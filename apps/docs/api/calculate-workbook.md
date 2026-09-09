---
description: "Calculate the documented formula subset. Formula errors appear in the errors array and in cell values."
---

# calculateWorkbook

[API reference](./all) / [Workbooks & formulas](./all#workbook)

Calculate the documented formula subset. Formula errors appear in the errors array and in cell values.

## Import {#import}

```js
import { calculateWorkbook } from 'sheetdelta-core/formula';
```

## Signature {#signature}

```ts
calculateWorkbook(input: FormulaWorkbook, options?: FormulaOptions | undefined): { sheets: Record<string, Record<string, Cell>>; errors: FormulaIssue[]; }
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `input` | Yes | `FormulaWorkbook` |
| `options` | No | `FormulaOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../formulas).

Related types：[`Cell`](./types#cell) · [`FormulaWorkbook`](./types#formulaworkbook) · [`FormulaOptions`](./types#formulaoptions) · [`FormulaIssue`](./types#formulaissue).

## Return value {#returns}

```ts
{ sheets: Record<string, Record<string, Cell>>; errors: FormulaIssue[]; }
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { calculateWorkbook } from 'sheetdelta-core/formula';
const result = calculateWorkbook({Data:{A1:2,B1:{formula:'=A1*3'}}});
console.log(result.sheets.Data.B1); // 6
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../formulas)
- [patchWorkbook](./patch-workbook)
- [recalculateExcel](./recalculate-excel)
- [cellPosition](./cell-position)
- [cellAddress](./cell-address)
