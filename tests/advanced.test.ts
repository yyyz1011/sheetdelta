import * as XLSX from 'xlsx';
import { describe,it,expect } from 'vitest';
import { readFileSync,writeFileSync,mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync,strFromU8 } from 'fflate';
import { calculateWorkbook } from '../packages/core/src/formula';
import { patchWorkbook,recalculateExcel } from '../packages/core/src/workbook';
import { readCsvStream,writeCsvStream,compareSortedStreams,compareStreamKeys } from '../packages/core/src/stream';
import { writeExcelStream } from '../packages/core/src/excel-stream';
import { readExcelStream } from '../packages/core/src/excel-node';
import { readExcel } from '../packages/core/src/excel';
import { compareTables } from '../packages/core/src/compare';
import type { Row } from '../packages/core/src/types';
const fixture=(name:string)=>readFileSync(new URL('./fixtures/'+name,import.meta.url));
async function collect<T>(input:AsyncIterable<T>){const result:T[]=[];for await(const row of input)result.push(row);return result;}
async function bytes(input:AsyncIterable<Uint8Array>){return Buffer.concat(await collect(input));}
async function* pieces(text:string,size=1){const b=Buffer.from(text);for(let i=0;i<b.length;i+=size)yield b.subarray(i,i+size);}

describe('formula calculation',()=>{
 it('resolves dependencies, cross-sheet ranges, lazy branches and common business functions',()=>{
  const result=calculateWorkbook({Orders:{A1:2,A2:3,B1:{formula:'=A1*12.5'},B2:{formula:'=A2*5'},C1:{formula:'=IF(B1>20,"large",1/0)'}},Summary:{A1:{formula:'=SUM(Orders!B1:B2)'},A2:{formula:'=ROUND(AVERAGE(Orders!B1:B2),2)'},A3:{formula:'=COUNTIF(Orders!B1:B2,">20")'},A4:{formula:'=SUMIF(Orders!A1:A2,">=2",Orders!B1:B2)'},A5:{formula:'=IFERROR(1/0,99)'},A6:{formula:'=UPPER(TRIM("  some   text "))'},A7:{formula:'=CONCAT("qty=",Orders!A1)'},A8:{formula:'=LEN("abc")'},A9:{formula:'=NOT(OR(FALSE,0))'},A10:{formula:'=2^3^2'},A11:{formula:'=20%*50'},A12:{formula:'=COUNT("no", "2",TRUE)'},A13:{formula:'=Z99'}}});
  expect(result.errors).toEqual([]);expect(result.sheets.Summary).toMatchObject({A1:40,A2:20,A3:1,A4:40,A5:99,A6:'SOME TEXT',A7:'qty=2',A8:3,A9:true,A10:64,A11:10,A12:2,A13:0});expect(result.sheets.Orders.C1).toBe('large');
 });
 it('reports unsupported formulas, cycles and bounds without executing arbitrary code',()=>{
  const r=calculateWorkbook({S:{A1:{formula:'=B1'},B1:{formula:'=A1'},C1:{formula:'=WEBSERVICE("https://example.com")'},D1:{formula:'=1/0'},E1:{formula:'=SUM(A1:XFD1048576)'},F1:{formula:'=MISSING!A1'},G1:{formula:'=globalThis.process.exit()'}}});
  expect(r.errors.map(e=>e.code)).toEqual(expect.arrayContaining(['#CYCLE!','#NAME?','#DIV/0!','#NUM!','#REF!']));expect(r.errors).toHaveLength(7);
 });
 it('recalculates from changed inputs and protects against deep expressions',()=>{
  const input={S:{A1:2,B1:{formula:'=A1*2'}}};expect(calculateWorkbook(input).sheets.S.B1).toBe(4);input.S.A1=5;expect(calculateWorkbook(input).sheets.S.B1).toBe(10);
  expect(calculateWorkbook({S:{A1:{formula:'='+Array(200).fill('1').join('+')}}}).errors[0].code).toBe('#NUM!');
 });
});

