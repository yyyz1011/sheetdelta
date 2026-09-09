# Compatibility & performance

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

## Practical limits

- All operations retain data in memory. Import byte/dimension budgets do not cap decompression memory, and async comparison is not streaming.
- Excel dates in raw mode are serial numbers with date-system metadata. Display mode returns formatted text. No timezone conversion is inferred.
- Formulas use cached results; no recalculation, dependency graph or stale-cache detection is provided.
- Writing creates new data workbooks. It does not round-trip macros, charts, source styling, encryption or arbitrary workbook objects.
- Use realistic, non-sensitive application fixtures before increasing limits. Exact decimal workflows should use normalized strings or a suitable decimal strategy outside this library.

See [import policies](./excel), [async & Workers](./async), and [upgrade behavior changes](./migration).
