---
description: "比较输入错误，携带重复键、缺键、缺列问题；继承 SheetDeltaError，支持 toJSON()。"
---

# TableValidationError

[API 参考](./all) / [错误处理](./all#errors)

比较输入错误，携带重复键、缺键、缺列问题；继承 SheetDeltaError，支持 toJSON()。

## 导入方式 {#import}

```js
import { TableValidationError } from 'sheetdelta-core/types';
```

也可从以下入口导入：`sheetdelta-core`, `sheetdelta-core/compare`.

## 函数签名 {#signature}

```ts
TableValidationError(issues: DataIssue[]): TableValidationError
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `issues` | 是 | `DataIssue[]` |

选项含义、默认值与限制： [使用指南](../validation).

相关类型：[`DataIssue`](./types#dataissue).

## 返回值 {#returns}

```ts
TableValidationError
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { TableValidationError } from 'sheetdelta-core/types';
const error = new TableValidationError([{side:'left',code:'missing-key',rows:[1],column:'id'}]);
console.log(error.toJSON().issues.length); // 1
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../validation)
- [SheetDeltaError](./sheet-delta-error)
- [isSheetDeltaError](./is-sheet-delta-error)
- [MergeConflictError](./merge-conflict-error)
