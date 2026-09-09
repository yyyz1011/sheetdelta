import { assertRows } from './table.js';
import { SheetDeltaError, fail, assertRecord, wrapError } from './errors.js';
import Papa from 'papaparse';
import type { Cell, Row, TableData, TableReadOptions } from './types.js';
import { matrixToTable, columnNames } from './table.js';
export { exportDiffCsv } from './csv-export.js';
export type { TableData } from './types.js';

export interface CsvReadOptions extends TableReadOptions { delimiter?: string; name?: string }
/** Parse CSV text without automatic numeric conversion: identifiers retain leading zeros. */
export function readCsv(text: string, options: CsvReadOptions = {}): TableData {
  if (typeof text !== 'string') fail('INVALID_DATA', 'CSV input must be a string.');
  assertRecord(options, 'options');
  if (options.delimiter != null && (typeof options.delimiter !== 'string' || !options.delimiter || /[\r\n"\uFEFF]/.test(options.delimiter))) fail('INVALID_OPTIONS', 'Invalid CSV delimiter.', { option: 'delimiter' });
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), { delimiter: options.delimiter ?? '', dynamicTyping: false, skipEmptyLines: false });
  const errors = result.errors.filter(error => error.code !== 'UndetectableDelimiter');
  if (errors.length) throw new SheetDeltaError('INVALID_CSV', `Invalid CSV: ${errors[0].message}`, { operation: 'readCsv', row: errors[0].row == null ? undefined : errors[0].row + 1 });
  return matrixToTable(result.data, options.name ?? 'Data', options);
}
export interface CsvWriteOptions { columns?: string[]; delimiter?: string; bom?: boolean; escapeFormulae?: boolean }
/** Export arbitrary rows. Formula-like text is escaped unless explicitly disabled. */
export function writeCsv(rows: readonly Row[], options: CsvWriteOptions = {}): string {
  assertRows(rows); assertRecord(options, 'options');
  if (options.delimiter != null && (typeof options.delimiter !== 'string' || !options.delimiter || /[\r\n"\uFEFF]/.test(options.delimiter))) fail('INVALID_OPTIONS', 'Invalid CSV delimiter.', { option: 'delimiter' });
  if (options.columns != null && !Array.isArray(options.columns)) fail('INVALID_OPTIONS', 'columns must be an array.');
  const columns = options.columns ?? columnNames(rows);
  if (new Set(columns).size !== columns.length || columns.some(c => typeof c !== 'string' || !c)) throw new SheetDeltaError('INVALID_OPTIONS', 'Column names must be nonempty and unique.');
  const protect = (value: Cell): Cell => options.escapeFormulae !== false && typeof value === 'string' && /^[\s]*[=+\-@\t\r]/.test(value) ? "'" + value : value;
  const csv = Papa.unparse({ fields: columns.map(protect) as string[], data: rows.map(row => columns.map(key => protect(Object.hasOwn(row, key) ? row[key] : null))) }, { delimiter: options.delimiter ?? ',', newline: '\r\n', quotes: true });
  return (options.bom === false ? '' : '\uFEFF') + csv;
}

export interface CsvByteReadOptions extends CsvReadOptions { encoding?: string; maxBytes?: number }
/** Decode bytes explicitly; malformed text is rejected instead of replacing characters. */
export function readCsvBytes(input: ArrayBuffer | Uint8Array, options: CsvByteReadOptions = {}): TableData {
  assertRecord(options, 'options');
  if (!(input instanceof ArrayBuffer) && !(input instanceof Uint8Array)) fail('INVALID_DATA', 'CSV input must be an ArrayBuffer or Uint8Array.');
  const limit = options.maxBytes ?? 20 * 1024 * 1024;
  if (!Number.isSafeInteger(limit) || limit < 1) fail('INVALID_OPTIONS', 'maxBytes must be a positive integer.');
  if (input.byteLength > limit) fail('LIMIT_EXCEEDED', 'CSV file size limit exceeded.', { limit, actual: input.byteLength });
  let decoder: TextDecoder;
  try { decoder = new TextDecoder(options.encoding ?? 'utf-8', { fatal: true }); }
  catch (error) { wrapError(error, 'INVALID_OPTIONS', 'Unsupported text encoding.', { option: 'encoding' }); }
  let text: string;
  try { text = decoder.decode(input); }
  catch (error) { wrapError(error, 'INVALID_CSV', 'Input bytes do not match the selected encoding.', { operation: 'readCsvBytes' }); }
  return readCsv(text, options);
}
