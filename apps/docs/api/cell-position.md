---
description: "Convert an A1 address into one-based row and column numbers. Reject out-of-range Excel addresses."
---

# cellPosition

[API reference](./all) / [Workbooks & formulas](./all#workbook)

Convert an A1 address into one-based row and column numbers. Reject out-of-range Excel addresses.

## Import {#import}

```js
import { cellPosition } from 'sheetdelta-core/formula';
```

## Signature {#signature}

```ts
cellPosition(address: string): { row: number; column: number; }
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `address` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../formulas).

## Return value {#returns}

```ts
{ row: number; column: number; }
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { cellPosition } from 'sheetdelta-core/formula';
const position = cellPosition('$B$3');
console.log(position); // { row: 3, column: 2 }
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../formulas)
- [patchWorkbook](./patch-workbook)
- [recalculateExcel](./recalculate-excel)
- [calculateWorkbook](./calculate-workbook)
- [cellAddress](./cell-address)
