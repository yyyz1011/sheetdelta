---
description: "从行迭代器生成 CSV 字节块，必须指定列；直接写入目标才能保留流式优势。"
---

# writeCsvStream

[API 参考](./all) / [流式处理](./all#stream)

从行迭代器生成 CSV 字节块，必须指定列；直接写入目标才能保留流式优势。

## 导入方式 {#import}

```js
import { writeCsvStream } from 'sheetdelta-core/stream';
```

## 函数签名 {#signature}

```ts
writeCsvStream(rows: AsyncIterable<Row> | Iterable<Row>, options: CsvStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `rows` | 是 | `AsyncIterable<Row> \| Iterable<Row>` |
| `options` | 是 | `CsvStreamWriteOptions` |

选项含义、默认值与限制： [使用指南](../streaming).

相关类型：[`Row`](./types#row) · [`CsvStreamWriteOptions`](./types#csvstreamwriteoptions).

## 返回值 {#returns}

```ts
AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { writeCsvStream } from 'sheetdelta-core/stream';
let size = 0;
for await (const chunk of writeCsvStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../streaming)
- [readCsvStream](./read-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
