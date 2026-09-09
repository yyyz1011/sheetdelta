---
description: "Comparator for exactly the text-tuple ordering required by compareSortedStreams; use identical normalization options."
---

# compareStreamKeys

[API reference](./all) / [Streaming](./all#stream)

Comparator for exactly the text-tuple ordering required by compareSortedStreams; use identical normalization options.

## Import {#import}

```js
import { compareStreamKeys } from 'sheetdelta-core/stream';
```

## Signature {#signature}

```ts
compareStreamKeys(a: Row, b: Row, keys: string[], options?: Pick<CompareInputOptions, "trim" | "ignoreCase"> | undefined): number
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `a` | Yes | `Row` |
| `b` | Yes | `Row` |
| `keys` | Yes | `string[]` |
| `options` | No | `Pick<CompareInputOptions, "trim" \| "ignoreCase"> \| undefined` |

Option meanings, defaults and limits： [Usage guide](../streaming).

Related types：[`Row`](./types#row) · [`CompareInputOptions`](./types#compareinputoptions).

## Return value {#returns}

```ts
number
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { compareStreamKeys } from 'sheetdelta-core/stream';
const rows = [{id:'2'}, {id:'10'}];
rows.sort((a,b) => compareStreamKeys(a,b,['id']));
console.log(rows.map(r => r.id)); // ['10', '2']
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
