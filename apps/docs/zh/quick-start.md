# 快速开始

安装包，选择唯一键，然后比较两组对象记录。

## 安装

::: code-group
```sh [npm]
npm install sheetdelta-core
```
```sh [pnpm]
pnpm add sheetdelta-core
```
```sh [yarn]
yarn add sheetdelta-core
```
:::

核心包使用 ESM。在 Node.js 中使用 `.mjs` 文件，或在项目的 `package.json` 中设置 `"type": "module"`。

## 比较记录

```ts
import { compareTables, exportDiffCsv } from 'sheetdelta-core';

const before = [
  { sku: '001', price: '129.00', stock: 20 },
  { sku: '002', price: '49.00', stock: 8 },
];
const after = [
  { sku: '001', price: '119.00', stock: 20 },
  { sku: '003', price: '79.00', stock: 12 },
];

const result = compareTables(before, after, {
  keys: [{ left: 'sku', right: 'sku' }],
  columns: [
    { left: 'price', right: 'price' },
    { left: 'stock', right: 'stock' },
  ],
});

console.log(result.summary);
// { added: 1, removed: 1, changed: 1, unchanged: 0,
//   total: 3, before: 2, after: 2 }

const csv = exportDiffCsv(result);
```

## 读取结果

`result.summary` 统计各状态数量。`result.rows` 包含每条记录的键、状态、变化前后对象和字段级变化。上面的示例产生一条修改、一条删除和一条新增。

```ts
for (const row of result.rows) {
  if (row.status === 'changed') {
    console.log(row.key, row.changes);
  }
}
```

## 在 Node.js 中保存报告

```ts
import { writeFile } from 'node:fs/promises';
await writeFile('changes.csv', csv, 'utf8');
```

在浏览器中，可把 CSV 文本放进 Blob 并下载，详见 [CSV 导出](./api/export-diff-csv)。

## 下一步：文件处理

通过 [按需导入](./imports) 选择功能，或跟随 [完整流程](./workflow) 完成读取、校验与报告导出。
