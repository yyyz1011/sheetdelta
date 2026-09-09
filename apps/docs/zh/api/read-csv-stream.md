---
description: "消费同类型的字节块或文本块，逐条返回数据和记录号；消费者控制读取速度。"
---

# readCsvStream

[API 参考](./all) / [流式处理](./all#stream)

消费同类型的字节块或文本块，逐条返回数据和记录号；消费者控制读取速度。

## 导入方式 {#import}

```js
import { readCsvStream } from 'sheetdelta-core/stream';
```

## 函数签名 {#signature}

```ts
readCsvStream(source: AsyncIterable<string | Uint8Array<ArrayBufferLike>>, options?: CsvStreamReadOptions | undefined): AsyncGenerator<{ row: Row; rowNumber: number; }, any, any>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `source` | 是 | `AsyncIterable<string \| Uint8Array<ArrayBufferLike>>` |
| `options` | 否 | `CsvStreamReadOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../streaming).

相关类型：[`Row`](./types#row) · [`CsvStreamReadOptions`](./types#csvstreamreadoptions).

## 返回值 {#returns}

```ts
AsyncGenerator<{ row: Row; rowNumber: number; }, any, any>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { readCsvStream } from 'sheetdelta-core/stream';
async function* chunks(){yield new TextEncoder().encode('id,qty\n001,2');}
let first;
for await (const item of readCsvStream(chunks())) { first = item.row; }
console.log(first.id); // 001
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../streaming)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
