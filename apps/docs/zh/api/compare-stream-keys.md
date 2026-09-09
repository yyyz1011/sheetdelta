---
description: "生成有序流比较要求的文本元组排序顺序；排序和比较应使用相同规范化选项。"
---

# compareStreamKeys

[API 参考](./all) / [流式处理](./all#stream)

生成有序流比较要求的文本元组排序顺序；排序和比较应使用相同规范化选项。

## 导入方式 {#import}

```js
import { compareStreamKeys } from 'sheetdelta-core/stream';
```

## 函数签名 {#signature}

```ts
compareStreamKeys(a: Row, b: Row, keys: string[], options?: Pick<CompareInputOptions, "trim" | "ignoreCase"> | undefined): number
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `a` | 是 | `Row` |
| `b` | 是 | `Row` |
| `keys` | 是 | `string[]` |
| `options` | 否 | `Pick<CompareInputOptions, "trim" \| "ignoreCase"> \| undefined` |

选项含义、默认值与限制： [使用指南](../streaming).

相关类型：[`Row`](./types#row) · [`CompareInputOptions`](./types#compareinputoptions).

## 返回值 {#returns}

```ts
number
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { compareStreamKeys } from 'sheetdelta-core/stream';
const rows = [{id:'2'}, {id:'10'}];
rows.sort((a,b) => compareStreamKeys(a,b,['id']));
console.log(rows.map(r => r.id)); // ['10', '2']
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
