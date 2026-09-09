# 流式处理大数据

流式 API 逐条处理记录，并按消费者速度读取输入。它们仍在同一个包中，使用独立入口。异步数组比较仍保留完整数组；当来源是数据流时，可使用这里的 API。

```ts
import { readCsvStream, writeCsvStream } from 'sheetdelta-core/stream';
const source = [{ id: '001', price: 12 }];
for await (const { row } of readCsvStream(writeCsvStream(source, { columns: ['id', 'price'] }))) {
  console.log(row.id); // 001
}
```

## API 与运行环境

| 函数及入口 | 输入 → 输出 | 环境 |
| --- | --- | --- |
| `/stream` 的 `readCsvStream` | 异步文本或字节块 → `{ row, rowNumber }` | Node 与现代浏览器 |
| `/stream` 的 `writeCsvStream` | 异步或同步行记录 → UTF-8 字节块 | Node 与现代浏览器 |
| `/stream` 的 `compareSortedStreams` | 两个有序行迭代器 → 单条 `DiffRow` | Node 与现代浏览器 |
| `/stream` 的 `compareStreamKeys` | 准备符合要求的排序比较器 | Node 与现代浏览器 |
| `/excel-stream` 的 `writeExcelStream` | 异步或同步行记录 → 单表 XLSX ZIP 字节块 | Node 与现代浏览器 |
| `/excel-node` 的 `readExcelStream` | 本地 XLSX 文件路径 → `{ sheet, row, rowNumber, date1904 }` | 仅 Node |

浏览器不要导入 `/excel-node`。ZIP 读取器随机访问磁盘文件，不会加载整个压缩文件。浏览器文件导入仍可使用内存模式的 `readExcel`。

## CSV 流

`readCsvStream(source, options?)` 接受纯 `Uint8Array` 块或纯字符串块，拒绝混用。支持跨块 UTF-8 字符、BOM、引号转义、CRLF 和带换行的引号字段。首个非空记录作为表头，值保持字符串或 null。`rowNumber` 为源逻辑记录位置，不是物理文本行。

选项：`delimiter`（单字符，默认逗号）、`encoding`（默认 UTF-8）、`maxRows`（1,000,000）、`maxFieldChars`（1,000,000）、`maxRecordChars`（8 Mi 字符）、`skipEmptyLines`（true）、`signal`。记录最多 16,384 个字段。引号、编码或限制问题会报错，不会静默截断。

`writeCsvStream(rows, options)` 必须传入唯一的 `columns`，还支持 `delimiter`、`bom`（true）、`escapeFormulae`（true）、`signal`。输出使用引号字段和 CRLF。应将字节块直接写往流式目标；全部收集进数组会失去节省内存的效果。

## 有序流比较

`compareSortedStreams(left, right, compareOptions, { signal }?)` 要求明确指定比较 `columns`，两侧键唯一，并按**文本元组**升序排列。可用 `compareStreamKeys(rowA, rowB, keys, { trim, ignoreCase })` 为每侧排序，规范化选项必须与比较时一致。文本 `'10'` 排在 `'2'` 前，若希望编号按数值顺序排列，可以先补零。

```ts
import { compareSortedStreams } from 'sheetdelta-core/stream';
for await (const diff of compareSortedStreams(
  [{ id: '001', price: 10 }],
  [{ id: '001', price: 12 }],
  { keys: ['id'], columns: ['price'], includeUnchanged: false },
)) console.log(diff.status); // changed
```

结果按键顺序输出，并保留源数据位置。API 不生成全局字段结构报告，也不保留汇总，可在消费时累计各状态数量。它不会为乱序输入排序或缓存。重复键或乱序在遇到时失败，所以报错前可能已经输出部分记录。需要整体成功的流程，应使用临时输出。

## XLSX 流式导出

`writeExcelStream(rows, { columns, sheetName = 'Data', maxRows = 1048575, signal })` 使用内联字符串创建一张新的数据表，不保留完整行数组或共享字符串字典。支持基础值、公式形状的字面文本、前导零编号及类似 OOXML 转义的文本。不生成公式、样式和图表，现有模板请使用工作簿修改功能。

Node 示例：

```ts
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
await pipeline(
  writeExcelStream([{ id: '001', price: 12 }], { columns: ['id', 'price'] }),
  createWriteStream('products.xlsx'),
);
```

生产流程先写临时文件，完整成功后重命名，出错或取消时删除临时文件。浏览器应写入支持流式写入的目标；把所有块合并为一个 Blob 会缓存整个结果。

## XLSX 流式导入（Node）

`readExcelStream(path, options?)` 可指定 `sheet`，默认首个可见工作表。选项：`headerRow`（1）、`maxRows`（输出的非空数据行上限 1,000,000）、`maxColumns`（16,384）、`maxUncompressedBytes`（ZIP 声明内容总量 2 GiB）、`maxEntries`（10,000）、`maxSharedStringChars`（8 Mi 字符）、`formulas`（`'cached'` 或 `'reject'`）、`cellErrors`（`'reject'` 或 `'text'`）、`signal`。

返回原始数字、布尔值、字符串，不应用显示格式。数字日期保持序列值，并提供 `date1904` 元数据。读取器会在限制内缓存共享字符串，以及少量 XML 块和元数据，因此内存还与字典和行宽有关。字典过大明确报错；合并单元格只保留锚点数据，公式无缓存会被拒绝。不支持二进制 XLS 流式读取。

提前退出迭代会关闭当前来源和 ZIP 文件。取消在块或记录间检查；自定义输入迭代器等待新数据时，需要自行实现中断。已经写出的块无法因后续错误撤回。

参见[百万行基准和跨应用验证](./compatibility)。

## 完整库存对账示例

仓库的 [Node 库存对账示例](https://github.com/yyyz1011/sheetdelta/blob/master/examples/node/reconcile-inventory.mjs) 串联 CSV 读取、数量清洗、数据校验、有序比较和报告写出。结果先写临时文件，完整成功后再创建目标文件，拒绝覆盖已有输出，并在失败后清理临时文件。CI 验证正常对账、非法数量和已有文件保护。
