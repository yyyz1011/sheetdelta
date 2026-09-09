---
description: "Join unique-key tables with explicit join/conflict policies; the default rejects conflicting values."
---

# mergeTables

[API reference](./all) / [Compare & merge](./all#compare)

Join unique-key tables with explicit join/conflict policies; the default rejects conflicting values.

## Import {#import}

```js
import { mergeTables } from 'sheetdelta-core/merge';
```

## Signature {#signature}

```ts
mergeTables(left: readonly Row[], right: readonly Row[], options: MergeOptions): { rows: Row[]; conflicts: MergeConflict[]; summary: { matched: number; leftOnly: number; rightOnly: number; total: number; }; }
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `left` | Yes | `readonly Row[]` |
| `right` | Yes | `readonly Row[]` |
| `options` | Yes | `MergeOptions` |

Option meanings, defaults and limits： [Usage guide](../merge).

Related types：[`Row`](./types#row) · [`MergeOptions`](./types#mergeoptions) · [`MergeConflict`](./types#mergeconflict).

## Return value {#returns}

```ts
{ rows: Row[]; conflicts: MergeConflict[]; summary: { matched: number; leftOnly: number; rightOnly: number; total: number; }; }
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { mergeTables } from 'sheetdelta-core/merge';
const result = mergeTables([{id:'1',name:'Cup'}], [{id:'1',stock:2}], {keys:['id'],join:'left'});
console.log(result.rows[0].stock); // 2
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../merge)
- [compareTables](./compare-tables)
- [compareTablesAsync](./compare-tables-async)
- [appendTables](./append-tables)
