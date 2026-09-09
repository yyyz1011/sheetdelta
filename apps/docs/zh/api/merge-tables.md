---
description: "按唯一键连接表格，显式选择连接/冲突策略；默认拒绝冲突值。"
---

# mergeTables

[API 参考](./all) / [比较与合并](./all#compare)

按唯一键连接表格，显式选择连接/冲突策略；默认拒绝冲突值。

## 导入方式 {#import}

```js
import { mergeTables } from 'sheetdelta-core/merge';
```

## 函数签名 {#signature}

```ts
mergeTables(left: readonly Row[], right: readonly Row[], options: MergeOptions): { rows: Row[]; conflicts: MergeConflict[]; summary: { matched: number; leftOnly: number; rightOnly: number; total: number; }; }
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `left` | 是 | `readonly Row[]` |
| `right` | 是 | `readonly Row[]` |
| `options` | 是 | `MergeOptions` |

选项含义、默认值与限制： [使用指南](../merge).

相关类型：[`Row`](./types#row) · [`MergeOptions`](./types#mergeoptions) · [`MergeConflict`](./types#mergeconflict).

## 返回值 {#returns}

```ts
{ rows: Row[]; conflicts: MergeConflict[]; summary: { matched: number; leftOnly: number; rightOnly: number; total: number; }; }
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { mergeTables } from 'sheetdelta-core/merge';
const result = mergeTables([{id:'1',name:'Cup'}], [{id:'1',stock:2}], {keys:['id'],join:'left'});
console.log(result.rows[0].stock); // 2
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../merge)
- [compareTables](./compare-tables)
- [compareTablesAsync](./compare-tables-async)
- [appendTables](./append-tables)
