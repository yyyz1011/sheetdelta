# SheetDelta

An Excel and CSV data toolkit for TypeScript and JavaScript: read, validate, clean, compare, merge and export useful reports. **One npm package, focused imports.**

**English** · [简体中文](README.zh-CN.md)

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

## Import and repair

Header aliases and explicit mapping, required-column checks, row/table business rules, strict or valid-row output, source tracing, and highlighted error workbooks.

[Import tutorial](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/import-workflow.html) · [Every API with executable examples](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/api/all.html) · [Type reference](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/api/types.html)

## Workbook and streaming workflows

- **Formula calculation**: cross-sheet dependencies, conditions, aggregates and exact VLOOKUP/XLOOKUP/INDEX/MATCH; unsupported formulas return explicit errors.
- **Template-preserving edits**: patch XLSX/XLSM cells while retaining untouched styles, charts, comments, validation and VBA contents. Macros are never executed.
- **Incremental I/O**: CSV reading/writing, XLSX writing, Node local-file XLSX reading, and sorted-stream comparison.
- **Cross-application evidence**: actual LibreOffice recalculation, Apache POI fixtures with Excel application metadata, and a million-row incremental write/read benchmark.

[Formula reference](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/formulas.html) · [Workbook editing](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/workbooks.html) · [Streaming](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/streaming.html)


## Reliability and larger jobs

- **Async comparison**: `compareTablesAsync` supports progress and `AbortSignal` cancellation. `includeUnchanged: false` reduces retained results while preserving complete counts.
- **Explicit import policies**: hidden sheets, cached-formula warnings, merged cells and error cells; original row positions and 1904 date-system metadata.
- **CSV bytes**: `readCsvBytes` accepts explicit UTF-8, GB18030 and other runtime-supported encodings, rejecting malformed bytes.
- **Structured errors**: `sheetdelta-core/errors` exports `SheetDeltaError` and `isSheetDeltaError`, with codes and source context.
- **Workbook budgets**: 100,000 physical data rows and 1,000,000 rectangular cells by default, configurable in addition to per-sheet and byte limits.

See [async & Worker examples](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/async.html), [error codes](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/errors.html), and [compatibility & performance evidence](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/compatibility.html). **Upgrade note:** Excel error cells are now rejected by default; choose `cellErrors: 'text'` to keep literal error text. See [migration notes](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/migration.html).


## Features and imports

| Import | Features |
| --- | --- |
| `sheetdelta-core/compare` | Key-based comparison, composite keys, field mapping, inferred columns, ignored columns, schema changes, opt-in strict types and numeric tolerance |
| `sheetdelta-core/csv` | CSV reading, general CSV writing, difference reports, formula-like text escaping |
| `sheetdelta-core/excel` | XLSX/XLS reading, worksheet/header selection, displayed or raw values, XLSX writing and highlighted difference reports |
| `sheetdelta-core/validate` | Required fields, types, unique values, ranges, enums, patterns and real ISO calendar dates |
| `sheetdelta-core/clean` | Explicit text/type normalization, auditable changes, deduplication with source row positions |
| `sheetdelta-core/merge` | Left/inner/full joins with conflict reporting; strict or union-schema vertical append |
| `sheetdelta-core/errors` | Structured error codes, context and serialization |
| `sheetdelta-core/formula` | `calculateWorkbook` |
| `sheetdelta-core/workbook` | `patchWorkbook`, `recalculateExcel` |
| `sheetdelta-core/stream` | `readCsvStream`, `writeCsvStream`, `compareSortedStreams`, `compareStreamKeys` |
| `sheetdelta-core/excel-stream` | `writeExcelStream` |
| `sheetdelta-core/excel-node` | `readExcelStream` (Node only) |
| `sheetdelta-core/types` | Shared TypeScript types |

Existing `import { compareTables, exportDiffCsv } from 'sheetdelta-core'` remains supported. The root and `/compare` load no third-party runtime code. The installation includes file-format dependencies; production bundlers only include modules reachable from your imports. Excel dependencies are loaded on demand. See [selective imports](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/imports.html).

## Data guarantees and limits

- Local processing: no uploads, telemetry or advertising inside the npm library.
- Comparison preserves previous text-equality defaults; strict value handling is opt-in. Missing and duplicate keys are rejected.
- Merge and deduplication use type-sensitive keys; numeric `1` differs from string `'1'`.
- Cleaning reports changes and conversion failures. Merge conflicts throw by default rather than silently overwrite data.
- Excel reading defaults to displayed text; raw mode keeps primitive values and numeric date serials. Formula results are cached values, never recalculated.
- Default Excel read limits: 20 MiB, 50,000 physical data rows per sheet, 1,000 columns. Limits are configurable and exceeding them throws.
- Array APIs and workbook patching work in memory. Dedicated stream APIs process incrementally; Node XLSX reading caches shared strings within a configurable bound. Formula support is the documented subset; no macro execution or formatting comparison.
- Decimal arithmetic uses JavaScript numbers; use normalized text for exact decimals. IDs already damaged by source spreadsheet conversion cannot be reconstructed.

ESM; Node.js 18+ or modern browsers with `structuredClone`. Type declarations are included. Read the [complete workflow](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/workflow.html), [API reference](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/api/all.html), and [migration notes](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/migration.html).

## Browser tool

The separate browser tool compares CSV, TSV, XLSX and XLS locally, with visual differences, saved mapping rules and CSV export. Its current interface is Chinese and selects one key column. The npm API supports composite keys and the additional toolkit modules above. The tool limits remain 10 MB per file, 50,000 total workbook rows and 100 columns. There are no remote analytics or third-party ads.

## Local development

Use Node.js 24.10+ and npm 11.5.1+.

```sh
npm ci
npm run dev          # Browser tool: http://127.0.0.1:5178
npm run docs:dev     # Documentation: http://127.0.0.1:5179/docs/
```

```sh
npm run check        # Unit tests, TypeScript checks, tool build
npm run test:e2e     # Existing browser-tool regression suite
npm run site:build   # Build bilingual docs and browser tool into dist/
npm run site:check   # Validate static routes, locales, and theme defaults
npm run pack:core    # Build the distributable npm tarball in artifacts/
```

Browser tests use Chrome on macOS. On Linux, install Chromium with `npx playwright install --with-deps chromium`, or set `CHROME_PATH`.

## Repository structure

| Path | Purpose |
| --- | --- |
| `packages/core/` | Published TypeScript comparison library |
| `apps/docs/` | VitePress documentation: English and Chinese Markdown |
| `apps/web/` | React browser tool and local file parsing |
| `scripts/` | Package and static-site validation |
| `tests/` | Core, parser, and browser regressions |
| `docs/RELEASING.md` | npm release maintenance |
| `docs/HOSTING.md` | Documentation hosting and update instructions |

## Contributing and releases

Create a branch, open a PR, and squash-merge after required checks pass. Use `fix(core): ...` for patches, `feat(core): ...` for features, and a `BREAKING CHANGE:` body for incompatible changes. Documentation and `web`-scoped changes do not publish a new npm version.

GitHub Actions publishes npm releases from `master` using trusted publishing. Versions and release notes are recorded in Git tags, GitHub Releases, and npm. The development workspace retains its baseline package version. See [release maintenance](docs/RELEASING.md).

For documentation changes, update both the English page and its counterpart under `apps/docs/zh/`. Translation switches keep the current page. Report bugs with a small reproduction that contains no sensitive data.

## License

[MIT](LICENSE). File parsing uses Papa Parse and the official SheetJS 0.20.3 distribution; documentation uses VitePress.
