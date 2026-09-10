# Compatibility & performance

## 0.6 reusable import evidence

- The local suite passes 131 tests, including template validation, dictionary ambiguity, bounded concurrency, deterministic issue order, timeout, cancellation and sibling cleanup.
- New template/dictionary/batch-rule flows pass in Chromium, Firefox and WebKit; 12 browser tests pass in total. These use local lookup callbacks, not certification of an external service.
- The current reference covers 44 runtime APIs, 51 export bindings and 63 types; 88 bilingual API example executions are checked. Existing 0.5 evidence below describes that release.

## What is verified

The repository checks CSV/TSV quoting and BOM handling, XLSX/XLS import paths, XLSX data/report export, typed and composite keys, validation, cleaning, joins, cancellation and package subpath isolation. Tests run against committed source and separately against a packed npm installation.

Independent XLSX fixtures are generated with **openpyxl 3.1.5**. They cover leading-zero and long text IDs, 1900/1904 date systems, booleans, blank physical rows, hidden sheets, merged titles/data cells, error cells and formulas with/without cached results. A GB18030 CSV fixture checks explicit decoding. See the [fixture source and provenance](https://github.com/yyyz1011/sheetdelta/tree/master/tests/fixtures).

These are project-owned synthetic files from an independent producer. They are not a claim that every Excel, WPS or LibreOffice version has been tested. Existing XLS tests and export round trips also use the parsing engine's writer; they are useful regression checks but not independent format certification.

Worker examples are browser-bundled and type-checked. Their message, progress and cancellation flows execute through a Node worker transport adapter. Browser-tool Playwright tests cover the existing tool separately; they do not certify the new worker example on every browser.

## Reproducible comparison benchmark

Run `npm run bench:core` after `npm ci`. The script creates deterministic rows, checks comparison totals and measures both APIs. No spreadsheet parsing, worker transfer, network or XLSX export is included.

One local run: **2026-09-09, Apple M4, macOS arm64, Node 25.9.0**. Each side has five columns; 1% of records change; `includeUnchanged: false`; async batch size is 2048.

| Rows per side | Synchronous | Async | Retained diff rows |
| --- | --- | --- | --- |
| 10,000 | 26 ms | 53 ms | 100 |
| 50,000 | 112 ms | 334 ms | 500 |
| 100,000 | 199 ms | 503 ms | 1,000 |

These single-run measurements describe this fixture and machine, not a service guarantee or comparison with other packages. Async adds scheduling time to permit progress and cancellation. CPU, row width, string lengths, changed fraction and garbage collection affect results substantially. The script also prints heap deltas; these are not peak-memory measurements.

## 0.5 import workflow evidence

- Regression tests cover header mapping, strict and partial acceptance, synchronous business rules, source positions, cancellation, issue limits and repair reports.
- The CSV import, XLSX error report, cell repair and reimport workflow passed in Chromium, Firefox and WebKit. This does not certify every browser version or every UI flow.
- A generated error report was opened and saved by LibreOfficeDev 26.8.0.0.alpha0. Reading it back verified the three worksheets, leading-zero identifier and error ledger. Visual formatting and native Microsoft Excel/WPS application behavior were not verified in this run.
- All 41 public runtime APIs (48 export bindings) have executable English and Chinese examples: 82 example executions. The reference also documents 57 exported types. These checks establish example coverage, not correctness for every possible input.

## Resource and compatibility limits

- Array APIs and template patching retain data in memory. Dedicated streaming APIs process incrementally; shared-string dictionaries and row width still affect memory. Async array comparison itself is not streaming.
- Excel dates in raw mode are serial numbers with date-system metadata. Display mode returns formatted text. No timezone conversion is inferred.
- `readExcel` reads formula caches. The dedicated calculation module supports documented formulas and dependencies; it does not implement the entire Excel function catalog.
- `writeExcel` and streaming export create new data workbooks. `patchWorkbook` preserves untouched package parts for existing templates; encryption and digital signatures are not editable.
- Use realistic, non-sensitive application fixtures before increasing limits. Exact decimal workflows should use normalized strings or a suitable decimal strategy outside this library.

See [import policies](./excel), [async & Workers](./async), and [upgrade behavior changes](./migration).

## 0.4 application and workbook evidence

- The project-owned invoice template is opened and recalculated by **LibreOfficeDev 26.8.0.0.alpha0** (`2c87e51eeaa2b413ff4ae097b2705eea1995d8e5`). Committed XLS and XLSX exports are read in regression tests. Eleven formula results are checked against its caches, allowing numeric rounding differences.
- A patched invoice was reopened in LibreOffice: quantity 4 recalculated the order total to 50 and revenue to 65. Openpyxl independently verified the retained chart, frozen panes, comment and validation after that application roundtrip.
- Apache POI fixtures `WithChart.xlsx`, `SimpleMacro.xlsm`, and `SampleSS.strict.xlsx` carry Microsoft Excel application metadata. Tests patch cells and compare retained chart/VBA/relationship parts byte-for-byte after decompression. Their pinned source and Apache 2.0 attribution are in [tests/fixtures/apache-poi](https://github.com/yyyz1011/sheetdelta/tree/master/tests/fixtures/apache-poi).
- Actual Excel/WPS application versions were not launched for this release. These fixture checks do not certify all workbooks, all formula semantics, visual rendering, chart refresh or macro behavior.

## Streaming XLSX benchmark

Run `npm run bench:stream -- 1000000`. On the same Apple M4 / Node 25.9.0 environment, with five columns and a **128 MiB V8 heap limit**, one run wrote 1,000,000 rows in **7,574 ms** and read/verified every ID and row number in **7,533 ms**. The XLSX file was **26,442,063 bytes**; sampled peak process RSS was **259 MiB** (RSS includes memory outside the V8 heap). Input rows were generated incrementally; file output used a pipeline; rows were consumed without collection.

A 100,000-row run took 616 ms to write and 700 ms to read, with 166 MiB sampled peak RSS. These are local single-run measurements, not fixed memory or timing guarantees. Shared-string-heavy files, very wide rows and slow destinations have different costs. The reader's shared-string bound fails explicitly rather than silently exhausting an unbounded dictionary.

The repository's consumer checks exercise Node 18, 20, 22 and 24 in CI. Browser-target bundles are checked separately, preserving lightweight root imports and excluding the Node-only reader from browser graphs.
