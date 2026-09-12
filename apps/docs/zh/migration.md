# 升级与兼容

本次工具包升级增加子路径与文件处理模块。旧根入口、显式字段映射、默认文本比较、结果排序和差异 CSV 行为保持兼容。

```ts
// 旧代码继续可用。
import { compareTables, exportDiffCsv } from 'sheetdelta-core';
import type { CompareOptions } from 'sheetdelta-core';
const options: CompareOptions = {
  keys: [{ left: 'id', right: 'id' }],
  columns: [{ left: 'price', right: 'price' }],
};
```

简写主键、自动列选择和忽略列表使用 `CompareInputOptions`。`CompareOptions` 保持旧版必填显式映射类型。无论输入形式如何，结果中的 options 都是展开后的字段映射。

```ts
import type { CompareInputOptions } from 'sheetdelta-core/types';
const options: CompareInputOptions = { keys: ['id'], ignoreColumns: ['updatedAt'] };
```

## 显式选择新行为

- 默认文本比较不变：`10` 与 `'10'` 相等，null/undefined/空字符串相等。严格类型用 `valueMode: 'strict'`，区分空值用 `emptyValues: 'distinct'`。
- 省略 `columns` 自动比较共同非主键列；显式空数组仍报错。
- 列变化在 `result.schema`，不单独改变行状态。列结构从记录字段推断，空数组本身没有列结构。
- 合并、去重采用带类型的主键和精确值，不继承比较模块的规范化规则。
- Excel 读取异步执行，默认显示文本，不计算公式。

## 包结构

安装包新增文件格式依赖；根入口和 `/compare` 不运行第三方依赖，新模块通过独立入口使用。未提供 CommonJS 构建，请使用 ESM 或动态 import。内部文件路径不开放。

## 能力边界

表格 API 聚焦数据处理，公式、工作簿修改和流式处理使用下方独立模块。不提供宏执行、格式差异比较、模糊行匹配或多对多合并。浏览器工具仍是文件比较界面；新增校验、清洗和合并功能通过 npm API 使用。

当一侧为空时，自动使用另一侧的非主键字段，保证新增或删除报告保留数据。

## 0.3 可靠性升级

根入口与旧 `CompareOptions` 类型保留。新增可取消的 `compareTablesAsync`、`includeUnchanged`、`readCsvBytes` 和 `/errors` 入口。

需检查的行为变化：Excel 错误单元格默认抛出 `CELL_ERROR`，如需保留显示内容，请明确选择 `{ cellErrors: 'text' }`；新增整本 10 万物理行、100 万矩形单元格限制，可按资源预算调整。Excel 入口只接受实际 XLSX/XLS 字节，CSV 请使用 `/csv`。比较会拒绝非有限数字和对象等超出 `Cell` 类型的输入，而不是隐式转成字符串。

`includeUnchanged: false` 时，`result.rows.length` 可以小于 `summary.total`。完整数量使用汇总字段。原 `TableValidationError.issues` 和 `MergeConflictError.conflicts` 保留，统一错误基类改变了部分英文错误文案，请使用错误码。

阅读[异步与 Worker](./async)、[错误处理](./errors)和[兼容性与性能](./compatibility)。

## 0.4 工作簿处理升级

新增 `/formula`、`/workbook`、`/stream`、`/excel-stream`、`/excel-node`，仍是单个 npm 包。已有根入口和 0.3 API 不变。`/excel-node` 仅供 Node，浏览器请使用其他入口。

公式计算只覆盖文档列出的子集；未支持的公式明确返回错误。`patchWorkbook` 默认清除公式缓存并请求打开时重算，立即读取结果前先调用 `recalculateExcel` 或交由表格应用重算。有序流比较要求预先排序、明确字段，结果按键排序，可能在已经输出部分结果后遇到错误。参见[公式](./formulas)、[工作簿](./workbooks)、[流式处理](./streaming)。

## 0.5 导入与文档

新增 `/import`、`/import-report`，旧入口与比较默认行为保留。`validateTable` 增加可选问题数量预算。XLSX 读取新增默认 200 MiB 解压预算和 10,000 条目上限；超过时须显式调整，但非法 ZIP 包仍拒绝。[导入流程](./import-workflow)与[完整 API 案例](./api/all)列明参数、结果和限制。


## 可复用导入（0.6）

新增可选字典、JSON 模板和异步批量规则，原有调用行为保留。`CleanIssue.code` 新增 `dictionary`；`ErrorCode` 新增 `VALIDATION_TIMEOUT`、`VALIDATION_FAILED`；进度新增 `batch-rules`。如有穷尽 switch 检查需相应更新。参见[用法与边界](./reusable-imports)。

## 持久化导入会话（0.10）

新增 `/session` 入口，原有一次性 Worker API 不变。`ErrorCode` 增加 `SESSION_BUSY`、`SESSION_CLOSED`，穷尽 switch 需同步更新。一个会话独占一个 Worker 并保留解析数据，结束后应调用 `close()`；任何命令取消或超时都会关闭整个会话。参见[会话生命周期与案例](./import-sessions)。
