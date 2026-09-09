---
description: "读取 XLSX/XLS 字节，可选工作表、原始值/显示值和资源限制；公式读取缓存。"
---

# readExcel

[API 参考](./all) / [Excel 读写](./all#excel)

读取 XLSX/XLS 字节，可选工作表、原始值/显示值和资源限制；公式读取缓存。

## 导入方式 {#import}

```js
import { readExcel } from 'sheetdelta-core/excel';
```

## 函数签名 {#signature}

```ts
readExcel(input: ExcelInput, options?: ExcelReadOptions | undefined): Promise<TableData[]>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `input` | 是 | `ExcelInput` |
| `options` | 否 | `ExcelReadOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../excel).

相关类型：[`TableData`](./types#tabledata) · [`ExcelInput`](./types#excelinput) · [`ExcelReadOptions`](./types#excelreadoptions).

## 返回值 {#returns}

```ts
Promise<TableData[]>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { readExcel } from 'sheetdelta-core/excel';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const tables = await readExcel(bytes, {values:'raw'});
console.log(tables[0].rows[0].qty); // 2
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../excel)
- [writeExcel](./write-excel)
- [exportDiffExcel](./export-diff-excel)
