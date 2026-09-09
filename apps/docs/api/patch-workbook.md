---
description: "Edit explicitly addressed cells while retaining untouched package content. Formula caches clear by default."
---

# patchWorkbook

[API reference](./all) / [Workbooks & formulas](./all#workbook)

Edit explicitly addressed cells while retaining untouched package content. Formula caches clear by default.

## Import {#import}

```js
import { patchWorkbook } from 'sheetdelta-core/workbook';
```

## Signature {#signature}

```ts
patchWorkbook(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, edits: readonly CellEdit[], options?: PatchWorkbookOptions | undefined): Promise<Uint8Array<ArrayBufferLike>>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `input` | Yes | `ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `edits` | Yes | `readonly CellEdit[]` |
| `options` | No | `PatchWorkbookOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../workbooks).

Related types：[`CellEdit`](./types#celledit) · [`PatchWorkbookOptions`](./types#patchworkbookoptions).

## Return value {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { patchWorkbook } from 'sheetdelta-core/workbook';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const changed = await patchWorkbook(bytes, [{sheet:'Data',cell:'B2',value:3}]);
console.log(changed instanceof Uint8Array); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../workbooks)
- [recalculateExcel](./recalculate-excel)
- [calculateWorkbook](./calculate-workbook)
- [cellPosition](./cell-position)
- [cellAddress](./cell-address)
