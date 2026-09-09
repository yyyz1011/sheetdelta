# Stream larger datasets

The stream APIs process records incrementally and follow consumer backpressure. They are separate entry points inside the same package. Async array comparison still retains complete arrays; choose these APIs when the source is a stream.

```ts
import { readCsvStream, writeCsvStream } from 'sheetdelta-core/stream';
const source = [{ id: '001', price: 12 }];
for await (const { row } of readCsvStream(writeCsvStream(source, { columns: ['id', 'price'] }))) {
  console.log(row.id); // 001
}
```

## API and runtime

| Function / entry | Input → output | Runtime |
| --- | --- | --- |
| `readCsvStream` from `/stream` | Async text/byte chunks → `{ row, rowNumber }` | Node and modern browsers |
| `writeCsvStream` from `/stream` | Async/sync rows → UTF-8 byte chunks | Node and modern browsers |
| `compareSortedStreams` from `/stream` | Two sorted row iterables → individual `DiffRow` records | Node and modern browsers |
| `compareStreamKeys` from `/stream` | Comparator for preparing matching sort order | Node and modern browsers |
| `writeExcelStream` from `/excel-stream` | Async/sync rows → one-sheet XLSX ZIP chunks | Node and modern browsers |
| `readExcelStream` from `/excel-node` | A local XLSX file path → `{ sheet, row, rowNumber, date1904 }` | Node only |

Do not import `/excel-node` in browser bundles. The ZIP reader uses random access to the local file; it does not load the entire compressed workbook. For browser files, existing `readExcel` remains the in-memory import path.

## CSV streams

`readCsvStream(source, options?)` accepts either all `Uint8Array` chunks or all string chunks; mixing them is rejected. It supports split UTF-8 characters, BOM, escaped quotes, CRLF and multiline quoted fields. The first nonempty record is the header. Values remain strings or null. `rowNumber` counts logical source records, not physical lines.

Options: `delimiter` (one character, default comma), `encoding` (default UTF-8), `maxRows` (1,000,000), `maxFieldChars` (1,000,000), `maxRecordChars` (8 Mi characters), `skipEmptyLines` (true), `signal`. Maximum record width is 16,384 fields. Invalid quoting, decoding and limits reject instead of silently truncating.

`writeCsvStream(rows, options)` requires unique `columns`. Options: `delimiter`, `bom` (true), `escapeFormulae` (true), `signal`. Output uses quoted fields and CRLF. Consume byte chunks directly with a stream destination; collecting them all into an array defeats the memory benefit.

## Sorted comparison

`compareSortedStreams(left, right, compareOptions, { signal }?)` requires explicit comparison `columns` and unique keys in ascending **text tuple** order. Sort each side using `compareStreamKeys(rowA, rowB, keys, { trim, ignoreCase })`; use the same normalization options for comparison. For example, text `'10'` sorts before `'2'`, so pad numeric identifiers when numeric order is desired.

```ts
import { compareSortedStreams } from 'sheetdelta-core/stream';
for await (const diff of compareSortedStreams(
  [{ id: '001', price: 10 }],
  [{ id: '001', price: 12 }],
  { keys: ['id'], columns: ['price'], includeUnchanged: false },
)) console.log(diff.status); // changed
```

Results arrive in key order and retain source data indices. The API does not produce a global schema report or retain a summary; count statuses as you consume them. It does not sort or buffer unordered inputs. Duplicate/unsorted keys fail as encountered, so a stream may have already emitted earlier records before an error. Use staged output if your workflow must be atomic.

## XLSX streaming export

`writeExcelStream(rows, { columns, sheetName = 'Data', maxRows = 1048575, signal } )` creates one new data worksheet using inline strings. It retains no complete row table or shared-string dictionary. Supports primitive values and literal formula-like text, leading-zero IDs and OOXML escape-like text. It does not generate formulas, styles or charts; use workbook editing for existing templates.

Node example:

```ts
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
await pipeline(
  writeExcelStream([{ id: '001', price: 12 }], { columns: ['id', 'price'] }),
  createWriteStream('products.xlsx'),
);
```

For production files, write to a temporary destination, rename only after successful completion, and remove it on error/cancellation. In browsers, write to a streaming-capable destination; turning all chunks into one Blob buffers the whole result.

## XLSX streaming import (Node)

`readExcelStream(path, options?)` selects `sheet`, defaulting to the first visible worksheet. Options: `headerRow` (1), `maxRows` (1,000,000 emitted nonempty data rows), `maxColumns` (16,384), `maxUncompressedBytes` (2 GiB declared ZIP total), `maxEntries` (10,000), `maxSharedStringChars` (8 Mi characters), `formulas` (`'cached'` or `'reject'`), `cellErrors` (`'reject'` or `'text'`), `signal`.

Values are raw numbers/booleans/strings. Numeric dates remain serials with `date1904` metadata; displayed number formatting is not applied. The reader caches shared strings within its configured bound and buffers small XML chunks/metadata, so total memory also depends on dictionary and row width. Oversized dictionaries fail explicitly. Merged cells retain anchor data only. Missing formula caches reject. Binary XLS is not supported by this stream reader.

Early consumer exit closes the current source and ZIP file. Cancellation is checked between chunks/records; custom input iterables must implement their own abort behavior while waiting for new data. Errors cannot retract chunks already written.

See the [million-row benchmark and application checks](./compatibility).

## Complete inventory reconciliation example

The [Node inventory example](https://github.com/yyyz1011/sheetdelta/blob/master/examples/node/reconcile-inventory.mjs) connects CSV input, quantity cleaning, validation, sorted comparison and report output. It stages output, publishes only a complete file, refuses to overwrite an existing destination, and cleans up after failures. CI exercises successful reconciliation, invalid quantities and existing-file protection.
