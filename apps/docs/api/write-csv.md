---
description: "Write literal values as quoted CSV with configurable columns, delimiter, BOM and formula escaping."
---

# writeCsv

[API reference](./all) / [CSV files](./all#csv)

Write literal values as quoted CSV with configurable columns, delimiter, BOM and formula escaping.

## Import {#import}

```js
import { writeCsv } from 'sheetdelta-core/csv';
```

## Signature {#signature}

```ts
writeCsv(rows: readonly Row[], options?: CsvWriteOptions | undefined): string
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `rows` | Yes | `readonly Row[]` |
| `options` | No | `CsvWriteOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../csv).

Related types：[`Row`](./types#row) · [`CsvWriteOptions`](./types#csvwriteoptions).

## Return value {#returns}

```ts
string
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { writeCsv } from 'sheetdelta-core/csv';
const csv = writeCsv([{id:'001', qty:2}], {columns:['id','qty'], bom:false});
console.log(csv.includes('001')); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../csv)
- [readCsv](./read-csv)
- [readCsvBytes](./read-csv-bytes)
- [exportDiffCsv](./export-diff-csv)
