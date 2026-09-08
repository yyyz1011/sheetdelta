import { describe, expect, it } from 'vitest';
import { compareTables } from '../packages/core/src/compare';
import { readCsv, writeCsv } from '../packages/core/src/csv';
import { readExcel, writeExcel, exportDiffExcel } from '../packages/core/src/excel';
import { validateTable } from '../packages/core/src/validate';
import { cleanTable, deduplicateTable } from '../packages/core/src/clean';
import { mergeTables, appendTables, MergeConflictError } from '../packages/core/src/merge';
import * as XLSX from 'xlsx';
import { unzipSync, strFromU8 } from 'fflate';

describe('simplified comparison', () => {
  it('retains non-key report fields when one input is empty', () => {
    const added = compareTables([], [{ id: '001', price: 12 }], { keys: ['id'] });
    const removed = compareTables([{ id: '001', price: 12 }], [], { keys: ['id'] });
    expect(added.options.columns).toEqual([{ left: 'price', right: 'price' }]);
    expect(removed.options.columns).toEqual(added.options.columns);
  });
  it('infers common non-key columns and reports schema additions/removals', () => {
    const result = compareTables([{ id: '001', price: 1, legacy: 'x' }], [{ id: '001', price: 2, fresh: true }], { keys: ['id'] });
    expect(result.summary.changed).toBe(1);
    expect(result.schema).toEqual({ added: ['fresh'], removed: ['legacy'], common: ['id', 'price'] });
    expect(result.options.columns).toEqual([{ left: 'price', right: 'price' }]);
  });
  it('ignores requested columns and permits key-only comparison', () => {
    expect(compareTables([{ id: 1, timestamp: 1 }], [{ id: 1, timestamp: 2 }], { keys: ['id'], ignoreColumns: ['timestamp'] }).summary.unchanged).toBe(1);
    expect(compareTables([{ id: 1 }], [{ id: 2 }], { keys: ['id'] }).summary).toMatchObject({ removed: 1, added: 1 });
  });
  it('retains default coercion but supports strict types and distinct null/empty values', () => {
    expect(compareTables([{ id: 1, v: 10 }], [{ id: 1, v: '10' }], { keys: ['id'] }).summary.unchanged).toBe(1);
    expect(compareTables([{ id: 1, v: 10 }], [{ id: 1, v: '10' }], { keys: ['id'], valueMode: 'strict' }).summary.changed).toBe(1);
    expect(compareTables([{ id: 1, v: null }], [{ id: 1, v: '' }], { keys: ['id'], emptyValues: 'distinct' }).summary.changed).toBe(1);
  });
  it('applies field normalization independently of keys', () => {
    const result = compareTables([{ id: 'A', name: 'BOB ' }], [{ id: 'A', name: 'bob' }], { keys: ['id'], columns: [{ left: 'name', right: 'name', trim: true, ignoreCase: true }] });
    expect(result.summary.unchanged).toBe(1);
    expect(result.options.ignoreCase).toBeUndefined();
  });
});

describe('CSV import and export', () => {
  it('handles BOM, quotes, embedded newlines and leading-zero IDs', () => {
    const result = readCsv('\uFEFFid,note\r\n001,"a,b\nline"\r\n002,"say ""hi"""');
    expect(result.rows).toEqual([{ id: '001', note: 'a,b\nline' }, { id: '002', note: 'say "hi"' }]);
    expect(readCsv(writeCsv(result.rows)).rows).toEqual(result.rows);
  });
  it('supports custom headers and delimiter while preserving source record numbers', () => {
    const result = readCsv('Report\nid\tvalue\n001\t2\n\n002\t3', { headerRow: 2, delimiter: '\t' });
    expect(result.rowNumbers).toEqual([3, 5]);
    expect(result.headers).toEqual(['id', 'value']);
  });
  it('rejects invalid input instead of truncating', () => {
    expect(() => readCsv('id,id\n1,2')).toThrow(/unique/);
    expect(() => readCsv('id,value\n"unclosed')).toThrow(/Invalid CSV/);
    expect(() => readCsv('id\n1\n2', { maxRows: 1 })).toThrow(/limit/);
    expect(() => readCsv('id\n1,2')).toThrow(/more values/);
    expect(() => readCsv('id\n1', { headerRow: 0 })).toThrow(/positive/);
  });
  it('escapes dangerous text including headers, but preserves numeric negative values', () => {
    const rows = [Object.fromEntries([['=column', '\t=HYPERLINK("x")'], ['number', -3]])];
    const csv = writeCsv(rows);
    expect(csv).toContain("'=column"); expect(csv).toContain("'\t=HYPERLINK");
    expect(csv).toContain('"-3"');
    expect(writeCsv([{ value: '=SUM(1)' }], { escapeFormulae: false })).toContain('"=SUM(1)"');
  });
  it('handles prototype-like headers as own fields', () => {
    const result = readCsv('__proto__,constructor\nx,y');
    expect(Object.hasOwn(result.rows[0], '__proto__')).toBe(true);
    expect(result.rows[0].__proto__).toBe('x');
  });
});

