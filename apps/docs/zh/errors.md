# 结构化错误

库的参数校验和导入失败使用 `SheetDeltaError`。请根据稳定错误码处理，不要匹配英文错误文案。

```ts
import { SheetDeltaError, isSheetDeltaError } from 'sheetdelta-core/errors';
import { readCsv } from 'sheetdelta-core/csv';
try {
  readCsv('id,id\n001,2');
} catch (error) {
  if (isSheetDeltaError(error)) {
    console.log(error.code, error.context); // INVALID_HEADER 与来源信息
    console.log(error.toJSON()); // 包含文案、错误码、上下文，不包含 cause 或堆栈
  } else throw error;
}
```

| 错误码 | 含义与处理方式 |
| --- | --- |
| `INVALID_OPTIONS` | 修正键、限制、映射或策略参数 |
| `INVALID_DATA` | 传入由受支持基础类型组成的行记录 |
| `INVALID_HEADER` | 修正空、重复或缺失表头 |
| `LIMIT_EXCEEDED` | 缩小输入，或明确提高对应限制 |
| `INVALID_CSV` | 检查引号格式和文本编码 |
| `INVALID_WORKBOOK` | 确认是真实 XLSX/XLS 字节，不支持损坏或加密文件 |
| `SHEET_NOT_FOUND`, `EMPTY_WORKBOOK` | 修正工作表选择或提供可读取的数据 |
| `TABLE_VALIDATION` | 比较键或字段异常，检查 `issues` |
| `MISSING_KEY`, `DUPLICATE_KEY` | 合并、去重时的键问题，检查来源上下文 |
| `SCHEMA_MISMATCH`, `MERGE_CONFLICT` | 修正追加表结构，或指定合并冲突策略 |
| `FORMULA_REJECTED`, `MERGED_CELLS`, `CELL_ERROR` | Excel 导入策略拒绝了某个单元格 |
| `ABORTED` | 调用方取消了比较 |
| `VALIDATION_TIMEOUT` | 批量校验回调超时 |
| `VALIDATION_FAILED` | 批量校验抛错或拒绝；检查 cause 和 context.operation |
| `EXPORT_FAILED` | 无法构建生成的报告 |

上下文随操作而不同，可能包含 `operation`、`sheet`、`row`、`column`、`cell`、`side`、`limit`、`actual`、`option`。CSV 行表示逻辑记录，工作表行表示从 1 开始的物理行，比较与合并的行表示从 1 开始的输入数据位置。并非每个错误都包含所有字段。

`TableValidationError` 仍可从根入口和 `/compare` 导入，保留 `issues`。`MergeConflictError` 仍可从 `/merge` 导入，保留 `conflicts`。两者现在继承 `SheetDeltaError`，`toJSON()` 会带上相应问题或冲突详情。数据校验的正常发现和清洗的转换问题仍通过结果对象返回，不会一律抛错。

`isSheetDeltaError` 使用当前运行环境的 `instanceof`。Worker 消息是普通序列化对象，跨线程后请检查 `code`。调用方回调异常、依赖加载失败和资源耗尽不保证转换为库错误。问题或冲突详情可能含业务值，记录日志时注意这些内容。
