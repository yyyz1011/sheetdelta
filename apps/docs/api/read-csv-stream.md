---
description: "Consume consistent byte or string chunks and yield rows with logical record numbers. Backpressure is consumer-driven."
---

# readCsvStream

[API reference](./all) / [Streaming](./all#stream)

Consume consistent byte or string chunks and yield rows with logical record numbers. Backpressure is consumer-driven.

## Import {#import}

```js
import { readCsvStream } from 'sheetdelta-core/stream';
```

## Signature {#signature}

```ts
readCsvStream(source: AsyncIterable<string | Uint8Array<ArrayBufferLike>>, options?: CsvStreamReadOptions | undefined): AsyncGenerator<{ row: Row; rowNumber: number; }, any, any>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `source` | Yes | `AsyncIterable<string \| Uint8Array<ArrayBufferLike>>` |
| `options` | No | `CsvStreamReadOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../streaming).

Related types：[`Row`](./types#row) · [`CsvStreamReadOptions`](./types#csvstreamreadoptions).

## Return value {#returns}

```ts
AsyncGenerator<{ row: Row; rowNumber: number; }, any, any>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { readCsvStream } from 'sheetdelta-core/stream';
async function* chunks(){yield new TextEncoder().encode('id,qty\n001,2');}
let first;
for await (const item of readCsvStream(chunks())) { first = item.row; }
console.log(first.id); // 001
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../streaming)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
