import type { Cell, Row, TableData } from './types.js';
import type { CleanRule, CleanChange } from './clean.js';
import { cleanTable } from './clean.js';
import { validateTable, type ColumnRule } from './validate.js';
import { assertRecord, fail } from './errors.js';
import { assertRows } from './table.js';
import type { CsvByteReadOptions } from './csv.js';
import type { ExcelReadOptions } from './excel.js';

export interface ImportField {
  key: string;
  aliases?: readonly string[];
  /** Explicit, exact source header; overrides aliases. */
  source?: string;
  requiredColumn?: boolean;
  clean?: CleanRule;
  rule?: ColumnRule;
}
export interface ImportMapping { field: string; column?: string; candidates: string[] }
export interface ImportLocation {
  fileName?: string; sheet: string; sourceRow?: number;
  positionKind: 'worksheet-row' | 'csv-record' | 'data-row';
  sourceColumn?: string; columnIndex?: number; cell?: string;
}
export interface ImportIssue {
  code: string; message: string; severity: 'error' | 'warning';
  /** One-based position in processedRows, never a physical worksheet row. */
  row?: number; column?: string; ruleId?: string; source?: ImportLocation;
}
export interface RowRule {
  id: string;
  validate: (row: Readonly<Row>, context: { row: number }) => readonly Omit<ImportIssue, 'row' | 'source' | 'ruleId'>[];
}
export interface TableRule {
  id: string;
  validate: (rows: readonly Readonly<Row>[]) => readonly Omit<ImportIssue, 'source' | 'ruleId'>[];
}
export interface ImportSchema {
  fields: readonly ImportField[];
  allowUnknownColumns?: boolean;
  rowRules?: readonly RowRule[];
  tableRules?: readonly TableRule[];
}
export interface ImportProgress { phase: 'map' | 'clean' | 'validate' | 'rules' | 'complete'; processed: number; total: number }
export interface ImportOptions {
  mode?: 'strict' | 'valid-rows'; fileName?: string; format?: 'table' | 'csv' | 'excel';
  signal?: AbortSignal; onProgress?: (event: ImportProgress) => void;
  batchSize?: number; maxRows?: number; maxCells?: number; maxIssues?: number;
}
export interface ImportResult {
  status: 'ready' | 'partial' | 'invalid'; valid: boolean;
  /** Eligible rows only; strict mode returns no rows if any error exists. */
  rows: Row[]; sources: ImportLocation[];
  processedRows: Row[]; rowSources: ImportLocation[];
  original: TableData; mappings: ImportMapping[]; issues: ImportIssue[];
  changes: (CleanChange & { source: ImportLocation })[];
  validRows: number[]; invalidRows: number[];
  summary: { total: number; accepted: number; errors: number; warnings: number };
}

