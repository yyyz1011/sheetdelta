---
description: "Yield CSV byte chunks from row iterables; columns are required. Write chunks to a destination to retain streaming benefits."
---

# writeCsvStream

[API reference](./all) / [Streaming](./all#stream)

Yield CSV byte chunks from row iterables; columns are required. Write chunks to a destination to retain streaming benefits.

## Import {#import}

```js
import { writeCsvStream } from 'sheetdelta-core/stream';
```

## Signature {#signature}

```ts
writeCsvStream(rows: AsyncIterable<Row> | Iterable<Row>, options: CsvStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `rows` | Yes | `AsyncIterable<Row> \| Iterable<Row>` |
| `options` | Yes | `CsvStreamWriteOptions` |

Option meanings, defaults and limits： [Usage guide](../streaming).

Related types：[`Row`](./types#row) · [`CsvStreamWriteOptions`](./types#csvstreamwriteoptions).

## Return value {#returns}

```ts
AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { writeCsvStream } from 'sheetdelta-core/stream';
let size = 0;
for await (const chunk of writeCsvStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../streaming)
- [readCsvStream](./read-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
