---
description: "分批比较，支持进度与取消，返回 Promise；不会自动创建 Worker。"
---

# compareTablesAsync

[API 参考](./all) / [比较与合并](./all#compare)

分批比较，支持进度与取消，返回 Promise；不会自动创建 Worker。

## 导入方式 {#import}

```js
import { compareTablesAsync } from 'sheetdelta-core/compare';
```

也可从以下入口导入：`sheetdelta-core`.

## 函数签名 {#signature}

```ts
compareTablesAsync(left: readonly Row[], right: readonly Row[], options: CompareInputOptions, execution?: AsyncCompareOptions | undefined): Promise<DiffResult>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `left` | 是 | `readonly Row[]` |
| `right` | 是 | `readonly Row[]` |
| `options` | 是 | `CompareInputOptions` |
| `execution` | 否 | `AsyncCompareOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../async).

相关类型：[`AsyncCompareOptions`](./types#asynccompareoptions) · [`Row`](./types#row) · [`CompareInputOptions`](./types#compareinputoptions) · [`DiffResult`](./types#diffresult).

## 返回值 {#returns}

```ts
Promise<DiffResult>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { compareTablesAsync } from 'sheetdelta-core/compare';
const before = [{id:'001', qty:1}];
const after = [{id:'001', qty:2}];
const result = await compareTablesAsync(before, after, {keys:['id']}, {batchSize:64});
console.log(result.summary.changed); // 1
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../async)
- [compareTables](./compare-tables)
- [mergeTables](./merge-tables)
- [appendTables](./append-tables)
