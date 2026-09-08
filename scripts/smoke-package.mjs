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
    import { compareTables } from 'sheetdelta-core/compare';
    import { readCsv, writeCsv } from 'sheetdelta-core/csv';
    import { readExcel, writeExcel, exportDiffExcel } from 'sheetdelta-core/excel';
    import { cleanTable, deduplicateTable } from 'sheetdelta-core/clean';
    import { validateTable } from 'sheetdelta-core/validate';
    import { mergeTables, appendTables } from 'sheetdelta-core/merge';
    const result = rootCompare([{id:'001',price:10}], [{id:'001',price:12}], {
      keys:[{left:'id',right:'id'}], columns:[{left:'price',right:'price'}]
    });
    assert.equal(result.summary.changed, 1);
    assert.ok(exportDiffCsv(result).includes('changed'));
    assert.equal(typeof TableValidationError, 'function');
    assert.equal(rootCompare, compareTables);
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
    const table: TableData = readCsv('id,v\\n001,2');
    await readExcel(await writeExcel([{name:'Data',rows:table.rows}]));
    validateTable(cleanTable(table.rows,{v:{type:'number'}}).rows,{v:{type:'number'}});
    mergeTables([],[],{keys:['id']});
  `;
  writeFileSync(join(cwd, 'consumer.ts'), types);
  execFileSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'), '--strict', '--noEmit', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.ts'], { cwd, stdio: 'pipe' });
  console.log('Packed TypeScript consumer and legacy CompareOptions: PASS');
  for (const entry of ['sheetdelta-core', 'sheetdelta-core/compare', 'sheetdelta-core/validate', 'sheetdelta-core/clean', 'sheetdelta-core/merge']) {
    const bundled = await build({ stdin: { contents: `export * from '${entry}';`, resolveDir: cwd }, bundle: true, minify: true, format: 'esm', platform: 'browser', write: false, metafile: true });
    assert.ok(!Object.keys(bundled.metafile.inputs).some(path => /node_modules\/(xlsx|papaparse|fflate)\//.test(path)), `${entry} must not load file dependencies`);
    assert.ok(bundled.outputFiles[0].contents.length < 20_000, `${entry} bundle budget`);
    console.log(`${entry}: ${bundled.outputFiles[0].contents.length} minified bytes; no file-format dependencies`);
  }
  const excelBundle = await build({ stdin: { contents: `export {readExcel,writeExcel,exportDiffExcel} from 'sheetdelta-core/excel';`, resolveDir: cwd }, bundle: true, splitting: true, minify: true, format: 'esm', platform: 'browser', outdir: join(cwd, 'browser'), write: false, metafile: true });
  assert.ok(excelBundle.outputFiles.length > 1, 'Excel dynamic dependency chunks');
  for (const output of Object.values(excelBundle.metafile.outputs)) assert.ok(!output.imports.some(i => i.external), 'No unresolvable browser externals');
  console.log('Browser Excel bundle with lazy chunks: PASS');
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
