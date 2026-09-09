# 导入、校验与修复

使用 `sheetdelta-core/import` 把解析后的表格或 CSV/Excel 文件变成经过校验的业务数据；使用 `/import-report` 生成错误工作簿。接口不依赖前端框架，不会自动写数据库或上传文件。

```ts
import { importFile, type ImportSchema } from 'sheetdelta-core/import';
import { exportImportReport } from 'sheetdelta-core/import-report';

const schema: ImportSchema = {
  fields: [
    { key: 'sku', aliases: ['商品编号'], requiredColumn: true, rule: { required: true, unique: true } },
    { key: 'qty', aliases: ['数量'], requiredColumn: true, clean: { trim: true, type: 'number' }, rule: { required: true, min: 0 } },
  ],
};
const result = await importFile('商品编号,数量\n001,-2\n002,3', schema, {
  format: 'csv', fileName: 'stock.csv',
});
console.log(result.status, result.rows.length); // invalid 0
console.log(result.issues[0].source?.sourceRow); // 2（CSV 记录号）
const report = await exportImportReport(result); // XLSX Uint8Array
console.log(report.byteLength > 0); // true
```

通过 Node `writeFile` 或浏览器 Blob 下载保存 `report`，见[保存文件](./excel)。报告包含 **Data**（可修改的原始值）、**Issues**（问题和源位置）、**Summary**（汇总）。修改 Data 表后，使用相同规则和 `sheet: 'Data'` 重新导入。报告不会复制原工作簿样式。

## 接口

| API | 输入与输出 |
| --- | --- |
| `mapImportHeaders(headers, fields, options?)` | 源表头和字段定义 → `{ mappings, issues, unknownColumns, valid }` |
| `prepareImport(table, schema, options?)` | 已解析的 `TableData` → `Promise<ImportResult>` |
| `importFile(input, schema, options)` | CSV 文本/字节或 Excel 字节 → `Promise<ImportResult>` |
| `locateImportCell(result, row, field)` | 从 1 开始的原始数据行位置和标准字段 → 来源位置 |
| `/import-report` 的 `exportImportReport(result)` | 导入结果 → XLSX 字节 |

每个 API 均有[独立可运行案例](./api/all)和[完整类型声明](./api/types)。

## 字段规则

`fields` 包含 1–1,000 个标准字段，字段名互不重复。

| 字段选项 | 含义 |
| --- | --- |
| `key` | 标准输出字段名，非空且唯一 |
| `aliases` | 源表头别名，匹配时忽略首尾空格和大小写 |
| `source` | **精确**指定源表头，优先于 key/aliases |
| `requiredColumn` | 必须有这一列；文件没有数据行时也会检查 |
| `clean` | 校验前执行已有 [cleanTable 规则](./clean) |
| `rule` | 清洗后执行已有 [validateTable 列规则](./validate) |

`requiredColumn` 与 `rule.required` 相互独立：可以要求列存在，同时允许单元格为空。缺少可选字段时输出 `null`。源表头不能重复或为空。若两个表头都匹配，即使其中一个与标准名完全相同，也会报告歧义；用 `source` 明确选择。一个源列不能分配给两个字段。此版本不做模糊匹配。

`allowUnknownColumns` 默认允许未映射列；这些列保留在 `original`，不会进入标准化的 `processedRows` 或 `rows`。设置 `false` 可拒绝额外列。`mapImportHeaders` 单独返回 `unknownColumns`。

## 自定义业务校验

`rowRules` 与 `tableRules` 中每条规则有唯一 `id` 和同步 `validate` 函数。返回 `{ code, message, severity, column? }` 数组；表级规则还可以填写从 1 开始的 `row`。`column` 必须使用标准字段名。未指定行号的表级错误会阻止整个导入，即使开启部分接收模式。

```ts
import { importFile, type ImportSchema } from 'sheetdelta-core/import';
const schema: ImportSchema = {
  fields: [
    { key: 'start', rule: { type: 'date', required: true } },
    { key: 'end', rule: { type: 'date', required: true } },
  ],
  rowRules: [{
    id: 'date-order',
    validate: row => typeof row.start === 'string' && typeof row.end === 'string' && row.start > row.end
      ? [{ code: 'date-order', severity: 'error', column: 'end', message: '结束日期不能早于开始日期。' }]
      : [],
  }],
};
const result = await importFile('start,end\n2026-09-10,2026-09-09', schema, { format: 'csv' });
console.log(result.issues[0].ruleId); // date-order
```

规则接收冻结的浅层快照，单元格为基本类型。所有处理后的行都会执行自定义规则，包括已有转换/校验错误的行，因此应先检查类型。规则抛出的异常会传播；Promise 或格式不正确的返回值会被拒绝。本版不提供异步查询校验。回调应避免副作用：严格模式只控制返回数据，不能撤销回调自己进行的外部操作。

## 文件和执行选项

