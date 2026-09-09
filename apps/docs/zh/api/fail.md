---
description: "底层兼容导出：直接抛出指定错误码、说明和上下文的 SheetDeltaError。"
---

# fail

[API 参考](./all) / [底层辅助函数](./all#helpers)

底层兼容导出：直接抛出指定错误码、说明和上下文的 SheetDeltaError。

::: info 底层兼容辅助函数
业务代码优先使用下方关联的高级功能接口。
:::

## 导入方式 {#import}

```js
import { fail } from 'sheetdelta-core/errors';
```

## 函数签名 {#signature}

```ts
fail(code: ErrorCode, message: string, context?: ErrorContext | undefined): never
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
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
import { fail } from 'sheetdelta-core/errors';
let code;
try { fail('INVALID_DATA','Missing ID',{column:'id'}); } catch(error) { code = error.code; }
console.log(code); // INVALID_DATA
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../errors)
- [parseXml](./parse-xml)
- [elements](./elements)
- [relationshipPath](./relationship-path)
- [assertRecord](./assert-record)
- [wrapError](./wrap-error)
