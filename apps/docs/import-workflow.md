# Import, validate and repair

Use `sheetdelta-core/import` to turn a parsed table or a CSV/Excel file into validated business rows. Use `/import-report` for a downloadable error workbook. These APIs are framework-independent and never write to a database or upload files.

```ts
import { importFile, type ImportSchema } from 'sheetdelta-core/import';
import { exportImportReport } from 'sheetdelta-core/import-report';

const schema: ImportSchema = {
  fields: [
    { key: 'sku', aliases: ['商品编号'], requiredColumn: true, rule: { required: true, unique: true } },
    { key: 'qty', aliases: ['数量'], requiredColumn: true, clean: { trim: true, type: 'number' }, rule: { required: true, min: 0 } },
  ],
};
const result = await importFile('商品编号,数量\n001,-2\n002,3', schema, {
  format: 'csv', fileName: 'stock.csv',
});
console.log(result.status, result.rows.length); // invalid 0
console.log(result.issues[0].source?.sourceRow); // 2 (CSV record)
const report = await exportImportReport(result); // XLSX Uint8Array
console.log(report.byteLength > 0); // true
```

Save `report` with Node `writeFile` or a browser Blob download, following [file-saving recipes](./excel#save-the-output). It contains **Data** (original editable values), **Issues** (errors and exact source positions), and **Summary**. Correct the Data sheet and reimport it with `sheet: 'Data'` and the same schema. Original workbook formatting is not copied into this report.

## Functions

| API | Input and output |
| --- | --- |
| `mapImportHeaders(headers, fields, options?)` | Source headers and field definitions → `{ mappings, issues, unknownColumns, valid }` |
| `prepareImport(table, schema, options?)` | Already parsed `TableData` → `Promise<ImportResult>` |
| `importFile(input, schema, options)` | CSV text/bytes or Excel bytes → `Promise<ImportResult>` |
| `locateImportCell(result, row, field)` | One-based original data-row index + canonical field → source position |
| `exportImportReport(result)` from `/import-report` | Import result → XLSX bytes |

Every API has a [standalone executable example](./api/all) and [complete type declarations](./api/types).

## Define the schema

`fields` is an array of 1–1,000 distinct canonical keys. A field supports:

| Field option | Meaning |
| --- | --- |
| `key` | Canonical output name; must be nonempty and unique |
| `aliases` | Optional alternate source labels; matching trims and ignores case |
| `source` | Explicit **exact** header selection; overrides key/alias matching |
| `requiredColumn` | Require a matching column, even if the file has zero data rows |
| `clean` | Existing [cleanTable rules](./clean) applied before validation |
| `rule` | Existing [validateTable column rules](./validate) applied after cleaning |

`requiredColumn` and `rule.required` are independent. A file can be required to contain a column while its cells remain optional. An absent optional field becomes `null`. Source headers must be unique and nonempty. Two matching headers are ambiguous even if one exactly matches the canonical key: specify `source` to resolve it. One source column cannot populate two fields. No fuzzy matching is performed.

`allowUnknownColumns` defaults to allowing unmapped source columns. Unmapped columns remain in `original`, but are not included in canonical `processedRows` or `rows`. Set it to `false` for a strict source schema. `mapImportHeaders` reports unknown columns separately.

## Custom business rules

`rowRules` and `tableRules` contain unique `id` values and synchronous `validate` functions. Return an array of `{ code, message, severity, column? }`; table rules may additionally specify one-based `row`. Use canonical field names for `column`. A table-level error without a row blocks the entire import, including in partial mode.

```ts
import { importFile, type ImportSchema } from 'sheetdelta-core/import';
const schema: ImportSchema = {
  fields: [
    { key: 'start', rule: { type: 'date', required: true } },
    { key: 'end', rule: { type: 'date', required: true } },
  ],
  rowRules: [{
    id: 'date-order',
    validate: row => typeof row.start === 'string' && typeof row.end === 'string' && row.start > row.end
      ? [{ code: 'date-order', severity: 'error', column: 'end', message: 'End must not precede start.' }]
      : [],
  }],
};
const result = await importFile('start,end\n2026-09-10,2026-09-09', schema, { format: 'csv' });
console.log(result.issues[0].ruleId); // date-order
```

Rules receive frozen shallow snapshots whose values are primitives. They run on every processed row, including rows with earlier conversion/validation issues, so guard types before comparing. Exceptions propagate as programming failures. Promise returns and malformed issue arrays are rejected; asynchronous lookup validation is not part of this release. Callbacks must not perform side effects: strict mode controls returned data, not arbitrary external effects inside callbacks.

## File and execution options

`importFile` requires `format: 'csv' | 'excel'`. A text input means CSV content, never a path or URL. CSV accepts `csv` parser options; Excel accepts `excel` parser options plus `sheet` (which overrides `excel.sheets`). If Excel parsing yields more than one sheet, choose one explicitly. Existing Excel reading defaults to **display text**; select `excel: { values: 'raw' }` when underlying numbers matter. `fileName` is caller-provided metadata, not a verified filename.

`prepareImport` accepts `format: 'table' | 'csv' | 'excel'`, default `'table'`, to describe positions already supplied in `table.rowNumbers`. It does not verify that the caller chose the correct format.

| Shared option | Default | Behavior |
| --- | --- | --- |
| `mode` | `'strict'` | `'valid-rows'` explicitly permits rows without errors |
| `maxRows` | 50,000 | Maximum data rows for preparation |
| `maxCells` | 1,000,000 | `(rows + 1) × max(source columns, canonical fields)` |
| `maxIssues` | 10,000 | Throw `LIMIT_EXCEEDED` instead of returning a truncated issue report |
| `batchSize` | 512 | Clean/custom-row processing yield interval |
| `signal` | none | Cancel cooperatively with `AbortSignal` |
| `onProgress` | none | Receive `{ phase, processed, total }` |

Preparation limits apply **after file parsing**. Parser limits must be configured separately in `csv`/`excel` when changing accepted file sizes. Use XLSX `maxUncompressedBytes` and `maxEntries` for ZIP budgets. All import/report APIs here work in memory; they do not turn ordinary XLSX parsing into streaming.

Progress phases are `map`, `clean`, `validate`, `rules`, `complete`. Counts are local to each phase, not one global percentage. A phase may be skipped for empty input or structural errors. Parsing, built-in table validation and table-rule callbacks are synchronous work between cancellation checks. Use a Worker for long browser tasks. Do not mutate the table, schema or options while a task is running. Errors/cancellation return no partial result; exceptions in progress callbacks propagate.

## Result and source positions

| Result field | Meaning |
| --- | --- |
| `status` | `ready` (no errors), `partial` (some rows accepted despite errors), or `invalid` |
| `valid` | Whether there are no error-severity issues; warnings do not invalidate |
| `rows`, `sources` | Eligible business rows and their source positions in the same order |
| `processedRows` | All mapped/cleaned rows, including invalid values; empty when mapping is structurally invalid |
| `original` | Original parsed values/headers/row numbers, copied before processing |
| `rowSources` | Source locations for every original data row |
| `validRows`, `invalidRows` | One-based positions in `original.rows`; structural/global errors invalidate every row |
| `mappings` | Canonical field → selected source header, including ambiguous candidates |
| `changes` | Clean-value audit with original data-row number and source location |
| `issues` | Built-in/custom/import warning issues with severity, rule ID where present and source location |
| `summary` | `{ total, accepted, errors, warnings }` |

In strict mode, `rows` is empty if any error exists even when `validRows` identifies otherwise valid rows. Consumers should use `rows` for submission and `processedRows` only for inspection. Missing-column errors remain visible for a header-only file. A header-only file with all required columns is valid and returns no data.

For XLSX, `sourceRow` is the original worksheet row and `cell` is an A1 address. For CSV, `sourceRow` is a logical record number; quoted multiline fields do not count as several records. Plain table positions are caller-supplied data positions. Missing source columns have no cell address. Filtering valid output does not renumber `rowSources`; use `sources` for returned rows or `locateImportCell` with an original data index.

When comparing accepted rows, map each `DiffRow.leftIndex/rightIndex` into the corresponding import result's `sources` array. When using `appendTables`, combine its `sources` indices with the relevant import result. No row/column is injected into user data to hold metadata.

## Errors and report behavior

Mapping issue codes: `missing-column`, `ambiguous-column`, `reused-column`, `unknown-column`. Cleaning contributes `conversion`; built-in validation retains its codes; custom rules choose their own codes and carry `ruleId`. Reader warnings are retained as warnings, including missing formula caches. Set stricter [Excel import policies](./excel#import-policies-warnings-and-workbook-budgets) when needed.

Malformed inputs/configuration, parsing failures, resource limits and cancellation throw [structured errors](./errors). Data validation failures return an `ImportResult`. `maxIssues` overflow throws and returns no truncated result.

The report's Data sheet contains original parsed values, not cleaned values or original workbook styling. Errors use red highlights, warnings yellow; errors win when both affect one cell. Row-wide issues mark the row; global/missing-column issues mark headers and remain fully described in Issues. Positions in Issues refer to the original input; Data-sheet rows are compacted and start at row 2. XLSX text is always written literally, including strings beginning with `=`. Sheet labels are stable English names; issue messages may be localized by custom rules.
