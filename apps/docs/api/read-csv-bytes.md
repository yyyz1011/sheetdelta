---
description: "Decode bytes with explicit encoding, then parse. Invalid encoding/data and byte limits produce structured errors."
---

# readCsvBytes

[API reference](./all) / [CSV files](./all#csv)

Decode bytes with explicit encoding, then parse. Invalid encoding/data and byte limits produce structured errors.

## Import {#import}

```js
import { readCsvBytes } from 'sheetdelta-core/csv';
```

## Signature {#signature}

```ts
readCsvBytes(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: CsvByteReadOptions | undefined): TableData
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `input` | Yes | `ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `options` | No | `CsvByteReadOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../csv).

Related types：[`TableData`](./types#tabledata) · [`CsvByteReadOptions`](./types#csvbytereadoptions).

## Return value {#returns}

```ts
TableData
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { readCsvBytes } from 'sheetdelta-core/csv';
const table = readCsvBytes(new TextEncoder().encode('id,qty\n001,2'), {encoding:'utf-8'});
console.log(table.rows[0].id); // 001
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../csv)
- [readCsv](./read-csv)
- [writeCsv](./write-csv)
- [exportDiffCsv](./export-diff-csv)
