---
description: "执行显式空白、大小写和类型转换规则，返回新数据、修改审计和转换失败。"
---

# cleanTable

[API 参考](./all) / [清洗与校验](./all#clean)

执行显式空白、大小写和类型转换规则，返回新数据、修改审计和转换失败。

## 导入方式 {#import}

```js
import { cleanTable } from 'sheetdelta-core/clean';
```

## 函数签名 {#signature}

```ts
cleanTable(rows: readonly Row[], rules: Record<string, CleanRule>): { rows: Row[]; changes: CleanChange[]; issues: CleanIssue[]; }
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `rows` | 是 | `readonly Row[]` |
| `rules` | 是 | `Record<string, CleanRule>` |

选项含义、默认值与限制： [使用指南](../clean).

相关类型：[`Row`](./types#row) · [`CleanRule`](./types#cleanrule) · [`CleanChange`](./types#cleanchange) · [`CleanIssue`](./types#cleanissue).

## 返回值 {#returns}

```ts
{ rows: Row[]; changes: CleanChange[]; issues: CleanIssue[]; }
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { cleanTable } from 'sheetdelta-core/clean';
const result = cleanTable([{id:'001',qty:' 2 '}], {qty:{trim:true,type:'number'}});
console.log(result.rows[0].qty); // 2
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../clean)
- [deduplicateTable](./deduplicate-table)
- [validateTable](./validate-table)
- [isIsoDate](./is-iso-date)
