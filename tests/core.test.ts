import { describe, expect, it } from 'vitest';
import { compareTables, exportDiffCsv, TableValidationError, type CompareOptions } from '../packages/core/src/index';
const options: CompareOptions = { keys: [{ left: 'id', right: 'id' }], columns: [{ left: 'price', right: 'price' }] };
describe('key-based comparison', () => {
  it('ignores row position and identifies all four outcomes', () => {
    const result = compareTables([{ id: '001', price: '10' }, { id: '002', price: '20' }, { id: '003', price: '30' }], [{ id: '002', price: '21' }, { id: '004', price: '40' }, { id: '001', price: '10' }], options);
    expect(result.summary).toEqual({ added: 1, removed: 1, changed: 1, unchanged: 1, total: 4, before: 3, after: 3 });
    expect(result.rows.find(r => r.key[0] === '002')?.changes).toEqual([{ leftColumn: 'price', rightColumn: 'price', before: '20', after: '21' }]);
  });
  it('preserves leading zeros and treats 001 and 1 as distinct identifiers', () => {
    expect(compareTables([{ id: '001', price: 1 }], [{ id: '1', price: 1 }], options).summary).toMatchObject({ added: 1, removed: 1, unchanged: 0 });
  });
  it('rejects duplicate identifiers on both sides and exposes all affected rows', () => {
    try { compareTables([{ id: 'x', price: 1 }, { id: 'x', price: 2 }], [{ id: 'y', price: 1 }, { id: 'y', price: 2 }], options); throw new Error('should throw'); }
    catch (e) { expect(e).toBeInstanceOf(TableValidationError); expect((e as TableValidationError).issues).toEqual([{ side: 'left', code: 'duplicate-key', rows: [1, 2], key: ['x'] }, { side: 'right', code: 'duplicate-key', rows: [1, 2], key: ['y'] }]); }
  });
  it('does not allow empty or whitespace-only keys', () => { expect(() => compareTables([{ id: '  ', price: 1 }], [], options)).toThrow(TableValidationError); });
  it('supports column renames and ignores unselected fields', () => {
    const settings: CompareOptions = { keys: [{ left: 'sku', right: '编号' }], columns: [{ left: 'price', right: '价格' }] };
    expect(compareTables([{ sku: 'x', price: 10, timestamp: 'a' }], [{ 编号: 'x', 价格: 10, timestamp: 'b' }], settings).summary.unchanged).toBe(1);
  });
  it('normalizes whitespace and case only when requested', () => {
    const a = [{ id: 'X ', price: ' USD ' }], b = [{ id: 'x', price: 'usd' }];
    expect(compareTables(a, b, options).summary.added).toBe(1);
    expect(compareTables(a, b, { ...options, trim: true, ignoreCase: true }).summary.unchanged).toBe(1);
  });
  it('detects duplicate keys introduced by normalization', () => { expect(() => compareTables([{ id: 'x', price: 1 }, { id: ' X ', price: 1 }], [], { ...options, trim: true, ignoreCase: true })).toThrow(TableValidationError); });
  it('uses tuple encoding for composite keys with delimiter characters', () => {
    const settings = { ...options, keys: [{ left: 'a', right: 'a' }, { left: 'b', right: 'b' }] };
    const rows = [{ a: 'x|y', b: 'z', price: 1 }, { a: 'x', b: 'y|z', price: 2 }];
    expect(compareTables(rows, [...rows].reverse(), settings).summary.unchanged).toBe(2);
  });
  it('makes numeric tolerance opt-in and does not equate blank with zero', () => {
    const a = [{ id: 'x', price: '10.00' }], b = [{ id: 'x', price: '10' }];
    expect(compareTables(a, b, options).summary.changed).toBe(1);
    const settings = { ...options, columns: [{ left: 'price', right: 'price', numericTolerance: 0.01 }] };
    expect(compareTables(a, b, settings).summary.unchanged).toBe(1);
    expect(compareTables([{ id: 'x', price: '' }], [{ id: 'x', price: '0' }], settings).summary.changed).toBe(1);
    expect(compareTables(a, [{ id: 'x', price: '10.1' }], settings).summary.changed).toBe(1);
  });
  it('rejects invalid tolerances and missing mappings', () => {
    expect(() => compareTables([], [], { ...options, keys: [] })).toThrow();
    expect(() => compareTables([], [], { ...options, columns: [] })).toThrow();
    expect(() => compareTables([], [], { ...options, columns: [{ left: 'price', right: 'price', numericTolerance: -1 }] })).toThrow();
  });
  it('rejects missing selected columns rather than silently comparing undefined', () => { expect(() => compareTables([{ id: 'x' }], [{ id: 'x' }], options)).toThrow(TableValidationError); });
  it('handles empty datasets as additions or deletions', () => {
    expect(compareTables([], [], options).summary.total).toBe(0);
    expect(compareTables([], [{ id: 'x', price: 1 }], options).summary.added).toBe(1);
    expect(compareTables([{ id: 'x', price: 1 }], [], options).summary.removed).toBe(1);
  });
  it('supports property names such as __proto__ safely', () => {
    const row = JSON.parse('{"id":"__proto__","price":"constructor"}');
    expect(compareTables([row], [row], options).summary.unchanged).toBe(1);
  });
  it('does not mutate inputs or retain mutable options', () => {
    const a = Object.freeze([{ id: 'x', price: '1' }]);
    const settings = structuredClone(options), result = compareTables(a, a, settings);
    settings.columns[0].left = 'other';
    expect(result.options.columns[0].left).toBe('price');
    expect(a[0].price).toBe('1');
  });
  it('handles 50,000 keyed rows and reports a sparse change correctly', () => {
    const a = Array.from({ length: 50_000 }, (_, i) => ({ id: String(i), price: String(i) }));
    const b = a.map(row => ({ ...row })); b[34_321].price = 'edited';
    expect(compareTables(a, b.reverse(), options).summary).toMatchObject({ changed: 1, unchanged: 49_999 });
  });
});
describe('CSV export', () => {
  it('escapes quotes, commas, line breaks and dangerous spreadsheet formula prefixes', () => {
    const result = compareTables([], [{ id: '001', price: '=HYPERLINK("evil")\n,ok' }], options);
    const csv = exportDiffCsv(result);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"\'=HYPERLINK(""evil"")\n,ok"');
    expect(csv).toContain('"001"');
  });
  it('exports all changed fields from both sides and can include unchanged records', () => {
    const result = compareTables([{ id: 'x', price: '1' }], [{ id: 'x', price: '1' }], options);
    expect(exportDiffCsv(result).split('\r\n')).toHaveLength(1);
    expect(exportDiffCsv(result, { changesOnly: false })).toContain('unchanged');
  });
});
