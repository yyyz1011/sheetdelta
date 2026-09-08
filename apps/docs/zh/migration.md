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

本版聚焦表格数据处理，不是在线编辑器或公式引擎。不提供宏、公式求值、格式差异比较、模糊行匹配、多对多合并或恒定内存流式处理保证。浏览器工具仍是文件比较界面；新增校验、清洗和合并功能通过 npm API 使用。
