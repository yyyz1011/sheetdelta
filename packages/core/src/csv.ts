import Papa from 'papaparse';
import type { Cell, Row, TableData, TableReadOptions } from './types.js';
import { matrixToTable, columnNames } from './table.js';
export { exportDiffCsv } from './csv-export.js';
export type { TableData } from './types.js';

export interface CsvReadOptions extends TableReadOptions { delimiter?: string; name?: string }
/** Parse CSV text without automatic numeric conversion: identifiers retain leading zeros. */
export function readCsv(text: string, options: CsvReadOptions = {}): TableData {
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), { delimiter: options.delimiter ?? '', dynamicTyping: false, skipEmptyLines: false });
  const errors = result.errors.filter(error => error.code !== 'UndetectableDelimiter');
  if (errors.length) throw new Error(`Invalid CSV: ${errors[0].message}`);
  return matrixToTable(result.data, options.name ?? 'Data', options);
}
export interface CsvWriteOptions { columns?: string[]; delimiter?: string; bom?: boolean; escapeFormulae?: boolean }
/** Export arbitrary rows. Formula-like text is escaped unless explicitly disabled. */
export function writeCsv(rows: readonly Row[], options: CsvWriteOptions = {}): string {
  const columns = options.columns ?? columnNames(rows);
  if (new Set(columns).size !== columns.length || columns.some(c => !c)) throw new Error('Column names must be nonempty and unique.');
  const protect = (value: Cell): Cell => options.escapeFormulae !== false && typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value;
  const csv = Papa.unparse({ fields: columns.map(protect) as string[], data: rows.map(row => columns.map(key => protect(Object.hasOwn(row, key) ? row[key] : null))) }, { delimiter: options.delimiter ?? ',', newline: '\r\n', quotes: true });
  return (options.bom === false ? '' : '\uFEFF') + csv;
}