describe('incremental CSV and sorted comparison',()=>{
 it('parses split UTF-8, quotes, CRLF and multiline fields with original record numbers',async()=>{
  const r=await collect(readCsvStream(pieces('\uFEFFid,note\r\n001,"你好\r\n""world"""\r\n002,done\r\n')));
  expect(r).toEqual([{row:{id:'001',note:'你好\r\n"world"'},rowNumber:2},{row:{id:'002',note:'done'},rowNumber:3}]);
 });
 it('writes incrementally and protects formula-like text',async()=>{
  const result=await bytes(writeCsvStream([{id:'001',value:'=1+1'},{id:'002',value:-2}],{columns:['id','value']}));
  const read=await collect(readCsvStream(pieces(result.toString(),2)));expect(read.map(r=>r.row.value)).toEqual(["'=1+1",'-2']);
 });
 it('rejects damaged quotes, encoding, field limits and cancellation',async()=>{
  await expect(collect(readCsvStream(pieces('id,v\n1,"bad')))).rejects.toMatchObject({code:'INVALID_CSV'});
  await expect(collect(readCsvStream(pieces('id,v\n1,"x"oops')))).rejects.toMatchObject({code:'INVALID_CSV'});
  await expect(collect(readCsvStream(pieces('id,v\n1,abcdef'),{maxFieldChars:4}))).rejects.toMatchObject({code:'LIMIT_EXCEEDED'});
  const c=new AbortController();c.abort();await expect(collect(readCsvStream(pieces('id\n1'),{signal:c.signal}))).rejects.toMatchObject({code:'ABORTED'});
 });
 it('uses backpressure and closes sources when consumers stop early',async()=>{
  let read=0,closed=false;async function* source(){try{for(let i=0;i<100;i++){read++;yield i===0?'id\n':'item\n';}}finally{closed=true;}}
  for await(const _ of readCsvStream(source()))break;
  expect(read).toBe(2);expect(closed).toBe(true);
 });
 it('matches ordinary comparison while retaining only current sorted records',async()=>{
  const a=[{id:'01',v:1},{id:'02',v:2},{id:'04',v:4}],b=[{id:'01',v:1},{id:'03',v:3},{id:'04',v:5}];
  const options={keys:['id'],columns:['v'],includeUnchanged:false};const actual=await collect(compareSortedStreams(a,b,options));const expected=compareTables(a,b,options).rows;
  expect(actual.sort((a,b)=>a.key[0].localeCompare(b.key[0]))).toEqual(expected.sort((a,b)=>a.key[0].localeCompare(b.key[0])));
  expect([{id:'2'},{id:'10'}].sort((a,b)=>compareStreamKeys(a,b,['id']))).toEqual([{id:'10'},{id:'2'}]);
 });
 it('rejects unsorted or duplicate keys and releases both inputs',async()=>{
  await expect(collect(compareSortedStreams([{id:'2',v:1},{id:'1',v:2}],[],{keys:['id'],columns:['v']}))).rejects.toMatchObject({code:'INVALID_DATA'});
  await expect(collect(compareSortedStreams([{id:'1',v:1},{id:'1',v:2}],[],{keys:['id'],columns:['v']}))).rejects.toMatchObject({code:'DUPLICATE_KEY'});
  let closed=0;async function* source(){try{yield{id:'1',v:1};yield{id:'2',v:2};}finally{closed++;}}
  for await(const _ of compareSortedStreams(source(),source(),{keys:['id'],columns:['v']}))break;expect(closed).toBe(2);
 });
});