describe('schema validation', () => {
  it('reports every duplicate row along with required, type and enum failures', () => {
    const result = validateTable([{ id: 'x', amount: -1, status: 'bad' }, { id: 'x', amount: '2', status: '' }], {
      id: { required: true, unique: true }, amount: { type: 'number', min: 0 }, status: { required: true, enum: ['ok'] },
    });
    expect(result.valid).toBe(false); expect(result.invalidRows).toEqual([1, 2]);
    expect(result.issues.filter(i => i.code === 'unique').map(i => i.row)).toEqual([1, 2]);
    expect(result.issues.map(i => i.code)).toEqual(expect.arrayContaining(['type', 'min', 'required', 'enum']));
  });
  it('validates real ISO dates including leap years', () => {
    const result = validateTable([{ date: '2024-02-29' }, { date: '2025-02-29' }, { date: '03/04/2025' }], { date: { type: 'date' } });
    expect(result.validRows).toEqual([1]); expect(result.invalidRows).toEqual([2, 3]);
  });
  it('checks string rules and unknown columns without reading inherited properties', () => {
    const result = validateTable([{ code: 'a', extra: 1 }], { code: { minLength: 2, pattern: '^[A-Z]+$' }, constructor: { required: true } }, { allowUnknown: false });
    expect(result.issues.map(i => i.code)).toEqual(expect.arrayContaining(['unknown-column', 'minLength', 'pattern', 'required']));
  });
  it('rejects invalid schemas and nonfinite numbers', () => {
    expect(() => validateTable([], { x: { min: 3, max: 1 } })).toThrow();
    expect(() => validateTable([], { x: { pattern: '[' } })).toThrow();
    expect(validateTable([{ x: Infinity }], { x: { type: 'number' } }).valid).toBe(false);
  });
});

describe('auditable cleaning and deduplication', () => {
  it('leaves input untouched and records exact changes', () => {
    const source = Object.freeze([Object.freeze({ id: '001', name: ' Alice ', amount: '10.25', enabled: 'false' })]);
    const result = cleanTable(source, { name: { trim: true, case: 'lower' }, amount: { type: 'number' }, enabled: { type: 'boolean' } });
    expect(result.rows).toEqual([{ id: '001', name: 'alice', amount: 10.25, enabled: false }]);
    expect(result.changes).toHaveLength(3); expect(result.issues).toEqual([]); expect(source[0].name).toBe(' Alice ');
  });
  it('keeps failed conversions unchanged, rejects unsafe integer conversion and never turns blank into zero', () => {
    const result = cleanTable([{ amount: ' ', id: '9007199254740993', bool: 'yes' }], { amount: { trim: true, type: 'number' }, id: { type: 'number' }, bool: { type: 'boolean' } });
    expect(result.rows[0]).toEqual({ amount: '', id: '9007199254740993', bool: 'yes' }); expect(result.issues).toHaveLength(2);
  });
  it('deduplicates composite keys with an explicit keep policy and reports removed rows', () => {
    const rows = [{ a: 'x|y', b: 'z', n: 1 }, { a: 'x', b: 'y|z', n: 2 }, { a: 'x|y', b: 'z', n: 3 }];
    const result = deduplicateTable(rows, { keys: ['a', 'b'], keep: 'last' });
    expect(result.removedRows).toEqual([1]); expect(result.duplicateGroups).toEqual([[1, 3]]); expect(result.rows.map(r => r.n)).toEqual([2, 3]);
  });
  it('rejects blank keys and distinguishes number and string identities', () => {
    expect(() => deduplicateTable([{ id: '' }], { keys: ['id'] })).toThrow();
    expect(deduplicateTable([{ id: 1 }, { id: '1' }], { keys: ['id'] }).rows).toHaveLength(2);
  });
});

describe('keyed merge', () => {
  it('appends compatible tables and requires opt-in for missing columns', () => {
    expect(appendTables([[{ id: 1 }], [{ id: 2 }]]).sources).toEqual([{ table: 1, row: 1 }, { table: 2, row: 1 }]);
    expect(() => appendTables([[{ id: 1 }], [{ value: 2 }]])).toThrow(/Schema mismatch/);
    expect(appendTables([[{ id: 1 }], [{ value: 2 }]], { schema: 'union' }).rows).toEqual([{ id: 1, value: null }, { id: null, value: 2 }]);
  });
  it('joins complementary fields and unmatched rows without mutating sources', () => {
    const left = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }], right = [{ id: '1', stock: 4 }, { id: '3', stock: 8 }];
    const result = mergeTables(left, right, { keys: ['id'] });
    expect(result.rows).toEqual([{ id: '1', name: 'A', stock: 4 }, { id: '2', name: 'B' }, { id: '3', stock: 8 }]);
    expect(result.summary).toEqual({ matched: 1, leftOnly: 1, rightOnly: 1, total: 3 });
    expect(left[0]).toEqual({ id: '1', name: 'A' });
    expect(mergeTables(left, right, { keys: ['id'], join: 'inner' }).rows).toHaveLength(1);
    expect(mergeTables(left, right, { keys: ['id'], join: 'left' }).rows).toHaveLength(2);
  });
  it('rejects conflicts by default and exposes them for explicit resolution', () => {
    const a = [{ id: 1, price: 10 }], b = [{ id: 1, price: 12 }];
    expect(() => mergeTables(a, b, { keys: ['id'] })).toThrow(MergeConflictError);
    const result = mergeTables(a, b, { keys: ['id'], conflict: 'right' });
    expect(result.rows[0].price).toBe(12); expect(result.conflicts).toHaveLength(1);
  });
  it('rejects duplicate and missing keys before returning output', () => {
    expect(() => mergeTables([{ id: 1 }, { id: 1 }], [], { keys: ['id'] })).toThrow(/Duplicate/);
    expect(() => mergeTables([{}], [], { keys: ['id'] })).toThrow(/present/);
  });
});

