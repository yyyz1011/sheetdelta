import { fail, assertRecord } from './errors.js';
import { TableValidationError, type Cell, type Row, type ColumnPair, type CompareInputOptions, type DiffResult, type DataIssue, type DiffRow } from './types.js';
import { assertRow } from './table.js';
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
export interface CompareProgress { phase: 'scan' | 'index' | 'compare' | 'append' | 'complete'; processed: number; total: number }
export interface AsyncCompareOptions { signal?: AbortSignal; batchSize?: number; onProgress?: (progress: CompareProgress) => void }

/** The same generator drives synchronous and cooperative async comparison. */
function* comparison(left: readonly Row[], right: readonly Row[], input: CompareInputOptions, batchSize: number): Generator<CompareProgress, DiffResult> {
  if (!Array.isArray(left) || !Array.isArray(right)) fail('INVALID_DATA', 'Inputs must be arrays of records.');
  assertRecord(input, 'options');
  if (!Array.isArray(input.keys) || !input.keys.length) fail('INVALID_OPTIONS', 'Select at least one key column.', { option: 'keys' });
  if (input.columns != null && (!Array.isArray(input.columns) || !input.columns.length)) fail('INVALID_OPTIONS', 'Select at least one comparison column.', { option: 'columns' });
  if (input.ignoreColumns != null && (!Array.isArray(input.ignoreColumns) || input.ignoreColumns.some(c => typeof c !== 'string'))) fail('INVALID_OPTIONS', 'ignoreColumns must contain column names.', { option: 'ignoreColumns' });
  const total = 3 * (left.length + right.length); let processed = 0;
  function step(phase: CompareProgress['phase']): CompareProgress | undefined { processed++; return processed % batchSize === 0 ? { phase, processed, total } : undefined; }
  const leftSet = new Set<string>(), rightSet = new Set<string>();
  for (const [rows, side, columns] of [[left, 'left', leftSet], [right, 'right', rightSet]] as const) {
    for (let i = 0; i < rows.length; i++) {
      assertRow(rows[i], i, side);
      for (const key of Object.keys(rows[i])) {
        const value = rows[i][key];
        if ((value != null && !['string', 'number', 'boolean'].includes(typeof value)) || (typeof value === 'number' && !Number.isFinite(value))) fail('INVALID_DATA', 'Comparison cells must be finite primitive values.', { side, row: i + 1, column: key });
        columns.add(key);
      }
      const progress = step('scan'); if (progress) yield progress;
    }
  }
  const leftHeaders = [...leftSet], rightHeaders = [...rightSet];
  const ignored = new Set(input.ignoreColumns ?? []);
  const schema = { added: rightHeaders.filter(c => !leftSet.has(c) && !ignored.has(c)), removed: leftHeaders.filter(c => !rightSet.has(c) && !ignored.has(c)), common: leftHeaders.filter(c => rightSet.has(c) && !ignored.has(c)) };
  const asPair = (column: string | ColumnPair): ColumnPair => {
    if (typeof column === 'string') return { left: column, right: column };
    assertRecord(column, 'column mapping'); return { ...column };
  };
  const keys = input.keys.map(asPair), keyColumns = new Set(keys.flatMap(pair => [pair.left, pair.right]));
  const inferred = left.length === 0 ? rightHeaders : right.length === 0 ? leftHeaders : schema.common;
  const columns = input.columns?.map(asPair) ?? inferred.filter(c => !keyColumns.has(c)).map(asPair);
  const options = { ...input, keys, columns: columns.filter(pair => !ignored.has(pair.left) && !ignored.has(pair.right)) };
  if (input.valueMode && !['text', 'strict'].includes(input.valueMode)) fail('INVALID_OPTIONS', 'Invalid valueMode.');
  if (input.emptyValues && !['equal', 'distinct'].includes(input.emptyValues)) fail('INVALID_OPTIONS', 'Invalid emptyValues.');
  if (input.includeUnchanged != null && typeof input.includeUnchanged !== 'boolean') fail('INVALID_OPTIONS', 'includeUnchanged must be boolean.');
  for (const pair of [...options.keys, ...options.columns]) {
    if (typeof pair.left !== 'string' || typeof pair.right !== 'string' || !pair.left || !pair.right) fail('INVALID_OPTIONS', 'Column names must not be empty.');
    if (pair.numericTolerance != null && (!Number.isFinite(pair.numericTolerance) || pair.numericTolerance < 0)) fail('INVALID_OPTIONS', 'Numeric tolerance must be finite and non-negative.');
  }
  for (const side of ['left', 'right'] as const) for (const group of [options.keys, options.columns]) if (new Set(group.map(pair => pair[side])).size !== group.length) fail('INVALID_OPTIONS', 'Each column can only be mapped once.');
  const issues: DataIssue[] = [];
  type Indexed = { row: Row; index: number; key: string[] };
  const before = new Map<string, Indexed>(), after = new Map<string, Indexed>();
  for (const [data, side, map] of [[left, 'left', before], [right, 'right', after]] as const) {
    const duplicates = new Map<string, DataIssue>();
    const selectedColumns = new Set([...options.keys, ...options.columns].map(pair => pair[side]));
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      for (const column of selectedColumns) if (!Object.hasOwn(row, column)) issues.push({ side, code: 'missing-column', rows: [i + 1], column });
      const key = options.keys.map(pair => normalize(Object.hasOwn(row, pair[side]) ? row[pair[side]] : undefined, options));
      if (key.some(value => value.trim() === '')) issues.push({ side, code: 'missing-key', rows: [i + 1], key });
      else {
        const id = JSON.stringify(key), previous = map.get(id);
        if (previous) {
          const issue = duplicates.get(id) ?? { side, code: 'duplicate-key' as const, rows: [previous.index + 1], key };
          issue.rows.push(i + 1); duplicates.set(id, issue);
        } else map.set(id, { row, index: i, key });
      }
      const progress = step('index'); if (progress) yield progress;
    }
    for (const issue of duplicates.values()) issues.push(issue);
  }
  if (issues.length) throw new TableValidationError(issues);
  const rows: DiffRow[] = [];
  const summary: DiffResult['summary'] = { added: 0, removed: 0, changed: 0, unchanged: 0, total: 0, before: left.length, after: right.length };
  const record = (row: DiffRow) => { summary[row.status]++; summary.total++; if (row.status !== 'unchanged' || input.includeUnchanged !== false) rows.push(row); };
  for (const [id, entry] of before) {
    const match = after.get(id);
    if (!match) record({ key: entry.key, status: 'removed', before: entry.row, leftIndex: entry.index, changes: [] });
    else {
      const changes = options.columns.filter(pair => !equal(entry.row[pair.left], match.row[pair.right], pair, options))
        .map(pair => ({ leftColumn: pair.left, rightColumn: pair.right, before: entry.row[pair.left], after: match.row[pair.right] }));
      record({ key: entry.key, status: changes.length ? 'changed' : 'unchanged', before: entry.row, after: match.row, leftIndex: entry.index, rightIndex: match.index, changes });
    }
    const progress = step('compare'); if (progress) yield progress;
  }
  for (const [id, entry] of after) {
    if (!before.has(id)) record({ key: entry.key, status: 'added', after: entry.row, rightIndex: entry.index, changes: [] });
    const progress = step('append'); if (progress) yield progress;
  }
  return { rows, summary, options: structuredClone(options), schema };
}
/** Synchronous API retained for existing consumers. */
export function compareTables(left: readonly Row[], right: readonly Row[], options: CompareInputOptions): DiffResult {
  const task = comparison(left, right, options, 2048);
  let result = task.next(); while (!result.done) result = task.next(); return result.value;
}
/** Cooperatively yield between row batches; cancellation never returns a partial result. */
export async function compareTablesAsync(left: readonly Row[], right: readonly Row[], options: CompareInputOptions, execution: AsyncCompareOptions = {}): Promise<DiffResult> {
  assertRecord(execution, 'execution');
  if (execution.onProgress != null && typeof execution.onProgress !== 'function') fail('INVALID_OPTIONS', 'onProgress must be a function.');
  if (execution.signal != null && typeof execution.signal.aborted !== 'boolean') fail('INVALID_OPTIONS', 'signal must be an AbortSignal.');
  const batchSize = execution.batchSize ?? 2048;
  if (!Number.isSafeInteger(batchSize) || batchSize < 1) fail('INVALID_OPTIONS', 'batchSize must be a positive integer.', { option: 'batchSize' });
  const checkAbort = () => { if (execution.signal?.aborted) fail('ABORTED', 'Comparison cancelled.', { operation: 'compareTablesAsync' }); };
  checkAbort();
  const task = comparison(left, right, options, batchSize);
  const total = Array.isArray(left) && Array.isArray(right) ? 3 * (left.length + right.length) : 0;
  execution.onProgress?.({ phase: 'scan', processed: 0, total });
  try {
    while (true) {
      checkAbort(); const step = task.next();
      if (step.done) { execution.onProgress?.({ phase: 'complete', processed: total, total }); checkAbort(); return step.value; }
      execution.onProgress?.(step.value);
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  } finally { task.return(undefined as never); }
}
