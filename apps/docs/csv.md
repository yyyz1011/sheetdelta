# CSV files

```ts
import { readCsv, writeCsv, exportDiffCsv } from 'sheetdelta-core/csv';
const table = readCsv('id,price\n001,12.50');
const csv = writeCsv(table.rows);
```

## readCsv(text, options?)

Returns `{ name, headers, rows, rowNumbers }`. Values remain strings; missing cells become `null`. No automatic number or date conversion occurs. UTF-8 BOM, quoted separators, escaped quotes and embedded newlines are supported.

| Option | Default | Meaning |
| --- | --- | --- |
| `delimiter` | Detected | Explicit delimiter, e.g. `';'` or `'\t'` |
| `headerRow` | `1` | One-based CSV record containing headers |
| `maxRows` | `50000` | Maximum output data records |
| `maxColumns` | `1000` | Maximum header columns |
| `skipEmptyLines` | `true` | Skip blank records |
| `name` | `'Data'` | Name of returned table |

`rowNumbers` counts source CSV **records**, not physical text lines; quoted fields can span lines. Invalid quoting, empty/duplicate headers, too many cells and exceeded limits throw. Decode file bytes into a string before calling this API; choose the encoding explicitly for non-UTF-8 files.

## writeCsv(rows, options?)

Returns CSV text with quoted fields and CRLF record separators.

| Option | Default | Meaning |
| --- | --- | --- |
| `columns` | Union of row keys | Output selection and order |
| `delimiter` | `','` | Output separator |
| `bom` | `true` | Include UTF-8 BOM |
| `escapeFormulae` | `true` | Prefix formula-like text and headers with an apostrophe |

Numeric negative values remain numbers. Text beginning with a dangerous spreadsheet prefix is escaped; disable only for trusted consumers. Spreadsheet applications may still infer identifier types on import, so import ID columns as text.

For structured comparison results, use [exportDiffCsv](./api/export-diff-csv). Its existing escaping and row-number behavior are retained for compatibility.

## readCsvBytes(input, options?)

Read an `ArrayBuffer` or `Uint8Array` (including Node Buffer) directly. Returns the same table shape as `readCsv`. Accepts every CSV read option plus `encoding` (default `'utf-8'`) and `maxBytes` (default `20971520`, 20 MiB).

```ts
import { readCsvBytes } from 'sheetdelta-core/csv';
const bytes = new TextEncoder().encode('id,name\n001,Example');
const table = readCsvBytes(bytes, { encoding: 'utf-8' });
```

For legacy Chinese exports, explicitly select `{ encoding: 'gb18030' }`. Supported labels depend on the runtime's `TextDecoder`. There is no encoding guessing: malformed bytes throw `INVALID_CSV`, unsupported encodings throw `INVALID_OPTIONS`, and oversized input throws `LIMIT_EXCEEDED`. Both reading APIs parse in memory; neither streams.
