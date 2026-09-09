import { SheetDeltaError, fail, assertRecord, wrapError } from './errors.js';
import type { Cell, Row, TableData, TableReadOptions, DiffResult, ImportWarning } from './types.js';
import { matrixToTable, readLimits, columnNames, assertRows } from './table.js';
export type { TableData, ImportWarning } from './types.js';
export type ExcelInput = ArrayBuffer | Uint8Array;
export interface ExcelReadOptions extends TableReadOptions {
  maxUncompressedBytes?: number; maxEntries?: number;
  sheets?: string[]; values?: 'display' | 'raw'; maxBytes?: number;
  maxTotalRows?: number; maxCells?: number;
  hiddenSheets?: 'include' | 'exclude'; formulas?: 'cached' | 'reject';
  mergedCells?: 'anchor' | 'reject'; cellErrors?: 'reject' | 'text';
}
/** Read actual XLSX/XLS workbooks with explicit data-loss policies. */
export async function readExcel(input: ExcelInput, options: ExcelReadOptions = {}): Promise<TableData[]> {
  assertRecord(options, 'options');
  const { headerRow, maxRows, maxColumns } = readLimits(options);
  const maxUncompressedBytes = options.maxUncompressedBytes ?? 200 * 1024 * 1024, maxEntries = options.maxEntries ?? 10000;
  const maxBytes = options.maxBytes ?? 20 * 1024 * 1024, maxTotalRows = options.maxTotalRows ?? 100_000, maxCells = options.maxCells ?? 1_000_000;
  for (const [option, value] of Object.entries({ maxBytes, maxTotalRows, maxCells, maxUncompressedBytes, maxEntries })) if (!Number.isSafeInteger(value) || value < 1) fail('INVALID_OPTIONS', `${option} must be a positive integer.`, { option });
  if (!(input instanceof ArrayBuffer) && !(input instanceof Uint8Array)) fail('INVALID_DATA', 'Workbook input must be an ArrayBuffer or Uint8Array.');
  if (input.byteLength > maxBytes) fail('LIMIT_EXCEEDED', `File size limit exceeded (${maxBytes} bytes).`, { limit: maxBytes, actual: input.byteLength });
  for (const [key, allowed] of Object.entries({ values: ['display', 'raw'], hiddenSheets: ['include', 'exclude'], formulas: ['cached', 'reject'], mergedCells: ['anchor', 'reject'], cellErrors: ['reject', 'text'] })) {
    const value = options[key as keyof ExcelReadOptions];
    if (value != null && !allowed.includes(value as string)) fail('INVALID_OPTIONS', `Invalid ${key}.`, { option: key });
  }
  if (options.sheets && (!Array.isArray(options.sheets) || !options.sheets.length || options.sheets.some(s => typeof s !== 'string' || !s) || new Set(options.sheets).size !== options.sheets.length)) fail('INVALID_OPTIONS', 'Select distinct worksheet names.');
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const zip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 3 && bytes[3] === 4;
  const cfb = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1].every((v, i) => bytes[i] === v);
  if (!zip && !cfb) fail('INVALID_WORKBOOK', 'Expected an XLSX or XLS workbook, not CSV or arbitrary text.', { operation: 'readExcel' });
  if (zip) { const { readZipBudget } = await import('./zip-budget.js'); readZipBudget(bytes, maxUncompressedBytes, maxEntries); }
  const XLSX = await import('xlsx');
  let workbook: ReturnType<typeof XLSX.read>;
  try { workbook = XLSX.read(bytes, { type: 'array', cellDates: false, sheetStubs: true, sheetRows: headerRow + maxRows + 1, ...(options.sheets ? { sheets: options.sheets } : {}) }); }
  catch (error) { wrapError(error, 'INVALID_WORKBOOK', 'Unable to parse workbook. It may be damaged or encrypted.', { operation: 'readExcel' }); }
  const names = options.sheets ?? workbook.SheetNames;
  const output: TableData[] = []; let totalRows = 0, totalCells = 0;
  for (const name of names) {
    if (!workbook.SheetNames.includes(name)) fail('SHEET_NOT_FOUND', `Worksheet not found: ${name}`, { sheet: name });
    const hidden = Boolean(workbook.Workbook?.Sheets?.find(sheet => sheet.name === name)?.Hidden);
    if (hidden && options.hiddenSheets === 'exclude') continue;
    const sheet = workbook.Sheets[name];
    if (!sheet || !sheet['!ref']) { if (options.sheets) fail('EMPTY_WORKBOOK', `Worksheet is empty: ${name}`, { sheet: name }); continue; }
    const range = XLSX.utils.decode_range(sheet['!fullref'] ?? sheet['!ref']);
    const physicalRows = Math.max(0, range.e.r + 1 - headerRow);
    if (physicalRows > maxRows) fail('LIMIT_EXCEEDED', `Worksheet ${name} exceeds ${maxRows} physical data rows.`, { sheet: name, limit: maxRows, actual: physicalRows });
    if (range.e.c + 1 > maxColumns) fail('LIMIT_EXCEEDED', `Worksheet ${name} exceeds ${maxColumns} columns.`, { sheet: name, limit: maxColumns, actual: range.e.c + 1 });
    totalRows += physicalRows; totalCells += (physicalRows + 1) * (range.e.c + 1);
    if (totalRows > maxTotalRows) fail('LIMIT_EXCEEDED', 'Workbook total row limit exceeded.', { sheet: name, limit: maxTotalRows, actual: totalRows });
    if (totalCells > maxCells) fail('LIMIT_EXCEEDED', 'Workbook rectangular cell limit exceeded.', { sheet: name, limit: maxCells, actual: totalCells });
    const warnings: ImportWarning[] = [];
    if (hidden) warnings.push({ code: 'HIDDEN_SHEET', sheet: name, message: 'This worksheet is hidden.' });
    for (const merge of sheet['!merges'] ?? []) if (merge.e.r >= headerRow - 1) {
      const cell = XLSX.utils.encode_range(merge), context = { sheet: name, row: merge.s.r + 1, column: XLSX.utils.encode_col(merge.s.c), cell };
      if (options.mergedCells === 'reject') fail('MERGED_CELLS', 'Merged cells require an explicit anchor-value workflow.', context);
      warnings.push({ code: 'MERGED_CELLS', ...context, message: 'Only the top-left value of merged cells is read.' });
    }
    for (const address of Object.keys(sheet)) {
      if (address.startsWith('!')) continue;
      const cell = sheet[address];
      const position = XLSX.utils.decode_cell(address);
      if (position.r < headerRow - 1) continue;
      const context = { sheet: name, row: position.r + 1, column: XLSX.utils.encode_col(position.c), cell: address };
      if (cell.f) {
        if (options.formulas === 'reject') fail('FORMULA_REJECTED', 'Formula cells are disabled by the selected policy.', context);
        if (cell.v == null || cell.t === 'z') warnings.push({ code: 'FORMULA_NO_CACHE', ...context, message: 'Formula has no cached value; recalculate in a spreadsheet application before importing.' });
      }
      if (cell.t === 'e') {
        if (options.cellErrors !== 'text') fail('CELL_ERROR', `Workbook contains ${XLSX.utils.format_cell(cell)}.`, context);
        sheet[address] = { t: 's', v: XLSX.utils.format_cell(cell) || '#ERROR!' };
      }
    }
    const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: options.values === 'raw', defval: null, blankrows: true, range: headerRow - 1 });
    const table = matrixToTable(matrix, name, { ...options, headerRow: 1 }, headerRow - 1);
    table.warnings = warnings;
    table.metadata = { date1904: Boolean(workbook.Workbook?.WBProps?.date1904), hidden };
    output.push(table);
  }
  if (!output.length) fail('EMPTY_WORKBOOK', 'Workbook has no readable worksheets.');
  return output;
}
export interface ExcelSheet { name: string; rows: readonly Row[]; columns?: string[] }
function validateSheets(sheets: readonly ExcelSheet[]) {
  if (!Array.isArray(sheets) || !sheets.length) throw new SheetDeltaError('INVALID_OPTIONS', 'Provide at least one worksheet.');
  const seen = new Set<string>();
  for (const sheet of sheets as readonly ExcelSheet[]) {
    assertRecord(sheet, 'sheet'); assertRows(sheet.rows);
    if (typeof sheet.name !== 'string' || !sheet.name || sheet.name.length > 31 || /[\\/*?:\[\]\x00-\x1f]/.test(sheet.name) || /^'|'$/.test(sheet.name)) throw new SheetDeltaError('INVALID_OPTIONS', `Invalid worksheet name: ${sheet.name}`);
    const folded = sheet.name.toLowerCase();
    if (seen.has(folded)) throw new SheetDeltaError('INVALID_OPTIONS', 'Worksheet names must be unique (case-insensitive).');
    seen.add(folded);
    const columns = sheet.columns ?? columnNames(sheet.rows);
    if (!Array.isArray(columns) || !columns.length || columns.some(c => typeof c !== 'string' || !c) || new Set(columns).size !== columns.length) throw new SheetDeltaError('INVALID_OPTIONS', 'Provide nonempty, unique columns, including for empty sheets.');
    if (columns.length > 16_384 || sheet.rows.length > 1_048_575) throw new SheetDeltaError('LIMIT_EXCEEDED', 'Excel worksheet dimensions exceeded.', { sheet: sheet.name });
    for (const row of sheet.rows) for (const column of columns) {
      const value = Object.hasOwn(row, column) ? row[column] : null;
      if (typeof value === 'number' && !Number.isFinite(value)) throw new SheetDeltaError('INVALID_DATA', `Nonfinite number in ${sheet.name}.${column}.`, { sheet: sheet.name, column });
      if (value != null && !['string', 'number', 'boolean'].includes(typeof value)) throw new SheetDeltaError('INVALID_DATA', 'Excel cells must contain primitive values.', { sheet: sheet.name, column });
      if (typeof value === 'string' && value.length > 32_767) throw new SheetDeltaError('LIMIT_EXCEEDED', 'Excel cell text exceeds 32,767 characters.', { sheet: sheet.name, column, limit: 32767 });
    }
  }
}
/** Write data as literal values, never formulas. Returns XLSX bytes in browser and Node. */
export async function writeExcel(sheets: readonly ExcelSheet[]): Promise<Uint8Array> {
  validateSheets(sheets);
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets as readonly ExcelSheet[]) {
    const columns = sheet.columns ?? columnNames(sheet.rows);
    const matrix = [columns, ...sheet.rows.map(row => columns.map(key => Object.hasOwn(row, key) ? row[key] ?? null : null))];
    const worksheet = XLSX.utils.aoa_to_sheet(matrix);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx', compression: true }));
}
/** Produce an XLSX summary and separate, highlighted Added / Removed / Changed sheets. */
export async function exportDiffExcel(result: DiffResult): Promise<Uint8Array> {
  const mappings = [...result.options.keys, ...result.options.columns].filter((pair, i, all) => all.findIndex(p => p.left === pair.left && p.right === pair.right) === i);
  // Stable internal column IDs prevent collisions with user-supplied column labels.
  const ids = ['key', 'old_data_row', 'new_data_row', ...mappings.flatMap((_, i) => [`old_${i}`, `new_${i}`])];
  const labels = ['Key', 'Old data row', 'New data row', ...mappings.flatMap(pair => [`Old: ${pair.left}`, `New: ${pair.right}`])];
  if (ids.length > 16_384) throw new SheetDeltaError('LIMIT_EXCEEDED', 'Excel report column limit exceeded.');
  const XLSX = await import('xlsx');
  const { unzipSync, zipSync, strFromU8, strToU8 } = await import('fflate');
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet([['Status', 'Count'], ...(['added', 'removed', 'changed', 'unchanged'] as const).map(status => [status, result.summary[status]])]);
  XLSX.utils.book_append_sheet(workbook, summary, 'Summary');
  const highlights: Map<string, number>[] = [new Map(['A1', 'B1'].map(cell => [cell, 0]))];
  for (const [kind, status] of (['added', 'removed', 'changed'] as const).entries()) {
    const selected = result.rows.filter(row => row.status === status);
    if (selected.length > 1_048_575) throw new SheetDeltaError('LIMIT_EXCEEDED', 'Excel report row limit exceeded.');
    const matrix: Cell[][] = [labels];
    const styles = new Map<string, number>(labels.map((_, column) => [XLSX.utils.encode_cell({ r: 0, c: column }), 0]));
    selected.forEach((row, index) => {
      const values = [JSON.stringify(row.key), row.leftIndex == null ? null : row.leftIndex + 1, row.rightIndex == null ? null : row.rightIndex + 1, ...mappings.flatMap(pair => [row.before && Object.hasOwn(row.before, pair.left) ? row.before[pair.left] ?? null : null, row.after && Object.hasOwn(row.after, pair.right) ? row.after[pair.right] ?? null : null])];
      matrix.push(values.map(value => value ?? ''));
      values.forEach((_, column) => {
        const pair = mappings[Math.floor((column - 3) / 2)];
        if (status !== 'changed' || (pair && row.changes.some(change => change.leftColumn === pair.left && change.rightColumn === pair.right))) styles.set(XLSX.utils.encode_cell({ r: index + 1, c: column }), kind + 1);
      });
    });
    const worksheet = XLSX.utils.aoa_to_sheet(matrix);
    worksheet['!cols'] = labels.map(() => ({ wch: 24 }));
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: selected.length, c: labels.length - 1 } }) };
    XLSX.utils.book_append_sheet(workbook, worksheet, status[0].toUpperCase() + status.slice(1));
    highlights.push(styles);
  }
  const files = unzipSync(new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })));
  // Add four cell styles to our own generated workbook; no arbitrary input XML is edited.
  let stylesXml = strFromU8(files['xl/styles.xml']);
  function append(section: string, elements: string[]): number {
    const pattern = new RegExp(`<${section}([^>]*)>([\\s\\S]*?)</${section}>`);
    const match = stylesXml.match(pattern);
    if (!match) throw new SheetDeltaError('EXPORT_FAILED', `Report style section missing: ${section}`);
    const count = Number(match[1].match(/count="(\d+)"/)?.[1]);
    if (!Number.isSafeInteger(count)) throw new SheetDeltaError('EXPORT_FAILED', 'Invalid generated report styles.');
    stylesXml = stylesXml.replace(pattern, () => `<${section}${match[1].replace(/count="\d+"/, `count="${count + elements.length}"`)}>${match[2]}${elements.join('')}</${section}>`);
    return count;
  }
  const font = append('fonts', ['<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>']);
  const fill = append('fills', ['FF2459CC', 'FFE8F5E9', 'FFFFEBEE', 'FFFFF3CD'].map(color => `<fill><patternFill patternType="solid"><fgColor rgb="${color}"/><bgColor indexed="64"/></patternFill></fill>`));
  const base = append('cellXfs', [0, 1, 2, 3].map(i => `<xf numFmtId="0" fontId="${i === 0 ? font : 0}" fillId="${fill + i}" borderId="0" xfId="0" applyFill="1" applyFont="1"/>`));
  files['xl/styles.xml'] = strToU8(stylesXml);
  highlights.forEach((styles, i) => {
    const path = `xl/worksheets/sheet${i + 1}.xml`;
    const xml = strFromU8(files[path]).replace(/<c\b([^>]*\br="([A-Z]+\d+)"[^>]*)>/g, (tag, attributes: string, address: string) => {
      const style = styles.get(address);
      if (style == null) return tag;
      return `<c${attributes.replace(/\s+s="\d+"/, '')} s="${base + style}">`;
    });
    files[path] = strToU8(xml);
  });
  return zipSync(files, { level: 6 });
}