describe('Excel import, export and highlighted reports', () => {
  it('round-trips multiple sheets and literal formula-like strings', async () => {
    const bytes = await writeExcel([{ name: 'Products', rows: [{ id: '001', amount: 12.5, formula: '=1+1' }] }, { name: 'Empty', columns: ['id'], rows: [] }]);
    const raw = await readExcel(bytes, { values: 'raw' });
    expect(raw[0].rows).toEqual([{ id: '001', amount: 12.5, formula: '=1+1' }]); expect(raw[1].rows).toEqual([]);
    const wb = XLSX.read(bytes, { type: 'array' }); expect(wb.Sheets.Products.C2.f).toBeUndefined();
    const display = await readExcel(bytes); expect(display[0].rows[0].amount).toBe('12.5');
  });
  it('supports header offsets and sheet selection, rejects silent truncation', async () => {
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Title'], ['id', 'price'], ['001', 2], [], ['002', 3]]), 'Data');
    const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
    const tables = await readExcel(bytes, { headerRow: 2, sheets: ['Data'] }); expect(tables[0].rowNumbers).toEqual([3, 5]);
    await expect(readExcel(bytes, { headerRow: 2, maxRows: 2 })).rejects.toThrow(/exceeds/);
    await expect(readExcel(bytes, { sheets: ['Missing'] })).rejects.toThrow(/not found/);
    await expect(readExcel(bytes, { maxBytes: 1 })).rejects.toThrow(/size/);
    await expect(readExcel(bytes, { maxColumns: 1 })).rejects.toThrow(/columns/);
  });
  it('rejects invalid sheet names and supports XLS legacy reading', async () => {
    await expect(writeExcel([{ name: 'Data', rows: [{ value: Infinity }] }])).rejects.toThrow(/Nonfinite/);
    await expect(writeExcel([{ name: 'A/B', rows: [{ id: 1 }] }])).rejects.toThrow(/name/);
    await expect(writeExcel([{ name: 'A', rows: [{ id: 1 }] }, { name: 'a', rows: [{ id: 2 }] }])).rejects.toThrow(/unique/);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['id'], ['001']]), 'Data');
    const bytes = new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'biff8' }));
    expect((await readExcel(bytes))[0].rows[0].id).toBe('001');
  });
  it('exports a readable report with actual cell fills and correct before/after data', async () => {
    const result = compareTables([{ id: '001', price: 10 }, { id: '002', price: 20 }], [{ id: '001', price: 12 }, { id: '003', price: 30 }], { keys: ['id'] });
    const bytes = await exportDiffExcel(result);
    const workbook = XLSX.read(bytes, { type: 'array', cellStyles: true });
    expect(workbook.SheetNames).toEqual(['Summary', 'Added', 'Removed', 'Changed']);
    expect(workbook.Sheets.Changed.F2.v).toBe(10); expect(workbook.Sheets.Changed.G2.v).toBe(12);
    expect(workbook.Sheets.Changed.F2.s.fgColor.rgb).toBe('FFF3CD');
    expect(workbook.Sheets.Added.G2.s.fgColor.rgb).toBe('E8F5E9');
    expect(workbook.Sheets.Summary.A1.s.fgColor.rgb).toBe('2459CC');
    const files = unzipSync(bytes); expect(strFromU8(files['xl/worksheets/sheet4.xml'])).toContain('autoFilter');
  });
  it('highlights changes to empty cells and keeps formula-like strings literal', async () => {
    const result = compareTables([{ id: 'x', value: '=1+1' }], [{ id: 'x', value: null }], { keys: ['id'] });
    const wb = XLSX.read(await exportDiffExcel(result), { type: 'array', cellStyles: true });
    expect(wb.Sheets.Changed.F2.f).toBeUndefined();
    expect(wb.Sheets.Changed.F2.v).toBe('=1+1');
    expect(wb.Sheets.Changed.G2.s.fgColor.rgb).toBe('FFF3CD');
  });
});
