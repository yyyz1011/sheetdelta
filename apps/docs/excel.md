# Excel files & reports

Read XLSX/XLS and write XLSX in Node.js or the browser. All processing stays in your process; these APIs do not upload files.

```ts
import { readExcel, writeExcel, exportDiffExcel } from 'sheetdelta-core/excel';
import { compareTables } from 'sheetdelta-core/compare';

const bytes = await writeExcel([{ name: 'Products', rows: [{ id: '001', price: 12 }] }]);
const [table] = await readExcel(bytes, { values: 'raw' });
const result = compareTables([{ id: '001', price: 10 }], table.rows, { keys: ['id'] });
const report = await exportDiffExcel(result); // Uint8Array containing an XLSX workbook
```

## readExcel(input, options?)

Async. Accepts `ArrayBuffer` or `Uint8Array` (including Node `Buffer`). Returns `TableData[]`: `{ name, headers, rows, rowNumbers }`.

| Option | Default | Meaning |
| --- | --- | --- |
| `sheets` | All nonempty sheets | Exact worksheet names; unknown or explicitly selected empty sheets throw |
| `values` | `'display'` | Displayed text, or `'raw'` for underlying primitive values |
| `headerRow` | `1` | One-based physical worksheet row containing column names |
| `skipEmptyLines` | `true` | Omit completely blank data rows |
| `maxRows` | `50000` | Physical data rows per sheet, including blanks |
| `maxColumns` | `1000` | Maximum worksheet columns |
| `maxBytes` | `20971520` | Maximum input bytes (20 MiB) |

Limits must be positive integers. Limit violations throw rather than return a truncated table. They are resource guardrails, not a sandbox for hostile files. Empty/duplicate headers and values beyond the header are rejected. `rowNumbers` maps output records back to original physical worksheet rows. Headers are trimmed; values are not automatically cleaned.

`display` preserves formatted text such as `001`. `raw` preserves numbers and booleans; Excel dates are numeric serial values, not JavaScript `Date` objects. Formulas are not recalculated: only cached results are read. Missing cells become `null`. Already-lost identifier digits cannot be recovered.

## writeExcel(sheets)

Async; returns `Uint8Array`. Each sheet is `{ name, rows, columns? }`. `columns` sets column order and selection; otherwise the union of row keys is used. Supply columns for empty sheets. Names must be valid Excel worksheet names and unique ignoring case.

Cells support primitive values. Text stays text, including strings beginning with `=`; formulas are never generated. Nonfinite numbers, oversized text and worksheet dimensions are rejected. This creates a new data workbook; it does not preserve source workbook styling, macros, charts or merged-cell semantics.

## exportDiffExcel(result)

Async; returns an XLSX workbook with **Summary**, **Added**, **Removed**, and **Changed** sheets. Header rows are blue; additions green, removals red, and changed before/after cells yellow. Detail sheets include filter controls. Unchanged rows are counted in the summary, not copied into detail sheets.

Row positions in reports are **one-based data indices**, not original Excel row addresses. Use the imported table's `rowNumbers` to locate original rows when headers or blank rows intervene. Column structure changes are available separately in `result.schema`.

## Save the output

Node.js:

```ts
import { writeFile } from 'node:fs/promises';
import { writeExcel } from 'sheetdelta-core/excel';
await writeFile('products.xlsx', await writeExcel([{ name: 'Products', rows: [{ id: '001' }] }]));
```

Browser: create a Blob with the XLSX MIME type and use an object URL for a download. Revoke the URL afterward. The async APIs load dependencies lazily, but parsing/compression is in-memory work; use a Worker for large browser files.

## Import policies, warnings and workbook budgets

| Option | Default | Behavior |
| --- | --- | --- |
| `maxTotalRows` | `100000` | Sum of physical data rows, including blanks, across selected, included sheets |
| `maxCells` | `1000000` | Sum of rectangular cells, including headers and blanks, across included sheets |
| `hiddenSheets` | `'include'` | Read hidden sheets with a warning; `'exclude'` skips them |
| `formulas` | `'cached'` | Read cached results; `'reject'` rejects formula cells |
| `mergedCells` | `'anchor'` | Keep top-left values only; `'reject'` rejects merged ranges |
| `cellErrors` | `'reject'` | Reject errors such as `#DIV/0!`; `'text'` retains their literal text |

Every returned sheet also has `warnings` and `metadata: { date1904, hidden }`. Warning codes are `HIDDEN_SHEET`, `MERGED_CELLS` and `FORMULA_NO_CACHE`; cell-related warnings include source positions. A formula without a cached result becomes `null` with a warning, not a calculated answer. Existing caches may also be stale; the library does not verify their freshness.

Merged ranges are not filled down automatically. Title merges entirely before `headerRow` are ignored. Raw dates remain serial numbers; `date1904` identifies the workbook date system. Import does not convert dates into timezone-aware timestamps.

```ts
import { readExcel } from 'sheetdelta-core/excel';
// bytes contains file bytes
// const tables = await readExcel(bytes, {
//   sheets: ['Products'], hiddenSheets: 'exclude',
//   formulas: 'reject', mergedCells: 'reject', cellErrors: 'reject',
//   maxTotalRows: 50000, maxCells: 500000,
// });
```

Byte limits apply before parsing; dimension and cell budgets apply after the engine reads the workbook and before table conversion. They do not bound ZIP decompression memory. The XLSX/XLS entry rejects ordinary CSV text masquerading as a workbook. See [compatibility evidence](./compatibility) and [migration notes](./migration).
