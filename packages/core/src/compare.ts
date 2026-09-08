import { TableValidationError, type Cell, type Row, type ColumnPair, type CompareInputOptions, type DiffResult, type DataIssue, type DiffRow } from './types.js';
import { columnNames } from './table.js';
export { TableValidationError } from './types.js';
export type { Cell, Row, ColumnPair, CompareOptions, CompareInputOptions, DiffResult, DiffRow } from './types.js';
function normalize(value: Cell, options: CompareInputOptions): string {
  let result = value == null ? '' : String(value);
  if (options.trim) result = result.trim();
  if (options.ignoreCase) result = result.toLocaleLowerCase('en-US');
  return result;
}
const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
function equal(a: Cell, b: Cell, pair: ColumnPair, options: CompareInputOptions): boolean {
  if (options.emptyValues === 'distinct' && (a == null || b == null || a === '' || b === '')) return a === b;
  if (options.valueMode === 'strict' && typeof a !== typeof b) return false;
  const fieldOptions = { ...options, trim: pair.trim ?? options.trim, ignoreCase: pair.ignoreCase ?? options.ignoreCase };
  const left = normalize(a, fieldOptions), right = normalize(b, fieldOptions);
  if (left === right) return true;
  if (pair.numericTolerance != null && numeric.test(left) && numeric.test(right)) {
    const x = Number(left), y = Number(right);
    return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= pair.numericTolerance;
  }
  return false;
}
/** Input row indices in validation issues are 1-based data rows (excluding the header). */
export function compareTables(left: readonly Row[], right: readonly Row[], input: CompareInputOptions): DiffResult {
  const leftHeaders = columnNames(left), rightHeaders = columnNames(right);
  const leftSet = new Set(leftHeaders), rightSet = new Set(rightHeaders);
  const ignored = new Set(input.ignoreColumns ?? []);
  const schema = { added: rightHeaders.filter(c => !leftSet.has(c) && !ignored.has(c)), removed: leftHeaders.filter(c => !rightSet.has(c) && !ignored.has(c)), common: leftHeaders.filter(c => rightSet.has(c) && !ignored.has(c)) };
  const asPair = (column: string | ColumnPair): ColumnPair => typeof column === 'string' ? { left: column, right: column } : { ...column };
  const keys = input.keys.map(asPair);
  const keyColumns = new Set(keys.flatMap(pair => [pair.left, pair.right]));
  // An empty side has no schema: retain the populated side's fields in addition/removal reports.
  const inferredColumns = left.length === 0 ? rightHeaders : right.length === 0 ? leftHeaders : schema.common;
  const columns = input.columns?.map(asPair) ?? inferredColumns.filter(c => !keyColumns.has(c)).map(asPair);
  const options = { ...input, keys, columns: columns.filter(pair => !ignored.has(pair.left) && !ignored.has(pair.right)) };
  if (!options.keys.length) throw new Error('Select at least one key column.');
  if (input.columns && !input.columns.length) throw new Error('Select at least one comparison column.');
  if (input.valueMode && !['text', 'strict'].includes(input.valueMode)) throw new Error('Invalid valueMode.');
  if (input.emptyValues && !['equal', 'distinct'].includes(input.emptyValues)) throw new Error('Invalid emptyValues.');
  for (const pair of [...options.keys, ...options.columns]) {
    if (!pair.left || !pair.right) throw new Error('Column names must not be empty.');
    if (pair.numericTolerance != null && (!Number.isFinite(pair.numericTolerance) || pair.numericTolerance < 0)) throw new Error('Numeric tolerance must be finite and non-negative.');
  }
  for (const side of ['left', 'right'] as const) {
    for (const group of [options.keys, options.columns]) {
      if (new Set(group.map(pair => pair[side])).size !== group.length) throw new Error('Each column can only be mapped once.');
    }
  }
  const issues: DataIssue[] = [];
  function index(rows: readonly Row[], side: 'left' | 'right') {
    const map = new Map<string, { row: Row; index: number; key: string[] }>();
    const duplicates = new Map<string, DataIssue>();
    const selectedColumns = new Set([...options.keys, ...options.columns].map(pair => pair[side]));
    rows.forEach((row, i) => {
      for (const column of selectedColumns) {
        if (!Object.hasOwn(row, column)) issues.push({ side, code: 'missing-column', rows: [i + 1], column });
      }
      const key = options.keys.map(pair => normalize(row[pair[side]], options));
      if (key.some(value => value.trim() === '')) { issues.push({ side, code: 'missing-key', rows: [i + 1], key }); return; }
      // JSON tuples prevent delimiter collisions in composite keys.
      const serialized = JSON.stringify(key);
      const previous = map.get(serialized);
      if (previous) {
        const issue = duplicates.get(serialized) ?? { side, code: 'duplicate-key' as const, rows: [previous.index + 1], key };
        issue.rows.push(i + 1);
        duplicates.set(serialized, issue);
      } else map.set(serialized, { row, index: i, key });
    });
    issues.push(...duplicates.values());
    return map;
  }
  const before = index(left, 'left'), after = index(right, 'right');
  if (issues.length) throw new TableValidationError(issues);
  const rows: DiffRow[] = [];
  for (const [id, entry] of before) {
    const match = after.get(id);
    if (!match) { rows.push({ key: entry.key, status: 'removed', before: entry.row, leftIndex: entry.index, changes: [] }); continue; }
    const changes = options.columns.filter(pair => !equal(entry.row[pair.left], match.row[pair.right], pair, options))
      .map(pair => ({ leftColumn: pair.left, rightColumn: pair.right, before: entry.row[pair.left], after: match.row[pair.right] }));
    rows.push({ key: entry.key, status: changes.length ? 'changed' : 'unchanged', before: entry.row, after: match.row, leftIndex: entry.index, rightIndex: match.index, changes });
  }
  for (const [id, entry] of after) if (!before.has(id)) rows.push({ key: entry.key, status: 'added', after: entry.row, rightIndex: entry.index, changes: [] });
  const summary: DiffResult['summary'] = { added: 0, removed: 0, changed: 0, unchanged: 0, total: rows.length, before: left.length, after: right.length };
  rows.forEach(row => summary[row.status]++);
  return { rows, summary, options: structuredClone(options), schema };
}
