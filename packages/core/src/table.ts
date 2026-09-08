import type { Cell, Row, TableData, TableReadOptions } from './types.js';

export function readLimits(options: TableReadOptions) {
  const limits = { headerRow: options.headerRow ?? 1, maxRows: options.maxRows ?? 50_000, maxColumns: options.maxColumns ?? 1_000 };
  for (const [key, value] of Object.entries(limits)) if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${key} must be a positive integer.`);
  return limits;
}

export function matrixToTable(matrix: readonly (readonly Cell[])[], name: string, options: TableReadOptions = {}): TableData {
  const { headerRow, maxRows, maxColumns } = readLimits(options);
  const header = matrix[headerRow - 1];
  if (!header?.length) throw new Error('Header row is missing or empty.');
  const headers = Array.from(header, value => String(value ?? '').trim());
  if (headers.length > maxColumns) throw new Error(`Column limit exceeded (${maxColumns}).`);
  if (headers.some(value => !value) || new Set(headers).size !== headers.length) throw new Error('Column names must be nonempty and unique.');
  const rows: Row[] = [], rowNumbers: number[] = [];
  for (let i = headerRow; i < matrix.length; i++) {
    const cells = matrix[i];
    if (options.skipEmptyLines !== false && !cells.some(value => value != null && String(value).trim() !== '')) continue;
    if (rows.length >= maxRows) throw new Error(`Row limit exceeded (${maxRows}).`);
    if (cells.slice(headers.length).some(value => value != null && value !== '')) throw new Error(`Row ${i + 1} has more values than the header.`);
    rows.push(Object.fromEntries(headers.map((key, j) => [key, cells[j] ?? null])));
    rowNumbers.push(i + 1);
  }
  return { name, headers, rows, rowNumbers };
}

export function columnNames(rows: readonly Row[]): string[] {
  const columns = new Set<string>();
  for (const row of rows) for (const key of Object.keys(row)) columns.add(key);
  return [...columns];
}
export function ownValue(row: Row, key: string): Cell { return Object.hasOwn(row, key) ? row[key] : undefined; }
export function keyOf(row: Row, keys: readonly string[]): string {
  return JSON.stringify(keys.map(key => {
    const value = ownValue(row, key);
    if (value == null || String(value).trim() === '' || (typeof value === 'number' && !Number.isFinite(value))) throw new Error(`Key ${key} must be present and finite.`);
    return [typeof value, value];
  }));
}
export function assertKeys(keys: readonly string[]) {
  if (!keys.length || keys.some(k => !k) || new Set(keys).size !== keys.length) throw new Error('Keys must be nonempty and unique.');
}
