# 可复用的业务导入

保存供应商的列映射与文件布局，下次直接复用；把显示标签转换成业务值，再批量调用自己的服务校验记录。仍然只有一个 npm 包：模板和流程从 `/import` 导入，字典转换也能通过 `/clean` 单独使用。

```ts
import {
  serializeImportTemplate, parseImportTemplate, importWithTemplate,
  type ImportTemplate, type ImportBatchRule,
} from 'sheetdelta-core/import';

const template: ImportTemplate = {
  version: 1, id: 'supplier-stock', revision: 1, format: 'csv', headerRow: 1,
  fields: [
    { key: 'sku', source: '商品编号', requiredColumn: true, rule: { required: true } },
    { key: 'active', source: '状态', requiredColumn: true,
      clean: { trim: true, dictionary: { entries: [
        { from: '启用', to: true }, { from: '停用', to: false },
      ] } }, rule: { type: 'boolean' } },
  ],
};
const saved = serializeImportTemplate(template); // 由应用保存这段 JSON。
const restored = parseImportTemplate(saved);

const catalogRule: ImportBatchRule = {
  id: 'catalog-exists',
  async validate(items, { signal }) {
    // 本地演示；实际应用可替换为每批一次的自有 API 请求。
    // 将 signal 传给 fetch；凭据保留在应用里，不写入模板。
    const keys = [...new Set(items.map(item => String(item.values.sku)))];
    const found = new Set(keys.filter(key => key === '001'));
    if (signal.aborted) return [];
    return items.filter(item => !found.has(String(item.values.sku))).map(item => ({
      row: item.row, column: 'sku', code: 'unknown-sku',
      message: '商品编号不存在。', severity: 'error' as const,
    }));
  },
};
const result = await importWithTemplate('商品编号,状态\n001,启用\n999,停用', restored, {
  mode: 'valid-rows', batchRules: [catalogRule],
  batchValidation: { batchSize: 100, concurrency: 2, timeoutMs: 10_000 },
});
console.log(result.status, result.rows.length); // partial 1
console.log(result.rows[0].active); // true
```

包不会自动上传文件或连接数据库，只有调用方提供的回调会发起请求。校验结果沿用现有来源定位和[可修复错误工作簿](./import-workflow)。

## 模板约定

| 属性 | 含义 |
| --- | --- |
| `version` | 配置格式，目前必须为 `1`；未知版本报错 |
| `id`、`revision` | 应用定义的非空标识和正整数修订号；应用负责保存和选择版本 |
| `format` | 明确指定 `csv` 或 `excel`，不根据扩展名猜测 |
| `headerRow` | 从 1 开始的原文件表头位置，默认 `1` |
| `sheet`、`values` | 仅 Excel：工作表名称及 `display`/`raw` 值策略 |
| `delimiter`、`encoding` | 仅 CSV：分隔符及字节编码；编码不会重新解释文本输入 |
| `fields`、`allowUnknownColumns` | 沿用现有字段定义及未知列策略 |

序列化和解析都会校验配置。未知属性、无效字典、函数、undefined、非 JSON 对象、循环引用和非有限数字会报错，不会悄悄丢失。上限为 1 MiB UTF-8 JSON、32 层嵌套。`rule.pattern` 使用正则字符串，不接受 RegExp 对象。来自不可信来源的正则仍需审查：语法校验不等于正则运行时间隔离。

模板不保存文件数据和回调代码。`rowRules`、`tableRules`、`batchRules` 通过 `importWithTemplate` 第三个参数传入，不执行配置中的字符串。原有 `/import` API 仍可直接接收 schema。

保存的显式 `source` 列消失时返回 `missing-column`，不偷偷换列。供应商格式变化后由应用递增 `revision`。不提供自动迁移、模板数据库或凭据存储。`serializeImportTemplate` 返回 JSON；`parseImportTemplate` 返回独立的已校验对象；`importWithTemplate` 返回 `Promise<ImportResult>`。

## 字典转换

使用 `clean.dictionary.entries: [{ from, to }]`。按类型和值精确匹配：数字 `1` 和文本 `'1'` 不同，数字 `0` 与 `-0` 是同一键。支持有限数字、字符串、布尔值和 `null`。重复 `from` 即使目标一致也报配置错误。

顺序为：去空白/大小写 → 空值替换 → 字典 → 显式类型转换 → 校验。字典标签需自行符合配置的规范化规则。未知值默认产生 `dictionary` 问题，该单元格保留原值；显式设置 `unknown: 'keep'` 则保留前面规范化后的值，并继续类型转换。空值也参与字典匹配，需要空值/null 映射或明确选择保留策略。

转换成功后记录原值、新值和来源，不修改输入。`cleanTable` 返回清洗问题；导入流程将其转换为 error 级别问题，参与严格/部分接受判定。

## 异步批量校验

`ImportSchema.batchRules` 同样支持 `prepareImport` 和 `importFile`。三种规则列表中的 ID 必须全局唯一。每个规则接收冻结的 `{ row, values }` 数组及 `{ signal }`。`row` 是从 1 开始的全局数据行编号，不是批内序号或 Excel 物理行号。返回问题数组，列名使用标准字段名；带行号的问题必须属于当前批次。省略行号表示全局问题，error 级别会阻止全部数据通过。

在内置和同步规则之后执行，接收所有处理后数据，包括已有错误的行，查询前应检查类型。结构映射失败或空数据时不调用批量回调。正常业务校验失败应返回问题；服务抛异常或拒绝 Promise 属于执行失败，不会返回成功或部分导入结果。

| `batchValidation` 选项 | 默认 | 范围 |
| --- | --- | --- |
| `batchSize` | 每批 100 行 | 1–10,000 |
| `concurrency` | 4 个回调 | 1–32 |
| `timeoutMs` | 每个回调 30,000 毫秒 | 1–2,147,483,647 |

规则依次执行，每个有界窗口内的批次并发处理，结果始终按输入顺序归并。`maxIssues` 继续限制累计问题数。`batch-rules` 进度按每个规则单独计数，新规则重新开始。不自动重试、不限制每秒请求数、不提供跨批缓存，也不自动删除重复行；示例只在每次查询中去重业务键，仍为每一行返回问题。

超时抛出 `VALIDATION_TIMEOUT`；回调错误包装为 `VALIDATION_FAILED`，保留 `cause`，`context.operation` 为规则 ID。已有 `SheetDeltaError` 保留错误码。取消抛出 `ABORTED`；失败会中止同组任务的 signal，回调结束时也会中止其 signal 以清理资源。定时器和监听器会清理。实际网络任务需要回调遵守 signal 才能停止，取消不能撤销远端副作用，同步 CPU 死循环也无法由定时器打断。校验应使用只读查询，CPU 重任务使用 Worker。

## 边界与升级

新增能力均为可选配置，原有入口、严格默认模式和同步规则继续兼容。不把 Excel 解析变成流式或自动转移到后台线程。模板封装沿用解析器默认预算；需要详细修改解析预算时使用 `importFile`。准备阶段的限制仍可通过运行时选项设置。

参见 [API 案例](./api/all)、[完整类型](./api/types)、[错误码](./errors)和[导入结果](./import-workflow#结果与源位置)。
