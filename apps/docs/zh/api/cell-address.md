---
description: "把从 1 开始的 Excel 行列坐标转换为 A1 地址。"
---

# cellAddress

[API 参考](./all) / [工作簿与公式](./all#workbook)

把从 1 开始的 Excel 行列坐标转换为 A1 地址。

## 导入方式 {#import}

```js
import { cellAddress } from 'sheetdelta-core/formula';
```

## 函数签名 {#signature}

```ts
cellAddress(row: number, column: number): string
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `row` | 是 | `number` |
| `column` | 是 | `number` |

选项含义、默认值与限制： [使用指南](../formulas).

## 返回值 {#returns}

```ts
string
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { cellAddress } from 'sheetdelta-core/formula';
console.log(cellAddress(3,2)); // B3
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../formulas)
- [patchWorkbook](./patch-workbook)
- [recalculateExcel](./recalculate-excel)
- [calculateWorkbook](./calculate-workbook)
- [cellPosition](./cell-position)
