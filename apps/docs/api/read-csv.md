---
description: "Parse text to TableData; values stay strings. CSV positions count records, including multiline fields as one record."
---

# readCsv

[API reference](./all) / [CSV files](./all#csv)

Parse text to TableData; values stay strings. CSV positions count records, including multiline fields as one record.

## Import {#import}

```js
import { readCsv } from 'sheetdelta-core/csv';
```

## Signature {#signature}

```ts
readCsv(text: string, options?: CsvReadOptions | undefined): TableData
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `text` | Yes | `string` |
| `options` | No | `CsvReadOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../csv).

Related types：[`TableData`](./types#tabledata) · [`CsvReadOptions`](./types#csvreadoptions).

## Return value {#returns}

```ts
TableData
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { readCsv } from 'sheetdelta-core/csv';
const table = readCsv('id,qty\n001,2');
console.log(table.rows[0].id); // 001
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../csv)
- [readCsvBytes](./read-csv-bytes)
- [writeCsv](./write-csv)
- [exportDiffCsv](./export-diff-csv)
