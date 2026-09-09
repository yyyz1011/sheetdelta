import { encodeXlsxText } from './ooxml.js';
import { Zip, ZipDeflate, strToU8 } from 'fflate';
import type { Row, Cell } from './types.js';
import { assertKeys, assertRow } from './table.js';
import { fail } from './errors.js';
import { cellAddress } from './formula.js';
export interface ExcelStreamWriteOptions { columns:string[]; sheetName?:string; signal?:AbortSignal; maxRows?:number }
const xml=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
/** Stream a new, single-sheet XLSX workbook as ZIP chunks. Uses inline strings; no row/shared-string cache. */
export async function* writeExcelStream(rows:AsyncIterable<Row>|Iterable<Row>,options:ExcelStreamWriteOptions):AsyncGenerator<Uint8Array>{
  assertKeys(options.columns);const name=options.sheetName??'Data',maxRows=options.maxRows??1048575;
  if(!name||name.length>31||/[\\/*?:\[\]\x00-\x1f]/.test(name)||/^'|'$/.test(name)||options.columns.length>16384||!Number.isSafeInteger(maxRows)||maxRows<1||maxRows>1048575)fail('INVALID_OPTIONS','Invalid XLSX stream options.');
  const check=()=>{if(options.signal?.aborted)fail('ABORTED','Excel export cancelled.');};
  const pending:Uint8Array[]=[];let failure:Error|undefined;const zip=new Zip((error,data)=>{if(error)failure=error;else pending.push(data);});
  const pushFile=(path:string,text:string)=>{const file=new ZipDeflate(path,{level:6});zip.add(file);file.push(strToU8(text),true);};
  const cell=(value:Cell,address:string)=>{
    if(value==null)return `<c r="${address}"/>`;
    if(typeof value==='number'){if(!Number.isFinite(value))fail('INVALID_DATA','Nonfinite Excel number.');return `<c r="${address}"><v>${value}</v></c>`;}
    if(typeof value==='boolean')return `<c r="${address}" t="b"><v>${+value}</v></c>`;
    if(typeof value!=='string'||value.length>32767||/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(value))fail('INVALID_DATA','Invalid Excel cell text.');
    return `<c r="${address}" t="inlineStr"><is><t xml:space="preserve">${xml(encodeXlsxText(value))}</t></is></c>`;
  };
  try{check();
    pushFile('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
    pushFile('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    pushFile('xl/workbook.xml',`<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(name)}" sheetId="1" r:id="rId1"/></sheets></workbook>`);
    pushFile('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
    const sheet=new ZipDeflate('xl/worksheets/sheet1.xml',{level:6});zip.add(sheet);sheet.push(strToU8('<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">'+options.columns.map((c,i)=>cell(c,cellAddress(1,i+1))).join('')+'</row>'));
    while(pending.length)yield pending.shift()!;
    let count=0;for await(const row of rows){check();assertRow(row,count);if(++count>maxRows)fail('LIMIT_EXCEEDED','Excel row limit exceeded.',{limit:maxRows});sheet.push(strToU8(`<row r="${count+1}">`+options.columns.map((c,i)=>cell(Object.hasOwn(row,c)?row[c]:null,cellAddress(count+1,i+1))).join('')+'</row>'));if(failure)throw failure;while(pending.length)yield pending.shift()!;}
    sheet.push(strToU8('</sheetData></worksheet>'),true);zip.end();if(failure)throw failure;while(pending.length){check();yield pending.shift()!;}
  }finally{zip.terminate();}
}
