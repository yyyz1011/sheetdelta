---
description: "Explicitly retain first/last rows per typed composite key. Returns retained rows, removed indices and duplicate groups."
---

# deduplicateTable

[API reference](./all) / [Clean & validate](./all#clean)

Explicitly retain first/last rows per typed composite key. Returns retained rows, removed indices and duplicate groups.

## Import {#import}

```js
import { deduplicateTable } from 'sheetdelta-core/clean';
```

## Signature {#signature}

```ts
deduplicateTable(rows: readonly Row[], options: { keys: string[]; keep?: "first" | "last" | undefined; }): { rows: { [x: string]: Cell; }[]; removedRows: number[]; duplicateGroups: number[][]; }
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `rows` | Yes | `readonly Row[]` |
| `options` | Yes | `{ keys: string[]; keep?: "first" \| "last" \| undefined; }` |

Option meanings, defaults and limits： [Usage guide](../clean).

Related types：[`Cell`](./types#cell) · [`Row`](./types#row).

## Return value {#returns}

```ts
{ rows: { [x: string]: Cell; }[]; removedRows: number[]; duplicateGroups: number[][]; }
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { deduplicateTable } from 'sheetdelta-core/clean';
const result = deduplicateTable([{id:'1',v:1},{id:'1',v:2}], {keys:['id'],keep:'last'});
console.log(result.rows[0].v); // 2
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../clean)
- [cleanTable](./clean-table)
- [validateTable](./validate-table)
- [isIsoDate](./is-iso-date)
