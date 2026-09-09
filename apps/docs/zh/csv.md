# CSV 文件

```ts
import { readCsv, writeCsv, exportDiffCsv } from 'sheetdelta-core/csv';
const table = readCsv('id,price\n001,12.50');
const csv = writeCsv(table.rows);
```

## readCsv(text, options?)

返回 `{ name, headers, rows, rowNumbers }`。值保持字符串，缺失单元格为 `null`，不自动转换数字或日期。支持 UTF-8 BOM、引号内分隔符、转义引号和字段内换行。

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `delimiter` | 自动检测 | 显式指定分隔符，例如 `';'`、`'\t'` |
| `headerRow` | `1` | 表头所在的 CSV 记录，从 1 开始 |
| `maxRows` | `50000` | 输出数据记录上限 |
| `maxColumns` | `1000` | 表头列数上限 |
| `skipEmptyLines` | `true` | 跳过空白记录 |
| `name` | `'Data'` | 返回表格的名称 |

`rowNumbers` 按源 CSV **记录**计数，不是文本的物理行数；引号字段可能跨多行。引号格式错误、空或重复表头、多余单元格及超限都会报错。该 API 接受文本，先将文件字节按实际编码解码；非 UTF-8 文件需显式选择编码。

## writeCsv(rows, options?)

返回带引号字段、CRLF 记录分隔符的 CSV 文本。

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `columns` | 所有行字段并集 | 导出字段及顺序 |
| `delimiter` | `','` | 输出分隔符 |
| `bom` | `true` | 添加 UTF-8 BOM |
| `escapeFormulae` | `true` | 给疑似公式文本和表头加单引号前缀 |

数字类型的负数保持数字；危险前缀的文本会被转义，仅针对可信消费方关闭。表格软件仍可能自动推断编号类型，导入时应将编号列指定为文本。

比较结果请使用 [exportDiffCsv](./api/export-diff-csv)，保留旧版的转义与行号规则。

## readCsvBytes(input, options?)

直接读取 `ArrayBuffer` 或 `Uint8Array`（包括 Node Buffer），返回与 `readCsv` 相同的表结构。支持全部 CSV 读取选项，并增加 `encoding`（默认 `'utf-8'`）与 `maxBytes`（默认 `20971520`，即 20 MiB）。

```ts
import { readCsvBytes } from 'sheetdelta-core/csv';
const bytes = new TextEncoder().encode('id,name\n001,示例');
const table = readCsvBytes(bytes, { encoding: 'utf-8' });
```

中文旧系统导出的文件可以明确指定 `{ encoding: 'gb18030' }`，支持范围取决于运行环境的 `TextDecoder`。不会自动猜测编码；不匹配或损坏的字节抛出 `INVALID_CSV`，不支持的编码抛出 `INVALID_OPTIONS`，超出大小抛出 `LIMIT_EXCEEDED`。两种读取 API 都在内存中解析，并非流式读取。
