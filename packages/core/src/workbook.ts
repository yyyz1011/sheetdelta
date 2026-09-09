import { encodeXlsxText, encodeFormula } from './ooxml.js';
import { DOMParser, XMLSerializer, type Document, type Element } from '@xmldom/xmldom';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { fail, wrapError, assertRecord } from './errors.js';
import type { Cell } from './types.js';
import { calculateWorkbook, cellPosition, type FormulaWorkbook, type FormulaOptions } from './formula.js';
export interface WorkbookOptions { maxBytes?: number; maxUncompressedBytes?: number; maxEntries?: number }
export interface CellEdit { sheet: string; cell: string; value?: Cell; formula?: string; cachedValue?: Cell }
export interface PatchWorkbookOptions extends WorkbookOptions { recalculateOnOpen?: boolean }
const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const serialize=(doc:Document)=>strToU8(new XMLSerializer().serializeToString(doc));
export function parseXml(xml:string):Document {
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))fail('INVALID_WORKBOOK','DTD and entity declarations are not supported.');
  try{return new DOMParser({onError:()=>{throw new Error('Malformed XML');}}).parseFromString(xml,'application/xml');}
  catch(e){wrapError(e,'INVALID_WORKBOOK','Malformed workbook XML.');}
}
export function elements(doc:Document|Element,name:string):Element[]{return Array.from(doc.getElementsByTagNameNS('*',name));}
export function relationshipPath(base:string,target:string):string {
  const parts=(target.startsWith('/')?target.slice(1):base.slice(0,base.lastIndexOf('/')+1)+target).split('/'),out:string[]=[];
  for(const part of parts){if(part==='..'){if(!out.length)fail('INVALID_WORKBOOK','Invalid package relationship.');out.pop();}else if(part&&part!=='.')out.push(part);}
  return out.join('/');
}
function load(input:ArrayBuffer|Uint8Array,options:WorkbookOptions){
  assertRecord(options,'options');if(!(input instanceof ArrayBuffer)&&!(input instanceof Uint8Array))fail('INVALID_DATA','Expected workbook bytes.');
  const maxBytes=options.maxBytes??20*1024*1024,maxSize=options.maxUncompressedBytes??200*1024*1024,maxEntries=options.maxEntries??10000;
  for(const n of [maxBytes,maxSize,maxEntries])if(!Number.isSafeInteger(n)||n<1)fail('INVALID_OPTIONS','Package limits must be positive integers.');
  if(input.byteLength>maxBytes)fail('LIMIT_EXCEEDED','Workbook byte limit exceeded.',{limit:maxBytes});
  const seen=new Set<string>();let total=0;
  try{const files=unzipSync(input instanceof Uint8Array?input:new Uint8Array(input),{filter:entry=>{
    if(seen.has(entry.name))fail('INVALID_WORKBOOK','Duplicate package entry.');seen.add(entry.name);total+=entry.originalSize;
    if(seen.size>maxEntries||total>maxSize)fail('LIMIT_EXCEEDED','Uncompressed workbook package limit exceeded.');return true;
  }});
  if(!files['xl/workbook.xml']||!files['xl/_rels/workbook.xml.rels'])fail('INVALID_WORKBOOK','Expected an OOXML workbook.');
  if(Object.keys(files).some(p=>p.startsWith('_xmlsignatures/')))fail('INVALID_WORKBOOK','Editing signed workbooks would invalidate signatures.');return files;
  }catch(e){wrapError(e,'INVALID_WORKBOOK','Unable to open workbook package.');}
}
function sheetPaths(files:Record<string,Uint8Array>){
  const workbook=parseXml(strFromU8(files['xl/workbook.xml'])),rels=parseXml(strFromU8(files['xl/_rels/workbook.xml.rels']));
  const map=new Map<string,string>();
  for(const sheet of elements(workbook,'sheet')){const id=Array.from(sheet.attributes).find(a=>a.localName==='id')?.value;const rel=elements(rels,'Relationship').find(r=>r.getAttribute('Id')===id);
    if(!rel||rel.getAttribute('TargetMode')==='External')fail('INVALID_WORKBOOK','Invalid worksheet relationship.');
    if(!rel.getAttribute('Type')?.endsWith('/worksheet'))continue;
    const path=relationshipPath('xl/workbook.xml',rel.getAttribute('Target')!);if(!files[path])fail('INVALID_WORKBOOK','Worksheet part is missing.');map.set(sheet.getAttribute('name')!,path);
  }return{workbook,map};
}
function validateValue(v:Cell){if(v!=null&&!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v))fail('INVALID_DATA','Edited cells must contain finite primitive values.');if(typeof v==='string'&&(v.length>32767||/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(v)))fail('INVALID_DATA','Invalid Excel cell text.');}
/** Patch cells without reconstructing other workbook parts. Untouched ZIP entries retain their content bytes. */
export async function patchWorkbook(input:ArrayBuffer|Uint8Array,edits:readonly CellEdit[],options:PatchWorkbookOptions={}):Promise<Uint8Array>{
  if(!Array.isArray(edits))fail('INVALID_OPTIONS','edits must be an array.');const files=load(input,options);const {workbook,map}=sheetPaths(files);const docs=new Map<string,Document>(),seen=new Set<string>();
  for(const edit of edits){assertRecord(edit,'edit');const path=map.get(edit.sheet);if(!path)fail('SHEET_NOT_FOUND','Worksheet not found.',{sheet:edit.sheet});
    let pos:{row:number;column:number};try{pos=cellPosition(edit.cell);}catch{fail('INVALID_OPTIONS','Invalid edit cell.',{cell:edit.cell});}
    const address=edit.cell.replaceAll('$','').toUpperCase(),id=JSON.stringify([edit.sheet,address]);if(seen.has(id))fail('INVALID_OPTIONS','Duplicate cell edit.');seen.add(id);
    if(edit.formula!=null&&(typeof edit.formula!=='string'||!edit.formula.replace(/^=/,'').trim()||Object.hasOwn(edit,'value')))fail('INVALID_OPTIONS','Provide either value or formula, not both.');
    validateValue(edit.value);validateValue(edit.cachedValue);if(edit.formula!=null){validateValue(edit.formula);if(edit.formula.length>8192)fail('INVALID_OPTIONS','Formula length exceeds 8192 characters.');}
    const doc=docs.get(path)??parseXml(strFromU8(files[path]));docs.set(path,doc);const sheetData=elements(doc,'sheetData')[0];if(!sheetData)fail('INVALID_WORKBOOK','Worksheet data is missing.');
    for(const merge of elements(doc,'mergeCell')){const [a,b]=merge.getAttribute('ref')!.split(':').map(cellPosition);if(b&&pos.row>=a.row&&pos.row<=b.row&&pos.column>=a.column&&pos.column<=b.column&&!(pos.row===a.row&&pos.column===a.column))fail('MERGED_CELLS','Only the anchor of a merged region can be edited.',{sheet:edit.sheet,cell:address});}
    let row=elements(sheetData,'row').find(r=>Number(r.getAttribute('r'))===pos.row);
    if(!row){row=doc.createElementNS(doc.documentElement!.namespaceURI??NS,'row');row.setAttribute('r',String(pos.row));const next=elements(sheetData,'row').find(r=>Number(r.getAttribute('r'))>pos.row);sheetData.insertBefore(row,next??null);}
    let cell=elements(row,'c').find(c=>c.getAttribute('r')?.toUpperCase()===address);
    if(cell&&elements(cell,'f').some(f=>['shared','array','dataTable'].includes(f.getAttribute('t')??'')))fail('FORMULA_REJECTED','Shared, array and data-table formula cells cannot be patched individually.',{sheet:edit.sheet,cell:address});
    // Reject edits into any array formula's spill region, including cells without their own f element.
    for(const f of elements(doc,'f'))if(['array','shared','dataTable'].includes(f.getAttribute('t')??'')&&f.getAttribute('ref')){const [a,b=a]=f.getAttribute('ref')!.split(':').map(cellPosition);if(pos.row>=a.row&&pos.row<=b.row&&pos.column>=a.column&&pos.column<=b.column)fail('FORMULA_REJECTED','Cannot edit a grouped formula region.',{cell:address});}
    if(!cell){cell=doc.createElementNS(doc.documentElement!.namespaceURI??NS,'c');cell.setAttribute('r',address);const next=elements(row,'c').find(c=>cellPosition(c.getAttribute('r')!).column>pos.column);row.insertBefore(cell,next??null);}
    for(const child of Array.from(cell.childNodes))if(child.nodeType===1&&['v','f','is'].includes((child as Element).localName!))cell.removeChild(child);
    cell.removeAttribute('t');const append=(name:string,text:string)=>{const child=doc.createElementNS(doc.documentElement!.namespaceURI??NS,name);child.appendChild(doc.createTextNode(text));cell!.appendChild(child);return child;};
    const value=edit.formula!=null?edit.cachedValue:edit.value;
    if(edit.formula!=null)append('f',encodeFormula(edit.formula.replace(/^=/,'')));
    if(typeof value==='string'){
      if(edit.formula!=null){cell.setAttribute('t','str');append('v',encodeXlsxText(value));}else{cell.setAttribute('t','inlineStr');const is=doc.createElementNS(doc.documentElement!.namespaceURI??NS,'is'),t=doc.createElementNS(doc.documentElement!.namespaceURI??NS,'t');t.setAttribute('xml:space','preserve');t.appendChild(doc.createTextNode(encodeXlsxText(value)));is.appendChild(t);cell.appendChild(is);}
    }else if(value!=null){if(typeof value==='boolean')cell.setAttribute('t','b');append('v',typeof value==='boolean'?value?'1':'0':String(value));}
    const dimension=elements(doc,'dimension')[0];if(dimension){const [a,b=a]=dimension.getAttribute('ref')!.split(':').map(cellPosition);const {cellAddress}=await import('./formula.js');dimension.setAttribute('ref',cellAddress(Math.min(a.row,pos.row),Math.min(a.column,pos.column))+':'+cellAddress(Math.max(b.row,pos.row),Math.max(b.column,pos.column)));}
  }
  if(edits.length&&options.recalculateOnOpen!==false)for(const path of map.values()){const doc=docs.get(path)??parseXml(strFromU8(files[path]));let changed=false;for(const c of elements(doc,'c'))if(elements(c,'f').length){for(const v of elements(c,'v'))c.removeChild(v);changed=true;}if(changed)docs.set(path,doc);}
  for(const [path,doc] of docs)files[path]=serialize(doc);
  if(edits.length&&options.recalculateOnOpen!==false){let calc=elements(workbook,'calcPr')[0];if(!calc){calc=workbook.createElementNS(workbook.documentElement!.namespaceURI??NS,'calcPr');workbook.documentElement!.appendChild(calc);}calc.setAttribute('fullCalcOnLoad','1');calc.setAttribute('forceFullCalc','1');calc.setAttribute('calcMode','auto');files['xl/workbook.xml']=serialize(workbook);}
  return zipSync(files,{level:6});
}
/** Evaluate supported formulas and write fresh caches while preserving unrelated parts. Fails atomically on calculation issues. */
export async function recalculateExcel(input:ArrayBuffer|Uint8Array,options:WorkbookOptions&FormulaOptions={}):Promise<Uint8Array>{
  load(input,options);const XLSX=await import('xlsx');const wb=XLSX.read(input instanceof Uint8Array?input:new Uint8Array(input),{type:'array',cellFormula:true,sheetStubs:true,cellDates:false});
  const data:FormulaWorkbook=Object.create(null),edits:CellEdit[]=[];
  for(const name of wb.SheetNames){const cells:FormulaWorkbook[string]=Object.create(null);data[name]=cells;for(const [address,cell] of Object.entries(wb.Sheets[name])){if(address.startsWith('!'))continue;if(cell.t==='e')fail('CELL_ERROR','Cannot calculate with existing Excel error cells.',{sheet:name,cell:address});cells[address]=cell.f?{formula:cell.f}:cell.v??null;if(cell.f)edits.push({sheet:name,cell:address,formula:cell.f});}}
  const result=calculateWorkbook(data,options);if(result.errors.length)fail('FORMULA_REJECTED',result.errors[0].message,{sheet:result.errors[0].sheet,cell:result.errors[0].cell});
  return patchWorkbook(input,edits.map(edit=>({...edit,cachedValue:result.sheets[edit.sheet][edit.cell]})),{...options,recalculateOnOpen:false});
}
