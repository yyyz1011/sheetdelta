export type Cell = string | number | boolean | null | undefined;
export type Row = Record<string, Cell>;
export type Status = 'added' | 'removed' | 'changed' | 'unchanged';
export interface ColumnPair { left: string; right: string; numericTolerance?: number }
export interface CompareOptions {
  keys: ColumnPair[];
  columns: ColumnPair[];
  trim?: boolean;
  ignoreCase?: boolean;
}
export interface Change { leftColumn: string; rightColumn: string; before: Cell; after: Cell }
export interface DiffRow {
  key: string[]; status: Status; before?: Row; after?: Row;
  leftIndex?: number; rightIndex?: number; changes: Change[];
}
export interface DiffResult {
  rows: DiffRow[];
  summary: Record<Status, number> & { total: number; before: number; after: number };
  options: CompareOptions;
}
export interface DataIssue { side: 'left' | 'right'; code: 'missing-key' | 'duplicate-key' | 'missing-column'; rows: number[]; column?: string; key?: string[] }
export class TableValidationError extends Error {
  readonly issues: DataIssue[];
  constructor(issues: DataIssue[]) {
    super('Table validation failed: keys must be present and unique, and selected columns must exist.');
    this.name = 'TableValidationError';
    this.issues = issues;
  }
}
function normalize(value: Cell, options: CompareOptions): string {
  let result = value == null ? '' : String(value);
  if (options.trim) result = result.trim();
  if (options.ignoreCase) result = result.toLocaleLowerCase('en-US');
  return result;
}
const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
function equal(a: Cell, b: Cell, pair: ColumnPair, options: CompareOptions): boolean {
  const left = normalize(a, options), right = normalize(b, options);
  if (left === right) return true;
  if (pair.numericTolerance != null && numeric.test(left) && numeric.test(right)) {
    const x = Number(left), y = Number(right);
    return Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= pair.numericTolerance;
  }
  return false;
}
/** Input row indices in validation issues are 1-based data rows (excluding the header). */
export function compareTables(left: readonly Row[], right: readonly Row[], options: CompareOptions): DiffResult {
  if (!options.keys.length) throw new Error('Select at least one key column.');
  if (!options.columns.length) throw new Error('Select at least one comparison column.');
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
    rows.forEach((row, i) => {
      for (const column of new Set([...options.keys, ...options.columns].map(pair => pair[side]))) {
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
  return { rows, summary, options: structuredClone(options) };
}
/** UTF-8 CSV with BOM, RFC 4180 quoting, and spreadsheet formula escaping by default. */
export function exportDiffCsv(result: DiffResult, { changesOnly = true, escapeFormulae = true } = {}): string {
  const columns = [...result.options.keys, ...result.options.columns].filter((pair, i, all) => all.findIndex(p => p.left === pair.left && p.right === pair.right) === i);
  const matrix: Cell[][] = [['change_type', 'key', 'old_row', 'new_row', ...columns.flatMap(pair => [`old:${pair.left}`, `new:${pair.right}`])]];
  for (const row of result.rows) {
    if (changesOnly && row.status === 'unchanged') continue;
    matrix.push([row.status, JSON.stringify(row.key), row.leftIndex == null ? '' : row.leftIndex + 2, row.rightIndex == null ? '' : row.rightIndex + 2,
      ...columns.flatMap(pair => [row.before?.[pair.left], row.after?.[pair.right]])]);
  }
  return '\uFEFF' + matrix.map(row => row.map(value => {
    let text = value == null ? '' : String(value);
    if (escapeFormulae && /^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
}
