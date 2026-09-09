---
description: "按类型敏感的复合键显式保留首条/末条，返回保留行、删除位置和重复组。"
---

# deduplicateTable

[API 参考](./all) / [清洗与校验](./all#clean)

按类型敏感的复合键显式保留首条/末条，返回保留行、删除位置和重复组。

## 导入方式 {#import}

```js
import { deduplicateTable } from 'sheetdelta-core/clean';
```

## 函数签名 {#signature}

```ts
deduplicateTable(rows: readonly Row[], options: { keys: string[]; keep?: "first" | "last" | undefined; }): { rows: { [x: string]: Cell; }[]; removedRows: number[]; duplicateGroups: number[][]; }
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `rows` | 是 | `readonly Row[]` |
| `options` | 是 | `{ keys: string[]; keep?: "first" \| "last" \| undefined; }` |

选项含义、默认值与限制： [使用指南](../clean).

相关类型：[`Cell`](./types#cell) · [`Row`](./types#row).

## 返回值 {#returns}

```ts
{ rows: { [x: string]: Cell; }[]; removedRows: number[]; duplicateGroups: number[][]; }
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { deduplicateTable } from 'sheetdelta-core/clean';
const result = deduplicateTable([{id:'1',v:1},{id:'1',v:2}], {keys:['id'],keep:'last'});
console.log(result.rows[0].v); // 2
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../clean)
- [cleanTable](./clean-table)
- [validateTable](./validate-table)
- [isIsoDate](./is-iso-date)
