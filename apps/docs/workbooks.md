# Preserve and update workbooks

`patchWorkbook` edits individual cells in an existing OOXML workbook. It keeps unrelated package contents instead of recreating a data-only workbook. `recalculateExcel` writes fresh caches for [supported formulas](./formulas).

```ts
import { writeExcel, readExcel } from 'sheetdelta-core/excel';
import { patchWorkbook, recalculateExcel } from 'sheetdelta-core/workbook';
const template = await writeExcel([{ name: 'Orders', rows: [{ id: '001', qty: 2, total: 0 }] }]);
const changed = await patchWorkbook(template, [
  { sheet: 'Orders', cell: 'B2', value: 4 },
  { sheet: 'Orders', cell: 'C2', formula: '=B2*3' },
]);
const output = await recalculateExcel(changed);
console.log((await readExcel(output, { values: 'raw' }))[0].rows[0].total); // 12
```

## patchWorkbook(bytes, edits, options?)

Async; accepts `ArrayBuffer` or `Uint8Array`, returns new workbook bytes. Input bytes are not changed. Each edit contains exact `sheet`, A1 `cell`, and either `value` or `formula`. Values are finite primitive cells; `null`/undefined clears the value while preserving its style. A string beginning with `=` remains literal text unless placed in `formula`. Optional `cachedValue` is for explicitly supplied formula caches.

Existing cell style attributes, row/column formatting, worksheet controls and untouched ZIP entries are retained. New cells/rows are inserted at their A1 positions, and an existing used-range dimension is expanded. New cells have no inferred style; this API does not shift rows, copy styles or update formulas to account for inserted table rows.

Unmodified ZIP-entry **content bytes** stay identical after decompression. ZIP compression, timestamps and modified worksheet XML serialization can differ. Tests cover charts, VBA payloads, comments, hyperlinks, validation, frozen panes, filters, hidden sheets and Strict OOXML namespaces. VBA bytes are preserved but never executed or edited.

## Formula caches after edits

`recalculateOnOpen` defaults to `true`: existing formula caches are removed across worksheets, and the workbook requests full automatic recalculation when opened by a spreadsheet application. This prevents reading an old cached answer as a new calculation. Chart/pivot cached data is retained and may need application refresh.

To obtain calculated results immediately, call `recalculateExcel` after patching. Setting `recalculateOnOpen: false` explicitly retains other caches; the caller then owns their freshness. Do not use that option when relying on old caches after changing their inputs.

`recalculateExcel(bytes, options?)` recalculates all supported formulas and updates their caches. It fails atomically on an unsupported/error formula, existing Excel error cell, or unsupported formula group. No partially updated bytes are returned. It accepts package limits below and the [formula options](./formulas).

## Guardrails and scope

| Option | Default |
| --- | --- |
| `maxBytes` | 20 MiB compressed input |
| `maxUncompressedBytes` | 200 MiB declared total entry contents |
| `maxEntries` | 10,000 ZIP entries |

This path buffers the workbook in memory; use the [stream APIs](./streaming) for large new data exports. Limits reject oversized inputs instead of truncating. The implementation does not claim a hard process-memory sandbox.

- Supports `.xlsx` and `.xlsm` OOXML packages, including tested Strict namespaces. Keep the original file extension and workbook content type when saving.
- Binary `.xls`, encrypted packages and digitally signed packages are not editable through this API.
- Merged regions can only be edited at their top-left anchor. Array/spill ranges and individual shared/data-table formula cells are rejected.
- Formula groups, arbitrary workbook objects and source styling are preserved where untouched; their semantics are not fully interpreted. The API is not a general spreadsheet layout editor.

See [compatibility evidence](./compatibility), including a business workbook reopened and recalculated in LibreOffice.
