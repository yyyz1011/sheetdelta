import { SheetDeltaError } from './errors.js';
export type Cell = string | number | boolean | null | undefined;
export type Row = Record<string, Cell>;
export type Status = 'added' | 'removed' | 'changed' | 'unchanged';
export interface ColumnPair { left: string; right: string; numericTolerance?: number; trim?: boolean; ignoreCase?: boolean }
export interface CompareInputOptions {
  keys: (string | ColumnPair)[];
  columns?: (string | ColumnPair)[];
  ignoreColumns?: string[];
  trim?: boolean;
  ignoreCase?: boolean;
  valueMode?: 'text' | 'strict';
  emptyValues?: 'equal' | 'distinct';
  includeUnchanged?: boolean;
}
export interface CompareOptions extends Omit<CompareInputOptions, 'keys' | 'columns'> { keys: ColumnPair[]; columns: ColumnPair[] }
export type ResolvedCompareOptions = CompareOptions;
export interface Change { leftColumn: string; rightColumn: string; before: Cell; after: Cell }
export interface DiffRow {
  key: string[]; status: Status; before?: Row; after?: Row;
  leftIndex?: number; rightIndex?: number; changes: Change[];
}
export interface DiffResult {
  rows: DiffRow[];
  summary: Record<Status, number> & { total: number; before: number; after: number };
  options: ResolvedCompareOptions;
  schema: { added: string[]; removed: string[]; common: string[] };
}
export interface TableData { name: string; headers: string[]; rows: Row[]; rowNumbers: number[]; warnings?: ImportWarning[]; metadata?: { date1904: boolean; hidden: boolean } }
export interface ImportWarning { code: 'FORMULA_NO_CACHE' | 'MERGED_CELLS' | 'HIDDEN_SHEET'; message: string; sheet: string; row?: number; column?: string; cell?: string }
export interface TableReadOptions { headerRow?: number; maxRows?: number; maxColumns?: number; skipEmptyLines?: boolean }
export interface DataIssue { side: 'left' | 'right'; code: 'missing-key' | 'duplicate-key' | 'missing-column'; rows: number[]; column?: string; key?: string[] }
export class TableValidationError extends SheetDeltaError {
  readonly issues: DataIssue[];
  constructor(issues: DataIssue[]) {
    super('TABLE_VALIDATION', 'Table validation failed: keys must be present and unique, and selected columns must exist.');
    this.name = 'TableValidationError';
    this.issues = issues;
  }
  override toJSON() { return { ...super.toJSON(), issues: this.issues }; }
}
