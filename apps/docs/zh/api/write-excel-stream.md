---
description: "逐块写出一个新的纯数据 XLSX 工作表，无需收集所有行。"
---

# writeExcelStream

[API 参考](./all) / [流式处理](./all#stream)

逐块写出一个新的纯数据 XLSX 工作表，无需收集所有行。

## 导入方式 {#import}

```js
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
```

## 函数签名 {#signature}

```ts
writeExcelStream(rows: AsyncIterable<Row> | Iterable<Row>, options: ExcelStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `rows` | 是 | `AsyncIterable<Row> \| Iterable<Row>` |
| `options` | 是 | `ExcelStreamWriteOptions` |

选项含义、默认值与限制： [使用指南](../streaming).

相关类型：[`Row`](./types#row) · [`ExcelStreamWriteOptions`](./types#excelstreamwriteoptions).

## 返回值 {#returns}

```ts
AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
let size = 0;
for await (const chunk of writeExcelStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [readExcelStream](./read-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
