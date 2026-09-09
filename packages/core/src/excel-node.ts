import { decodeXlsxText } from './ooxml.js';
import { openPromise, type Entry } from 'yauzl';
import { SaxesParser, type SaxesTagNS } from 'saxes';
import { fail, wrapError } from './errors.js';
import type { Cell, Row } from './types.js';
import { parseXml, elements, relationshipPath } from './workbook.js';
import { cellPosition } from './formula.js';
export interface ExcelStreamReadOptions {
  sheet?: string; headerRow?: number; maxRows?: number; maxColumns?: number;
  maxUncompressedBytes?: number; maxSharedStringChars?: number; maxEntries?: number;
  formulas?: 'cached'|'reject'; cellErrors?: 'reject'|'text'; signal?: AbortSignal;
}
export interface ExcelStreamRow { sheet: string; row: Row; rowNumber: number; date1904: boolean }
/** Node-only XLSX file reader. Rows stream from disk; shared strings are bounded and cached. */
export async function* readExcelStream(path:string,options:ExcelStreamReadOptions={}):AsyncGenerator<ExcelStreamRow>{
  const headerRow=options.headerRow??1,maxRows=options.maxRows??1000000,maxColumns=options.maxColumns??16384,maxSize=options.maxUncompressedBytes??2*1024**3,maxStrings=options.maxSharedStringChars??8*1024**2,maxEntries=options.maxEntries??10000;
  for(const n of [headerRow,maxRows,maxColumns,maxSize,maxStrings,maxEntries])if(!Number.isSafeInteger(n)||n<1)fail('INVALID_OPTIONS','Stream limits must be positive integers.');
  if(options.formulas!=null&&!['cached','reject'].includes(options.formulas)||options.cellErrors!=null&&!['reject','text'].includes(options.cellErrors))fail('INVALID_OPTIONS','Invalid formula or error policy.');
  const check=()=>{if(options.signal?.aborted)fail('ABORTED','Excel stream cancelled.');};check();
  let zip:Awaited<ReturnType<typeof openPromise>>;try{zip=await openPromise(path,{lazyEntries:true,autoClose:false,validateEntrySizes:true});}catch(e){wrapError(e,'INVALID_WORKBOOK','Unable to open XLSX file.');}
  const entries=new Map<string,Entry>();let total=0;
  try{
    for await(const entry of zip.eachEntry()){check();if(entries.has(entry.fileName))fail('INVALID_WORKBOOK','Duplicate ZIP part.');entries.set(entry.fileName,entry);total+=entry.uncompressedSize;if(entries.size>maxEntries||total>maxSize)fail('LIMIT_EXCEEDED','Workbook package limit exceeded.');}
    async function* chunks(name:string){const entry=entries.get(name);if(!entry)fail('INVALID_WORKBOOK',`Missing part: ${name}`);const stream=await zip.openReadStreamPromise(entry);
      const cancel=()=>stream.destroy();options.signal?.addEventListener('abort',cancel,{once:true});
      try{check();for await(const chunk of stream){check();yield chunk as Buffer;}check();}catch(e){check();throw e;}finally{options.signal?.removeEventListener('abort',cancel);stream.destroy();}
    }
    async function text(name:string,limit=4*1024**2){if((entries.get(name)?.uncompressedSize??0)>limit)fail('LIMIT_EXCEEDED','Workbook metadata is oversized.');const decoder=new TextDecoder('utf-8',{fatal:true});let text='';for await(const chunk of chunks(name))text+=decoder.decode(chunk,{stream:true});return text+decoder.decode();}
    const wb=parseXml(await text('xl/workbook.xml')),rels=parseXml(await text('xl/_rels/workbook.xml.rels'));
    const selected=elements(wb,'sheet').find(s=>options.sheet?s.getAttribute('name')===options.sheet:s.getAttribute('state')!=='hidden'&&s.getAttribute('state')!=='veryHidden');
    if(!selected)fail('SHEET_NOT_FOUND','Requested or visible worksheet not found.');const name=selected.getAttribute('name')!;
    const id=Array.from(selected.attributes).find(a=>a.localName==='id')?.value;const relationship=elements(rels,'Relationship').find(r=>r.getAttribute('Id')===id);
    if(!relationship||relationship.getAttribute('TargetMode')==='External'||!relationship.getAttribute('Type')?.endsWith('/worksheet'))fail('INVALID_WORKBOOK','Invalid worksheet relationship.');
    const sheetPath=relationshipPath('xl/workbook.xml',relationship.getAttribute('Target')!);
    const date1904=['1','true'].includes(elements(wb,'workbookPr')[0]?.getAttribute('date1904')??'');
    const shared:string[]=[];let chars=0,current='',inside=false,capture=false;
    const stringsRel=elements(rels,'Relationship').find(r=>r.getAttribute('Type')?.endsWith('/sharedStrings'));
    const stringsPath=stringsRel?relationshipPath('xl/workbook.xml',stringsRel.getAttribute('Target')!):'xl/sharedStrings.xml';
    function parser(){const p=new SaxesParser({xmlns:true});p.on('doctype',()=>fail('INVALID_WORKBOOK','DTD is not supported.'));return p;}
    if(entries.has(stringsPath)){
      const p=parser();p.on('opentag',tag=>{if(tag.local==='si'){inside=true;current='';}if(inside&&tag.local==='t')capture=true;});
      p.on('text',s=>{if(capture){current+=s;chars+=s.length;if(chars>maxStrings)fail('LIMIT_EXCEEDED','Shared string cache limit exceeded.',{limit:maxStrings});}});
      p.on('closetag',tag=>{if(tag.local==='t')capture=false;if(tag.local==='si'){shared.push(decodeXlsxText(current));inside=false;if(shared.length>maxStrings)fail('LIMIT_EXCEEDED','Shared string count limit exceeded.');}});
      const decoder=new TextDecoder('utf-8',{fatal:true});for await(const chunk of chunks(stringsPath))p.write(decoder.decode(chunk,{stream:true}));p.write(decoder.decode()).close();
    }
    const p=parser();let rowNumber=0,previousRow=0,values:Cell[]=[],cell:{address:string;type:string;value:string;inline:string;formula:boolean;hasValue:boolean}|undefined,field='',headers:string[]|undefined,rows=0;
    const queue:ExcelStreamRow[]=[];
    const attr=(tag:SaxesTagNS,name:string)=>Object.values(tag.attributes).find(a=>a.local===name)?.value??'';
    p.on('opentag',tag=>{
      if(tag.local==='row'){rowNumber=Number(attr(tag,'r'));if(!Number.isSafeInteger(rowNumber)||rowNumber<=previousRow||rowNumber>1048576)fail('INVALID_WORKBOOK','Invalid worksheet row order.');previousRow=rowNumber;values=[];}
      if(tag.local==='c'){const address=attr(tag,'r'),pos=cellPosition(address);if(pos.row!==rowNumber||pos.column>maxColumns)fail('LIMIT_EXCEEDED','Invalid or oversized worksheet cell.',{cell:address});if(Object.hasOwn(values,pos.column-1))fail('INVALID_WORKBOOK','Duplicate worksheet cell.');cell={address,type:attr(tag,'t'),value:'',inline:'',formula:false,hasValue:false};}
      if(cell&&['v','t','f'].includes(tag.local)){field=tag.local;if(field==='v')cell.hasValue=true;if(field==='f')cell.formula=true;}
    });
    p.on('text',s=>{if(cell){if(field==='v')cell.value+=s;else if(field==='t')cell.inline+=s;if(cell.value.length+cell.inline.length>1000000)fail('LIMIT_EXCEEDED','Cell text length limit exceeded.');}});
    p.on('closetag',tag=>{
      if(['v','t','f'].includes(tag.local))field='';
      if(tag.local==='c'&&cell){const c=cell;let value:Cell=null;
        if(c.formula&&(options.formulas==='reject'||!c.hasValue))fail('FORMULA_REJECTED','Formula rejected or cached value missing.',{sheet:name,cell:c.address});
        if(c.type==='e'){if(options.cellErrors!=='text')fail('CELL_ERROR','Workbook contains an error cell.',{sheet:name,cell:c.address});value=c.value;}
        else if(c.type==='s'){const index=Number(c.value);if(!c.hasValue||!Number.isSafeInteger(index)||index<0||index>=shared.length)fail('INVALID_WORKBOOK','Invalid shared string index.');value=shared[index];}
        else if(c.type==='inlineStr')value=decodeXlsxText(c.inline);
        else if(c.type==='str'||c.type==='d')value=c.hasValue?decodeXlsxText(c.value):null;
        else if(c.type==='b'){if(!['0','1'].includes(c.value))fail('INVALID_WORKBOOK','Invalid boolean cell.');value=c.value==='1';}
        else if(c.hasValue&&c.value!==''){value=Number(c.value);if(!Number.isFinite(value))fail('INVALID_WORKBOOK','Invalid numeric cell.');}
        values[cellPosition(c.address).column-1]=value;cell=undefined;
      }
      if(tag.local==='row'){
        if(rowNumber<headerRow)return;
        if(rowNumber===headerRow){headers=Array.from(values,v=>String(v??'').trim());if(!headers.length||headers.some(h=>!h)||new Set(headers).size!==headers.length)fail('INVALID_HEADER','Invalid streaming worksheet headers.');return;}
        if(!headers)fail('INVALID_HEADER','Header row is missing.');if(values.every(v=>v==null||String(v).trim()===''))return;
        if(values.slice(headers.length).some(v=>v!=null&&v!==''))fail('INVALID_DATA','Row exceeds header width.',{row:rowNumber});
        if(++rows>maxRows)fail('LIMIT_EXCEEDED','Excel stream row limit exceeded.',{limit:maxRows});
        queue.push({sheet:name,row:Object.fromEntries(headers.map((h,i)=>[h,values[i]??null])),rowNumber,date1904});
      }
    });
    const decoder=new TextDecoder('utf-8',{fatal:true});for await(const chunk of chunks(sheetPath)){p.write(decoder.decode(chunk,{stream:true}));while(queue.length){check();yield queue.shift()!;}}p.write(decoder.decode()).close();while(queue.length){check();yield queue.shift()!;}
    if(!headers)fail('INVALID_HEADER','Header row is missing.');
  }catch(e){wrapError(e,'INVALID_WORKBOOK','Unable to read XLSX stream.');}finally{zip.close();}
}
