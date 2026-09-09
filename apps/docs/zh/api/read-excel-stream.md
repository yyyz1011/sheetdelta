---
description: "仅 Node 的本地 XLSX 逐行读取，返回原始值和来源行；共享字符串受明确预算约束。"
---

# readExcelStream

[API 参考](./all) / [流式处理](./all#stream)

仅 Node 的本地 XLSX 逐行读取，返回原始值和来源行；共享字符串受明确预算约束。

::: warning 仅限 Node.js
此 API 读取本地文件路径，不能在浏览器中运行。
:::

## 导入方式 {#import}

```js
import { readExcelStream } from 'sheetdelta-core/excel-node';
```

## 函数签名 {#signature}

```ts
readExcelStream(path: string, options?: ExcelStreamReadOptions | undefined): AsyncGenerator<ExcelStreamRow, any, any>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `path` | 是 | `string` |
| `options` | 否 | `ExcelStreamReadOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../streaming).

相关类型：[`ExcelStreamReadOptions`](./types#excelstreamreadoptions) · [`ExcelStreamRow`](./types#excelstreamrow).

## 返回值 {#returns}

```ts
AsyncGenerator<ExcelStreamRow, any, any>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { readExcelStream } from 'sheetdelta-core/excel-node';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const dir = await mkdtemp(join(tmpdir(),'sheetdelta-example-'));
let id;
try {
  const path = join(dir,'data.xlsx');
  await writeFile(path,bytes);
  for await (const item of readExcelStream(path)) id = item.row.id;
  console.log(id); // 001
} finally { await rm(dir,{recursive:true,force:true}); }
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
