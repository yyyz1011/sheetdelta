---
description: "Convert one-based Excel row/column coordinates into an A1 address."
---

# cellAddress

[API reference](./all) / [Workbooks & formulas](./all#workbook)

Convert one-based Excel row/column coordinates into an A1 address.

## Import {#import}

```js
import { cellAddress } from 'sheetdelta-core/formula';
```

## Signature {#signature}

```ts
cellAddress(row: number, column: number): string
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `row` | Yes | `number` |
| `column` | Yes | `number` |

Option meanings, defaults and limits： [Usage guide](../formulas).

## Return value {#returns}

```ts
string
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { cellAddress } from 'sheetdelta-core/formula';
console.log(cellAddress(3,2)); // B3
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../formulas)
- [patchWorkbook](./patch-workbook)
- [recalculateExcel](./recalculate-excel)
- [calculateWorkbook](./calculate-workbook)
- [cellPosition](./cell-position)
