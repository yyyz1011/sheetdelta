---
description: "Append rows using strict or union columns. Source table/row indices are one-based."
---

# appendTables

[API reference](./all) / [Compare & merge](./all#compare)

Append rows using strict or union columns. Source table/row indices are one-based.

## Import {#import}

```js
import { appendTables } from 'sheetdelta-core/merge';
```

## Signature {#signature}

```ts
appendTables(tables: readonly (readonly Row[])[], options?: { schema?: "strict" | "union" | undefined; } | undefined): { rows: Row[]; columns: string[]; sources: { table: number; row: number; }[]; }
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `tables` | Yes | `readonly (readonly Row[])[]` |
| `options` | No | `{ schema?: "strict" \| "union" \| undefined; } \| undefined` |

Option meanings, defaults and limits： [Usage guide](../merge).

Related types：[`Row`](./types#row).

## Return value {#returns}

```ts
{ rows: Row[]; columns: string[]; sources: { table: number; row: number; }[]; }
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { appendTables } from 'sheetdelta-core/merge';
const result = appendTables([[{id:'1'}],[{id:'2',note:'new'}]], {schema:'union'});
console.log(result.rows.length); // 2
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../merge)
- [compareTables](./compare-tables)
- [compareTablesAsync](./compare-tables-async)
- [mergeTables](./merge-tables)
