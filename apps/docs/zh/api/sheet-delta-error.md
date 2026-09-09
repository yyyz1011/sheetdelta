---
description: "构造包含稳定错误码与上下文的异常；toJSON() 适合 Worker 传输，反序列化后检查 code。"
---

# SheetDeltaError

[API 参考](./all) / [错误处理](./all#errors)

构造包含稳定错误码与上下文的异常；toJSON() 适合 Worker 传输，反序列化后检查 code。

## 导入方式 {#import}

```js
import { SheetDeltaError } from 'sheetdelta-core/errors';
```

也可从以下入口导入：`sheetdelta-core`.

## 函数签名 {#signature}

```ts
SheetDeltaError(code: ErrorCode, message: string, context?: ErrorContext | undefined, options?: ErrorOptions | undefined): SheetDeltaError
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `code` | 是 | `ErrorCode` |
| `message` | 是 | `string` |
| `context` | 否 | `ErrorContext \| undefined` |
| `options` | 否 | `ErrorOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../errors).

相关类型：[`ErrorCode`](./types#errorcode) · [`ErrorContext`](./types#errorcontext).

## 返回值 {#returns}

```ts
SheetDeltaError
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { SheetDeltaError } from 'sheetdelta-core/errors';
const error = new SheetDeltaError('INVALID_DATA','Missing value',{row:2,column:'qty'});
console.log(error.toJSON().code); // INVALID_DATA
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../errors)
- [isSheetDeltaError](./is-sheet-delta-error)
- [TableValidationError](./table-validation-error)
- [MergeConflictError](./merge-conflict-error)
