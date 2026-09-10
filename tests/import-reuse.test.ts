import { describe, it, expect } from 'vitest';
import { cleanTable } from '../packages/core/src/clean.js';
import { readCsv } from '../packages/core/src/csv.js';
import { writeExcel } from '../packages/core/src/excel.js';
import { prepareImport, importWithTemplate, serializeImportTemplate, parseImportTemplate, type ImportTemplate, type ImportBatchRule } from '../packages/core/src/import.js';
const template: ImportTemplate = { version: 1, id: 'supplier', revision: 1, format: 'csv', headerRow: 2, fields: [
  { key: 'sku', source: '商品', requiredColumn: true },
  { key: 'active', source: '状态', clean: { trim: true, dictionary: { entries: [{ from: '启用', to: true }, { from: '停用', to: false }] } }, rule: { type: 'boolean' } },
] };
const table = () => readCsv('id\na\nb\nc\nd\ne');
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('reusable import configuration and dictionaries', () => {
  it('round trips configuration and keeps original data, source rows and audit', async () => {
    const restored = parseImportTemplate(serializeImportTemplate(template));
    restored.fields[0].key = 'changed';
    expect(template.fields[0].key).toBe('sku');
    const result = await importWithTemplate('供应商,导入\n商品,状态\n001, 启用 \n002,未知', template, { mode: 'valid-rows' });
    expect(result.rows).toEqual([{ sku: '001', active: true }]);
    expect(result.original.rows[0]['状态']).toBe(' 启用 ');
    expect(result.issues).toContainEqual(expect.objectContaining({ code: 'dictionary', row: 2, source: expect.objectContaining({ sourceRow: 4, sourceColumn: '状态' }) }));
    expect(result.changes[0]).toMatchObject({ before: ' 启用 ', after: true });
  });
  it('reuses explicit Excel sheet and header selection and locates its cells', async () => {
    const bytes = await writeExcel([{ name: 'Other', rows: [{ id: 'ignore' }] }, { name: 'Orders', rows: [{ 商品: '001', 状态: '启用' }] }]);
    const result = await importWithTemplate(bytes, { ...template, format: 'excel', headerRow: 1, sheet: 'Orders', values: 'raw' });
    expect(result.rows[0]).toEqual({ sku: '001', active: true });
    expect(result.changes[0].source.cell).toBe('B2');
  });
  it('rejects config drift and invalid JSON without executing callbacks', () => {
    for (const change of [{ version: 2 }, { revision: 0 }, { extra: 1 }, { sheet: 'Data' }, { headerRow: 0 }, { fields: [{ key: 'x', rule: { required: 'yes' } }] }, { fields: [{ key: 'x', clean: { trim: 'yes' } }] }]) {
      expect(() => parseImportTemplate(JSON.stringify({ ...template, ...change }))).toThrowError(expect.objectContaining({ code: 'INVALID_OPTIONS' }));
    }
    expect(() => parseImportTemplate('{bad')).toThrow();
    expect(() => serializeImportTemplate({ ...template, callback: () => {} } as ImportTemplate)).toThrow();
    expect(() => parseImportTemplate(' '.repeat(1024 * 1024 + 1))).toThrowError(expect.objectContaining({ code: 'LIMIT_EXCEEDED' }));
    const circular: any = { ...template }; circular.loop = circular;
    expect(() => serializeImportTemplate(circular)).toThrow();
    expect(() => serializeImportTemplate({ ...template, id: undefined } as any)).toThrow();
    expect(() => parseImportTemplate('{"__proto__":{"polluted":true}}')).toThrow();
    expect(({} as any).polluted).toBeUndefined();
  });
  it('reports missing saved columns instead of silently switching mappings', async () => {
    const result = await importWithTemplate('供应商,导入\n新商品,状态\n001,启用', template);
    expect(result.status).toBe('invalid');
    expect(result.issues.some(i => i.code === 'missing-column')).toBe(true);
  });
  it('distinguishes typed inputs and rejects ambiguous dictionary definitions', () => {
    const rule = { dictionary: { entries: [{ from: 1, to: 'number' }, { from: '1', to: 'string' }, { from: null, to: 'empty' }] } };
    expect(cleanTable([{ a: 1 }, { a: '1' }, { a: null }], { a: rule }).rows).toEqual([{ a: 'number' }, { a: 'string' }, { a: 'empty' }]);
    expect(() => cleanTable([], { a: { dictionary: { entries: [{ from: 'x', to: 1 }, { from: 'x', to: 2 }] } } })).toThrow();
    expect(() => cleanTable([], { a: { dictionary: { entries: [{ from: Infinity, to: 1 }] } } })).toThrow();
    expect(cleanTable([{ a: 'unknown' }], { a: { dictionary: { entries: [], unknown: 'keep' } } }).issues).toEqual([]);
  });
  it('keeps runtime rules outside serialized templates', async () => {
    const result = await importWithTemplate('供应商,导入\n商品,状态\n001,启用', template, { batchRules: [{ id: 'exists', validate: async rows => rows.map(({ row }) => ({ row, column: 'sku', code: 'missing', message: 'Not in catalog', severity: 'error' })) }] });
    expect(result.status).toBe('invalid');
    expect(result.issues[0].source?.sourceRow).toBe(3);
  });
});

