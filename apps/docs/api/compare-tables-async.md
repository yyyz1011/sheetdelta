---
description: "Same comparison with cooperative batching, progress and cancellation. Returns a Promise; it does not automatically create a Worker."
---

# compareTablesAsync

[API reference](./all) / [Compare & merge](./all#compare)

Same comparison with cooperative batching, progress and cancellation. Returns a Promise; it does not automatically create a Worker.

## Import {#import}

```js
import { compareTablesAsync } from 'sheetdelta-core/compare';
```

Also exported from：`sheetdelta-core`.

## Signature {#signature}

```ts
compareTablesAsync(left: readonly Row[], right: readonly Row[], options: CompareInputOptions, execution?: AsyncCompareOptions | undefined): Promise<DiffResult>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `left` | Yes | `readonly Row[]` |
| `right` | Yes | `readonly Row[]` |
| `options` | Yes | `CompareInputOptions` |
| `execution` | No | `AsyncCompareOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../async).

Related types：[`AsyncCompareOptions`](./types#asynccompareoptions) · [`Row`](./types#row) · [`CompareInputOptions`](./types#compareinputoptions) · [`DiffResult`](./types#diffresult).

## Return value {#returns}

```ts
Promise<DiffResult>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { compareTablesAsync } from 'sheetdelta-core/compare';
const before = [{id:'001', qty:1}];
const after = [{id:'001', qty:2}];
const result = await compareTablesAsync(before, after, {keys:['id']}, {batchSize:64});
console.log(result.summary.changed); // 1
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../async)
- [compareTables](./compare-tables)
- [mergeTables](./merge-tables)
- [appendTables](./append-tables)
