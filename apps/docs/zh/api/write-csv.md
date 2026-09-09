---
description: "按指定列和分隔符导出带引号的 CSV，可配置 BOM 与公式转义。"
---

# writeCsv

[API 参考](./all) / [CSV 读写](./all#csv)

按指定列和分隔符导出带引号的 CSV，可配置 BOM 与公式转义。

## 导入方式 {#import}

```js
import { writeCsv } from 'sheetdelta-core/csv';
```

## 函数签名 {#signature}

```ts
writeCsv(rows: readonly Row[], options?: CsvWriteOptions | undefined): string
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `rows` | 是 | `readonly Row[]` |
| `options` | 否 | `CsvWriteOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../csv).

相关类型：[`Row`](./types#row) · [`CsvWriteOptions`](./types#csvwriteoptions).

## 返回值 {#returns}

```ts
string
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { writeCsv } from 'sheetdelta-core/csv';
const csv = writeCsv([{id:'001', qty:2}], {columns:['id','qty'], bom:false});
console.log(csv.includes('001')); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../csv)
- [readCsv](./read-csv)
- [readCsvBytes](./read-csv-bytes)
- [exportDiffCsv](./export-diff-csv)
