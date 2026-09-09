import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { compareTables, compareTablesAsync } from '../packages/core/src/compare';
import { SheetDeltaError, isSheetDeltaError } from '../packages/core/src/errors';
import { TableValidationError } from '../packages/core/src/types';
import { readExcel } from '../packages/core/src/excel';
import { readCsv, readCsvBytes } from '../packages/core/src/csv';
import { mergeTables, MergeConflictError, appendTables } from '../packages/core/src/merge';
import { cleanTable, deduplicateTable } from '../packages/core/src/clean';
import { validateTable } from '../packages/core/src/validate';
const compat = readFileSync(new URL('./fixtures/openpyxl-compat.xlsx', import.meta.url));

describe('cooperative comparison', () => {
  const left = Array.from({ length: 100 }, (_, i) => ({ id: String(i), value: i }));
  const right = left.slice(1).map(row => ({ ...row, value: row.value % 7 ? row.value : row.value + 1 })).reverse();
  it('matches the synchronous result through every phase and yields to the event loop', async () => {
    const progress: { processed: number; total: number; phase: string }[] = [];
    let timerRan = false; const timer = setTimeout(() => { timerRan = true; }, 0);
    try {
      const result = await compareTablesAsync(left, right, { keys: ['id'] }, { batchSize: 25, onProgress: p => progress.push(p) });
      expect(result).toEqual(compareTables(left, right, { keys: ['id'] }));
      expect(timerRan).toBe(true);
      expect(progress.at(-1)).toEqual({ processed: 597, total: 597, phase: 'complete' });
      expect(progress.every((p, i) => i === 0 || p.processed >= progress[i - 1].processed)).toBe(true);
      expect(new Set(progress.map(p => p.phase))).toEqual(new Set(['scan', 'index', 'compare', 'append', 'complete']));
    } finally { clearTimeout(timer); }
  });
  it('omits unchanged rows while preserving full summary counts', async () => {
    const result = await compareTablesAsync(left, left, { keys: ['id'], includeUnchanged: false });
    expect(result.rows).toEqual([]); expect(result.summary).toMatchObject({ total: 100, unchanged: 100 });
    expect(result).toEqual(compareTables(left, left, { keys: ['id'], includeUnchanged: false }));
  });
  it('cancels before starting and during a row batch boundary without returning partial results', async () => {
    const initial = new AbortController(); initial.abort();
    await expect(compareTablesAsync(left, right, { keys: ['id'] }, { signal: initial.signal })).rejects.toMatchObject({ code: 'ABORTED' });
    const controller = new AbortController(); const phases: string[] = [];
    await expect(compareTablesAsync(left, right, { keys: ['id'] }, { batchSize: 10, signal: controller.signal, onProgress: p => { phases.push(p.phase); if (p.processed >= 30) controller.abort(); } })).rejects.toMatchObject({ code: 'ABORTED' });
    expect(phases).not.toContain('complete');
  });
  it('preserves validation errors and handles empty inputs', async () => {
    await expect(compareTablesAsync([{ id: 'x' }, { id: 'x' }], [], { keys: ['id'] }, { batchSize: 1 })).rejects.toBeInstanceOf(TableValidationError);
    expect(await compareTablesAsync([], [], { keys: ['id'] })).toEqual(compareTables([], [], { keys: ['id'] }));
    await expect(compareTablesAsync([], [], { keys: ['id'] }, { batchSize: 0 })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
  });
  it('keeps legacy and structured error identities and serialization', () => {
    try { compareTables([{ id: 'x' }, { id: 'x' }], [], { keys: ['id'] }); throw new Error('missing failure'); }
    catch (error) {
      expect(error).toBeInstanceOf(TableValidationError); expect(isSheetDeltaError(error)).toBe(true);
      expect(JSON.parse(JSON.stringify(error))).toMatchObject({ code: 'TABLE_VALIDATION', issues: [{ rows: [1, 2] }] });
    }
  });
});

describe('consistent failures across modules', () => {
  it('provides data/header locations and stable codes', () => {
    expect.assertions(5);
    expect(() => readCsv('id,id\n1,2')).toThrow(SheetDeltaError);
    try { readCsv('id,id\n1,2'); } catch (error) { expect(error).toMatchObject({ code: 'INVALID_HEADER', context: { row: 1, sheet: 'Data' } }); }
    try { mergeTables([{ id: 1 }, { id: 1 }], [], { keys: ['id'] }); } catch (error) { expect(error).toMatchObject({ code: 'DUPLICATE_KEY', context: { side: 'left', row: 2 } }); }
    try { deduplicateTable([{ id: '' }], { keys: ['id'] }); } catch (error) { expect(error).toMatchObject({ code: 'MISSING_KEY', context: { row: 1, column: 'id' } }); }
    try { appendTables([[{ id: 1 }], [{ value: 2 }]]); } catch (error) { expect(error).toMatchObject({ code: 'SCHEMA_MISMATCH', context: { row: 1 } }); }
  });
  it('serializes conflicts without breaking the previous class', () => {
    expect.assertions(2);
    try { mergeTables([{ id: 1, v: 1 }], [{ id: 1, v: 2 }], { keys: ['id'] }); }
    catch (error) { expect(error).toBeInstanceOf(MergeConflictError); expect(JSON.parse(JSON.stringify(error))).toMatchObject({ code: 'MERGE_CONFLICT', conflicts: [{ column: 'v', left: 1, right: 2 }] }); }
  });
  it('rejects malformed JavaScript inputs rather than returning false equality', () => {
    expect(() => compareTables([null as never], [], { keys: ['id'] })).toThrow(SheetDeltaError);
    expect(() => compareTables([{ id: 1, value: {} as never }], [], { keys: ['id'] })).toThrow(SheetDeltaError);
    expect(() => cleanTable([], { value: null as never })).toThrow(SheetDeltaError);
    expect(() => validateTable([], { value: { pattern: '[' } })).toThrow(SheetDeltaError);
    expect(() => readCsv(42 as never)).toThrow(SheetDeltaError);
  });
});

describe('independently produced workbook fixtures', () => {
  it('preserves displayed IDs, dates, booleans and original physical row positions', async () => {
    const [table] = await readExcel(compat, { sheets: ['Data'] });
    expect(table.rows[0]).toMatchObject({ id: '001', amount: '12.5', date: '2024-02-29 12:30', active: 'TRUE' });
    expect(table.rows[1].id).toBe('900719925474099312345'); expect(table.rowNumbers).toEqual([2, 4]);
    expect(table.metadata).toEqual({ date1904: false, hidden: false });
    const [raw] = await readExcel(compat, { sheets: ['Data'], values: 'raw' });
    expect(raw.rows[0].amount).toBe(12.5); expect(raw.rows[0].active).toBe(true); expect(typeof raw.rows[0].date).toBe('number');
  });
  it('reports hidden sheets and can exclude them', async () => {
    const tables = await readExcel(compat, { sheets: ['Data', 'Hidden'] });
    expect(tables[1].warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'HIDDEN_SHEET' })]));
    expect((await readExcel(compat, { sheets: ['Data', 'Hidden'], hiddenSheets: 'exclude' })).map(t => t.name)).toEqual(['Data']);
  });
  it('exposes the 1904 date epoch and preserves displayed dates', async () => {
    const [table] = await readExcel(readFileSync(new URL('./fixtures/openpyxl-1904.xlsx', import.meta.url)));
    expect(table.metadata?.date1904).toBe(true); expect(table.rows[0].date).toBe('2024-02-29');
  });
  it('uses cached formulas, warns for missing caches, and supports rejecting formulas', async () => {
    const [table] = await readExcel(compat, { sheets: ['Formulas'], values: 'raw' });
    expect(table.rows[0].cached).toBe(5); expect(table.rows[0].missing).toBeNull();
    expect(table.warnings).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'FORMULA_NO_CACHE', cell: 'C2', row: 2 })]));
    await expect(readExcel(compat, { sheets: ['Formulas'], formulas: 'reject' })).rejects.toMatchObject({ code: 'FORMULA_REJECTED', context: { cell: 'B2' } });
  });
  it('reports or rejects merged cells, preserving header offsets', async () => {
    const [table] = await readExcel(compat, { sheets: ['Merged'] });
    expect(table.rows[1].group).toBeNull(); expect(table.warnings?.[0].code).toBe('MERGED_CELLS');
    await expect(readExcel(compat, { sheets: ['Merged'], mergedCells: 'reject' })).rejects.toMatchObject({ code: 'MERGED_CELLS' });
    const [offset] = await readExcel(compat, { sheets: ['Titles'], headerRow: 2 });
    expect(offset.rowNumbers).toEqual([3]); expect(offset.warnings).toEqual([]);
    await expect(readExcel(compat, { sheets: ['Titles'], headerRow: 1 })).rejects.toMatchObject({ code: 'INVALID_HEADER', context: { row: 1 } });
  });
  it('rejects Excel error cells by default instead of silently dropping values', async () => {
    await expect(readExcel(compat, { sheets: ['Errors'] })).rejects.toMatchObject({ code: 'CELL_ERROR', context: { sheet: 'Errors', cell: 'B2', row: 2 } });
    expect((await readExcel(compat, { sheets: ['Errors'], cellErrors: 'text' }))[0].rows[0].value).toBe('#DIV/0!');
  });
  it('bounds total rows and cells across selected sheets', async () => {
    await expect(readExcel(compat, { sheets: ['Data', 'Hidden'], maxTotalRows: 3 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED', context: { limit: 3 } });
    await expect(readExcel(compat, { sheets: ['Data'], maxCells: 10 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED', context: { limit: 10 } });
  });
  it('wraps damaged workbooks and rejects text masquerading as Excel', async () => {
    await expect(readExcel(new TextEncoder().encode('id,value\n1,2'))).rejects.toMatchObject({ code: 'INVALID_WORKBOOK' });
    await expect(readExcel(new Uint8Array([0x50,0x4b,3,4,0,0,0]))).rejects.toMatchObject({ code: 'INVALID_WORKBOOK' });
  });
  it('decodes GB18030 explicitly and rejects invalid encodings and oversized inputs', () => {
    const bytes = readFileSync(new URL('./fixtures/gb18030.csv', import.meta.url));
    expect(readCsvBytes(bytes, { encoding: 'gb18030' }).rows[0]).toEqual({ 编号: '001', 名称: '测试商品' });
    expect(() => readCsvBytes(bytes)).toThrow(SheetDeltaError);
    expect(() => readCsvBytes(bytes, { encoding: 'made-up' })).toThrow(SheetDeltaError);
    expect(() => readCsvBytes(bytes, { maxBytes: 1 })).toThrow(SheetDeltaError);
  });
});
