---
description: "检查 YYYY-MM-DD 格式的真实日期；拒绝地区格式和不存在的日期。"
---

# isIsoDate

[API 参考](./all) / [清洗与校验](./all#clean)

检查 YYYY-MM-DD 格式的真实日期；拒绝地区格式和不存在的日期。

## 导入方式 {#import}

```js
import { isIsoDate } from 'sheetdelta-core/validate';
```

## 函数签名 {#signature}

```ts
isIsoDate(value: string): boolean
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `value` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../validate).

## 返回值 {#returns}

```ts
boolean
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { isIsoDate } from 'sheetdelta-core/validate';
console.log(isIsoDate('2024-02-29')); // true
console.log(isIsoDate('2025-02-29')); // false
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../validate)
- [cleanTable](./clean-table)
- [deduplicateTable](./deduplicate-table)
- [validateTable](./validate-table)
