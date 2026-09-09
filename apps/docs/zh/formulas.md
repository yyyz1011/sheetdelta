# 公式计算

通过 `sheetdelta-core/formula` 计算明确支持的公式，不会加载文件解析器。要更新 XLSX/XLSM 文件中的公式缓存，使用 `/workbook` 的 `recalculateExcel`。

```ts
import { calculateWorkbook } from 'sheetdelta-core/formula';
const result = calculateWorkbook({
  Orders: { A1: 2, A2: 3, B1: { formula: '=A1*12.5' }, B2: { formula: '=A2*5' } },
  Summary: { A1: { formula: '=SUM(Orders!B1:B2)' } },
});
console.log(result.sheets.Summary.A1); // 40
console.log(result.errors); // []
```

## calculateWorkbook(workbook, options?)

输入按工作表名称、单元格地址组织。每个单元格为字符串、有限数字、布尔值、null/undefined，或 `{ formula: string }`。公式可以包含开头的 `=`。地址支持 `$A$1` 和 `A1`；引用的表名、地址不区分大小写。重复表名、规范化后重复地址会被拒绝，不修改输入。

返回 `{ sheets, errors }`。`sheets` 按原始表名存放计算后的基础值。出错单元格的结果为错误码，并在 `errors` 中记录 `{ sheet, cell, formula, code, message }`。依赖单元格根据本次输入重新计算，多次调用之间不复用旧缓存。直接引用空单元格得到零。

| 支持函数 | 范围 |
| --- | --- |
| `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA` | 单值参数和矩形 A1 区域 |
| `IF`, `IFERROR`, `IFNA` | 只计算需要执行的分支 |
| `AND`, `OR`, `NOT`, `TRUE`, `FALSE` | 逻辑判断 |
| `ABS`, `ROUND` | JavaScript 数字运算；ROUND 位数必须为整数 |
| `LEN`, `LOWER`, `UPPER`, `TRIM`, `CONCAT`, `CONCATENATE` | 基础文本处理；TRIM 合并普通空格 |
| `COUNTIF`, `SUMIF` | 相等和比较条件，不支持通配符条件 |
| `INDEX` | 用正的行、列位置返回单个值 |
| `MATCH` | 必须明确指定精确模式 `0` |
| `VLOOKUP`, `HLOOKUP` | 必须明确指定精确模式 `FALSE` 或 `0` |
| `XLOOKUP` | 精确、正向查找，可指定未找到时的返回值 |

支持 `+ - * / ^ % & = <> < > <= >=`、括号、双引号字符串及双写引号、矩形区域，以及 `'Unit Prices'!$B$2` 这样的跨表引用。乘方按 Excel 从左至右结合，文本比较忽略大小写。数字聚合函数忽略区域中的文本和布尔值，直接传入的参数按各函数规则转换。

## 错误与限制

常见错误码为 `#DIV/0!`、`#VALUE!`、`#REF!`、`#NAME?`、`#NUM!`、`#N/A`，循环引用使用 `#CYCLE!`。非法输入和选项抛出 `SheetDeltaError`，普通公式计算问题通过 `errors` 返回。

| 选项 | 默认值 | 含义 |
| --- | --- | --- |
| `maxCells` | `100000` | 输入中定义的单元格数量 |
| `maxRangeCells` | `100000` | 单个展开区域的单元格数量 |
| `maxDepth` | `128` | 表达式和依赖计算深度，最大可配置为 512 |
| `maxOperations` | `1000000` | 单元格解析和表达式求值共享的工作量预算 |

公式最长 8,192 字符。不会执行 JavaScript `eval`、宏、外部链接或网络函数。

## 兼容边界

这是明确列出的公式子集，并非完整 Excel 计算引擎。暂不支持名称区域、结构化表引用、动态溢出数组、整列区域、通配符或近似查找、本地化分隔符、省略参数、易变日期时间函数和完整财务统计函数库。不支持的语法和函数会返回错误，不会悄悄使用旧缓存。小数遵循 JavaScript 数字精度。

发票样本中有 11 个公式单元格与 LibreOffice 重算缓存进行对照，数字比较允许浮点舍入差异。参见[兼容性证据](./compatibility)和[保留工作簿修改](./workbooks)。

## 跨软件类型规则

聚合函数对单格引用和区域引用采用相同规则，忽略其中的文本和布尔值；直接传入的参数按函数规则转换。这与 [Microsoft 的 SUM 说明](https://learn.microsoft.com/en-us/office/vba/api/excel.worksheetfunction.sum)一致。本 API 的数字条件匹配数字文本，但排除布尔值；文本条件匹配不区分大小写。若数据会在多个表格软件之间计算，先清洗为一致类型。

扩展样本包含 53 个公式，其中 44 个结果与 LibreOffice 缓存一致，9 个混合类型用例固定为本 API 的明确规则并记录差异，不把它们算作跨软件一致。另有发票样本的 11 个公式对照。已识别的 `_xlfn.` 和 `_xlws.` 函数前缀可以读取，工作簿写入会为支持的新函数添加必要前缀。
