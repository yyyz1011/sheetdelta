---
description: "同一运行环境中的类型守卫；序列化后的 Worker 异常是普通对象，不会通过此检查。"
---

# isSheetDeltaError

[API 参考](./all) / [错误处理](./all#errors)

同一运行环境中的类型守卫；序列化后的 Worker 异常是普通对象，不会通过此检查。

## 导入方式 {#import}

```js
import { isSheetDeltaError } from 'sheetdelta-core/errors';
```

也可从以下入口导入：`sheetdelta-core`.

## 函数签名 {#signature}

```ts
isSheetDeltaError(error: unknown): error is SheetDeltaError
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `error` | 是 | `unknown` |

选项含义、默认值与限制： [使用指南](../errors).

## 返回值 {#returns}

```ts
boolean
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { isSheetDeltaError } from 'sheetdelta-core/errors';
import { SheetDeltaError } from 'sheetdelta-core/errors';
console.log(isSheetDeltaError(new SheetDeltaError('INVALID_DATA','Bad data'))); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../errors)
- [SheetDeltaError](./sheet-delta-error)
- [TableValidationError](./table-validation-error)
- [MergeConflictError](./merge-conflict-error)
