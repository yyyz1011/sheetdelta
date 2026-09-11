# 页面内纠错与重新校验

`repairImport` 修改已有导入结果中的来源单元格，无需重新解析文件。返回修正后的源数据、新的问题和可提交数据，先前结果不变。

```ts
import { importFile, repairImport } from 'sheetdelta-core/import';
const schema = { fields: [
  { key: 'sku', aliases: ['SKU'], rule: { unique: true } },
  { key: 'qty', clean: { type: 'number' as const }, rule: { min: 0 } }
] };
const previous = await importFile('SKU,qty\n001,-2', schema, { format: 'csv' });
const result = await repairImport(previous, [
  { row: 1, column: 'qty', value: '2' }
], schema, { mode: 'valid-rows' });
console.log(result.rows); // [{ sku: '001', qty: 2 }]
```

## 坐标与行为

- `row` 是从 1 开始的**原始数据行序号**，不含表头，不是工作表行号，也不是可提交 `rows` 的序号。
- `column` 是精确的**来源表头**，例如 `SKU`，不是标准字段别名 `sku`。问题中的 `source.sourceColumn` 提供此值。
- 拒绝同一个单元格的重复修改、越界坐标及非有限值。清空单元格可用 `null`。
- 重新执行全表清洗、唯一性和传入的业务规则。修改一个 ID 可能让另一行变成重复，不能只校验修改行。
- 需要重新传入 schema 和业务规则，`ImportResult` 不保存这些配置。需要部分接受时再次设置 `mode: 'valid-rows'`，默认仍为严格模式。文件名和来源位置类型默认从旧结果推断，也可覆盖。
- 修改 schema 后传入空修改列表，可修复列映射；单元格修改不支持新建缺失列。
- 新结果的 `original` 是修正后的来源表格；`changes` 记录本轮清洗，不是持久化手动编辑历史。需要历史时保留旧结果。

## React / Vue 示例

[打开工作台](https://sheetdelta.nimokit.com/examples/)，导入样例后，在 **Repair a source cell** 中依次修改：数据行 `2`、列 `qty`、值 `3`；数据行 `3`、列 `active`、值 `Yes`。无需重新上传，三行即可全部通过。

首次文件导入使用 Worker。当前纠错示例在调用线程分批处理并按需生成报告，同步校验及报告生成仍可能占用该线程；它不是虚拟化表格编辑器，也不是限定内存的导入引擎。

## 性能测量

本地已解析表格基准：**2026-09-12，Apple M4、macOS arm64、Node 25.9.0**。每项预热一次，再测量五次，取中位数。每行五列，包含三次清洗变化和唯一键校验，无自定义业务回调。

| 操作 | v0.7.0 | 优化后 | 耗时减少 |
| --- | ---: | ---: | ---: |
| 准备 1,000 行 | 7.77 ms | 6.44 ms | 17% |
| 准备 10,000 行 | 73.76 ms | 47.94 ms | 35% |
| 准备 50,000 行 | 355.14 ms | 228.08 ms | 36% |
| 匹配 1,000 列表头 | 34.71 ms | 1.53 ms | 96% |

优化包括：表头索引、复用来源列定位、无业务规则时跳过冻结副本及批次等待，以及复用清洗和校验规则条目，避免逐行重建。

这些数据不包含 CSV/XLSX 文件解析、报告生成、Worker 传输和网络时间，不能推断峰值内存下降，也不保证所有业务有相同提升。列宽、规则、设备及 GC 都会影响结果。为保证跨行校验正确，仍然执行全表校验。

运行 `npm run bench:import` 可复现。[原始记录](https://github.com/yyyz1011/sheetdelta/blob/master/benchmarks/import-2026-09-12.json)保留五次样本及方法。脚本可接收历史版本构建后的 `import.js` 路径，用同一数据集比较。

[API 参考](./api/repair-import) · [流式处理方案](./streaming)