describe('template preservation and workbook recalculation',()=>{
 it('patches values while preserving style, charts, comments, relationships and validation',async()=>{
  const original=fixture('business-template.xlsx');const result=await patchWorkbook(original,[{sheet:'Orders',cell:'B2',value:4}]);const old=unzipSync(original),next=unzipSync(result);
  expect(Object.keys(next).sort()).toEqual(Object.keys(old).sort());
  for(const path of Object.keys(old))if(!['xl/workbook.xml','xl/worksheets/sheet1.xml','xl/worksheets/sheet2.xml'].includes(path))expect(next[path],path).toEqual(old[path]);
  const sheet=strFromU8(next['xl/worksheets/sheet1.xml']);expect(sheet).toContain('dataValidations');expect(sheet).toContain('pane');expect(sheet).toContain('drawing');expect(sheet).toContain('autoFilter');
  expect((await readExcel(result,{sheets:['Orders'],values:'raw'}))[0].rows[0].qty).toBe(4);
  const recalculated=await recalculateExcel(result);expect((await readExcel(recalculated,{sheets:['Orders'],values:'raw'}))[0].rows[0].total).toBe(50);
  expect((await readExcel(recalculated,{sheets:['Summary'],values:'raw'}))[0].rows[0].value).toBe(65);
 });
 it('clears old caches when edits request recalculation on open',async()=>{
  const input=await recalculateExcel(fixture('business-template.xlsx'));
  const updated=await patchWorkbook(input,[{sheet:'Orders',cell:'B2',value:9}]);
  const [sheet]=await readExcel(updated,{sheets:['Orders'],values:'raw'});expect(sheet.rows[0].total).toBeNull();expect(sheet.warnings?.some(w=>w.code==='FORMULA_NO_CACHE')).toBe(true);
 });
 it('keeps formulas literal unless explicitly requested and rejects unsupported changes atomically',async()=>{
  const input=fixture('business-template.xlsx');const output=await patchWorkbook(input,[{sheet:'Orders',cell:'A2',value:'=1+1'}]);expect((await readExcel(output,{sheets:['Orders']}))[0].rows[0].sku).toBe('=1+1');
  await expect(patchWorkbook(input,[{sheet:'Orders',cell:'B2',value:1},{sheet:'Orders',cell:'B2',value:2}])).rejects.toMatchObject({code:'INVALID_OPTIONS'});
  await expect(patchWorkbook(input,[{sheet:'Missing',cell:'A1',value:1}])).rejects.toMatchObject({code:'SHEET_NOT_FOUND'});
  const unsupported=await patchWorkbook(input,[{sheet:'Orders',cell:'D2',formula:'=UNKNOWN(B2)'}]);await expect(recalculateExcel(unsupported)).rejects.toMatchObject({code:'FORMULA_REJECTED'});
 });
});

describe('XLSX streams',()=>{
 it('exports and reads a workbook incrementally with raw values, Unicode and leading-zero IDs',async()=>{
  const folder=mkdtempSync(join(tmpdir(),'sheetdelta-stream-'));try{
    const data=await bytes(writeExcelStream([{id:'001',name:'商品',active:true,value:12.5},{id:'002',name:'=literal',active:false,value:null}],{columns:['id','name','active','value']}));const path=join(folder,'data.xlsx');writeFileSync(path,data);
    const actual=await collect(readExcelStream(path));expect(actual.map(x=>x.row)).toEqual([{id:'001',name:'商品',active:true,value:12.5},{id:'002',name:'=literal',active:false,value:null}]);expect(actual.map(x=>x.rowNumber)).toEqual([2,3]);
    expect((await readExcel(data,{values:'raw'}))[0].rows).toEqual(actual.map(x=>x.row));
  }finally{rmSync(folder,{recursive:true,force:true});}
 });
 it('reads independently produced XLSX dates and header offsets and closes early',async()=>{
  const path=new URL('./fixtures/openpyxl-compat.xlsx',import.meta.url).pathname;
  expect((await collect(readExcelStream(path,{sheet:'Data'}))).map(x=>x.row.id)).toEqual(['001','900719925474099312345']);
  expect((await collect(readExcelStream(path,{sheet:'Titles',headerRow:2})))[0].rowNumber).toBe(3);
  for await(const row of readExcelStream(path,{sheet:'Data'})){expect(row.row.id).toBe('001');break;}
  await expect(collect(readExcelStream(path,{sheet:'Errors'}))).rejects.toMatchObject({code:'CELL_ERROR'});
  await expect(collect(readExcelStream(path,{sheet:'Data',maxRows:1}))).rejects.toMatchObject({code:'LIMIT_EXCEEDED'});
 });
 it('applies writer cancellation and input consumption backpressure',async()=>{
  let consumed=0,closed=false;async function* rows(){try{for(let i=0;i<10000;i++){consumed++;yield{id:String(i)};}}finally{closed=true;}}
  const c=new AbortController();let n=0;await expect((async()=>{for await(const _ of writeExcelStream(rows(),{columns:['id'],signal:c.signal})){if(++n===10)c.abort();}})()).rejects.toMatchObject({code:'ABORTED'});
  expect(consumed).toBeLessThan(10000);expect(closed).toBe(true);
 });
});


