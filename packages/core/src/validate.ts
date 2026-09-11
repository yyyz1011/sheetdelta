import { assertRows } from './table.js';
import { SheetDeltaError, fail, assertRecord, wrapError } from './errors.js';
import type { Cell, Row } from './types.js';
import { ownValue } from './table.js';
export interface ColumnRule {
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'date';
  unique?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  enum?: readonly Cell[];
  pattern?: string;
}
export type TableSchema = Record<string, ColumnRule>;
export interface ValidationIssue { code: 'required' | 'type' | 'unique' | 'min' | 'max' | 'minLength' | 'maxLength' | 'enum' | 'pattern' | 'unknown-column'; row: number; column: string; value: Cell; message: string }
export interface ValidationResult { valid: boolean; issues: ValidationIssue[]; validRows: number[]; invalidRows: number[] }
/** Validate without mutation or coercion. Row numbers are 1-based data rows. */
export function validateTable(rows: readonly Row[], schema: TableSchema, options: { allowUnknown?: boolean; maxIssues?: number } = {}): ValidationResult {
  assertRows(rows); assertRecord(schema, 'schema'); assertRecord(options, 'options');
  if (options.maxIssues !== undefined && (!Number.isSafeInteger(options.maxIssues) || options.maxIssues < 1)) fail('INVALID_OPTIONS', 'maxIssues must be positive.');
  const ruleEntries = Object.entries(schema);
  const issues: ValidationIssue[] = [];
  const unique = new Map<string, Map<string, number[]>>();
  const patterns = new Map<string, RegExp>();
  for (const [column, rule] of ruleEntries) {
    assertRecord(rule, 'rule');
    if (rule.enum && !Array.isArray(rule.enum)) fail('INVALID_OPTIONS', 'enum must be an array.', { column });
    if (rule.type && !['string', 'number', 'boolean', 'date'].includes(rule.type)) throw new SheetDeltaError('INVALID_OPTIONS', `Invalid type for ${column}.`);
    for (const bound of ['min', 'max', 'minLength', 'maxLength'] as const) if (rule[bound] != null && (!Number.isFinite(rule[bound]) || (bound.endsWith('Length') && (!Number.isInteger(rule[bound]) || rule[bound]! < 0)))) throw new SheetDeltaError('INVALID_OPTIONS', `Invalid ${bound} for ${column}.`);
    if (rule.min != null && rule.max != null && rule.min > rule.max) throw new SheetDeltaError('INVALID_OPTIONS', `min exceeds max for ${column}.`);
    if (rule.minLength != null && rule.maxLength != null && rule.minLength > rule.maxLength) throw new SheetDeltaError('INVALID_OPTIONS', `minLength exceeds maxLength for ${column}.`);
    if (rule.pattern != null) { try { patterns.set(column, new RegExp(rule.pattern)); } catch (error) { wrapError(error, 'INVALID_OPTIONS', `Invalid pattern for ${column}.`, { column, option: 'pattern' }); } }
    if (rule.unique) unique.set(column, new Map());
  }
  const add = (code: ValidationIssue['code'], row: number, column: string, value: Cell) => { if (issues.length >= (options.maxIssues ?? Infinity)) fail('LIMIT_EXCEEDED', 'Validation issue budget exceeded.'); issues.push({ code, row, column, value, message: `${column}: ${code} validation failed at data row ${row}.` }); };
  rows.forEach((row, index) => {
    const number = index + 1;
    if (options.allowUnknown === false) for (const column of Object.keys(row)) if (!Object.hasOwn(schema, column)) add('unknown-column', number, column, row[column]);
    for (const [column, rule] of ruleEntries) {
      const value = ownValue(row, column), blank = value == null || (typeof value === 'string' && value.trim() === '');
      if (blank) { if (rule.required) add('required', number, column, value); continue; }
      if (rule.type) {
        const matches = rule.type === 'date' ? typeof value === 'string' && isIsoDate(value) : typeof value === rule.type && (rule.type !== 'number' || Number.isFinite(value));
        if (!matches) add('type', number, column, value);
      }
      if (typeof value === 'number') {
        if (rule.min != null && value < rule.min) add('min', number, column, value);
        if (rule.max != null && value > rule.max) add('max', number, column, value);
      }
      if (typeof value === 'string') {
        if (rule.minLength != null && value.length < rule.minLength) add('minLength', number, column, value);
        if (rule.maxLength != null && value.length > rule.maxLength) add('maxLength', number, column, value);
        if (patterns.has(column) && !patterns.get(column)!.test(value)) add('pattern', number, column, value);
      }
      if (rule.enum && !rule.enum.some(candidate => Object.is(candidate, value))) add('enum', number, column, value);
      const seen = unique.get(column);
      if (seen) { const key = JSON.stringify([typeof value, value]); const group = seen.get(key); if (group) group.push(number); else seen.set(key, [number]); }
    }
  });
  for (const [column, values] of unique) for (const numbers of values.values()) if (numbers.length > 1) for (const row of numbers) add('unique', row, column, ownValue(rows[row - 1], column));
  const invalid = new Set(issues.map(issue => issue.row));
  return { valid: !issues.length, issues, validRows: rows.map((_, i) => i + 1).filter(n => !invalid.has(n)), invalidRows: [...invalid].sort((a, b) => a - b) };
}
/** Calendar date only, deliberately excluding ambiguous locale date strings. */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
