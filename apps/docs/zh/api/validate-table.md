---
description: "执行内置列规则，不转换类型；返回有效/无效数据行位置和问题，maxIssues 可限制问题数量。"
---

# validateTable

[API 参考](./all) / [清洗与校验](./all#clean)

执行内置列规则，不转换类型；返回有效/无效数据行位置和问题，maxIssues 可限制问题数量。

## 导入方式 {#import}

```js
import { validateTable } from 'sheetdelta-core/validate';
```

## 函数签名 {#signature}

```ts
validateTable(rows: readonly Row[], schema: TableSchema, options?: { allowUnknown?: boolean | undefined; maxIssues?: number | undefined; } | undefined): ValidationResult
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `rows` | 是 | `readonly Row[]` |
| `schema` | 是 | `TableSchema` |
| `options` | 否 | `{ allowUnknown?: boolean \| undefined; maxIssues?: number \| undefined; } \| undefined` |

选项含义、默认值与限制： [使用指南](../validate).

相关类型：[`Row`](./types#row) · [`TableSchema`](./types#tableschema) · [`ValidationResult`](./types#validationresult).

## 返回值 {#returns}

```ts
ValidationResult
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { validateTable } from 'sheetdelta-core/validate';
const result = validateTable([{price:-1}], {price:{type:'number',min:0}}, {maxIssues:100});
console.log(result.issues[0].code); // min
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../validate)
- [cleanTable](./clean-table)
- [deduplicateTable](./deduplicate-table)
- [isIsoDate](./is-iso-date)
