---
description: "Write one new literal-value XLSX sheet as byte chunks. No whole-row collection is required."
---

# writeExcelStream

[API reference](./all) / [Streaming](./all#stream)

Write one new literal-value XLSX sheet as byte chunks. No whole-row collection is required.

## Import {#import}

```js
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
```

## Signature {#signature}

```ts
writeExcelStream(rows: AsyncIterable<Row> | Iterable<Row>, options: ExcelStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `rows` | Yes | `AsyncIterable<Row> \| Iterable<Row>` |
| `options` | Yes | `ExcelStreamWriteOptions` |

Option meanings, defaults and limits： [Usage guide](../streaming).

Related types：[`Row`](./types#row) · [`ExcelStreamWriteOptions`](./types#excelstreamwriteoptions).

## Return value {#returns}

```ts
AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
let size = 0;
for await (const chunk of writeExcelStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
