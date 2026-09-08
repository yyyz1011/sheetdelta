# SheetDelta

An Excel and CSV data toolkit for TypeScript and JavaScript: read, validate, clean, compare, merge and export useful reports. **One npm package, focused imports.**

[Source and 中文 README](https://github.com/yyyz1011/sheetdelta)

[Documentation](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/) · [中文文档](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/zh/) · [Browser tool](https://sheetdelta.snowy-hero-3539.chatgpt.site/playground/) · [npm](https://www.npmjs.com/package/sheetdelta-core) · [Releases](https://github.com/yyyz1011/sheetdelta/releases)

```sh
npm install sheetdelta-core
```

```ts
import { readCsv } from 'sheetdelta-core/csv';
import { compareTables } from 'sheetdelta-core/compare';
import { exportDiffExcel } from 'sheetdelta-core/excel';

const before = readCsv('sku,price\n001,10');
const after = readCsv('sku,price\n001,12');
const result = compareTables(before.rows, after.rows, { keys: ['sku'] });
const report = await exportDiffExcel(result); // XLSX Uint8Array
console.log(result.summary.changed); // 1
```

## Features and imports

| Import | Features |
| --- | --- |
| `sheetdelta-core/compare` | Key-based comparison, composite keys, field mapping, inferred columns, ignored columns, schema changes, opt-in strict types and numeric tolerance |
| `sheetdelta-core/csv` | CSV reading, general CSV writing, difference reports, formula-like text escaping |
| `sheetdelta-core/excel` | XLSX/XLS reading, worksheet/header selection, displayed or raw values, XLSX writing and highlighted difference reports |
| `sheetdelta-core/validate` | Required fields, types, unique values, ranges, enums, patterns and real ISO calendar dates |
| `sheetdelta-core/clean` | Explicit text/type normalization, auditable changes, deduplication with source row positions |
| `sheetdelta-core/merge` | Left/inner/full joins with conflict reporting; strict or union-schema vertical append |
| `sheetdelta-core/types` | Shared TypeScript types |

Existing `import { compareTables, exportDiffCsv } from 'sheetdelta-core'` remains supported. The root and `/compare` load no third-party runtime code. The installation includes file-format dependencies; production bundlers only include modules reachable from your imports. Excel dependencies are loaded on demand. See [selective imports](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/imports.html).

## Data guarantees and limits

- Local processing: no uploads, telemetry or advertising inside the npm library.
- Comparison preserves previous text-equality defaults; strict value handling is opt-in. Missing and duplicate keys are rejected.
- Merge and deduplication use type-sensitive keys; numeric `1` differs from string `'1'`.
- Cleaning reports changes and conversion failures. Merge conflicts throw by default rather than silently overwrite data.
- Excel reading defaults to displayed text; raw mode keeps primitive values and numeric date serials. Formula results are cached values, never recalculated.
- Default Excel read limits: 20 MiB, 50,000 physical data rows per sheet, 1,000 columns. Limits are configurable and exceeding them throws.
- All operations work in memory. Use a browser Worker for large files. This is not a formula engine, formatting comparator, macro editor or constant-memory streaming system.
- Decimal arithmetic uses JavaScript numbers; use normalized text for exact decimals. IDs already damaged by source spreadsheet conversion cannot be reconstructed.

ESM; Node.js 18+ or modern browsers with `structuredClone`. Type declarations are included. Read the [complete workflow](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/workflow.html), [API reference](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/api/compare-tables.html), and [migration notes](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/migration.html).

## Browser tool

The separate browser tool compares CSV, TSV, XLSX and XLS locally, with visual differences, saved mapping rules and CSV export. Its current interface is Chinese and selects one key column. The npm API supports composite keys and the additional toolkit modules above. The tool limits remain 10 MB per file, 50,000 total workbook rows and 100 columns. There are no remote analytics or third-party ads.


## License

MIT. File formats use Papa Parse, SheetJS CE and fflate.
