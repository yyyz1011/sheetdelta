---
description: "按明确编码解码字节后解析；编码错误、数据错误和字节超限返回结构化异常。"
---

# readCsvBytes

[API 参考](./all) / [CSV 读写](./all#csv)

按明确编码解码字节后解析；编码错误、数据错误和字节超限返回结构化异常。

## 导入方式 {#import}

```js
import { readCsvBytes } from 'sheetdelta-core/csv';
```

## 函数签名 {#signature}

```ts
readCsvBytes(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: CsvByteReadOptions | undefined): TableData
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `input` | 是 | `ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `options` | 否 | `CsvByteReadOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../csv).

相关类型：[`TableData`](./types#tabledata) · [`CsvByteReadOptions`](./types#csvbytereadoptions).

## 返回值 {#returns}

```ts
TableData
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { readCsvBytes } from 'sheetdelta-core/csv';
const table = readCsvBytes(new TextEncoder().encode('id,qty\n001,2'), {encoding:'utf-8'});
console.log(table.rows[0].id); // 001
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../csv)
- [readCsv](./read-csv)
- [writeCsv](./write-csv)
- [exportDiffCsv](./export-diff-csv)
