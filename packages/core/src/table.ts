import { SheetDeltaError, fail, assertRecord } from './errors.js';
import type { Cell, Row, TableData, TableReadOptions } from './types.js';

export function readLimits(options: TableReadOptions) {
  assertRecord(options, 'options');
  const limits = { headerRow: options.headerRow ?? 1, maxRows: options.maxRows ?? 50_000, maxColumns: options.maxColumns ?? 1_000 };
  for (const [key, value] of Object.entries(limits)) if (!Number.isSafeInteger(value) || value < 1) throw new SheetDeltaError('INVALID_OPTIONS', `${key} must be a positive integer.`);
  return limits;
}

export function matrixToTable(matrix: readonly (readonly Cell[])[], name: string, options: TableReadOptions = {}, rowOffset = 0): TableData {
  const { headerRow, maxRows, maxColumns } = readLimits(options);
  const header = matrix[headerRow - 1];
  if (!header?.length) throw new SheetDeltaError('INVALID_HEADER', 'Header row is missing or empty.', { sheet: name, row: headerRow + rowOffset });
  const headers = Array.from(header, value => String(value ?? '').trim());
  if (headers.length > maxColumns) throw new SheetDeltaError('LIMIT_EXCEEDED', `Column limit exceeded (${maxColumns}).`, { sheet: name, limit: maxColumns, actual: headers.length });
  if (headers.some(value => !value) || new Set(headers).size !== headers.length) throw new SheetDeltaError('INVALID_HEADER', 'Column names must be nonempty and unique.', { sheet: name, row: headerRow + rowOffset });
  const rows: Row[] = [], rowNumbers: number[] = [];
  for (let i = headerRow; i < matrix.length; i++) {
    const cells = matrix[i];
    if (options.skipEmptyLines !== false && !cells.some(value => value != null && String(value).trim() !== '')) continue;
    if (rows.length >= maxRows) throw new SheetDeltaError('LIMIT_EXCEEDED', `Row limit exceeded (${maxRows}).`, { sheet: name, row: i + 1 + rowOffset, limit: maxRows });
    if (cells.slice(headers.length).some(value => value != null && value !== '')) throw new SheetDeltaError('INVALID_DATA', `Row ${i + 1 + rowOffset} has more values than the header.`, { sheet: name, row: i + 1 + rowOffset });
    rows.push(Object.fromEntries(headers.map((key, j) => [key, cells[j] ?? null])));
    rowNumbers.push(i + 1 + rowOffset);
  }
  return { name, headers, rows, rowNumbers };
}

export function columnNames(rows: readonly Row[]): string[] {
  const columns = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
  return [...columns];
}
export function ownValue(row: Row, key: string): Cell { return Object.hasOwn(row, key) ? row[key] : undefined; }
export function keyOf(row: Row, keys: readonly string[], context: import('./errors.js').ErrorContext = {}): string {
  return JSON.stringify(keys.map(key => {
    const value = ownValue(row, key);
    if (value == null || String(value).trim() === '' || (typeof value === 'number' && !Number.isFinite(value))) throw new SheetDeltaError('MISSING_KEY', `Key ${key} must be present and finite.`, { ...context, column: key });
    return [typeof value, value];
  }));
}
export function assertKeys(keys: readonly string[]) {
  if (!Array.isArray(keys) || !keys.length || keys.some(k => typeof k !== 'string' || !k) || new Set(keys).size !== keys.length) throw new SheetDeltaError('INVALID_OPTIONS', 'Keys must be nonempty and unique.');
}

export function assertRow(row: unknown, index: number, side?: string): asserts row is Row {
  if (!row || typeof row !== 'object' || Array.isArray(row) || row instanceof Date) fail('INVALID_DATA', 'Each data row must be a record.', { row: index + 1, side });
}
export function assertRows(rows: unknown, side?: string): asserts rows is readonly Row[] {
  if (!Array.isArray(rows)) fail('INVALID_DATA', 'Rows must be an array.', { side });
  for (let i = 0; i < rows.length; i++) assertRow(rows[i], i, side);
}
