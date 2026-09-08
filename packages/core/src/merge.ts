import type { Cell, Row } from './types.js';
import { assertKeys, keyOf, columnNames } from './table.js';
export interface MergeOptions { keys: string[]; join?: 'left' | 'inner' | 'full'; conflict?: 'error' | 'left' | 'right' }
export interface MergeConflict { key: Cell[]; column: string; left: Cell; right: Cell }
export class MergeConflictError extends Error { constructor(readonly conflicts: MergeConflict[]) { super('Conflicting field values. Select an explicit left or right conflict policy.'); this.name = 'MergeConflictError'; } }
/** Join unique keyed rows. Conflicting values throw unless an explicit policy is provided. */
export function mergeTables(left: readonly Row[], right: readonly Row[], options: MergeOptions) {
  assertKeys(options.keys);
  const join = options.join ?? 'full', policy = options.conflict ?? 'error';
  if (!['left', 'inner', 'full'].includes(join) || !['error', 'left', 'right'].includes(policy)) throw new Error('Invalid merge options.');
  const index = (rows: readonly Row[], side: string) => {
    const map = new Map<string, Row>();
    rows.forEach((row, i) => { const key = keyOf(row, options.keys); if (map.has(key)) throw new Error(`Duplicate key on ${side} at data row ${i + 1}.`); map.set(key, row); }); return map;
  };
  const before = index(left, 'left'), after = index(right, 'right');
  const rows: Row[] = [], conflicts: MergeConflict[] = [];
  let matched = 0, leftOnly = 0, rightOnly = 0;
  for (const [id, row] of before) {
    const other = after.get(id);
    if (!other) { leftOnly++; if (join !== 'inner') rows.push({ ...row }); continue; }
    matched++;
    const merged = new Map(Object.entries(row));
    for (const [column, value] of Object.entries(other)) {
      if (options.keys.includes(column)) continue;
      if (merged.has(column) && !Object.is(merged.get(column), value)) {
        conflicts.push({ key: options.keys.map(key => row[key]), column, left: merged.get(column), right: value });
        if (policy !== 'right') continue;
      }
      merged.set(column, value);
    }
    rows.push(Object.fromEntries(merged));
  }
  for (const [id, row] of after) if (!before.has(id)) { rightOnly++; if (join === 'full') rows.push({ ...row }); }
  if (conflicts.length && policy === 'error') throw new MergeConflictError(conflicts);
  return { rows, conflicts, summary: { matched, leftOnly, rightOnly, total: rows.length } };
}

/** Append tables vertically with an explicit schema policy. */
export function appendTables(tables: readonly (readonly Row[])[], options: { schema?: 'strict' | 'union' } = {}) {
  const mode = options.schema ?? 'strict';
  if (!['strict', 'union'].includes(mode)) throw new Error('schema must be strict or union.');
  const columns = [...new Set(tables.flatMap(columnNames))];
  const rows: Row[] = [], sources: { table: number; row: number }[] = [];
  tables.forEach((table, index) => table.forEach((row, rowIndex) => {
    if (mode === 'strict' && (Object.keys(row).length !== columns.length || columns.some(key => !Object.hasOwn(row, key)))) throw new Error(`Schema mismatch in table ${index + 1}, data row ${rowIndex + 1}.`);
    rows.push(Object.fromEntries(columns.map(key => [key, Object.hasOwn(row, key) ? row[key] : null])));
    sources.push({ table: index + 1, row: rowIndex + 1 });
  }));
  return { rows, columns, sources };
}
