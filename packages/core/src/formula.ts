import { fail, assertRecord } from './errors.js';
import type { Cell } from './types.js';
export type FormulaCell = Cell | { formula: string };
export type FormulaWorkbook = Record<string, Record<string, FormulaCell>>;
export interface FormulaOptions { maxCells?: number; maxRangeCells?: number; maxDepth?: number; maxOperations?: number }
export interface FormulaIssue { sheet: string; cell: string; formula: string; code: string; message: string }
type Node = { kind: 'literal'; value: Cell } | { kind: 'ref'; sheet?: string; address: string; end?: string } | { kind: 'call'; name: string; args: Node[] } | { kind: 'op'; op: string; args: Node[] };
type Value = Cell | Cell[];
class CalculationError extends Error { constructor(readonly code: string, message = code) { super(message); } }
const err = (code: string, message?: string): never => { throw new CalculationError(code, message); };
export function cellPosition(address: string): { row: number; column: number } {
  const match = /^\$?([A-Z]{1,3})\$?([1-9]\d*)$/i.exec(address);
  if (!match) return err('#REF!', `Invalid cell address: ${address}`);
  let column = 0; for (const c of match[1].toUpperCase()) column = column * 26 + c.charCodeAt(0) - 64;
  const row = Number(match[2]); if (column > 16384 || row > 1048576) return err('#REF!');
  return { row, column };
}
export function cellAddress(row: number, column: number): string {
  if (!Number.isSafeInteger(row) || row < 1 || row > 1048576 || !Number.isSafeInteger(column) || column < 1 || column > 16384) fail('INVALID_OPTIONS', 'Cell coordinates must be within Excel worksheet bounds.');
  let letters = ''; for (let c = column; c > 0; c = Math.floor((c - 1) / 26)) letters = String.fromCharCode(65 + (c - 1) % 26) + letters;
  return letters + row;
}
function parse(formula: string, depthLimit: number): Node {
  if(formula.length>8192)return err('#NUM!', 'Formula length limit exceeded.');
  const text = formula.replace(/^=/, ''); let offset = 0;
  const tokens: string[] = [];
  const token = /\s*("(?:[^"]|"")*"|'(?:[^']|'')*'|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|\$?[A-Za-z_][A-Za-z0-9_.$]*|<=|>=|<>|[+\-*/^&=<>%(),!:])/y;
  while (offset < text.length) { if (!text.slice(offset).trim()) break; token.lastIndex = offset; const m = token.exec(text); if (!m) return err('#NAME?', `Unsupported formula syntax at ${offset + 1}.`); tokens.push(m[1]); offset = token.lastIndex; }
  let i = 0;
  const precedence: Record<string, number> = { '=': 1, '<>': 1, '<': 1, '>': 1, '<=': 1, '>=': 1, '&': 2, '+': 3, '-': 3, '*': 4, '/': 4, '^': 5 };
  function expression(min = 0, depth = 0): Node {
    if (depth > depthLimit) return err('#NUM!', 'Formula nesting limit exceeded.');
    const t = tokens[i++]; if (!t) return err('#VALUE!', 'Incomplete formula.');
    let n: Node;
    if (t === '+' || t === '-') n = { kind: 'op', op: 'unary' + t, args: [expression(6, depth + 1)] };
    else if (t === '(') { n = expression(0, depth + 1); if (tokens[i++] !== ')') return err('#VALUE!', 'Missing closing parenthesis.'); }
    else if (t.startsWith('"')) n = { kind: 'literal', value: t.slice(1, -1).replaceAll('""', '"') };
    else if (/^(?:\d|\.)/.test(t)) n = { kind: 'literal', value: Number(t) };
    else if (tokens[i] === '(') {
      i++; const args: Node[] = [];
      if (tokens[i] !== ')') do { args.push(expression(0, depth + 1)); if (tokens[i] !== ',') break; i++; } while (true);
      if (tokens[i++] !== ')') return err('#VALUE!', 'Invalid function arguments.');
      n = { kind: 'call', name: t.toUpperCase().replace(/^_XLFN\./,'').replace(/^_XLWS\./,''), args };
    } else if (/^(TRUE|FALSE)$/i.test(t) && tokens[i] !== '!') n = { kind: 'literal', value: t.toUpperCase() === 'TRUE' };
    else {
      let sheet: string | undefined, address = t;
      if (tokens[i] === '!') { i++; sheet = t.startsWith("'") ? t.slice(1, -1).replaceAll("''", "'") : t; address = tokens[i++]; }
      cellPosition(address); let end: string | undefined;
      if (tokens[i] === ':') { i++; end = tokens[i++]; cellPosition(end); }
      n = { kind: 'ref', sheet, address: address.replaceAll('$', '').toUpperCase(), end: end?.replaceAll('$', '').toUpperCase() };
    }
    while (tokens[i] === '%') { i++; n = { kind: 'op', op: '%', args: [n] }; }
    while (tokens[i] in precedence && precedence[tokens[i]] >= min) {
      const op = tokens[i++], right = expression(precedence[op] + 1, depth + 1); // Excel exponentiation is left-associative.
      n = { kind: 'op', op, args: [n, right] };
    }
    return n;
  }
  const ast = expression(); if (i !== tokens.length) return err('#VALUE!', 'Unexpected formula tokens.'); return ast;
}
const scalar = (v: Value): Cell => Array.isArray(v) ? err('#VALUE!', 'A scalar value is required.') : v;
const number = (v: Value): number => { const s = scalar(v); if (s == null || s === '') return 0; if (typeof s === 'boolean') return +s; const n = typeof s === 'number' ? s : /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(s) ? Number(s) : NaN; return Number.isFinite(n) ? n : err('#VALUE!', 'Expected a number.'); };
const string = (v: Value): string => { const s = scalar(v); return s == null ? '' : typeof s === 'boolean' ? s ? 'TRUE' : 'FALSE' : String(s); };
const truth = (v: Value): boolean => { const s = scalar(v); if (s == null || s === '') return false; if (typeof s === 'boolean') return s; if (typeof s === 'number') return s !== 0; if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true'; return err('#VALUE!'); };
function compare(a: Cell, b: Cell): number {
  const x = a ?? (typeof b==='string'?'':0), y = b ?? (typeof a==='string'?'':0);
  if (typeof x !== typeof y) { const rank = (v: Cell) => typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2; return rank(x) - rank(y); }
  const l = typeof x === 'string' ? x.toLowerCase() : x, r = typeof y === 'string' ? y.toLowerCase() : y;
  return l === r ? 0 : l < r ? -1 : 1;
}
/** Recalculate supported formulas from current cell values. No eval, external links or macros. */
export function calculateWorkbook(input: FormulaWorkbook, options: FormulaOptions = {}) {
  assertRecord(input, 'workbook'); assertRecord(options, 'options');
  const maxCells = options.maxCells ?? 100000, maxRange = options.maxRangeCells ?? 100000, maxDepth = options.maxDepth ?? 128, maxOperations=options.maxOperations??1000000;let operations=0;
  for (const [name, value] of Object.entries({ maxCells, maxRangeCells: maxRange, maxDepth, maxOperations })) if (!Number.isSafeInteger(value) || value < 1) fail('INVALID_OPTIONS', `${name} must be a positive integer.`);
  if(maxDepth>512)fail('INVALID_OPTIONS','maxDepth cannot exceed 512.');
  const sheets = new Map<string, Map<string, FormulaCell>>(), names = new Map<string, string>(); let count = 0;
  for (const [name, cells] of Object.entries(input)) {
    assertRecord(cells, 'sheet'); if (!name || names.has(name.toLowerCase())) fail('INVALID_OPTIONS', 'Worksheet names must be unique ignoring case.');
    names.set(name.toLowerCase(), name); const map = new Map<string, FormulaCell>(); sheets.set(name, map);
    for (const [address, value] of Object.entries(cells)) {
      try { cellPosition(address); } catch { fail('INVALID_DATA', `Invalid cell address: ${address}`, { sheet: name, cell: address }); }
      const cell = address.replaceAll('$', '').toUpperCase(); if (map.has(cell)) fail('INVALID_DATA', 'Duplicate cell address.', { sheet: name, cell });
      if (value != null && typeof value === 'object') { if (typeof (value as { formula?: unknown }).formula !== 'string') fail('INVALID_DATA', 'Formula cells require a formula string.'); }
      else if ((value != null && !['string', 'number', 'boolean'].includes(typeof value)) || (typeof value === 'number' && !Number.isFinite(value))) fail('INVALID_DATA', 'Cells must contain finite primitive values.');
      if (++count > maxCells) fail('LIMIT_EXCEEDED', 'Calculation cell limit exceeded.', { limit: maxCells });
      map.set(cell, value);
    }
  }
  const cache = new Map<string, Cell | CalculationError>(), active = new Set<string>(); const issues: FormulaIssue[] = [];
  function get(sheet: string, address: string, depth: number): Cell {
    if(++operations>maxOperations)return err('#NUM!', 'Calculation operation budget exceeded.');
    if (depth > maxDepth) return err('#NUM!', 'Dependency depth limit exceeded.');
    const canonical = names.get(sheet.toLowerCase()); if (!canonical) return err('#REF!', `Unknown worksheet: ${sheet}`);
    const id = JSON.stringify([canonical, address]); if (active.has(id)) return err('#CYCLE!', 'Circular formula dependency.');
    if (cache.has(id)) { const hit = cache.get(id); if (hit instanceof CalculationError) throw hit; return hit; }
    const value = sheets.get(canonical)!.get(address) ?? null;
    if (typeof value !== 'object' || value === null) return value;
    active.add(id);
    try { const result = scalar(evaluate(parse(value.formula, maxDepth), canonical, depth)) ?? 0; if (typeof result === 'number' && !Number.isFinite(result)) return err('#NUM!'); cache.set(id, result); return result; }
    catch (error) { if (!(error instanceof CalculationError)) throw error; cache.set(id, error); issues.push({ sheet: canonical, cell: address, formula: value.formula, code: error.code, message: error.message }); throw error; }
    finally { active.delete(id); }
  }
  function evaluate(n: Node, sheet: string, depth: number): Value {
    if(++operations>maxOperations)return err('#NUM!', 'Calculation operation budget exceeded.');
    if(depth>maxDepth)return err('#NUM!', 'Formula evaluation depth limit exceeded.');
    if (n.kind === 'literal') return n.value;
    if (n.kind === 'ref') {
      if (!n.end) return get(n.sheet ?? sheet, n.address, depth + 1);
      const a = cellPosition(n.address), b = cellPosition(n.end), rows = Math.abs(a.row - b.row) + 1, cols = Math.abs(a.column - b.column) + 1;
      if (rows * cols > maxRange) return err('#NUM!', 'Formula range limit exceeded.');
      const values: Cell[] = []; for (let r = Math.min(a.row,b.row); r <= Math.max(a.row,b.row); r++) for (let c = Math.min(a.column,b.column); c <= Math.max(a.column,b.column); c++) values.push(get(n.sheet ?? sheet, cellAddress(r,c), depth + 1));
      return values;
    }
    if (n.kind === 'op') {
      const a = evaluate(n.args[0],sheet,depth+1), b = n.args[1] ? evaluate(n.args[1],sheet,depth+1) : null;
      switch(n.op) {
        case 'unary+': return number(a); case 'unary-': return -number(a); case '%': return number(a)/100;
        case '+': return number(a)+number(b); case '-': return number(a)-number(b); case '*': return number(a)*number(b);
        case '/': return number(b) === 0 ? err('#DIV/0!') : number(a)/number(b); case '^': return number(a)**number(b); case '&': return string(a)+string(b);
        default: { const cmp = compare(scalar(a),scalar(b)); return ({ '=':cmp===0, '<>':cmp!==0, '<':cmp<0, '>':cmp>0, '<=':cmp<=0, '>=':cmp>=0 })[n.op]; }
      }
    }
    const arity = (min: number, max = min) => { if(n.args.length < min || n.args.length > max) err('#VALUE!', `Invalid number of arguments for ${n.name}.`); };
    const ev = (i: number) => evaluate(n.args[i],sheet,depth+1);
    if(n.name === 'IF') { arity(2,3); return truth(ev(0)) ? ev(1) : n.args[2] ? ev(2) : false; }
    if(n.name === 'IFERROR'||n.name==='IFNA') { arity(2); try { return ev(0); } catch(e) { if(e instanceof CalculationError&&(n.name==='IFERROR'||e.code==='#N/A')) return ev(1); throw e; } }
    const args = n.args.map(a => evaluate(a,sheet,depth+1)), flat = args.flat() as Cell[];
    const nums = () => args.flatMap((v,i) => Array.isArray(v) ? v.filter((c): c is number => typeof c === 'number') : n.args[i].kind==='ref' ? typeof v==='number'?[v]:[] : v == null ? [] : [number(v)]);
    switch(n.name) {
      case 'TRUE': case 'FALSE': arity(0); return n.name==='TRUE';
      case 'SUM': arity(1,255); return nums().reduce((a,b)=>a+b,0);
      case 'AVERAGE': { arity(1,255); const v=nums(); return v.length ? v.reduce((a,b)=>a+b,0)/v.length : err('#DIV/0!'); }
      case 'MIN': arity(1,255); return nums().reduce((a,b)=>Math.min(a,b),Infinity) === Infinity ? 0 : nums().reduce((a,b)=>Math.min(a,b));
      case 'MAX': arity(1,255); return nums().reduce((a,b)=>Math.max(a,b),-Infinity) === -Infinity ? 0 : nums().reduce((a,b)=>Math.max(a,b));
      case 'COUNT': arity(1,255); return args.reduce<number>((total,v,i)=>total+(Array.isArray(v)?v.filter(c=>typeof c==='number').length:n.args[i].kind==='ref'?typeof v==='number'?1:0:v==null?0:typeof v==='number'||typeof v==='boolean'||typeof v==='string'&&v.trim()!==''&&Number.isFinite(Number(v))?1:0),0);
      case 'COUNTA': arity(1,255); return flat.filter(v=>v!=null).length;
      case 'AND': case 'OR': { arity(1,255); const values=args.flatMap((v,i)=>Array.isArray(v)?v.filter(c=>typeof c==='number'||typeof c==='boolean'):n.args[i].kind==='ref'?typeof v==='number'||typeof v==='boolean'?[v]:[]:[v]).map(v=>truth(v));if(!values.length)return err('#VALUE!');return n.name==='AND'?values.every(Boolean):values.some(Boolean); }
      case 'NOT': arity(1); return !truth(args[0]);
      case 'ABS': arity(1); return Math.abs(number(args[0]));
      case 'ROUND': { arity(2); const digits=number(args[1]); if(!Number.isInteger(digits)||Math.abs(digits)>308) return err('#NUM!'); const x=number(args[0]), scale=10**digits; return Math.sign(x)*Math.round((Math.abs(x)+Number.EPSILON)*scale)/scale; }
      case 'LEN': arity(1); return string(args[0]).length;
      case 'LOWER': arity(1); return string(args[0]).toLowerCase();
      case 'UPPER': arity(1); return string(args[0]).toUpperCase();
      case 'TRIM': arity(1); return string(args[0]).replace(/^ +| +$/g,'').replace(/ +/g,' ');
      case 'CONCAT': case 'CONCATENATE': arity(1,255); return flat.map(v=>string(v)).join('');
      case 'INDEX': { arity(2,3); const source=n.args[0], values=Array.isArray(args[0])?args[0]:[args[0]];let width=1,height=values.length;if(source.kind==='ref'&&source.end){const a=cellPosition(source.address),b=cellPosition(source.end);width=Math.abs(a.column-b.column)+1;height=Math.abs(a.row-b.row)+1;}const row=number(args[1]),column=args[2]==null?1:number(args[2]);if(!Number.isInteger(row)||!Number.isInteger(column)||row<1||column<1||row>height||column>width)return err('#REF!');return values[(row-1)*width+column-1]; }
      case 'MATCH': { arity(3);if(number(args[2])!==0)return err('#NAME?','MATCH supports explicit exact mode 0 only.');const values=Array.isArray(args[1])?args[1]:[args[1]],target=scalar(args[0]);const index=values.findIndex(v=>compare(v,target)===0);return index<0?err('#N/A'):index+1; }
      case 'VLOOKUP': case 'HLOOKUP': { arity(4);if(truth(args[3]))return err('#NAME?','Lookup supports exact mode FALSE only.');const source=n.args[1];if(source.kind!=='ref'||!source.end)return err('#VALUE!','Lookup table must be a rectangular range.');const a=cellPosition(source.address),b=cellPosition(source.end),width=Math.abs(a.column-b.column)+1,height=Math.abs(a.row-b.row)+1,values=args[1] as Cell[],index=number(args[2]),vertical=n.name==='VLOOKUP';if(!Number.isInteger(index)||index<1||index>(vertical?width:height))return err('#REF!');for(let i=0;i<(vertical?height:width);i++)if(compare(values[vertical?i*width:i],scalar(args[0]))===0)return values[vertical?i*width+index-1:(index-1)*width+i];return err('#N/A'); }
      case 'XLOOKUP': { arity(3,6);if(args[4]!=null&&number(args[4])!==0||args[5]!=null&&number(args[5])!==1)return err('#NAME?','XLOOKUP supports exact, forward search only.');const lookup=Array.isArray(args[1])?args[1]:[args[1]],result=Array.isArray(args[2])?args[2]:[args[2]];if(lookup.length!==result.length)return err('#VALUE!');const index=lookup.findIndex(v=>compare(v,scalar(args[0]))===0);return index<0?args.length>=4?args[3]:err('#N/A'):result[index]; }
      case 'COUNTIF': case 'SUMIF': {
        arity(2,n.name==='SUMIF'?3:2); const range=Array.isArray(args[0])?args[0]:[args[0]], sum=args[2]==null?range:Array.isArray(args[2])?args[2]:[args[2]];
        if(range.length!==sum.length) return err('#VALUE!','Criteria and sum ranges must have equal size.');
        const criterion=scalar(args[1]); const m=typeof criterion==='string'?/^(<=|>=|<>|=|<|>)(.*)$/.exec(criterion):null;
        const op=m?.[1]??'=', raw=m?.[2]??criterion; const target=typeof raw==='string'&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw)?Number(raw):raw;
        if(typeof target==='string'&&/[?*~]/.test(target)) return err('#NAME?','Wildcard criteria are not supported.');
        const matches=(v:Cell)=>{if(target===''&&v==null)v='';if(typeof target==='number'){if(typeof v==='boolean')return false;if(typeof v==='string'){if(v.trim()!==''&&Number.isFinite(Number(v)))v=Number(v);else return op==='<>';}}const c=compare(v,target);return ({'=':c===0,'<>':c!==0,'<':c<0,'>':c>0,'<=':c<=0,'>=':c>=0})[op];};
        return range.reduce<number>((total,v,i)=>total+(matches(v)?n.name==='COUNTIF'?1:typeof sum[i]==='number'?sum[i] as number:0:0),0);
      }
      default: return err('#NAME?', `Unsupported function: ${n.name}`);
    }
  }
  const result: Record<string, Record<string, Cell>> = Object.create(null);
  for(const [sheet,cells] of sheets) { const output: Record<string,Cell>=Object.create(null); result[sheet]=output; for(const cell of cells.keys()) { try { output[cell]=get(sheet,cell,0); } catch(e) { if(!(e instanceof CalculationError)) throw e; output[cell]=e.code; } } }
  return { sheets: result, errors: issues };
}
