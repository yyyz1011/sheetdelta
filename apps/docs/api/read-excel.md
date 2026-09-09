---
description: "Read XLSX/XLS bytes with sheet selection, raw/display policies and resource limits. Formulas use cached values."
---

# readExcel

[API reference](./all) / [Excel files](./all#excel)

Read XLSX/XLS bytes with sheet selection, raw/display policies and resource limits. Formulas use cached values.

## Import {#import}

```js
import { readExcel } from 'sheetdelta-core/excel';
```

## Signature {#signature}

```ts
readExcel(input: ExcelInput, options?: ExcelReadOptions | undefined): Promise<TableData[]>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `input` | Yes | `ExcelInput` |
| `options` | No | `ExcelReadOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../excel).

Related types：[`TableData`](./types#tabledata) · [`ExcelInput`](./types#excelinput) · [`ExcelReadOptions`](./types#excelreadoptions).

## Return value {#returns}

```ts
Promise<TableData[]>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { readExcel } from 'sheetdelta-core/excel';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const tables = await readExcel(bytes, {values:'raw'});
console.log(tables[0].rows[0].qty); // 2
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../excel)
- [writeExcel](./write-excel)
- [exportDiffExcel](./export-diff-excel)
