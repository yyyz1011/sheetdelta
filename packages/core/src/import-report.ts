import type { ImportResult } from './import.js';
import { fail } from './errors.js';

/** Export original, editable data plus a source-aware issue ledger and summary. No formula text is executed. */
export async function exportImportReport(result: ImportResult): Promise<Uint8Array> {
  if (!result?.original || !Array.isArray(result.issues)) fail('INVALID_DATA', 'Expected an ImportResult.');
  const { writeExcel } = await import('./excel.js');
  const { unzipSync, zipSync, strFromU8, strToU8 } = await import('fflate');
  const bytes = await writeExcel([
    { name: 'Data', columns: result.original.headers, rows: result.original.rows.map(row => Object.fromEntries(result.original.headers.map(h => [h, Object.hasOwn(row, h) ? row[h] ?? '' : '']))) },
    { name: 'Issues', columns: ['Severity', 'Code', 'Rule', 'Message', 'Data row', 'Field', 'File', 'Sheet', 'Source position', 'Position kind', 'Source column', 'Cell'], rows: result.issues.map(i => ({
      Severity: i.severity, Code: i.code, Rule: i.ruleId ?? '', Message: i.message, 'Data row': i.row ?? null, Field: i.column ?? '', File: i.source?.fileName ?? '', Sheet: i.source?.sheet ?? '',
      'Source position': i.source?.sourceRow ?? null, 'Position kind': i.source?.positionKind ?? '', 'Source column': i.source?.sourceColumn ?? '', Cell: i.source?.cell ?? '',
    })) },
    { name: 'Summary', columns: ['Metric', 'Value'], rows: [
      { Metric: 'Status', Value: result.status }, ...Object.entries(result.summary).map(([Metric, Value]) => ({ Metric, Value })),
      { Metric: 'Data sheet', Value: 'Original values. Correct highlighted cells and reimport Data with the same schema.' },
    ] },
  ]);
  const files = unzipSync(bytes);
  let styles = strFromU8(files['xl/styles.xml']);
  const append = (section: string, children: string[]) => {
    const pattern = new RegExp(`<${section}([^>]*)>([\\s\\S]*?)</${section}>`);
    const match = styles.match(pattern); const base = Number(match?.[1].match(/count="(\d+)"/)?.[1]);
    if (!match || !Number.isSafeInteger(base)) fail('EXPORT_FAILED', 'Generated report style section missing.');
    styles = styles.replace(pattern, () => `<${section}${match[1].replace(/count="\d+"/, `count="${base + children.length}"`)}>${match[2]}${children.join('')}</${section}>`);
    return base;
  };
  const fill = append('fills', ['FFFFCCCC', 'FFFFF3CD'].map(color => `<fill><patternFill patternType="solid"><fgColor rgb="${color}"/><bgColor indexed="64"/></patternFill></fill>`));
  const base = append('cellXfs', [0, 1].map(i => `<xf numFmtId="0" fontId="0" fillId="${fill + i}" borderId="0" xfId="0" applyFill="1"/>`));
  files['xl/styles.xml'] = strToU8(styles);
  const marks = new Map<string, number>();
  const letters = (index: number) => { let out = ''; for (let n = index + 1; n; n = Math.floor((n - 1) / 26)) out = String.fromCharCode(65 + (n - 1) % 26) + out; return out; };
  for (const issue of result.issues) {
    const columns = issue.source?.sourceColumn !== undefined ? [result.original.headers.indexOf(issue.source.sourceColumn)] : result.original.headers.map((_, i) => i);
    for (const column of columns) if (column >= 0) {
      const address = letters(column) + (issue.row === undefined ? 1 : issue.row + 1);
      const style = issue.severity === 'error' ? base : base + 1;
      marks.set(address, Math.min(marks.get(address) ?? style, style));
    }
  }
  files['xl/worksheets/sheet1.xml'] = strToU8(strFromU8(files['xl/worksheets/sheet1.xml']).replace(/<c\b([^>]*\br="([A-Z]+\d+)"[^>]*)>/g, (tag, attrs: string, address: string) => marks.has(address) ? `<c${attrs.replace(/\s+s="\d+"/, '')} s="${marks.get(address)}">` : tag));
  return zipSync(files, { level: 6 });
}