const textList = (values: readonly string[], label: string, empty = false) => {
  if (!Array.isArray(values) || (!empty && !values.length) || values.some(v => typeof v !== 'string' || !v.trim()) || new Set(values).size !== values.length) fail('INVALID_OPTIONS', `${label} must contain unique, nonempty names.`);
};
const fold = (s: string) => s.trim().toLocaleLowerCase('en-US');
function fieldsChecked(fields: readonly ImportField[]) {
  if (!Array.isArray(fields) || !fields.length || fields.length > 1000) fail('INVALID_OPTIONS', 'Provide 1–1000 import fields.');
  for (const f of fields) {
    assertRecord(f, 'field');
    if (f.clean?.emptyValue != null && (!['string', 'number', 'boolean'].includes(typeof f.clean.emptyValue) || typeof f.clean.emptyValue === 'number' && !Number.isFinite(f.clean.emptyValue))) fail('INVALID_OPTIONS', 'emptyValue must be a finite primitive.');
    if (f.aliases !== undefined) textList(f.aliases, 'aliases', true);
    if (f.source !== undefined && (typeof f.source !== 'string' || !f.source.trim())) fail('INVALID_OPTIONS', 'source must be a nonempty header.');
    if (f.requiredColumn !== undefined && typeof f.requiredColumn !== 'boolean') fail('INVALID_OPTIONS', 'requiredColumn must be boolean.');
  }
  textList(fields.map(f => f.key), 'field keys');
}
/** Resolve exact explicit headers or case-insensitive key/alias matches. Ambiguity is never guessed. */
export function mapImportHeaders(headers: readonly string[], fields: readonly ImportField[], options: { allowUnknownColumns?: boolean } = {}) {
  textList(headers, 'headers'); fieldsChecked(fields); assertRecord(options, 'options');
  if (options.allowUnknownColumns !== undefined && typeof options.allowUnknownColumns !== 'boolean') fail('INVALID_OPTIONS', 'allowUnknownColumns must be boolean.');
  const issues: ImportIssue[] = [];
  const add = (code: string, column: string, message: string) => issues.push({ code, column, message, severity: 'error' });
  const mappings = fields.map(f => {
    const names = new Set([f.key, ...(f.aliases ?? [])].map(fold));
    const candidates = headers.filter(h => f.source !== undefined ? h === f.source : names.has(fold(h)));
    if (candidates.length > 1) add('ambiguous-column', f.key, `More than one source header matches ${f.key}; set source explicitly.`);
    if (!candidates.length && (f.requiredColumn || f.source !== undefined)) add('missing-column', f.key, `Source column for ${f.key} is missing.`);
    return { field: f.key, column: candidates.length === 1 ? candidates[0] : undefined, candidates };
  });
  const used = new Map<string, string[]>();
  for (const m of mappings) if (m.column !== undefined) used.set(m.column, [...(used.get(m.column) ?? []), m.field]);
  for (const [column, keys] of used) if (keys.length > 1) for (const key of keys) add('reused-column', key, `Source column ${column} matches several fields.`);
  const unknownColumns = headers.filter(h => !mappings.some(m => m.candidates.includes(h)));
  if (options.allowUnknownColumns === false) for (const h of unknownColumns) add('unknown-column', h, `Unexpected source column ${h}.`);
  return { mappings, issues, unknownColumns, valid: issues.length === 0 };
}
function columnLetters(index: number) { let out = ''; for (let n = index; n; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out; return out; }
/** Locate a canonical field using a one-based original data row. Missing columns have no cell address. */
export function locateImportCell(result: Pick<ImportResult, 'original' | 'mappings' | 'rowSources'>, row: number, field: string): ImportLocation {
  if (!Number.isSafeInteger(row) || row < 1 || row > result.rowSources.length) fail('INVALID_OPTIONS', 'row must identify a processed data row.');
  const mapping = result.mappings.find(m => m.field === field);
  if (!mapping) fail('INVALID_OPTIONS', 'Unknown canonical field.', { column: field });
  const location = { ...result.rowSources[row - 1] };
  if (mapping.column !== undefined) {
    location.sourceColumn = mapping.column; location.columnIndex = result.original.headers.indexOf(mapping.column) + 1;
    if (location.positionKind === 'worksheet-row') location.cell = columnLetters(location.columnIndex) + location.sourceRow;
  }
  return location;
}
/** Map, clean and validate a parsed table while preserving original data and source positions. */
export async function prepareImport(table: TableData, schema: ImportSchema, options: ImportOptions = {}): Promise<ImportResult> {
  assertRecord(table, 'table'); assertRecord(schema, 'schema'); assertRecord(options, 'options'); assertRows(table.rows);
  if (typeof table.name !== 'string' || !table.name) fail('INVALID_DATA', 'Table name is required.');
  const limits = { maxRows: options.maxRows ?? 50000, maxCells: options.maxCells ?? 1000000, maxIssues: options.maxIssues ?? 10000, batchSize: options.batchSize ?? 512 };
  for (const [option, n] of Object.entries(limits)) if (!Number.isSafeInteger(n) || n < 1) fail('INVALID_OPTIONS', `${option} must be positive.`, { option });
  if (options.mode !== undefined && !['strict', 'valid-rows'].includes(options.mode)) fail('INVALID_OPTIONS', 'Invalid mode.');
  if (options.format !== undefined && !['table', 'csv', 'excel'].includes(options.format)) fail('INVALID_OPTIONS', 'Invalid format.');
  if (options.fileName !== undefined && typeof options.fileName !== 'string') fail('INVALID_OPTIONS', 'fileName must be text.');
  if (options.onProgress !== undefined && typeof options.onProgress !== 'function') fail('INVALID_OPTIONS', 'onProgress must be callable.');
  const aborted = () => { if (options.signal?.aborted) fail('ABORTED', 'Import cancelled.'); };
  const progress = (phase: ImportProgress['phase'], processed: number) => { aborted(); options.onProgress?.({ phase, processed, total: table.rows.length }); aborted(); };
  progress('map', 0);
  const mapped = mapImportHeaders(table.headers, schema.fields, { allowUnknownColumns: schema.allowUnknownColumns });
  if (table.rows.length > limits.maxRows || (table.rows.length + 1) * Math.max(table.headers.length, schema.fields.length) > limits.maxCells) fail('LIMIT_EXCEEDED', 'Import row/cell budget exceeded.');
  if (!Array.isArray(table.rowNumbers) || table.rowNumbers.length !== table.rows.length || table.rowNumbers.some((n, i) => !Number.isSafeInteger(n) || n < 1 || i > 0 && n <= table.rowNumbers[i - 1])) fail('INVALID_DATA', 'Source row numbers must be increasing positive integers matching the data.');
  const headers = new Set(table.headers);
  for (const row of table.rows) for (const [key, value] of Object.entries(row)) {
    if (!headers.has(key)) fail('INVALID_DATA', 'Row contains a column outside the source headers.', { column: key });
    if (value != null && !['string', 'boolean', 'number'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value)) fail('INVALID_DATA', 'Import cells must be finite primitive values.', { column: key });
  }
  const ids = new Set<string>();
  for (const group of [schema.rowRules ?? [], schema.tableRules ?? []]) {
    if (!Array.isArray(group)) fail('INVALID_OPTIONS', 'Custom rules must be arrays.');
    for (const rule of group) { assertRecord(rule, 'custom rule'); if (typeof rule.id !== 'string' || !rule.id.trim() || ids.has(rule.id) || typeof rule.validate !== 'function') fail('INVALID_OPTIONS', 'Custom rules need unique IDs and synchronous validate functions.'); ids.add(rule.id); }
  }
  const cleanRules = Object.fromEntries(schema.fields.filter(f => f.clean !== undefined).map(f => [f.key, f.clean!]));
  const rules = Object.fromEntries(schema.fields.filter(f => f.rule !== undefined).map(f => [f.key, f.rule!]));
  cleanTable([], cleanRules); validateTable([], rules);
  const original: TableData = { name: table.name, headers: [...table.headers], rows: table.rows.map(r => ({ ...r })), rowNumbers: [...table.rowNumbers], ...(table.metadata ? { metadata: { ...table.metadata } } : {}), warnings: table.warnings?.map(w => ({ ...w })) };
  const positionKind = options.format === 'excel' ? 'worksheet-row' : options.format === 'csv' ? 'csv-record' : 'data-row';
  const rowSources: ImportLocation[] = table.rowNumbers.map(sourceRow => ({ ...(options.fileName === undefined ? {} : { fileName: options.fileName }), sheet: table.name, sourceRow, positionKind }));
  const result: ImportResult = { status: 'invalid', valid: false, rows: [], sources: [], processedRows: [], rowSources, original, mappings: mapped.mappings, issues: [], changes: [], validRows: [], invalidRows: [], summary: { total: table.rows.length, accepted: 0, errors: 0, warnings: 0 } };
  const add = (issue: ImportIssue) => {
    if (result.issues.length >= limits.maxIssues) fail('LIMIT_EXCEEDED', 'Import issue budget exceeded; no partial result returned.', { limit: limits.maxIssues });
    const source = issue.source ?? (issue.row ? issue.column && result.mappings.some(m => m.field === issue.column) ? locateImportCell(result, issue.row, issue.column) : { ...rowSources[issue.row - 1] } : { fileName: options.fileName, sheet: table.name, positionKind });
    result.issues.push({ ...issue, source });
  };
  for (const issue of mapped.issues) add(issue);
  for (const warning of table.warnings ?? []) add({ code: warning.code, message: warning.message, severity: 'warning', source: { fileName: options.fileName, sheet: warning.sheet, positionKind, sourceRow: warning.row, sourceColumn: warning.column, cell: warning.cell } });
  // Structural errors block conversion; callers can repair the mapping without losing source data.
  if (mapped.valid) {
    for (let start = 0; start < original.rows.length; start += limits.batchSize) {
      const batch = original.rows.slice(start, start + limits.batchSize).map(row => Object.fromEntries(mapped.mappings.map(m => [m.field, m.column === undefined ? null : Object.hasOwn(row, m.column) ? row[m.column] : null])));
      const cleaned = cleanTable(batch, cleanRules); for (const row of cleaned.rows) result.processedRows.push(row);
      for (const change of cleaned.changes) { const row = start + change.row; result.changes.push({ ...change, row, source: locateImportCell(result, row, change.column) }); }
      for (const issue of cleaned.issues) add({ code: issue.code, row: start + issue.row, column: issue.column, severity: 'error', message: `Cannot convert ${issue.column}.` });
      progress('clean', result.processedRows.length);
      await new Promise<void>(resolve => setTimeout(resolve, 0)); aborted();
    }
    const validated = validateTable(result.processedRows, rules, { maxIssues: limits.maxIssues });
    for (const issue of validated.issues) add({ ...issue, severity: 'error' });
    progress('validate', result.processedRows.length);
    const snapshot = Object.freeze(result.processedRows.map(row => Object.freeze({ ...row })));
    const acceptCustom = (raw: unknown, ruleId: string, row?: number) => {
      if (raw && typeof (raw as PromiseLike<unknown>).then === 'function') {
        Promise.resolve(raw).catch(() => undefined);
        fail('INVALID_OPTIONS', 'Custom rules must be synchronous.');
      }
      if (!Array.isArray(raw)) fail('INVALID_OPTIONS', 'Custom rules must synchronously return issue arrays.');
      for (const item of raw) {
        assertRecord(item, 'custom issue'); const issue = item as ImportIssue; const index = row ?? issue.row;
        if (typeof issue.code !== 'string' || !issue.code || typeof issue.message !== 'string' || !['error', 'warning'].includes(issue.severity)) fail('INVALID_OPTIONS', 'Custom issues require code, message and severity.');
        if (index !== undefined && (!Number.isSafeInteger(index) || index < 1 || index > snapshot.length)) fail('INVALID_OPTIONS', 'Custom issue row is out of bounds.');
        if (issue.column !== undefined && !schema.fields.some(f => f.key === issue.column)) fail('INVALID_OPTIONS', 'Custom issue column must be a canonical field.');
        add({ code: issue.code, message: issue.message, severity: issue.severity, row: index, column: issue.column, ruleId });
      }
    };
    for (let i = 0; i < snapshot.length; i++) {
      for (const rule of schema.rowRules ?? []) acceptCustom(rule.validate(snapshot[i], { row: i + 1 }), rule.id, i + 1);
      if ((i + 1) % limits.batchSize === 0) { progress('rules', i + 1); await new Promise<void>(resolve => setTimeout(resolve, 0)); aborted(); }
    }
    for (const rule of schema.tableRules ?? []) { aborted(); acceptCustom(rule.validate(snapshot), rule.id); }
  }
  const errors = result.issues.filter(i => i.severity === 'error');
  const global = !mapped.valid || errors.some(i => i.row === undefined);
  const invalid = new Set(errors.flatMap(i => i.row === undefined ? [] : [i.row]));
  result.invalidRows = original.rows.map((_, i) => i + 1).filter(i => global || invalid.has(i));
  result.validRows = original.rows.map((_, i) => i + 1).filter(i => !global && !invalid.has(i));
  const accepted = global || errors.length && options.mode !== 'valid-rows' ? [] : result.validRows;
  result.rows = accepted.map(i => ({ ...result.processedRows[i - 1] })); result.sources = accepted.map(i => ({ ...rowSources[i - 1] }));
  result.valid = !errors.length;
  result.status = result.valid ? 'ready' : accepted.length ? 'partial' : 'invalid';
  result.summary = { total: original.rows.length, accepted: accepted.length, errors: errors.length, warnings: result.issues.length - errors.length };
  progress('complete', original.rows.length); return result;
}
export interface ImportFileOptions extends Omit<ImportOptions, 'format'> { format: 'csv' | 'excel'; csv?: CsvByteReadOptions; excel?: ExcelReadOptions; sheet?: string }
/** Read one explicit file format and import one table. Multiple Excel sheets require an explicit selection. */
export async function importFile(input: string | ArrayBuffer | Uint8Array, schema: ImportSchema, options: ImportFileOptions): Promise<ImportResult> {
  assertRecord(options, 'options'); if (options.signal?.aborted) fail('ABORTED', 'Import cancelled.');
  let table: TableData;
  if (options.format === 'csv') {
    const { readCsv, readCsvBytes } = await import('./csv.js');
    table = typeof input === 'string' ? readCsv(input, options.csv) : readCsvBytes(input, options.csv);
  } else if (options.format === 'excel') {
    if (typeof input === 'string') fail('INVALID_DATA', 'Excel imports require bytes.');
    const { readExcel } = await import('./excel.js');
    const tables = await readExcel(input, { ...options.excel, ...(options.sheet === undefined ? {} : { sheets: [options.sheet] }) });
    if (tables.length !== 1) fail('INVALID_OPTIONS', 'Select one Excel worksheet with sheet or excel.sheets.');
    table = tables[0];
  } else fail('INVALID_OPTIONS', 'Choose format csv or excel.');
  return prepareImport(table, schema, options);
}
