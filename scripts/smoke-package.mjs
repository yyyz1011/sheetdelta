import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { build } from 'esbuild';
const { name, version } = JSON.parse(readFileSync('packages/core/package.json', 'utf8'));
const tarball = resolve('artifacts', `${name}-${version}.tgz`);
const cwd = mkdtempSync(join(tmpdir(), 'sheetdelta-consumer-'));
try {
  writeFileSync(join(cwd, 'package.json'), '{"private":true,"type":"module"}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd, stdio: 'pipe' });
  const code = `
    import assert from 'node:assert/strict';
    import { compareTables as rootCompare, exportDiffCsv, TableValidationError } from 'sheetdelta-core';
    import { compareTables, compareTablesAsync } from 'sheetdelta-core/compare';
    import { SheetDeltaError } from 'sheetdelta-core/errors';
    import { readCsv, readCsvBytes, writeCsv } from 'sheetdelta-core/csv';
    import { readExcel, writeExcel, exportDiffExcel } from 'sheetdelta-core/excel';
    import { cleanTable, deduplicateTable } from 'sheetdelta-core/clean';
    import { validateTable } from 'sheetdelta-core/validate';
    import { mergeTables, appendTables } from 'sheetdelta-core/merge';
    import { importFile, mapImportHeaders, prepareImport, locateImportCell, importWithTemplate, serializeImportTemplate, parseImportTemplate } from 'sheetdelta-core/import';
    import { exportImportReport } from 'sheetdelta-core/import-report';
    import { calculateWorkbook } from 'sheetdelta-core/formula';
    import { patchWorkbook, recalculateExcel } from 'sheetdelta-core/workbook';
    import { readCsvStream, writeCsvStream, compareSortedStreams } from 'sheetdelta-core/stream';
    import { writeExcelStream } from 'sheetdelta-core/excel-stream';
    import { readExcelStream } from 'sheetdelta-core/excel-node';
    import { createImportSession } from 'sheetdelta-core/session';
    import { writeFileSync } from 'node:fs';
    const savedTemplate = parseImportTemplate(serializeImportTemplate({version:1,id:'supplier',revision:1,format:'csv',fields:[{key:'id'},{key:'active',clean:{dictionary:{entries:[{from:'Yes',to:true}]}}}]}));
    const reused = await importWithTemplate('id,active\\n001,Yes',savedTemplate,{batchRules:[{id:'known',validate:async items=>items.filter(item=>item.values.id!=='001').map(item=>({row:item.row,code:'unknown',message:'Unknown',severity:'error'}))}]});
    assert.deepEqual(reused.rows,[{id:'001',active:true}]);
    const importSchema = {fields:[{key:'id',requiredColumn:true},{key:'qty',clean:{type:'number'},rule:{min:0}}]};
    const importResult = await importFile('id,qty\\n001,-2', importSchema, {format:'csv'});
    assert.equal(importResult.status,'invalid');
    assert.equal(importResult.rows.length,0);
    assert.equal(mapImportHeaders(['id','qty'],importSchema.fields).valid,true);
    assert.equal(locateImportCell(importResult,1,'qty').sourceRow,2);
    assert.equal((await prepareImport(readCsv('id,qty\\n001,2'),importSchema)).rows[0].qty,2);
    assert.equal((await readExcel(await exportImportReport(importResult),{sheets:['Data']}))[0].rows[0].id,'001');
    async function collect(source) { const out=[]; for await (const x of source) out.push(x); return out; }
    assert.equal(calculateWorkbook({S:{A1:2,B1:{formula:'=A1*3'}}}).sheets.S.B1,6);
    const streamed = await collect(readCsvStream(writeCsvStream([{id:'001',v:2}],{columns:['id','v']})));
    assert.equal(streamed[0].row.id,'001');
    const file = Buffer.concat(await collect(writeExcelStream([{id:'001',v:2}],{columns:['id','v']})));
    writeFileSync('streamed.xlsx', file);
    assert.equal((await collect(readExcelStream('streamed.xlsx')))[0].row.v,2);
    const patched = await patchWorkbook(file,[{sheet:'Data',cell:'B2',formula:'=3*4'}]);
    assert.equal((await readExcel(await recalculateExcel(patched),{values:'raw'}))[0].rows[0].v,12);
    assert.equal((await collect(compareSortedStreams([{id:'1',v:1}],[{id:'1',v:2}],{keys:['id'],columns:['v']})))[0].status,'changed');
    const result = rootCompare([{id:'001',price:10}], [{id:'001',price:12}], {
      keys:[{left:'id',right:'id'}], columns:[{left:'price',right:'price'}]
    });
    assert.equal(result.summary.changed, 1);
    assert.ok(exportDiffCsv(result).includes('changed'));
    assert.equal(typeof TableValidationError, 'function');
    assert.equal(rootCompare, compareTables);
    assert.deepEqual(await compareTablesAsync([{id:'001',price:10}], [{id:'001',price:12}], {keys:['id']}), compareTables([{id:'001',price:10}], [{id:'001',price:12}], {keys:['id']}));
    assert.equal(readCsvBytes(new TextEncoder().encode('id,v\\n001,2')).rows[0].id, '001');
    const controller = new AbortController(); controller.abort();
    await assert.rejects(compareTablesAsync([], [], {keys:['id']}, {signal:controller.signal}), error => error instanceof SheetDeltaError && error.code === 'ABORTED');
    await assert.rejects(createImportSession(() => { throw new Error('must not start'); }, 'id\\n001', {format:'csv',signal:controller.signal}), error => error instanceof SheetDeltaError && error.code === 'ABORTED');
    const table = readCsv(writeCsv([{id:'001',price:12}]));
    const clean = cleanTable(table.rows, {price:{type:'number'}});
    assert.equal(validateTable(clean.rows,{price:{type:'number'}}).valid,true);
    assert.equal(deduplicateTable([...clean.rows,...clean.rows],{keys:['id']}).rows.length,1);
    assert.equal(mergeTables(clean.rows,[{id:'001',stock:5}],{keys:['id']}).rows[0].stock,5);
    assert.equal(appendTables([clean.rows,clean.rows]).rows.length,2);
    const bytes = await writeExcel([{name:'Data',rows:clean.rows}]);
    assert.equal((await readExcel(bytes,{values:'raw'}))[0].rows[0].price,12);
    assert.equal((await readExcel(await exportDiffExcel(result))).length,4);
    console.log('Packed npm consumer, all entry points and XLSX roundtrip: PASS');
  `;
  writeFileSync(join(cwd, 'smoke.mjs'), code);
  process.stdout.write(execFileSync(process.execPath, ['smoke.mjs'], { cwd, encoding: 'utf8' }));
  const types = `
    import { compareTables, type CompareOptions } from 'sheetdelta-core';
    import { importWithTemplate, type ImportTemplate, type ImportBatchRule } from 'sheetdelta-core/import';
    import { createImportSession, type ImportSessionState } from 'sheetdelta-core/session';
    const template: ImportTemplate = {version:1,id:'sample',revision:1,format:'csv',fields:[{key:'id'}]};
    const batchRule: ImportBatchRule = {id:'check',validate:async (items,{signal})=> signal.aborted ? [] : items.filter(item=>!item.values.id).map(item=>({row:item.row,code:'missing',message:'Missing',severity:'error'}))};
    void importWithTemplate('id', template, {batchRules:[batchRule]});
    import type { CompareInputOptions, TableData, DiffResult } from 'sheetdelta-core/types';
    import { readExcel, writeExcel } from 'sheetdelta-core/excel';
    import { readCsv } from 'sheetdelta-core/csv';
    import { cleanTable } from 'sheetdelta-core/clean';
    import { mergeTables } from 'sheetdelta-core/merge';
    import { validateTable } from 'sheetdelta-core/validate';
    const old: CompareOptions = { keys:[{left:'id',right:'id'}], columns:[{left:'v',right:'v'}] };
    old.columns[0].left;
    const modern: CompareInputOptions = {keys:['id']};
    const result: DiffResult = compareTables([], [], modern);
    const state = null as ImportSessionState | null;
    void state;
    void createImportSession;
    const table: TableData = readCsv('id,v\\n001,2');
    await readExcel(await writeExcel([{name:'Data',rows:table.rows}]));
    validateTable(cleanTable(table.rows,{v:{type:'number'}}).rows,{v:{type:'number'}});
    mergeTables([],[],{keys:['id']});
  `;
  writeFileSync(join(cwd, 'consumer.ts'), types);
  execFileSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'), '--strict', '--noEmit', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.ts'], { cwd, stdio: 'pipe' });
  console.log('Packed TypeScript consumer and legacy CompareOptions: PASS');
  for (const entry of ['sheetdelta-core', 'sheetdelta-core/compare', 'sheetdelta-core/validate', 'sheetdelta-core/clean', 'sheetdelta-core/merge', 'sheetdelta-core/errors', 'sheetdelta-core/formula']) {
    const bundled = await build({ stdin: { contents: `export * from '${entry}';`, resolveDir: cwd }, bundle: true, minify: true, format: 'esm', platform: 'browser', write: false, metafile: true });
    assert.ok(!Object.keys(bundled.metafile.inputs).some(path => /node_modules\/(xlsx|papaparse|fflate)\//.test(path)), `${entry} must not load file dependencies`);
    assert.ok(bundled.outputFiles[0].contents.length < 20_000, `${entry} bundle budget`);
    console.log(`${entry}: ${bundled.outputFiles[0].contents.length} minified bytes; no file-format dependencies`);
  }
  const excelBundle = await build({ stdin: { contents: `export {readExcel,writeExcel,exportDiffExcel} from 'sheetdelta-core/excel';`, resolveDir: cwd }, bundle: true, splitting: true, minify: true, format: 'esm', platform: 'browser', outdir: join(cwd, 'browser'), write: false, metafile: true });
  assert.ok(excelBundle.outputFiles.length > 1, 'Excel dynamic dependency chunks');
  for (const output of Object.values(excelBundle.metafile.outputs)) assert.ok(!output.imports.some(i => i.external), 'No unresolvable browser externals');
  console.log('Browser Excel bundle with lazy chunks: PASS');
  for (const entry of ['worker', 'session', 'workbook', 'stream', 'excel-stream', 'import', 'import-report']) {
    const output=await build({ stdin:{contents:`export * from 'sheetdelta-core/${entry}';`,resolveDir:cwd},bundle:true,splitting:true,minify:true,format:'esm',platform:'browser',outdir:join(cwd,'browser-'+entry),write:false,metafile:true });
    for(const file of Object.values(output.metafile.outputs)) assert.ok(!file.imports.some(i=>i.external), `${entry} has no unresolved browser imports`);
    console.log(`${entry} browser bundle: PASS`);
  }
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
