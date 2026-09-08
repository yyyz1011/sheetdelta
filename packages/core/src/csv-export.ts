import type { Cell, DiffResult } from './types.js';
/** UTF-8 CSV with BOM, RFC 4180 quoting, and spreadsheet formula escaping by default. */
export function exportDiffCsv(result: DiffResult, { changesOnly = true, escapeFormulae = true } = {}): string {
  const columns = [...result.options.keys, ...result.options.columns].filter((pair, i, all) => all.findIndex(p => p.left === pair.left && p.right === pair.right) === i);
  const matrix: Cell[][] = [['change_type', 'key', 'old_row', 'new_row', ...columns.flatMap(pair => [`old:${pair.left}`, `new:${pair.right}`])]];
  for (const row of result.rows) {
    if (changesOnly && row.status === 'unchanged') continue;
    matrix.push([row.status, JSON.stringify(row.key), row.leftIndex == null ? '' : row.leftIndex + 2, row.rightIndex == null ? '' : row.rightIndex + 2,
      ...columns.flatMap(pair => [row.before?.[pair.left], row.after?.[pair.right]])]);
  }
  return '\uFEFF' + matrix.map(row => row.map(value => {
    let text = value == null ? '' : String(value);
    if (escapeFormulae && /^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }).join(',')).join('\r\n');
}
