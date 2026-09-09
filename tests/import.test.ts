import { cellAddress } from '../packages/core/src/formula.js';
import { describe, it, expect } from 'vitest';
import { mapImportHeaders, prepareImport, importFile, locateImportCell, type ImportSchema } from '../packages/core/src/import.js';
import { exportImportReport } from '../packages/core/src/import-report.js';
import { readCsv } from '../packages/core/src/csv.js';
import { readExcel, writeExcel } from '../packages/core/src/excel.js';
import { validateTable } from '../packages/core/src/validate.js';
import { patchWorkbook } from '../packages/core/src/workbook.js';
import { readZipBudget } from '../packages/core/src/zip-budget.js';
import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate';

const schema: ImportSchema = { fields: [
  { key: 'sku', aliases: ['商品编号'], requiredColumn: true, rule: { required: true, unique: true, type: 'string' } },
  { key: 'qty', aliases: ['数量'], requiredColumn: true, clean: { trim: true, type: 'number' }, rule: { type: 'number', min: 0, required: true } },
] };
describe('import mapping and structural checks', () => {
  it('maps aliases without changing leading-zero identifiers', async () => {
    const result = await importFile('商品编号,数量\n001, 2 ', schema, { format: 'csv', fileName: 'stock.csv' });
    expect(result.rows).toEqual([{ sku: '001', qty: 2 }]); expect(result.status).toBe('ready');
    expect(result.changes[0]).toMatchObject({ row: 1, before: ' 2 ', after: 2, source: { sourceRow: 2, sourceColumn: '数量', positionKind: 'csv-record' } });
  });
  it('requires columns independently from blank values and zero data rows', async () => {
    const s: ImportSchema = { fields: [{ key: 'optional', requiredColumn: true }] };
    expect((await importFile('optional\n', s, { format: 'csv' })).valid).toBe(true);
    const result = await importFile('wrong\n', s, { format: 'csv', mode: 'valid-rows' });
    expect(result.status).toBe('invalid'); expect(result.issues[0].code).toBe('missing-column');
    expect((await importFile('optional,x\n,1', s, { format: 'csv' })).rows).toEqual([{ optional: '' }]);
  });
  it('rejects ambiguous aliases rather than guessing and supports explicit source', () => {
    const headers = ['SKU', 'sku', '数量'];
    expect(mapImportHeaders(headers, schema.fields).issues[0].code).toBe('ambiguous-column');
    expect(mapImportHeaders(headers, [{ key: 'sku', source: 'SKU' }]).mappings[0].column).toBe('SKU');
  });
  it('detects reuse, unknown columns and missing explicitly selected source', () => {
    expect(mapImportHeaders(['x'], [{ key: 'a', aliases: ['x'] }, { key: 'b', aliases: ['x'] }]).issues.map(x => x.code)).toEqual(['reused-column', 'reused-column']);
    expect(mapImportHeaders(['x'], [{ key: 'a', source: 'missing' }], { allowUnknownColumns: false }).issues.map(x => x.code)).toEqual(['missing-column', 'unknown-column']);
  });
  it('does not mutate tables and handles prototype-like field names safely', async () => {
    const table = readCsv('__proto__,数量\n001,2'); const snapshot = JSON.stringify(table);
    const r = await prepareImport(table, { fields: [{ key: '__proto__' }, { key: 'constructor', source: '数量' }] });
    expect(Object.hasOwn(r.rows[0], '__proto__')).toBe(true); expect(r.rows[0].constructor).toBe('2'); expect(JSON.stringify(table)).toBe(snapshot);
  });
  it('rejects invalid options, schema and mismatching source positions', async () => {
    expect(() => mapImportHeaders(['a'], [{ key: 'a' }, { key: 'a' }])).toThrow();
    await expect(prepareImport({ ...readCsv('sku,qty\n001,1'), rowNumbers: [] }, schema)).rejects.toMatchObject({ code: 'INVALID_DATA' });
    await expect(importFile('sku,qty\n001,1', schema, { format: 'csv', maxCells: 1 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' });
    await expect(importFile('sku,qty\n001,1', schema, { format: 'csv', mode: 'anything' as any })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
  });
});
describe('validation, tracing and repair', () => {
  it('strict mode withholds data and opt-in partial mode preserves original row locations', async () => {
    const text = 'sku,qty\n001,1\n\n002,-2\n003,3';
    const strict = await importFile(text, schema, { format: 'csv' });
    expect(strict.rows).toEqual([]); expect(strict.validRows).toEqual([1, 3]);
    const partial = await importFile(text, schema, { format: 'csv', mode: 'valid-rows' });
    expect(partial.status).toBe('partial'); expect(partial.rows.map(r => r.sku)).toEqual(['001', '003']);
    expect(partial.sources.map(s => s.sourceRow)).toEqual([2, 5]);
    expect(locateImportCell(partial, 2, 'qty')).toMatchObject({ sourceRow: 4, positionKind: 'csv-record', sourceColumn: 'qty', columnIndex: 2 });
    expect(locateImportCell(partial, 2, 'qty').cell).toBeUndefined();
  });
  it('distinguishes multiline CSV records from physical lines', async () => {
    const r = await importFile('sku,qty\n"00\n1",1\n002,-2', schema, { format: 'csv' });
    expect(r.issues[0].source?.sourceRow).toBe(3); expect(r.issues[0].source?.positionKind).toBe('csv-record');
  });
  it('maps Excel errors to original worksheet addresses after blank rows', async () => {
    const bytes = await writeExcel([{ name: 'Stock', columns: ['商品编号', '数量'], rows: [{ 商品编号: '001', 数量: 1 }, {}, { 商品编号: '002', 数量: -2 }] }]);
    const r = await importFile(bytes, schema, { format: 'excel', excel: { values: 'raw' }, fileName: 'stock.xlsx' });
    expect(r.issues[0].source).toMatchObject({ fileName: 'stock.xlsx', sheet: 'Stock', sourceRow: 4, cell: 'B4' });
  });
  it('runs row and table rules with severity and rule IDs', async () => {
    const r = await importFile('sku,qty\n001,2', { ...schema,
      rowRules: [{ id: 'stock-note', validate: row => row.qty === 2 ? [{ code: 'low', severity: 'warning', column: 'qty', message: 'Low stock' }] : [] }],
      tableRules: [{ id: 'total', validate: rows => rows.length < 2 ? [{ code: 'batch-size', severity: 'warning', message: 'Small batch' }] : [] }],
    }, { format: 'csv' });
    expect(r.valid).toBe(true); expect(r.summary.warnings).toBe(2); expect(r.issues[0].ruleId).toBe('stock-note');
  });
  it('global custom errors block every row even in partial mode', async () => {
    const r = await importFile('sku,qty\n001,2', { ...schema, tableRules: [{ id: 'closed', validate: () => [{ code: 'closed', severity: 'error', message: 'Batch closed' }] }] }, { format: 'csv', mode: 'valid-rows' });
    expect(r.rows).toEqual([]); expect(r.invalidRows).toEqual([1]);
  });
  it('custom validation receives frozen snapshots and exceptions propagate', async () => {
    await expect(importFile('sku,qty\n001,2', { ...schema, rowRules: [{ id: 'async', validate: (() => Promise.reject(new Error('async failure'))) as any }] }, { format: 'csv' })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    await expect(importFile('sku,qty\n001,2', { ...schema, rowRules: [{ id: 'mutate', validate: row => { (row as any).sku = 'changed'; return []; } }] }, { format: 'csv' })).rejects.toThrow();
    await expect(importFile('sku,qty\n001,2', { ...schema, rowRules: [{ id: 'bad', validate: () => ({}) as any }] }, { format: 'csv' })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    await expect(importFile('sku,qty\n001,2', { ...schema, tableRules: [{ id: 'bad-row', validate: () => [{ row: 2, code: 'bad', message: 'bad', severity: 'error' }] }] }, { format: 'csv' })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
  });
  it('bounds errors instead of silently truncating', async () => {
    await expect(importFile('sku,qty\n001,-1\n002,-2', schema, { format: 'csv', maxIssues: 1 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' });
    expect(() => validateTable([{ n: -1 }, { n: -2 }], { n: { min: 0 } }, { maxIssues: 1 })).toThrow();
  });
  it('preserves failed conversions, reports duplicate groups and retains source data', async () => {
    const r = await importFile('sku,qty\n001,whoops\n001,2', schema, { format: 'csv' });
    expect(r.processedRows[0].qty).toBe('whoops'); expect(r.original.rows[0].qty).toBe('whoops');
    expect(r.issues.filter(i => i.code === 'unique').map(i => i.row)).toEqual([1, 2]);
  });
  it('supports cancellation during batching and never reports complete afterward', async () => {
    const controller = new AbortController(); const phases: string[] = [];
    await expect(importFile('sku,qty\n001,1\n002,2', schema, { format: 'csv', signal: controller.signal, batchSize: 1, onProgress: e => { phases.push(e.phase); if (e.phase === 'clean') controller.abort(); } })).rejects.toMatchObject({ code: 'ABORTED' });
    expect(phases).not.toContain('complete');
  });
  it('propagates callback failures and honors pre-aborted inputs', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(importFile('bad', schema, { format: 'csv', signal: controller.signal })).rejects.toMatchObject({ code: 'ABORTED' });
    await expect(importFile('sku,qty', schema, { format: 'csv', onProgress: () => { throw new Error('callback'); } })).rejects.toThrow('callback');
  });
  it('requires explicit selection with multiple worksheets', async () => {
    const bytes = await writeExcel(['A', 'B'].map(name => ({ name, rows: [{ sku: '001', qty: 2 }] })));
    await expect(importFile(bytes, schema, { format: 'excel' })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    expect((await importFile(bytes, schema, { format: 'excel', sheet: 'B', excel: { values: 'raw' } })).sources[0].sheet).toBe('B');
  });
  it('exports editable original values and literal formula-shaped strings, then reimports repairs', async () => {
    const r = await importFile('商品编号,数量\n001,-2\n=not_a_formula,3', schema, { format: 'csv' });
    const bytes = await exportImportReport(r); const files = unzipSync(bytes);
    expect(strFromU8(files['xl/worksheets/sheet1.xml'])).toMatch(/<c[^>]*r="B2"[^>]*s="\d+"/);
    expect(strFromU8(files['xl/worksheets/sheet1.xml'])).not.toContain('<f>');
    expect((await readExcel(bytes, { sheets: ['Data'], values: 'raw' }))[0].rows[0]['商品编号']).toBe('001');
    const fixed = await patchWorkbook(bytes, [{ sheet: 'Data', cell: 'B2', value: 2 }]);
    const imported = await importFile(fixed, schema, { format: 'excel', sheet: 'Data', excel: { values: 'raw' } });
    expect(imported.valid).toBe(true); expect(imported.rows[0].qty).toBe(2); expect(imported.rows[1].sku).toBe('=not_a_formula');
  });
  it('highlights empty invalid cells and handles reports with no issues', async () => {
    const r = await importFile('sku,qty\n001,', schema, { format: 'csv' });
    const files = unzipSync(await exportImportReport(r)); expect(strFromU8(files['xl/worksheets/sheet1.xml'])).toMatch(/<c[^>]*r="B2"[^>]*s="\d+"/);
    expect((await readExcel(await exportImportReport(await importFile('sku,qty\n001,1', schema, { format: 'csv' })))).map(t => t.name)).toEqual(['Data', 'Issues', 'Summary']);
  });
});
describe('bounded OOXML decompression', () => {
  it('rejects nonfinite and out-of-range public coordinate helper inputs', () => {
    expect(() => cellAddress(1, Infinity)).toThrow();
    expect(() => cellAddress(0, 1)).toThrow();
    expect(cellAddress(1048576, 16384)).toBe('XFD1048576');
  });
  it('bounds declared decompression before parsing and limits entries', async () => {
    const bytes = await writeExcel([{ name: 'Data', rows: [{ sku: '001', qty: 2 }] }]);
    await expect(readExcel(bytes, { maxUncompressedBytes: 1 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' });
    await expect(readExcel(bytes, { maxEntries: 1 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' });
    await expect(patchWorkbook(bytes, [], { maxUncompressedBytes: 1 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' });
  });
  it('rejects expansion beyond forged declared sizes', () => {
    const zip = zipSync({ 'data.xml': strToU8('x'.repeat(200000)) }); const view = new DataView(zip.buffer);
    view.setUint32(22, 1, true);
    for (let i = 0; i < zip.length - 46; i++) if (view.getUint32(i, true) === 0x02014b50) view.setUint32(i + 24, 1, true);
    expect(() => readZipBudget(zip, 10000, 100)).toThrow();
  });
  it('rejects unsafe package paths and incomplete archives', () => {
    expect(() => readZipBudget(zipSync({ '../evil.xml': strToU8('x') }), 1000, 100)).toThrow();
    expect(() => readZipBudget(new Uint8Array([80, 75, 3, 4]), 1000, 100)).toThrow();
  });
});
