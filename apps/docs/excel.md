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
