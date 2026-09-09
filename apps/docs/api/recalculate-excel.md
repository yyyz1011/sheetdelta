---
description: "Recalculate supported formulas and write fresh caches. Unsupported/error formulas cause an atomic failure."
---

# recalculateExcel

[API reference](./all) / [Workbooks & formulas](./all#workbook)

Recalculate supported formulas and write fresh caches. Unsupported/error formulas cause an atomic failure.

## Import {#import}

```js
import { recalculateExcel } from 'sheetdelta-core/workbook';
```

## Signature {#signature}

```ts
recalculateExcel(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: (WorkbookOptions & FormulaOptions) | undefined): Promise<Uint8Array<ArrayBufferLike>>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `input` | Yes | `ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `options` | No | `(WorkbookOptions & FormulaOptions) \| undefined` |

Option meanings, defaults and limits： [Usage guide](../workbooks).

Related types：[`FormulaOptions`](./types#formulaoptions) · [`WorkbookOptions`](./types#workbookoptions).

## Return value {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { recalculateExcel } from 'sheetdelta-core/workbook';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
import { patchWorkbook } from 'sheetdelta-core/workbook';
import { readExcel } from 'sheetdelta-core/excel';
const changed = await patchWorkbook(bytes, [{sheet:'Data',cell:'B2',formula:'=3*4'}]);
const tables = await readExcel(await recalculateExcel(changed), {values:'raw'});
console.log(tables[0].rows[0].qty); // 12
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../workbooks)
- [patchWorkbook](./patch-workbook)
- [calculateWorkbook](./calculate-workbook)
- [cellPosition](./cell-position)
- [cellAddress](./cell-address)
