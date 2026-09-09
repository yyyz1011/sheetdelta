---
description: "按地址修改单元格并保留未修改包内容；默认清除公式缓存。"
---

# patchWorkbook

[API 参考](./all) / [工作簿与公式](./all#workbook)

按地址修改单元格并保留未修改包内容；默认清除公式缓存。

## 导入方式 {#import}

```js
import { patchWorkbook } from 'sheetdelta-core/workbook';
```

## 函数签名 {#signature}

```ts
patchWorkbook(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, edits: readonly CellEdit[], options?: PatchWorkbookOptions | undefined): Promise<Uint8Array<ArrayBufferLike>>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `input` | 是 | `ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `edits` | 是 | `readonly CellEdit[]` |
| `options` | 否 | `PatchWorkbookOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../workbooks).

相关类型：[`CellEdit`](./types#celledit) · [`PatchWorkbookOptions`](./types#patchworkbookoptions).

## 返回值 {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { patchWorkbook } from 'sheetdelta-core/workbook';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const changed = await patchWorkbook(bytes, [{sheet:'Data',cell:'B2',value:3}]);
console.log(changed instanceof Uint8Array); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../workbooks)
- [recalculateExcel](./recalculate-excel)
- [calculateWorkbook](./calculate-workbook)
- [cellPosition](./cell-position)
- [cellAddress](./cell-address)
