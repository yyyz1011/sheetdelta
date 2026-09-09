---
description: "把 A1 地址转换为从 1 开始的行列编号；拒绝超出 Excel 范围的地址。"
---

# cellPosition

[API 参考](./all) / [工作簿与公式](./all#workbook)

把 A1 地址转换为从 1 开始的行列编号；拒绝超出 Excel 范围的地址。

## 导入方式 {#import}

```js
import { cellPosition } from 'sheetdelta-core/formula';
```

## 函数签名 {#signature}

```ts
cellPosition(address: string): { row: number; column: number; }
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `address` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../formulas).

## 返回值 {#returns}

```ts
{ row: number; column: number; }
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { cellPosition } from 'sheetdelta-core/formula';
const position = cellPosition('$B$3');
console.log(position); // { row: 3, column: 2 }
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../formulas)
- [patchWorkbook](./patch-workbook)
- [recalculateExcel](./recalculate-excel)
- [calculateWorkbook](./calculate-workbook)
- [cellAddress](./cell-address)
