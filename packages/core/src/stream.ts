import type { Row, Cell, CompareInputOptions, DiffRow } from './types.js';
import { compareTables } from './compare.js';
import { fail, assertRecord } from './errors.js';
import { assertRow, assertKeys } from './table.js';
export interface StreamOptions { signal?: AbortSignal }
function abort(signal?: AbortSignal) { if (signal?.aborted) fail('ABORTED', 'Stream cancelled.'); }
export interface CsvStreamReadOptions extends StreamOptions { delimiter?: string; encoding?: string; maxRows?: number; maxFieldChars?: number; maxRecordChars?: number; skipEmptyLines?: boolean }
/** Incremental RFC 4180 records. Input backpressure follows consumer iteration. */
export async function* readCsvStream(source: AsyncIterable<Uint8Array | string>, options: CsvStreamReadOptions = {}): AsyncGenerator<{ row: Row; rowNumber: number }> {
  assertRecord(options, 'options'); const delimiter=options.delimiter??',';
  if(typeof delimiter!=='string'||delimiter.length!==1 || /[\r\n"\uFEFF]/.test(delimiter)) fail('INVALID_OPTIONS','Streaming CSV requires one non-quote delimiter.');
  const maxRows=options.maxRows??1000000,maxField=options.maxFieldChars??1000000,maxRecord=options.maxRecordChars??8*1024*1024;let recordChars=0;
  if(!Number.isSafeInteger(maxRows)||maxRows<1||!Number.isSafeInteger(maxField)||maxField<1||!Number.isSafeInteger(maxRecord)||maxRecord<1) fail('INVALID_OPTIONS','Stream limits must be positive integers.');
  let decoder:TextDecoder; try {decoder=new TextDecoder(options.encoding??'utf-8',{fatal:true});} catch {fail('INVALID_OPTIONS','Unsupported encoding.');}
  let field='',fields:string[]=[],quoted=false,closed=false,skipLf=false,first=true,touched=false,record=0,count=0,kind:string|undefined;
  let headers:string[]|undefined;
  const complete=()=>{ fields.push(field);field='';record++; const values=fields;fields=[];touched=false;recordChars=0;if(values.length>16384)fail('LIMIT_EXCEEDED','CSV column limit exceeded.');
    if(options.skipEmptyLines!==false && values.every(v=>!v.trim())) return;
    if(!headers) {headers=values.map(v=>v.trim());if(headers.some(v=>!v)||new Set(headers).size!==headers.length) fail('INVALID_HEADER','CSV headers must be nonempty and unique.',{row:record});return;}
    if(values.length>headers.length) fail('INVALID_DATA','CSV record exceeds header width.',{row:record});
    if(++count>maxRows) fail('LIMIT_EXCEEDED','CSV row limit exceeded.',{row:record,limit:maxRows});
    return {row:Object.fromEntries(headers.map((h,i)=>[h,values[i]??null])),rowNumber:record};
  };
  async function* texts(){
    for await(const chunk of source){abort(options.signal);const current=typeof chunk==='string'?'text':chunk instanceof Uint8Array?'bytes':'invalid';if(current==='invalid'||kind&&kind!==current) fail('INVALID_DATA','Use consistently text chunks or byte chunks.');kind=current;
      if(typeof chunk==='string') yield chunk;else {try{yield decoder.decode(chunk,{stream:true});}catch{fail('INVALID_CSV','Invalid encoded CSV bytes.');}}
    }
    if(kind==='bytes'){try{yield decoder.decode();}catch{fail('INVALID_CSV','Incomplete encoded CSV bytes.');}}
  }
  for await(const text of texts()) for(let i=0;i<text.length;i++) {
    if(i%4096===0) abort(options.signal); const c=text[i];if(first){first=false;if(c==='\uFEFF')continue;}
    if(skipLf){skipLf=false;if(c==='\n')continue;}
    if(++recordChars>maxRecord)fail('LIMIT_EXCEEDED','CSV record length limit exceeded.',{row:record+1,limit:maxRecord});
    if(quoted){if(c==='"'){quoted=false;closed=true;}else field+=c;}
    else if(closed&&c==='"'){field+='"';quoted=true;closed=false;}
    else if(c===delimiter){fields.push(field);field='';closed=false;touched=true; if(fields.length>16384)fail('LIMIT_EXCEEDED','CSV column limit exceeded.');}
    else if(c==='\r'||c==='\n'){closed=false;skipLf=c==='\r';const row=complete();if(row)yield row;}
    else if(closed)fail('INVALID_CSV','Unexpected character after a closing quote.',{row:record+1});
    else if(c==='"'){if(field.length)fail('INVALID_CSV','Quote inside an unquoted field.',{row:record+1});quoted=true;touched=true;}
    else {field+=c;touched=true;}
    if(field.length>maxField)fail('LIMIT_EXCEEDED','CSV field length limit exceeded.',{row:record+1,limit:maxField});
  }
  abort(options.signal);if(quoted)fail('INVALID_CSV','Unterminated quoted field.',{row:record+1});
  if(touched||closed||field||fields.length){const row=complete();if(row)yield row;}
  if(!headers)fail('INVALID_HEADER','CSV header is missing.');
}
export interface CsvStreamWriteOptions extends StreamOptions { columns: string[]; delimiter?: string; bom?: boolean; escapeFormulae?: boolean }
export async function* writeCsvStream(rows: AsyncIterable<Row> | Iterable<Row>, options: CsvStreamWriteOptions): AsyncGenerator<Uint8Array> {
  assertRecord(options,'options');assertKeys(options.columns);const delimiter=options.delimiter??',';
  if(typeof delimiter!=='string'||delimiter.length!==1||/[\r\n"\uFEFF]/.test(delimiter))fail('INVALID_OPTIONS','Invalid CSV delimiter.');
  const encoder=new TextEncoder(); const quote=(v:Cell)=>{if(v!=null&&!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v))fail('INVALID_DATA','CSV cells must be finite primitive values.');let s=String(v??'');if(options.escapeFormulae!==false&&typeof v==='string'&&/^\s*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
  abort(options.signal);yield encoder.encode((options.bom===false?'':'\uFEFF')+options.columns.map(quote).join(delimiter)+'\r\n');
  let i=0;for await(const row of rows){abort(options.signal);assertRow(row,i++);yield encoder.encode(options.columns.map(k=>quote(Object.hasOwn(row,k)?row[k]:null)).join(delimiter)+'\r\n');}
}
function tuple(row:Row,keys:string[],options:Pick<CompareInputOptions,'trim'|'ignoreCase'>):string[]{return keys.map(key=>{const v=Object.hasOwn(row,key)?row[key]:null;if(v!=null&&!['string','number','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v))fail('INVALID_DATA','Invalid stream key.');let s=String(v??'');if(options.trim)s=s.trim();if(options.ignoreCase)s=s.toLocaleLowerCase('en-US');if(!s.trim())fail('MISSING_KEY','Stream keys must not be blank.',{column:key});return s;});}
const order=(a:string[],b:string[])=>{for(let i=0;i<a.length;i++){if(a[i]!==b[i])return a[i]<b[i]?-1:1;}return 0;};
/** Use this comparator to prepare sorted inputs; keys follow comparison's text semantics. */
export function compareStreamKeys(a:Row,b:Row,keys:string[],options:Pick<CompareInputOptions,'trim'|'ignoreCase'>={}):number{assertKeys(keys);return order(tuple(a,keys,options),tuple(b,keys,options));}
/** Merge-join sorted unique inputs with only current rows retained. No input buffering or external sort. */
export async function* compareSortedStreams(left:AsyncIterable<Row>|Iterable<Row>,right:AsyncIterable<Row>|Iterable<Row>,options:CompareInputOptions,execution:StreamOptions={}):AsyncGenerator<DiffRow>{
  // Validate mappings before acquiring input iterators. Explicit columns avoid per-row schema inference.
  if(!options?.columns?.length)fail('INVALID_OPTIONS','Sorted comparison requires explicit columns.');compareTables([],[],options);
  const keys=options.keys.map(k=>typeof k==='string'?{left:k,right:k}:k);
  async function* checked(source:AsyncIterable<Row>|Iterable<Row>,side:'left'|'right'){
    let previous:string[]|undefined,index=0;for await(const row of source){abort(execution.signal);assertRow(row,index,side);const key=tuple(row,keys.map(k=>k[side]),options);
      if(previous){const cmp=order(previous,key);if(cmp>=0)fail(cmp===0?'DUPLICATE_KEY':'INVALID_DATA',cmp===0?'Duplicate stream key.':'Input stream is not sorted.',{side,row:index+1});}
      previous=key;yield{row,key,index:index++};
    }
  }
  const a=checked(left,'left'),b=checked(right,'right');
  try{let x=await a.next(),y=await b.next();while(!x.done||!y.done){abort(execution.signal);const cmp=x.done?1:y.done?-1:order(x.value.key,y.value.key);
    const before=!x.done&&cmp<=0?x.value:undefined,after=!y.done&&cmp>=0?y.value:undefined;
    const result=compareTables(before?[before.row]:[],after?[after.row]:[],options).rows[0];
    if(result)yield{...result,...(before?{leftIndex:before.index}:{}),...(after?{rightIndex:after.index}:{})};
    if(before)x=await a.next();if(after)y=await b.next();
  }}finally{try{await a.return(undefined as never);}finally{await b.return(undefined as never);}}
}
