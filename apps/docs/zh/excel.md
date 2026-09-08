# Excel 文件与差异报告

在 Node.js 或浏览器中读取 XLSX/XLS，生成 XLSX。所有处理都在当前进程进行，API 不上传文件。

```ts
import { readExcel, writeExcel, exportDiffExcel } from 'sheetdelta-core/excel';
import { compareTables } from 'sheetdelta-core/compare';
const bytes = await writeExcel([{ name: 'Products', rows: [{ id: '001', price: 12 }] }]);
const [table] = await readExcel(bytes, { values: 'raw' });
const result = compareTables([{ id: '001', price: 10 }], table.rows, { keys: ['id'] });
const report = await exportDiffExcel(result); // 包含 XLSX 的 Uint8Array
```

## readExcel(input, options?)

异步。接受 `ArrayBuffer` 或 `Uint8Array`（包括 Node `Buffer`），返回 `TableData[]`：`{ name, headers, rows, rowNumbers }`。

| 参数 | 默认值 | 含义 |
| --- | --- | --- |
| `sheets` | 所有非空工作表 | 精确名称；名称不存在或显式选择空工作表会报错 |
| `values` | `'display'` | 显示文本；`'raw'` 读取原始基本类型 |
| `headerRow` | `1` | 表头所在的物理行，从 1 开始 |
| `skipEmptyLines` | `true` | 跳过完全空白的数据行 |
| `maxRows` | `50000` | 每张表的物理数据行上限，含空行 |
| `maxColumns` | `1000` | 工作表列数上限 |
| `maxBytes` | `20971520` | 输入大小上限，20 MiB |

限制参数必须为正整数。超限会报错，不会静默截断。限制用于控制资源，并非恶意文件的安全沙箱。空表头、重复表头、超出表头的值会被拒绝。`rowNumbers` 保留源 Excel 物理行号。表头去除两端空格，数据值不自动清洗。

`display` 保留 `001` 等格式化文本；`raw` 保留数字和布尔值，Excel 日期仍是数字序列值，不会自动变成 `Date`。公式只读取缓存结果，不重新计算。缺失单元格为 `null`，已丢失的编号位数无法恢复。

## writeExcel(sheets)

异步，返回 `Uint8Array`。每张表传入 `{ name, rows, columns? }`。`columns` 指定导出字段和顺序；不传时使用所有行字段的并集。空表必须显式指定列。工作表名称必须符合 Excel 规则，且忽略大小写后唯一。

单元格只接受基本类型。以 `=` 开头的文本仍按文本写入，不生成公式。非有限数字、超长文本和超出工作表尺寸的数据会被拒绝。该函数生成新的数据工作簿，不保留源文件的样式、宏、图表及合并单元格语义。

## exportDiffExcel(result)

异步，输出含 **Summary**（汇总）、**Added**（新增）、**Removed**（删除）、**Changed**（修改）的 XLSX。表头蓝色、新增绿色、删除红色，修改前后单元格黄色，明细表带筛选。未变化记录仅统计数量，不输出明细。

报告中的行号是从 1 开始的**数据索引**，不是原始 Excel 地址。存在额外表头或空行时，使用 `rowNumbers` 映射源行。列结构变化另见 `result.schema`。

## 保存文件

Node.js：

```ts
import { writeFile } from 'node:fs/promises';
import { writeExcel } from 'sheetdelta-core/excel';
await writeFile('products.xlsx', await writeExcel([{ name: 'Products', rows: [{ id: '001' }] }]));
```

浏览器中使用 XLSX MIME 类型创建 Blob，再通过对象 URL 下载，下载后释放 URL。异步 API 会延迟加载依赖，但解析和压缩仍在内存中执行；大文件应放入 Worker 处理。
