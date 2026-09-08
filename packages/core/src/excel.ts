import type { Cell, Row, TableData, TableReadOptions, DiffResult } from './types.js';
import { matrixToTable, readLimits, columnNames } from './table.js';
export type { TableData } from './types.js';
export type ExcelInput = ArrayBuffer | Uint8Array;
export interface ExcelReadOptions extends TableReadOptions { sheets?: string[]; values?: 'display' | 'raw'; maxBytes?: number }
/** Local, in-memory workbook reading. No filesystem or network access. */
export async function readExcel(input: ExcelInput, options: ExcelReadOptions = {}): Promise<TableData[]> {
  const { headerRow, maxRows, maxColumns } = readLimits(options);
  const maxBytes = options.maxBytes ?? 20 * 1024 * 1024;
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error('maxBytes must be a positive integer.');
  if (input.byteLength > maxBytes) throw new Error(`File size limit exceeded (${maxBytes} bytes).`);
  if (options.values && !['display', 'raw'].includes(options.values)) throw new Error('values must be display or raw.');
  if (options.sheets && (!options.sheets.length || new Set(options.sheets).size !== options.sheets.length)) throw new Error('Select distinct worksheet names.');
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(input instanceof Uint8Array ? input : new Uint8Array(input), { type: 'array', cellDates: false, sheetRows: headerRow + maxRows + 1, ...(options.sheets ? { sheets: options.sheets } : {}) });
  const names = options.sheets ?? workbook.SheetNames;
  const output: TableData[] = [];
  for (const name of names) {
    if (!workbook.SheetNames.includes(name)) throw new Error(`Worksheet not found: ${name}`);
    const sheet = workbook.Sheets[name];
    if (!sheet || !sheet['!ref']) { if (options.sheets) throw new Error(`Worksheet is empty: ${name}`); continue; }
    const range = XLSX.utils.decode_range(sheet['!fullref'] ?? sheet['!ref']);
    if (range.e.r + 1 - headerRow > maxRows) throw new Error(`Worksheet ${name} exceeds ${maxRows} physical data rows.`);
    if (range.e.c + 1 > maxColumns) throw new Error(`Worksheet ${name} exceeds ${maxColumns} columns.`);
    const matrix = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, raw: options.values === 'raw', defval: null, blankrows: true, range: 0 });
    output.push(matrixToTable(matrix, name, options));
  }
  if (!output.length) throw new Error('Workbook has no readable worksheets.');
  return output;
}
export interface ExcelSheet { name: string; rows: readonly Row[]; columns?: string[] }
function validateSheets(sheets: readonly ExcelSheet[]) {
  if (!sheets.length) throw new Error('Provide at least one worksheet.');
  const seen = new Set<string>();
  for (const sheet of sheets) {
    if (!sheet.name || sheet.name.length > 31 || /[\\/*?:\[\]\x00-\x1f]/.test(sheet.name) || /^'|'$/.test(sheet.name)) throw new Error(`Invalid worksheet name: ${sheet.name}`);
    const folded = sheet.name.toLowerCase();
    if (seen.has(folded)) throw new Error('Worksheet names must be unique (case-insensitive).');
    seen.add(folded);
    const columns = sheet.columns ?? columnNames(sheet.rows);
    if (!columns.length || columns.some(c => !c) || new Set(columns).size !== columns.length) throw new Error('Provide nonempty, unique columns, including for empty sheets.');
    if (columns.length > 16_384 || sheet.rows.length > 1_048_575) throw new Error('Excel worksheet dimensions exceeded.');
    for (const row of sheet.rows) for (const column of columns) {
      const value = Object.hasOwn(row, column) ? row[column] : null;
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`Nonfinite number in ${sheet.name}.${column}.`);
      if (value != null && !['string', 'number', 'boolean'].includes(typeof value)) throw new Error('Excel cells must contain primitive values.');
      if (typeof value === 'string' && value.length > 32_767) throw new Error('Excel cell text exceeds 32,767 characters.');
    }
  }
}
/** Write data as literal values, never formulas. Returns XLSX bytes in browser and Node. */
export async function writeExcel(sheets: readonly ExcelSheet[]): Promise<Uint8Array> {
  validateSheets(sheets);
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
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
  if (ids.length > 16_384) throw new Error('Excel report column limit exceeded.');
  const XLSX = await import('xlsx');
  const { unzipSync, zipSync, strFromU8, strToU8 } = await import('fflate');
  const workbook = XLSX.utils.book_new();
  const summary = XLSX.utils.aoa_to_sheet([['Status', 'Count'], ...(['added', 'removed', 'changed', 'unchanged'] as const).map(status => [status, result.summary[status]])]);
  XLSX.utils.book_append_sheet(workbook, summary, 'Summary');
  const highlights: Map<string, number>[] = [new Map(['A1', 'B1'].map(cell => [cell, 0]))];
  for (const [kind, status] of (['added', 'removed', 'changed'] as const).entries()) {
    const selected = result.rows.filter(row => row.status === status);
    if (selected.length > 1_048_575) throw new Error('Excel report row limit exceeded.');
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
    if (!match) throw new Error(`Report style section missing: ${section}`);
    const count = Number(match[1].match(/count="(\d+)"/)?.[1]);
    if (!Number.isSafeInteger(count)) throw new Error('Invalid generated report styles.');
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
