---
description: "Compare already sorted unique-key iterables with explicit columns. Errors may follow previously emitted rows."
---

# compareSortedStreams

[API reference](./all) / [Streaming](./all#stream)

Compare already sorted unique-key iterables with explicit columns. Errors may follow previously emitted rows.

## Import {#import}

```js
import { compareSortedStreams } from 'sheetdelta-core/stream';
```

## Signature {#signature}

```ts
compareSortedStreams(left: AsyncIterable<Row> | Iterable<Row>, right: AsyncIterable<Row> | Iterable<Row>, options: CompareInputOptions, execution?: StreamOptions | undefined): AsyncGenerator<DiffRow, any, any>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `left` | Yes | `AsyncIterable<Row> \| Iterable<Row>` |
| `right` | Yes | `AsyncIterable<Row> \| Iterable<Row>` |
| `options` | Yes | `CompareInputOptions` |
| `execution` | No | `StreamOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../streaming).

Related types：[`Row`](./types#row) · [`CompareInputOptions`](./types#compareinputoptions) · [`DiffRow`](./types#diffrow) · [`StreamOptions`](./types#streamoptions).

## Return value {#returns}

```ts
AsyncGenerator<DiffRow, any, any>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { compareSortedStreams } from 'sheetdelta-core/stream';
let changed = 0;
for await (const row of compareSortedStreams([{id:'1',qty:1}], [{id:'1',qty:2}], {keys:['id'],columns:['qty']})) if(row.status==='changed') changed++;
console.log(changed); // 1
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareStreamKeys](./compare-stream-keys)
