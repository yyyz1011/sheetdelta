# Migration & compatibility

The toolkit release adds subpath imports and file-processing modules. Existing root imports, explicit comparison mappings, default text equality, ordering and CSV report behavior remain supported.

```ts
// Existing code remains valid.
import { compareTables, exportDiffCsv } from 'sheetdelta-core';
import type { CompareOptions } from 'sheetdelta-core';
const options: CompareOptions = {
  keys: [{ left: 'id', right: 'id' }],
  columns: [{ left: 'price', right: 'price' }],
};
```

For shorthand keys, inferred columns and ignore lists, use `CompareInputOptions`. `CompareOptions` retains required explicit mappings for existing TypeScript consumers. Result options are always resolved mappings, even when input uses shorthand.

```ts
import type { CompareInputOptions } from 'sheetdelta-core/types';
const options: CompareInputOptions = { keys: ['id'], ignoreColumns: ['updatedAt'] };
```

## Behavior to choose explicitly

- Comparison defaults are unchanged: text normalization equates `10` and `'10'`, and null/undefined/empty string. `valueMode: 'strict'` and `emptyValues: 'distinct'` are opt-in.
- Omit `columns` to compare the common non-key columns. An explicitly empty columns array remains an error.
- Schema changes appear in `result.schema`; they do not change individual row statuses by themselves. Schema is inferred from record keys, so an empty array carries no column schema.
- Merge and deduplication use typed keys and exact field values. They do not inherit comparison normalization.
- Importing Excel is async and defaults to display text. It does not recalculate formulas.

## Packaging

Installation now includes file-format dependencies. The root and `/compare` remain free of runtime third-party imports; new modules use isolated entry points. No CommonJS build is supplied. Use ESM or dynamic import. Internal paths are not exported.

## Scope

The table APIs focus on data processing. Dedicated formula, workbook editing and streaming modules are described below. Formatting comparison, macro execution, fuzzy row matching and many-to-many joins are not provided. The browser tool remains a file-comparison interface; the new validation, cleaning and merge APIs are available to npm consumers and documented here.

When one side is empty, inferred comparison fields come from the populated side so addition/removal reports retain their values.

## 0.3 reliability upgrade

Root imports and the previous `CompareOptions` type remain supported. New APIs include cancellable `compareTablesAsync`, `includeUnchanged`, `readCsvBytes` and the `/errors` entry.

Review these behavior changes: Excel error cells now throw `CELL_ERROR` by default; explicitly select `{ cellErrors: 'text' }` to keep their displayed text. New workbook budgets default to 100,000 physical data rows and 1,000,000 rectangular cells; adjust deliberately for your resource budget. The Excel entry only accepts actual XLSX/XLS bytes; use `/csv` for CSV. Comparison rejects nonfinite numbers and objects outside the `Cell` type instead of implicitly stringifying them.

With `includeUnchanged: false`, `result.rows.length` can be smaller than `summary.total`; use summary fields for complete counts. Existing `TableValidationError.issues` and `MergeConflictError.conflicts` are preserved. Some English error messages have changed; use error codes.

Read [async & Workers](./async), [structured errors](./errors), and [compatibility & performance](./compatibility).

## 0.4 workbook processing upgrade

New entries: `/formula`, `/workbook`, `/stream`, `/excel-stream`, `/excel-node`. This remains one npm package. Existing root imports and 0.3 APIs are unchanged. `/excel-node` is Node-only; use other entries in browser bundles.

Calculation supports the documented subset and reports unsupported formulas explicitly. `patchWorkbook` clears formula caches and requests recalculation on open by default; call `recalculateExcel` or a spreadsheet application before reading calculated results. Sorted-stream comparison requires presorted keys and explicit columns, emits key order, and may encounter an error after emitting earlier records. See [formulas](./formulas), [workbooks](./workbooks), and [streaming](./streaming).
