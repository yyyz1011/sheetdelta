---
description: "从具名工作表生成数据工作簿；以等号开头的文本仍是文本。"
---

# writeExcel

[API 参考](./all) / [Excel 读写](./all#excel)

从具名工作表生成数据工作簿；以等号开头的文本仍是文本。

## 导入方式 {#import}

```js
import { writeExcel } from 'sheetdelta-core/excel';
```

## 函数签名 {#signature}

```ts
writeExcel(sheets: readonly ExcelSheet[]): Promise<Uint8Array<ArrayBufferLike>>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `sheets` | 是 | `readonly ExcelSheet[]` |

选项含义、默认值与限制： [使用指南](../excel).

相关类型：[`ExcelSheet`](./types#excelsheet).

## 返回值 {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
console.log(bytes instanceof Uint8Array); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../excel)
- [readExcel](./read-excel)
- [exportDiffExcel](./export-diff-excel)
