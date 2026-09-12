# SheetDelta

An Excel and CSV data toolkit for TypeScript and JavaScript: read, validate, clean, compare, merge and export useful reports. **One npm package, focused imports.**

**English** · [简体中文](https://github.com/yyyz1011/sheetdelta/blob/master/README.zh-CN.md)

[Documentation](https://sheetdelta.nimokit.com/docs/) · [中文文档](https://sheetdelta.nimokit.com/docs/zh/) · [Browser tool](https://sheetdelta.nimokit.com/playground/) · [npm](https://www.npmjs.com/package/sheetdelta-core) · [Releases](https://github.com/yyyz1011/sheetdelta/releases)

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

## Import and repair

Header aliases and explicit mapping, required-column checks, row/table business rules, strict or valid-row output, source tracing, and highlighted error workbooks. Save versioned JSON import templates, map business dictionaries, and run asynchronous batch validators with bounded concurrency, timeouts and cancellation.

[Reusable import tutorial](https://sheetdelta.nimokit.com/docs/reusable-imports.html)

[Import tutorial](https://sheetdelta.nimokit.com/docs/import-workflow.html) · [Every API with executable examples](https://sheetdelta.nimokit.com/docs/api/all.html) · [Type reference](https://sheetdelta.nimokit.com/docs/api/types.html)

## Workbook and streaming workflows

- **Formula calculation**: cross-sheet dependencies, conditions, aggregates and exact VLOOKUP/XLOOKUP/INDEX/MATCH; unsupported formulas return explicit errors.
- **Template-preserving edits**: patch XLSX/XLSM cells while retaining untouched styles, charts, comments, validation and VBA contents. Macros are never executed.
- **Incremental I/O**: CSV reading/writing, XLSX writing, Node local-file XLSX reading, and sorted-stream comparison.
- **Cross-application evidence**: actual LibreOffice recalculation, Apache POI fixtures with Excel application metadata, and a million-row incremental write/read benchmark.

[Formula reference](https://sheetdelta.nimokit.com/docs/formulas.html) · [Workbook editing](https://sheetdelta.nimokit.com/docs/workbooks.html) · [Streaming](https://sheetdelta.nimokit.com/docs/streaming.html)


## Reliability and larger jobs

- **Async comparison**: `compareTablesAsync` supports progress and `AbortSignal` cancellation. `includeUnchanged: false` reduces retained results while preserving complete counts.
- **Explicit import policies**: hidden sheets, cached-formula warnings, merged cells and error cells; original row positions and 1904 date-system metadata.
- **CSV bytes**: `readCsvBytes` accepts explicit UTF-8, GB18030 and other runtime-supported encodings, rejecting malformed bytes.
- **Structured errors**: `sheetdelta-core/errors` exports `SheetDeltaError` and `isSheetDeltaError`, with codes and source context.
- **Workbook budgets**: 100,000 physical data rows and 1,000,000 rectangular cells by default, configurable in addition to per-sheet and byte limits.

See [async & Worker examples](https://sheetdelta.nimokit.com/docs/async.html), [error codes](https://sheetdelta.nimokit.com/docs/errors.html), and [compatibility & performance evidence](https://sheetdelta.nimokit.com/docs/compatibility.html). **Upgrade note:** Excel error cells are now rejected by default; choose `cellErrors: 'text'` to keep literal error text. See [migration notes](https://sheetdelta.nimokit.com/docs/migration.html).


## Features and imports

| Import | Features |
| --- | --- |
| `sheetdelta-core/compare` | Key-based comparison, composite keys, field mapping, inferred columns, ignored columns, schema changes, opt-in strict types and numeric tolerance |
| `sheetdelta-core/csv` | CSV reading, general CSV writing, difference reports, formula-like text escaping |
| `sheetdelta-core/excel` | XLSX/XLS reading, worksheet/header selection, displayed or raw values, XLSX writing and highlighted difference reports |
| `sheetdelta-core/validate` | Required fields, types, unique values, ranges, enums, patterns and real ISO calendar dates |
| `sheetdelta-core/clean` | Explicit text/type normalization, auditable changes, deduplication with source row positions |
| `sheetdelta-core/merge` | Left/inner/full joins with conflict reporting; strict or union-schema vertical append |
| `sheetdelta-core/import` | Header mapping, cleaning, business validation, partial acceptance and source tracing |
| `sheetdelta-core/import-report` | Editable XLSX error reports with cell highlights and source details |
| `sheetdelta-core/session` | Persistent browser Worker sessions for worksheet preview, visual mapping, batch repair and deferred full-result transfer |
| `sheetdelta-core/errors` | Structured error codes, context and serialization |
| `sheetdelta-core/formula` | `calculateWorkbook` |
| `sheetdelta-core/workbook` | `patchWorkbook`, `recalculateExcel` |
| `sheetdelta-core/stream` | `readCsvStream`, `writeCsvStream`, `compareSortedStreams`, `compareStreamKeys` |
| `sheetdelta-core/excel-stream` | `writeExcelStream` |
| `sheetdelta-core/excel-node` | `readExcelStream` (Node only) |
| `sheetdelta-core/types` | Shared TypeScript types |

Existing `import { compareTables, exportDiffCsv } from 'sheetdelta-core'` remains supported. The root and `/compare` load no third-party runtime code. The installation includes file-format dependencies; production bundlers only include modules reachable from your imports. Excel dependencies are loaded on demand. See [selective imports](https://sheetdelta.nimokit.com/docs/imports.html).

## Data guarantees and limits

- Local processing: no uploads, telemetry or advertising inside the npm library.
- Comparison preserves previous text-equality defaults; strict value handling is opt-in. Missing and duplicate keys are rejected.
- Merge and deduplication use type-sensitive keys; numeric `1` differs from string `'1'`.
- Cleaning reports changes and conversion failures. Merge conflicts throw by default rather than silently overwrite data.
- Excel reading defaults to displayed text; raw mode keeps primitive values and numeric date serials. Formula results are cached values, never recalculated.
- Default Excel read limits: 20 MiB, 50,000 physical data rows per sheet, 1,000 columns. Limits are configurable and exceeding them throws.
- Array APIs and workbook patching work in memory. Dedicated stream APIs process incrementally; Node XLSX reading caches shared strings within a configurable bound. Formula support is the documented subset; no macro execution or formatting comparison.
- Decimal arithmetic uses JavaScript numbers; use normalized text for exact decimals. IDs already damaged by source spreadsheet conversion cannot be reconstructed.

ESM; Node.js 18+ or modern browsers with `structuredClone`. Type declarations are included. Read the [complete workflow](https://sheetdelta.nimokit.com/docs/workflow.html), [API reference](https://sheetdelta.nimokit.com/docs/api/all.html), and [migration notes](https://sheetdelta.nimokit.com/docs/migration.html).

## Browser tool

The separate browser tool compares CSV, TSV, XLSX and XLS locally, with visual differences, saved mapping rules and CSV export. Its current interface is Chinese and selects one key column. The npm API supports composite keys and the additional toolkit modules above. The tool limits remain 10 MB per file, 50,000 total workbook rows and 100 columns. There are no remote analytics or third-party ads.

## License

MIT. Runtime dependencies retain their own licenses. External Apache POI fixtures are test-only and excluded from npm.

## Worker imports and framework examples

Import `runImportWorker` and `installImportWorker` from `sheetdelta-core/worker` for cancellable CSV/Excel imports and optional repair workbooks in a dedicated browser worker. React and Vue remain optional application dependencies. [Setup and limits](https://sheetdelta.nimokit.com/docs/worker-imports) · [Live React/Vue examples](https://sheetdelta.nimokit.com/examples/).

## Repair imports and performance

`repairImport` from `sheetdelta-core/import` applies source-cell edits without reparsing the file and reruns all validation. Try in-page correction in the React/Vue examples. [Usage and reproducible performance measurements](https://sheetdelta.nimokit.com/docs/import-repair). Run `npm run bench:import` in this repository for the parsed-table benchmark.

## Worker repair and lazy reports

Use `runRepairWorker` and `runReportWorker` from `sheetdelta-core/worker` to move correction and XLSX report generation off the calling thread. React/Vue examples support click-to-repair, report generation on download, and report caching until the next successful edit. [Guide](https://sheetdelta.nimokit.com/docs/worker-imports).

## Persistent import workbench

Use `createImportSession` from `sheetdelta-core/session` for interactive imports. A CSV or Excel file is parsed once in a persistent Worker; the page receives bounded worksheet previews, maps unfamiliar headers, queues multiple source-cell repairs, generates a report only when requested, and collects full accepted rows only at delivery. [Complete guide](https://sheetdelta.nimokit.com/docs/import-sessions) · [React/Vue workbench](https://sheetdelta.nimokit.com/examples/).