describe('cross-application business fixtures',()=>{
 it('matches LibreOffice cached calculations and reads its XLS and XLSX exports',async()=>{
  const input=fixture('business-libreoffice.xlsx');const wb=XLSX.read(input,{type:'array',cellFormula:true});
  const data=Object.fromEntries(wb.SheetNames.map(name=>[name,Object.fromEntries(Object.entries(wb.Sheets[name]).filter(([key])=>!key.startsWith('!')).map(([key,c])=>[key,c.f?{formula:c.f}:c.v]))]));
  const actual=calculateWorkbook(data);expect(actual.errors).toEqual([]);let checked=0;
  for(const name of wb.SheetNames)for(const [cell,c] of Object.entries(wb.Sheets[name]))if(c.f){checked++;if(typeof c.v==='number')expect(actual.sheets[name][cell]).toBeCloseTo(c.v,10);else expect(actual.sheets[name][cell]).toEqual(c.v);}
  expect(checked).toBe(11);
  for(const ext of ['xlsx','xls']){const [table]=await readExcel(fixture('business-libreoffice.'+ext),{sheets:['Orders'],values:'raw'});expect(table.rows.map(r=>r.total)).toEqual([25,15,0]);}
  const streamed=await collect(readExcelStream(new URL('./fixtures/business-libreoffice.xlsx',import.meta.url).pathname,{sheet:'Orders'}));expect(streamed.map(r=>r.row.total)).toEqual([25,15,0]);
 });
 it.each(['WithChart.xlsx','SimpleMacro.xlsm','SampleSS.strict.xlsx'])('preserves independent Excel-authored OOXML parts: %s',async file=>{
  const original=fixture('apache-poi/'+file),wb=XLSX.read(original),name=wb.SheetNames[0];
  const output=await patchWorkbook(original,[{sheet:name,cell:'A10',value:'SheetDelta verified'}]);expect(XLSX.read(output).Sheets[name].A10.v).toBe('SheetDelta verified');
  const a=unzipSync(original),b=unzipSync(output);expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
  const retained=Object.keys(a).filter(path=>!path.startsWith('xl/worksheets/sheet')&&path!=='xl/workbook.xml');for(const path of retained)expect(b[path],path).toEqual(a[path]);
  if(file==='SimpleMacro.xlsm')expect(b['xl/vbaProject.bin']).toEqual(a['xl/vbaProject.bin']);
  if(file==='WithChart.xlsx')expect(retained.some(p=>p.startsWith('xl/charts/'))).toBe(true);
 });
 it('preserves literal OOXML escape-like identifiers and carriage returns',async()=>{
  const row={id:'_x0041_',text:'line\rnext'};const output=await bytes(writeExcelStream([row],{columns:['id','text']}));
  expect((await readExcel(output))[0].rows[0]).toEqual(row);
  const folder=mkdtempSync(join(tmpdir(),'sheetdelta-text-'));try{const path=join(folder,'t.xlsx');writeFileSync(path,output);expect((await collect(readExcelStream(path)))[0].row).toEqual(row);}finally{rmSync(folder,{recursive:true,force:true});}
  const patched=await patchWorkbook(fixture('business-template.xlsx'),[{sheet:'Orders',cell:'A2',value:row.id}]);expect((await readExcel(patched,{sheets:['Orders']}))[0].rows[0].sku).toBe(row.id);
 });
});

