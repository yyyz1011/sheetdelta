---
description: "比较已排序且键唯一的数据流，需指定比较列；错误可能发生在部分结果已输出之后。"
---

# compareSortedStreams

[API 参考](./all) / [流式处理](./all#stream)

比较已排序且键唯一的数据流，需指定比较列；错误可能发生在部分结果已输出之后。

## 导入方式 {#import}

```js
import { compareSortedStreams } from 'sheetdelta-core/stream';
```

## 函数签名 {#signature}

```ts
compareSortedStreams(left: AsyncIterable<Row> | Iterable<Row>, right: AsyncIterable<Row> | Iterable<Row>, options: CompareInputOptions, execution?: StreamOptions | undefined): AsyncGenerator<DiffRow, any, any>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `left` | 是 | `AsyncIterable<Row> \| Iterable<Row>` |
| `right` | 是 | `AsyncIterable<Row> \| Iterable<Row>` |
| `options` | 是 | `CompareInputOptions` |
| `execution` | 否 | `StreamOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../streaming).

相关类型：[`Row`](./types#row) · [`CompareInputOptions`](./types#compareinputoptions) · [`DiffRow`](./types#diffrow) · [`StreamOptions`](./types#streamoptions).

## 返回值 {#returns}

```ts
AsyncGenerator<DiffRow, any, any>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { compareSortedStreams } from 'sheetdelta-core/stream';
let changed = 0;
for await (const row of compareSortedStreams([{id:'1',qty:1}], [{id:'1',qty:2}], {keys:['id'],columns:['qty']})) if(row.status==='changed') changed++;
console.log(changed); // 1
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareStreamKeys](./compare-stream-keys)
