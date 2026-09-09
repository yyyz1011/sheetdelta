---
description: "底层兼容导出：已有 SheetDeltaError 原样抛出，其他异常包装并保留 cause；始终抛出异常。"
---

# wrapError

[API 参考](./all) / [底层辅助函数](./all#helpers)

底层兼容导出：已有 SheetDeltaError 原样抛出，其他异常包装并保留 cause；始终抛出异常。

::: info 底层兼容辅助函数
业务代码优先使用下方关联的高级功能接口。
:::

## 导入方式 {#import}

```js
import { wrapError } from 'sheetdelta-core/errors';
```

## 函数签名 {#signature}

```ts
wrapError(error: unknown, code: ErrorCode, message: string, context?: ErrorContext | undefined): never
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `error` | 是 | `unknown` |
| `code` | 是 | `ErrorCode` |
| `message` | 是 | `string` |
| `context` | 否 | `ErrorContext \| undefined` |

选项含义、默认值与限制： [使用指南](../errors).

相关类型：[`ErrorCode`](./types#errorcode) · [`ErrorContext`](./types#errorcontext).

## 返回值 {#returns}

```ts
never
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { wrapError } from 'sheetdelta-core/errors';
let code;
try { wrapError(new Error('parse failed'),'INVALID_CSV','Cannot read CSV'); } catch(error) { code = error.code; }
console.log(code); // INVALID_CSV
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../errors)
- [parseXml](./parse-xml)
- [elements](./elements)
- [relationshipPath](./relationship-path)
- [assertRecord](./assert-record)
- [fail](./fail)
