---
description: "按严格列结构或列并集纵向追加；来源表和行位置从 1 开始。"
---

# appendTables

[API 参考](./all) / [比较与合并](./all#compare)

按严格列结构或列并集纵向追加；来源表和行位置从 1 开始。

## 导入方式 {#import}

```js
import { appendTables } from 'sheetdelta-core/merge';
```

## 函数签名 {#signature}

```ts
appendTables(tables: readonly (readonly Row[])[], options?: { schema?: "strict" | "union" | undefined; } | undefined): { rows: Row[]; columns: string[]; sources: { table: number; row: number; }[]; }
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `tables` | 是 | `readonly (readonly Row[])[]` |
| `options` | 否 | `{ schema?: "strict" \| "union" \| undefined; } \| undefined` |

选项含义、默认值与限制： [使用指南](../merge).

相关类型：[`Row`](./types#row).

## 返回值 {#returns}

```ts
{ rows: Row[]; columns: string[]; sources: { table: number; row: number; }[]; }
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { appendTables } from 'sheetdelta-core/merge';
const result = appendTables([[{id:'1'}],[{id:'2',note:'new'}]], {schema:'union'});
console.log(result.rows.length); // 2
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../merge)
- [compareTables](./compare-tables)
- [compareTablesAsync](./compare-tables-async)
- [mergeTables](./merge-tables)
