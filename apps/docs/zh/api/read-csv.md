---
description: "解析文本，字段保留字符串；位置按 CSV 记录计数，多行字段仍算一条记录。"
---

# readCsv

[API 参考](./all) / [CSV 读写](./all#csv)

解析文本，字段保留字符串；位置按 CSV 记录计数，多行字段仍算一条记录。

## 导入方式 {#import}

```js
import { readCsv } from 'sheetdelta-core/csv';
```

## 函数签名 {#signature}

```ts
readCsv(text: string, options?: CsvReadOptions | undefined): TableData
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `text` | 是 | `string` |
| `options` | 否 | `CsvReadOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../csv).

相关类型：[`TableData`](./types#tabledata) · [`CsvReadOptions`](./types#csvreadoptions).

## 返回值 {#returns}

```ts
TableData
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { readCsv } from 'sheetdelta-core/csv';
const table = readCsv('id,qty\n001,2');
console.log(table.rows[0].id); // 001
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../csv)
- [readCsvBytes](./read-csv-bytes)
- [writeCsv](./write-csv)
- [exportDiffCsv](./export-diff-csv)
