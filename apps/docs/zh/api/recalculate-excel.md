---
description: "重算支持的公式并写缓存；不支持或错误的公式使操作整体失败。"
---

# recalculateExcel

[API 参考](./all) / [工作簿与公式](./all#workbook)

重算支持的公式并写缓存；不支持或错误的公式使操作整体失败。

## 导入方式 {#import}

```js
import { recalculateExcel } from 'sheetdelta-core/workbook';
```

## 函数签名 {#signature}

```ts
recalculateExcel(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: (WorkbookOptions & FormulaOptions) | undefined): Promise<Uint8Array<ArrayBufferLike>>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `input` | 是 | `ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `options` | 否 | `(WorkbookOptions & FormulaOptions) \| undefined` |

选项含义、默认值与限制： [使用指南](../workbooks).

相关类型：[`FormulaOptions`](./types#formulaoptions) · [`WorkbookOptions`](./types#workbookoptions).

## 返回值 {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

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

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../workbooks)
- [patchWorkbook](./patch-workbook)
- [calculateWorkbook](./calculate-workbook)
- [cellPosition](./cell-position)
- [cellAddress](./cell-address)
