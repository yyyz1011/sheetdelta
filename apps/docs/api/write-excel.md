---
description: "Create a data workbook from named sheets. Text stays literal, including formula-shaped strings."
---

# writeExcel

[API reference](./all) / [Excel files](./all#excel)

Create a data workbook from named sheets. Text stays literal, including formula-shaped strings.

## Import {#import}

```js
import { writeExcel } from 'sheetdelta-core/excel';
```

## Signature {#signature}

```ts
writeExcel(sheets: readonly ExcelSheet[]): Promise<Uint8Array<ArrayBufferLike>>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `sheets` | Yes | `readonly ExcelSheet[]` |

Option meanings, defaults and limits： [Usage guide](../excel).

Related types：[`ExcelSheet`](./types#excelsheet).

## Return value {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
console.log(bytes instanceof Uint8Array); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../excel)
- [readExcel](./read-excel)
- [exportDiffExcel](./export-diff-excel)