describe('exact lookup formulas',()=>{
 it('supports common inventory lookup functions and returns explicit missing-key errors',()=>{
  const r=calculateWorkbook({S:{A1:'sku',B1:'price',A2:'001',B2:12.5,A3:'002',B3:7,C1:{formula:'=VLOOKUP("002",A2:B3,2,FALSE)'},C2:{formula:'=XLOOKUP("001",A2:A3,B2:B3)'},C3:{formula:'=INDEX(A2:B3,2,2)'},C4:{formula:'=MATCH("002",A2:A3,0)'},C5:{formula:'=IFNA(VLOOKUP("missing",A2:B3,2,FALSE),0)'},C6:{formula:'=HLOOKUP("price",A1:B3,2,FALSE)'},C7:{formula:'=VLOOKUP("001",A2:B3,2,TRUE)'}}});
  expect(r.sheets.S).toMatchObject({C1:7,C2:12.5,C3:7,C4:2,C5:0,C6:12.5,C7:'#NAME?'});expect(r.errors).toHaveLength(1);
 });
 it('enforces a work budget for repeated range calculations',()=>{
  expect(calculateWorkbook({S:{A1:1,A2:2,A3:3,B1:{formula:'=SUM(A1:A3)'},B2:{formula:'=SUM(A1:A3)'}}},{maxOperations:5}).errors.some(e=>e.message.includes('budget'))).toBe(true);
 });
});

describe('stream and workbook rejection paths',()=>{
 it('rejects merged interiors and oversized ZIP packages without returning output',async()=>{
  await expect(patchWorkbook(fixture('openpyxl-compat.xlsx'),[{sheet:'Merged',cell:'B3',value:2}])).rejects.toMatchObject({code:'MERGED_CELLS'});
  await expect(patchWorkbook(fixture('business-template.xlsx'),[],{maxUncompressedBytes:100})).rejects.toMatchObject({code:'LIMIT_EXCEEDED'});
 });
 it('bounds wide CSV records and applies mid-stream cancellation',async()=>{
  await expect(collect(readCsvStream(pieces('a,b,c\n12,34,56'),{maxRecordChars:6}))).rejects.toMatchObject({code:'LIMIT_EXCEEDED'});
  const c=new AbortController();let seen=0;await expect((async()=>{for await(const row of readExcelStream(new URL('./fixtures/business-libreoffice.xlsx',import.meta.url).pathname,{sheet:'Orders',signal:c.signal})){seen++;c.abort();}})()).rejects.toMatchObject({code:'ABORTED'});expect(seen).toBe(1);
 });
});


describe('formula coercion compatibility',()=>{
 it('checks the expanded LibreOffice oracle and documents intentional mixed-type differences',()=>{
  const wb=XLSX.read(fixture('formula-oracle-libreoffice.xlsx'));const sheet=wb.Sheets.Cases;
  const input=Object.fromEntries(Object.entries(sheet).filter(([k])=>!k.startsWith('!')).map(([k,c])=>[k,c.f?{formula:c.f}:c.v]));const result=calculateWorkbook({Cases:input});expect(result.errors).toEqual([]);
  // Excel ignores referenced booleans in numeric aggregates; Calc can count them.
  // Numeric criteria in this API also match numeric text and exclude booleans.
  const differences:Record<string,number>={C1:3,C3:0,C4:4,C6:0,C9:1.5,C32:1,C33:90,C49:7,C51:2};let count=0;
  for(const [cell,c]of Object.entries(sheet))if(c.f){count++;const actual=result.sheets.Cases[cell];if(Object.hasOwn(differences,cell))expect(actual).toBe(differences[cell]);else if(typeof c.v==='number')expect(actual).toBeCloseTo(c.v,10);else expect(actual).toBe(c.v);}
  expect(count).toBe(53);
 });
 it('writes future-function prefixes without rewriting quoted formula text',async()=>{
  const bytes=await patchWorkbook(fixture('business-template.xlsx'),[{sheet:'Orders',cell:'E2',formula:'=IFNA(XLOOKUP("001",A2:A4,B2:B4),"CONCAT(a,b)")'}]);
  const xml=strFromU8(unzipSync(bytes)['xl/worksheets/sheet1.xml']);expect(xml).toContain('_xlfn.IFNA(_xlfn.XLOOKUP');expect(xml).toContain('"CONCAT(a,b)"');
  const output=await recalculateExcel(bytes);expect((await readExcel(output,{sheets:['Orders'],values:'raw'}))[0].rows[0].label).toBe(2);
 });
});
