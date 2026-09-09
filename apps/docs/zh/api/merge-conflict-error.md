---
description: "连接冲突异常，包含键、列及两侧值；继承 SheetDeltaError。"
---

# MergeConflictError

[API 参考](./all) / [错误处理](./all#errors)

连接冲突异常，包含键、列及两侧值；继承 SheetDeltaError。

## 导入方式 {#import}

```js
import { MergeConflictError } from 'sheetdelta-core/merge';
```

## 函数签名 {#signature}

```ts
MergeConflictError(conflicts: MergeConflict[]): MergeConflictError
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `conflicts` | 是 | `MergeConflict[]` |

选项含义、默认值与限制： [使用指南](../merge).

相关类型：[`MergeConflict`](./types#mergeconflict).

## 返回值 {#returns}

```ts
MergeConflictError
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { MergeConflictError } from 'sheetdelta-core/merge';
const error = new MergeConflictError([{key:['1'],column:'qty',left:1,right:2}]);
console.log(error.toJSON().conflicts.length); // 1
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../merge)
- [SheetDeltaError](./sheet-delta-error)
- [isSheetDeltaError](./is-sheet-delta-error)
- [TableValidationError](./table-validation-error)
