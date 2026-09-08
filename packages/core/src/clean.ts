import type { Cell, Row } from './types.js';
import { keyOf, assertKeys } from './table.js';
export interface CleanRule { trim?: boolean; case?: 'lower' | 'upper'; emptyValue?: Cell; type?: 'string' | 'number' | 'boolean' }
export interface CleanChange { row: number; column: string; before: Cell; after: Cell }
export interface CleanIssue { row: number; column: string; value: Cell; code: 'conversion' }
export function cleanTable(rows: readonly Row[], rules: Record<string, CleanRule>): { rows: Row[]; changes: CleanChange[]; issues: CleanIssue[] } {
  for (const rule of Object.values(rules)) {
    if (rule.type && !['string', 'number', 'boolean'].includes(rule.type)) throw new Error('Invalid conversion type.');
    if (rule.case && !['lower', 'upper'].includes(rule.case)) throw new Error('Invalid case rule.');
  }
  const changes: CleanChange[] = [], issues: CleanIssue[] = [];
  const output = rows.map((row, index) => {
    const entries = new Map(Object.entries(row));
    for (const [column, rule] of Object.entries(rules)) {
      if (!entries.has(column)) continue;
      const before = entries.get(column); let value = before;
      if (typeof value === 'string') {
        if (rule.trim) value = value.trim();
        if (rule.case === 'lower') value = value.toLocaleLowerCase('en-US');
        if (rule.case === 'upper') value = value.toLocaleUpperCase('en-US');
      }
      if ((value == null || value === '') && Object.hasOwn(rule, 'emptyValue')) value = rule.emptyValue;
      if (value != null && value !== '' && rule.type) {
        if (rule.type === 'string') value = String(value);
        if (rule.type === 'number') {
          const converted = typeof value === 'number' ? value : typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) ? Number(value) : NaN;
          if (!Number.isFinite(converted) || (Number.isInteger(converted) && !Number.isSafeInteger(converted))) { issues.push({ row: index + 1, column, value: before, code: 'conversion' }); continue; }
          value = converted;
        }
        if (rule.type === 'boolean' && typeof value !== 'boolean') {
          if (value === 'true' || value === 'false') value = value === 'true';
          else { issues.push({ row: index + 1, column, value: before, code: 'conversion' }); continue; }
        }
      }
      if (!Object.is(before, value)) { entries.set(column, value); changes.push({ row: index + 1, column, before, after: value }); }
    }
    return Object.fromEntries(entries);
  });
  return { rows: output, changes, issues };
}
export function deduplicateTable(rows: readonly Row[], options: { keys: string[]; keep?: 'first' | 'last' } ) {
  assertKeys(options.keys);
  if (options.keep && !['first', 'last'].includes(options.keep)) throw new Error('keep must be first or last.');
  const groups = new Map<string, number[]>();
  rows.forEach((row, i) => { const key = keyOf(row, options.keys); const group = groups.get(key); if (group) group.push(i); else groups.set(key, [i]); });
  const kept = new Set([...groups.values()].map(indices => options.keep === 'last' ? indices[indices.length - 1] : indices[0]));
  return { rows: rows.filter((_, i) => kept.has(i)).map(row => ({ ...row })), removedRows: rows.map((_, i) => i).filter(i => !kept.has(i)).map(i => i + 1), duplicateGroups: [...groups.values()].filter(indices => indices.length > 1).map(indices => indices.map(i => i + 1)) };
}
