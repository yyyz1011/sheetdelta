---
description: "将差异结果导出为 CSV；changesOnly 和 escapeFormulae 默认开启。"
---

# exportDiffCsv

[API 参考](./all) / [CSV 读写](./all#csv)

将差异结果导出为 CSV；changesOnly 和 escapeFormulae 默认开启。

## 导入方式 {#import}

```js
import { exportDiffCsv } from 'sheetdelta-core/csv';
```

也可从以下入口导入：`sheetdelta-core`.

## 函数签名 {#signature}

```ts
exportDiffCsv(result: DiffResult, { changesOnly, escapeFormulae }?: { changesOnly?: boolean | undefined; escapeFormulae?: boolean | undefined; } | undefined): string
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `result` | 是 | `DiffResult` |
| `{ changesOnly, escapeFormulae }` | 否 | `{ changesOnly?: boolean \| undefined; escapeFormulae?: boolean \| undefined; } \| undefined` |

选项含义、默认值与限制： [使用指南](../api/export-diff-csv#报告列).

相关类型：[`DiffResult`](./types#diffresult).

## 返回值 {#returns}

```ts
string
```

返回文本包含 UTF-8 BOM、逗号分隔符、带引号字段及 CRLF 换行，字段内引号会被转义。设置 `changesOnly: false` 可包含未变化记录。

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { exportDiffCsv } from 'sheetdelta-core/csv';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const csv = exportDiffCsv(result);
console.log(csv.includes('changed')); // true
```

## 报告列

表头以 `change_type`、`key`、`old_row`、`new_row` 开始。每个选中映射生成 `old:<列名>` 和 `new:<列名>` 字段。键使用 JSON 编码。行号按电子表格存在一行表头计算，因此第一条输入记录导出为第 2 行。

## 公式转义

默认在可能被电子表格视为公式的内容前添加单引号，包括以 `=`、`+`、`-`、`@`、制表符或回车开头的文本，也检查前导空白。因此负数也可能显示出单引号。仅在输出接收方可信时关闭转义。

公式转义不控制 Excel 自动推断数据类型。需要保留编号前导零时，请将编号列按文本导入。

## 浏览器下载

```ts
const url = URL.createObjectURL(
  new Blob([exportDiffCsv(result)], { type: 'text/csv;charset=utf-8' }),
);
const link = document.createElement('a');
link.href = url;
link.download = 'changes.csv';
document.body.appendChild(link);
link.click();
link.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

## Node.js 导出

```ts
import { writeFile } from 'node:fs/promises';
await writeFile('changes.csv', exportDiffCsv(result), 'utf8');
```


## 相关 API 与指南 {#related}

- [用法、默认值与限制](../api/export-diff-csv#报告列)
- [readCsv](./read-csv)
- [readCsvBytes](./read-csv-bytes)
- [writeCsv](./write-csv)
