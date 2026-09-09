---
description: "返回包含汇总及新增、删除、修改高亮工作表的 XLSX。"
---

# exportDiffExcel

[API 参考](./all) / [Excel 读写](./all#excel)

返回包含汇总及新增、删除、修改高亮工作表的 XLSX。

## 导入方式 {#import}

```js
import { exportDiffExcel } from 'sheetdelta-core/excel';
```

## 函数签名 {#signature}

```ts
exportDiffExcel(result: DiffResult): Promise<Uint8Array<ArrayBufferLike>>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `result` | 是 | `DiffResult` |

选项含义、默认值与限制： [使用指南](../excel).

相关类型：[`DiffResult`](./types#diffresult).

## 返回值 {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { exportDiffExcel } from 'sheetdelta-core/excel';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const bytes = await exportDiffExcel(result);
console.log(bytes instanceof Uint8Array); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../excel)
- [readExcel](./read-excel)
- [writeExcel](./write-excel)
