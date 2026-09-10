# Reusable business imports

Save a supplier's column mapping and layout once, map display labels to business values, and validate records against your own service in batches. All APIs stay in the same npm package: templates and orchestration use `/import`, dictionaries also work directly with `/clean`.

```ts
import {
  serializeImportTemplate, parseImportTemplate, importWithTemplate,
  type ImportTemplate, type ImportBatchRule,
} from 'sheetdelta-core/import';

const template: ImportTemplate = {
  version: 1, id: 'supplier-stock', revision: 1, format: 'csv', headerRow: 1,
  fields: [
    { key: 'sku', source: '商品编号', requiredColumn: true, rule: { required: true } },
    { key: 'active', source: '状态', requiredColumn: true,
      clean: { trim: true, dictionary: { entries: [
        { from: '启用', to: true }, { from: '停用', to: false },
      ] } }, rule: { type: 'boolean' } },
  ],
};
const saved = serializeImportTemplate(template); // Store this JSON in your application.
const restored = parseImportTemplate(saved);

const catalogRule: ImportBatchRule = {
  id: 'catalog-exists',
  async validate(items, { signal }) {
    // Replace the local demo with one request per batch to your own API.
    // Pass signal to fetch; keep credentials in your application, never in the template.
    const keys = [...new Set(items.map(item => String(item.values.sku)))];
    const found = new Set(keys.filter(key => key === '001'));
    if (signal.aborted) return [];
    return items.filter(item => !found.has(String(item.values.sku))).map(item => ({
      row: item.row, column: 'sku', code: 'unknown-sku',
      message: 'SKU does not exist.', severity: 'error' as const,
    }));
  },
};
const result = await importWithTemplate('商品编号,状态\n001,启用\n999,停用', restored, {
  mode: 'valid-rows', batchRules: [catalogRule],
  batchValidation: { batchSize: 100, concurrency: 2, timeoutMs: 10_000 },
});
console.log(result.status, result.rows.length); // partial 1
console.log(result.rows[0].active); // true
```

The library never automatically uploads a file or connects to a database. Only the callback you provide can make a request. Its results feed the same source-aware issues and [editable error workbook](./import-workflow) as built-in validation.

## Template contract

| Property | Meaning |
| --- | --- |
| `version` | Configuration format, currently exactly `1`; unknown versions fail |
| `id`, `revision` | Nonempty application-defined identifier and positive integer revision; your application selects/stores revisions |
| `format` | Explicit `csv` or `excel`; no extension guessing |
| `headerRow` | One-based source header row; default `1` |
| `sheet`, `values` | Excel-only sheet selection and `display`/`raw` value policy |
| `delimiter`, `encoding` | CSV-only delimiter and explicit byte encoding; encoding does not reinterpret string input |
| `fields`, `allowUnknownColumns` | The existing import field definitions and unmapped-column policy |

Serialization/parsing validates the whole supported configuration. Unknown properties, invalid dictionaries, functions, undefined values, non-JSON objects, cycles and non-finite numbers fail instead of being silently lost. Limits are 1 MiB of UTF-8 JSON and 32 nested levels. Built-in `rule.pattern` is a regex **string**, not a RegExp object. Review patterns from untrusted sources: syntactic validation is not a regex execution-time sandbox.

Templates contain no file data or executable callbacks. Attach `rowRules`, `tableRules` and `batchRules` through the third argument of `importWithTemplate`. No strings are evaluated as code. Existing `/import` APIs still accept schemas directly.

A saved explicit `source` that disappears is reported as `missing-column`; it is not replaced by another column. Bump your application-owned `revision` when a supplier format changes. There is no automatic migration, template database or credential storage. `serializeImportTemplate` returns JSON; `parseImportTemplate` returns a detached validated object; `importWithTemplate` returns `Promise<ImportResult>`.

## Dictionary conversion

Use `clean.dictionary.entries: [{ from, to }]`. Inputs are matched **by type and literal value**: numeric `1` and text `'1'` differ; numeric `0` and `-0` are the same key. Entries may contain finite numbers, strings, booleans or `null`. Duplicate `from` values are configuration errors, even when their outputs agree.

Order: trim/case → empty replacement → dictionary → explicit type conversion → validation. Normalize configured labels yourself to match the chosen trim/case policy. Unknown values produce a `dictionary` issue and leave that cell's original value unchanged; `unknown: 'keep'` explicitly keeps the unmatched value after preceding normalization and continues type conversion. Empty values are also dictionary inputs: add an explicit empty/null entry or choose the keep policy when appropriate.

Successful changes retain before/after values and source positions. Original input is never mutated. `cleanTable` returns cleaning issues; the import workflow turns them into error-severity issues that participate in strict/partial acceptance.

## Async batch rules

`ImportSchema.batchRules` also works with `prepareImport` and `importFile`. Rule IDs must be unique across all three rule lists. Each rule receives a frozen array of `{ row, values }` and `{ signal }`. `row` is the global, one-based **data-row index**, not an offset within the batch or an Excel physical row. Return issue arrays with canonical columns; issues with a row must refer to that batch. Omit `row` only for a global issue, which blocks all rows when severity is `error`.

Rules run after built-in and synchronous rules, on all processed rows, including those already invalid; guard types in service calls. No batch callbacks run after a structural mapping failure or on empty input. A normal validation finding is an issue; thrown/rejected service failures are exceptions, not a successful or partial import.

| `batchValidation` option | Default | Limit |
| --- | --- | --- |
| `batchSize` | 100 rows | 1–10,000 |
| `concurrency` | 4 callbacks | 1–32 |
| `timeoutMs` | 30,000 per callback | 1–2,147,483,647 |

Rules run sequentially; batches within each bounded window run concurrently. Results are consumed in input order, even when callbacks finish out of order. `maxIssues` still bounds the accumulated report. `batch-rules` progress counts rows per rule and restarts for the next rule. There is no retry, requests-per-second throttling, cross-batch cache or automatic row deduplication; the example deduplicates lookup keys within each request while retaining every row's result.

Timeout rejects with `VALIDATION_TIMEOUT`; callback errors are wrapped as `VALIDATION_FAILED` with `cause` and rule ID in `context.operation`. Existing `SheetDeltaError` instances retain their codes. Caller cancellation rejects with `ABORTED`; sibling signals abort on failure, and callback signals also abort on completion for cleanup. Timers/listeners are cleaned up. A callback must honor its signal to stop its underlying network work. Cancellation cannot undo remote side effects, and a synchronous CPU loop cannot be interrupted by these timers. Use read-only lookups and a Worker for CPU-heavy tasks.

## Limits and migration

This release adds opt-in settings; existing imports, root exports, strict defaults and synchronous rule behavior remain supported. These helpers do not make Excel parsing streaming or move it off the main thread. The template wrapper uses existing default parser budgets; use `importFile` directly for detailed parser-limit overrides. Preparation limits are still configurable through runtime options.

See [API examples](./api/all), [complete types](./api/types), [error codes](./errors), and [import results](./import-workflow#result-and-source-positions).
