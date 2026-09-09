---
description: "计算已明确支持的公式子集；公式错误在 errors 和单元格结果中返回。"
---

# calculateWorkbook

[API 参考](./all) / [工作簿与公式](./all#workbook)

计算已明确支持的公式子集；公式错误在 errors 和单元格结果中返回。

## 导入方式 {#import}

```js
import { calculateWorkbook } from 'sheetdelta-core/formula';
```

## 函数签名 {#signature}

```ts
calculateWorkbook(input: FormulaWorkbook, options?: FormulaOptions | undefined): { sheets: Record<string, Record<string, Cell>>; errors: FormulaIssue[]; }
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `input` | 是 | `FormulaWorkbook` |
| `options` | 否 | `FormulaOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../formulas).

相关类型：[`Cell`](./types#cell) · [`FormulaWorkbook`](./types#formulaworkbook) · [`FormulaOptions`](./types#formulaoptions) · [`FormulaIssue`](./types#formulaissue).

## 返回值 {#returns}

```ts
{ sheets: Record<string, Record<string, Cell>>; errors: FormulaIssue[]; }
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { calculateWorkbook } from 'sheetdelta-core/formula';
const result = calculateWorkbook({Data:{A1:2,B1:{formula:'=A1*3'}}});
console.log(result.sheets.Data.B1); // 6
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../formulas)
- [patchWorkbook](./patch-workbook)
- [recalculateExcel](./recalculate-excel)
- [cellPosition](./cell-position)
- [cellAddress](./cell-address)