`importFile` 必须明确 `format: 'csv' | 'excel'`。文本输入表示 CSV 内容，不表示文件路径或 URL。CSV 选项放在 `csv`；Excel 选项放在 `excel`，也可用 `sheet` 指定工作表（优先于 `excel.sheets`）。读取结果超过一张表时必须明确选择。Excel 默认读取**显示文本**；需要底层数值时设置 `excel: { values: 'raw' }`。`fileName` 是调用方提供的标签，不是经过验证的真实文件名。

`prepareImport` 的 `format` 可以是 `'table' | 'csv' | 'excel'`，默认 `'table'`，用于解释已有的 `table.rowNumbers`。接口无法确认调用方所声明的格式是否正确。

| 共享选项 | 默认值 | 行为 |
| --- | --- | --- |
| `mode` | `'strict'` | `'valid-rows'` 明确允许返回没有错误的行 |
| `maxRows` | 50,000 | 准备阶段最多处理的数据行 |
| `maxCells` | 1,000,000 | `(数据行数 + 1) × max(源列数, 标准字段数)` |
| `maxIssues` | 10,000 | 超限抛 `LIMIT_EXCEEDED`，不返回被截断的问题报告 |
| `batchSize` | 512 | 清洗和自定义行规则分批让出执行的间隔 |
| `signal` | 无 | 通过 `AbortSignal` 协作取消 |
| `onProgress` | 无 | 接收 `{ phase, processed, total }` |

准备阶段的限制在**解析文件之后**生效。改变文件容量时，应分别配置 `csv`/`excel` 解析器的限制。XLSX 的 ZIP 预算使用 `maxUncompressedBytes`、`maxEntries`。这里的导入与报告均在内存中处理，不会把普通 XLSX 解析变成流式解析。

进度阶段为 `map`、`clean`、`validate`、`rules`、`complete`。计数只表示当前阶段，不是整个流程的统一百分比；空数据或结构错误时可能跳过阶段。解析、内置全表校验和表级回调在取消检查之间同步执行。大文件浏览器任务应放在 Worker 中。执行期间不要修改表格、schema 或 options。异常或取消不返回部分结果；进度回调抛出的异常会传播。

## 结果与源位置

| 结果字段 | 含义 |
| --- | --- |
| `status` | `ready` 无错误；`partial` 有错误但接收了部分行；`invalid` 无可接收结果 |
| `valid` | 是否没有 error 级问题；warning 不会使结果无效 |
| `rows`、`sources` | 可提交业务行及同顺序的来源位置 |
| `processedRows` | 所有映射/清洗后的数据，包括错误值；结构映射失败时为空 |
| `original` | 处理前复制的原始解析值、表头和行号 |
| `rowSources` | 每条原始数据的来源位置 |
| `validRows`、`invalidRows` | 在 `original.rows` 中从 1 开始的位置；结构/全局错误使所有行无效 |
| `mappings` | 标准字段对应源列，以及歧义候选 |
| `changes` | 清洗修改审计，包含原始数据位置和来源 |
| `issues` | 内置/自定义/读取问题，包含级别、适用时的 ruleId 和来源 |
| `summary` | `{ total, accepted, errors, warnings }` |

严格模式下只要有错误，`rows` 就为空，即使 `validRows` 中仍有通过校验的行。提交应使用 `rows`；`processedRows` 用于检查问题。只有表头的文件仍检查缺列；必需列齐全时，零行输入可以是有效结果。

XLSX 的 `sourceRow` 是原工作表行号，`cell` 是 A1 地址；CSV 的 `sourceRow` 是逻辑记录号，带换行的引号字段只算一条记录。普通表格使用调用方给定的数据位置。缺少源列时不会伪造单元格地址。筛选有效行不会重排 `rowSources`；可提交数据使用 `sources`，原始数据位置使用 `locateImportCell`。

比较有效行之后，将 `DiffRow.leftIndex/rightIndex` 映射到两侧导入结果的 `sources`，即可找回来源。使用 `appendTables` 时，结合其 `sources` 和对应导入结果即可回溯。元数据不占用用户自己的字段名。

## 错误与报告约定

映射错误码为 `missing-column`、`ambiguous-column`、`reused-column`、`unknown-column`；清洗错误为 `conversion`；内置校验保留原错误码，自定义规则使用调用方错误码并携带 `ruleId`。读取警告也会保留，包括公式缺少缓存；需要更严格检查时设置 [Excel 导入策略](./excel)。

无效参数/数据、解析失败、超限和取消抛出[结构化异常](./errors)；业务校验不通过返回 `ImportResult`。问题数量超限时不返回被截断的数据或报告。

报告 Data 表保留原始解析值，不是清洗后值，也不保留原文件样式。错误为红色，警告为黄色，同一格错误优先。整行问题标记该行；全局或缺列问题标记表头并在 Issues 说明。Issues 中位置指向原输入；Data 表的数据从第 2 行开始连续排列。以 `=` 开头的文本仍按文本写出。工作表名称固定英文；自定义规则可返回中文错误说明。
