---
description: Parse an unfamiliar Excel or CSV file once, inspect it, map headers, batch-repair issues and defer full row transfer with a persistent Worker session.
---

# Persistent import workbench

Use `sheetdelta-core/session` when a browser user must inspect an unfamiliar workbook before validating it. One Worker retains the parsed tables for the session. Worksheet previews, mapping, repeated repairs and reports reuse that data; full accepted rows cross to the main thread only when you call `result()`.

[Open the React and Vue workbench](https://sheetdelta.nimokit.com/examples/)

## 1. Install the Worker handler

```ts
// import.worker.ts
/// <reference lib="webworker" />
import { installImportSessionWorker } from 'sheetdelta-core/session';

installImportSessionWorker(self, {
  // Application-owned rowRules, tableRules and batchRules belong here.
});
```

Callbacks cannot be cloned across a Worker boundary. Keep business-rule functions in this module; send declarative fields and built-in rules from the page.

## 2. Open once and inspect

```ts
import { createImportSession } from 'sheetdelta-core/session';

const session = await createImportSession(
  () => new Worker(new URL('./import.worker.ts', import.meta.url), { type: 'module' }),
  file,
  {
    format: file.name.endsWith('.csv') ? 'csv' : 'excel',
    headerRow: 1,
    previewRows: 20,
    fileName: file.name,
  },
);

for (const sheet of session.inspection.sheets) {
  console.log(sheet.name, sheet.headers, sheet.rowCount, sheet.preview);
}
```

`previewRows` defaults to 20 and accepts 1–100. Inspection never returns every row. For paged previews use `session.preview(sheet, { offset, limit })`; `limit` has the same maximum. Changing `headerRow` requires a new session because headers are part of parsing.

## 3. Map and validate

```ts
const state = await session.prepare('Inventory', {
  fields: [
    { key: 'sku', source: 'Product ID', requiredColumn: true, rule: { required: true, unique: true } },
    { key: 'qty', source: 'Stock', clean: { type: 'number' }, rule: { min: 0 } },
  ],
}, { mode: 'valid-rows' });

console.log(state.summary, state.issues, state.preview);
```

The compact state includes counts, mappings, issues, current source values and a bounded processed preview. It intentionally omits the full original, processed and accepted row arrays.

## 4. Batch-repair and deliver

```ts
const repaired = await session.repair([
  { row: 2, column: 'Stock', value: '3' },
  { row: 8, column: 'Enabled', value: 'Yes' },
]);

const reportBytes = await session.report(); // generated only when requested
const final = await session.result();        // full rows transfer here
await submit(final.rows);
session.close();
```

Edit rows are one-based data-row indices and columns are exact source headers. A repair reruns all cleaning and validation against Worker-retained source data. `close()` is idempotent.

## Lifecycle, cancellation and limits

- Only one command may run at a time. A concurrent call rejects with `SESSION_BUSY`.
- Aborting or timing out a command terminates the Worker and closes the session, because synchronous XLSX parsing cannot be interrupted safely in place.
- Calls after closure reject with `SESSION_CLOSED`.
- Per-command timeout defaults to 120 seconds. File, row, column and cell budgets still come from the CSV/Excel reader and import options.
- A session retains parsed workbook data in memory. Close it when the user replaces the file, leaves the page or finishes submission.
- CSV strings and caller-owned byte arrays are copied before transfer. Files are read once, then their owned buffer is transferred.

## Choosing the right API

Use `createImportSession` for an interactive inspect → map → repair → deliver flow. Use [`runImportWorker`](./worker-imports) for a one-shot import. Use [`repairImport`](./import-repair) when parsed data already lives on the calling thread. For very large server-side jobs, use the [streaming APIs](./streaming).

## API reference

[createImportSession](./api/create-import-session) · [installImportSessionWorker](./api/install-import-session-worker) · [All session types](./api/types)