describe('bounded asynchronous business validation', () => {
  it('limits concurrency, preserves result order and passes immutable global row numbers', async () => {
    let active = 0, peak = 0; const batches: number[][] = [];
    const rule: ImportBatchRule = { id: 'catalog', validate: async rows => {
      active++; peak = Math.max(peak, active); batches.push(rows.map(r => r.row));
      expect(Object.isFrozen(rows)).toBe(true); expect(Object.isFrozen(rows[0].values)).toBe(true);
      await wait(rows[0].row === 1 ? 15 : 1); active--;
      return rows.map(({ row }) => ({ row, column: 'id', code: 'unknown', message: 'Unknown', severity: 'error' }));
    } };
    const result = await prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [rule] }, { batchValidation: { batchSize: 2, concurrency: 2 } });
    expect(peak).toBe(2); expect(batches).toEqual([[1, 2], [3, 4], [5]]);
    expect(result.issues.map(i => i.row)).toEqual([1, 2, 3, 4, 5]);
    expect(result.rows).toEqual([]);
  });
  it('supports the documented maximum concurrency with shared cancellation', async () => {
    let active = 0, peak = 0;
    const input = readCsv('id\n' + Array.from({ length: 40 }, (_, i) => String(i)).join('\n'));
    const result = await prepareImport(input, { fields: [{ key: 'id' }], batchRules: [{ id: 'wide', validate: async () => {
      active++; peak = Math.max(peak, active); await wait(2); active--; return [];
    } }] }, { batchValidation: { batchSize: 1, concurrency: 32 } });
    expect(peak).toBe(32); expect(result.rows).toHaveLength(40);
  });
  it('includes warnings without excluding rows and supports partial acceptance', async () => {
    const result = await prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [{ id: 'check', validate: async () => [
      { row: 2, code: 'bad', message: 'Bad', severity: 'error' }, { row: 3, code: 'old', message: 'Old', severity: 'warning' },
    ] }] }, { mode: 'valid-rows' });
    expect(result.rows.map(r => r.id)).toEqual(['a', 'c', 'd', 'e']);
    expect(result.summary).toEqual({ total: 5, accepted: 4, errors: 1, warnings: 1 });
  });
  it('times out an uncooperative callback and aborts its signal', async () => {
    let callbackSignal: AbortSignal | undefined;
    await expect(prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [{ id: 'hang', validate: (_, { signal }) => { callbackSignal = signal; return new Promise(() => {}); } }] }, { batchValidation: { timeoutMs: 10 } })).rejects.toMatchObject({ code: 'VALIDATION_TIMEOUT', context: { operation: 'hang' } });
    expect(callbackSignal?.aborted).toBe(true);
  });
  it('cancels in flight and never starts subsequent windows', async () => {
    const controller = new AbortController(); let calls = 0;
    await expect(prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [{ id: 'cancel', validate: async (_, { signal }) => {
      calls++; setTimeout(() => controller.abort(), 5);
      await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true })); return [];
    } }] }, { signal: controller.signal, batchValidation: { batchSize: 1, concurrency: 1 } })).rejects.toMatchObject({ code: 'ABORTED' });
    expect(calls).toBe(1);
  });
  it('aborts sibling work on a failed callback and preserves the failure cause', async () => {
    let sibling: AbortSignal | undefined;
    await expect(prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [{ id: 'fail', validate: async (rows, { signal }) => {
      if (rows[0].row === 1) { await wait(5); throw new Error('offline'); }
      sibling = signal; return new Promise(() => {});
    } }] }, { batchValidation: { batchSize: 1, concurrency: 2, timeoutMs: 30 } })).rejects.toMatchObject({ code: 'VALIDATION_FAILED', cause: { message: 'offline' } });
    expect(sibling?.aborted).toBe(true);
  });
  it('rejects out-of-batch row positions, invalid responses, duplicated rule IDs and exceeded issue budgets', async () => {
    for (const response of [[{ row: 4, code: 'bad', message: '', severity: 'error' }], null, [{ row: 1, column: 'other', code: 'bad', message: '', severity: 'error' }]]) {
      await expect(prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [{ id: 'bad', validate: async () => response as any }] }, { batchValidation: { batchSize: 1 } })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    }
    const rule: ImportBatchRule = { id: 'dup', validate: async () => [] };
    await expect(prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [rule, rule] })).rejects.toMatchObject({ code: 'INVALID_OPTIONS' });
    await expect(prepareImport(table(), { fields: [{ key: 'id' }], batchRules: [{ id: 'many', validate: async rows => rows.map(({ row }) => ({ row, code: 'bad', message: '', severity: 'error' })) }] }, { maxIssues: 2 })).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' });
  });
  it('does not invoke external validation after structural failures or for an empty table', async () => {
    let calls = 0; const rule: ImportBatchRule = { id: 'remote', validate: async () => { calls++; return []; } };
    await prepareImport(table(), { fields: [{ key: 'missing', requiredColumn: true }], batchRules: [rule] });
    await prepareImport(readCsv('id'), { fields: [{ key: 'id' }], batchRules: [rule] });
    expect(calls).toBe(0);
  });
});
