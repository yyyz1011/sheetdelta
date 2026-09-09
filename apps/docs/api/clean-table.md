---
description: "Apply explicit trimming/case/type rules. Returns new rows, changed-value audit and failed conversions."
---

# cleanTable

[API reference](./all) / [Clean & validate](./all#clean)

Apply explicit trimming/case/type rules. Returns new rows, changed-value audit and failed conversions.

## Import {#import}

```js
import { cleanTable } from 'sheetdelta-core/clean';
```

## Signature {#signature}

```ts
cleanTable(rows: readonly Row[], rules: Record<string, CleanRule>): { rows: Row[]; changes: CleanChange[]; issues: CleanIssue[]; }
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `rows` | Yes | `readonly Row[]` |
| `rules` | Yes | `Record<string, CleanRule>` |

Option meanings, defaults and limits： [Usage guide](../clean).

Related types：[`Row`](./types#row) · [`CleanRule`](./types#cleanrule) · [`CleanChange`](./types#cleanchange) · [`CleanIssue`](./types#cleanissue).

## Return value {#returns}

```ts
{ rows: Row[]; changes: CleanChange[]; issues: CleanIssue[]; }
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { cleanTable } from 'sheetdelta-core/clean';
const result = cleanTable([{id:'001',qty:' 2 '}], {qty:{trim:true,type:'number'}});
console.log(result.rows[0].qty); // 2
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../clean)
- [deduplicateTable](./deduplicate-table)
- [validateTable](./validate-table)
- [isIsoDate](./is-iso-date)
