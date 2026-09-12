# SheetDelta

面向 TypeScript / JavaScript 的 Excel 与 CSV 数据工具包：读取、校验、清洗、比较、合并并导出报告。**一个 npm 包，按功能导入。**

[English](README.md) · **简体中文**

[English docs](https://sheetdelta.nimokit.com/docs/) · [中文文档](https://sheetdelta.nimokit.com/docs/zh/) · [浏览器工具](https://sheetdelta.nimokit.com/playground/) · [npm](https://www.npmjs.com/package/sheetdelta-core)

```sh
npm install sheetdelta-core
```

```ts
import { readCsv } from 'sheetdelta-core/csv';
import { compareTables } from 'sheetdelta-core/compare';
import { exportDiffExcel } from 'sheetdelta-core/excel';
const before = readCsv('sku,price\n001,10');
const after = readCsv('sku,price\n001,12');
const result = compareTables(before.rows, after.rows, { keys: ['sku'] });
const report = await exportDiffExcel(result); // XLSX Uint8Array
```

## 导入与纠错

表头别名和显式映射、独立的必需列检查、跨字段/表级规则、严格或有效行模式、源位置追踪，以及高亮错误工作簿。

[导入教程](https://sheetdelta.nimokit.com/docs/zh/import-workflow.html) · [完整 API 和可运行案例](https://sheetdelta.nimokit.com/docs/zh/api/all.html) · [类型参考](https://sheetdelta.nimokit.com/docs/zh/api/types.html)

## 可复用业务导入

支持版本化 JSON 导入模板、业务字典转换、异步批量校验（批量大小、并发、超时、取消）。仍通过 `sheetdelta-core/import` 和 `/clean` 按需使用；模板不保存回调或凭据。参见[完整用法和案例](https://sheetdelta.nimokit.com/docs/zh/reusable-imports.html)。

## 工作簿与流式处理

- **公式计算**：跨表引用、依赖重算、条件和聚合函数，以及精确 VLOOKUP/XLOOKUP/INDEX/MATCH；不支持的公式返回明确错误。
- **保留模板修改**：定点修改 XLSX/XLSM，保留未改动的样式、图表、批注、校验和 VBA 内容；宏不会执行。
- **逐行读写**：CSV 流式解析和写出、XLSX 流式写出、Node 本地 XLSX 逐行读取，以及有序数据流比较。
- **跨应用证据**：LibreOffice 真实重算、Excel 元数据的 Apache POI 文件样本，以及百万行逐行写出/读回基准。

[公式文档](https://sheetdelta.nimokit.com/docs/zh/formulas.html) · [保留工作簿修改](https://sheetdelta.nimokit.com/docs/zh/workbooks.html) · [流式处理](https://sheetdelta.nimokit.com/docs/zh/streaming.html)


## 可靠性与大任务

- **异步比较**：`compareTablesAsync` 支持进度和 `AbortSignal` 取消；`includeUnchanged: false` 减少结果占用，完整统计保留。
- **明确的导入规则**：隐藏表策略、公式缓存警告、合并单元格与错误单元格策略，原始行位置和 1904 日期系统元数据。
- **CSV 字节读取**：`readCsvBytes` 支持明确指定 UTF-8、GB18030 等编码，拒绝损坏字节。
- **结构化错误**：`sheetdelta-core/errors` 导出 `SheetDeltaError` 与 `isSheetDeltaError`，错误码和位置便于应用处理。
- **整本工作簿限制**：默认 10 万物理数据行和 100 万矩形单元格，可配置；单表与字节限制继续生效。

查看[异步与 Worker 示例](https://sheetdelta.nimokit.com/docs/zh/async.html)、[错误码](https://sheetdelta.nimokit.com/docs/zh/errors.html)、[兼容性与性能证据](https://sheetdelta.nimokit.com/docs/zh/compatibility.html)。**升级注意**：Excel 错误单元格现在默认拒绝，如需保留为文本，请设置 `cellErrors: 'text'`。详情见[升级说明](https://sheetdelta.nimokit.com/docs/zh/migration.html)。


## 功能与入口

| 入口 | 功能 |
| --- | --- |
| `/compare` | 主键/联合主键比较、字段映射、自动列选择、忽略列、列结构变化、严格类型和数值容差 |
| `/csv` | CSV 读取、通用导出、差异报告、危险文本转义 |
| `/excel` | XLSX/XLS 读取、工作表/表头选择、显示值/原始值、XLSX 导出和高亮差异报告 |
| `/validate` | 必填、类型、唯一性、范围、枚举、正则、有效 ISO 日期 |
| `/clean` | 显式清洗和转换、变更记录、按主键去重、源记录位置 |
| `/merge` | 左/内/全连接、冲突报告、严格或并集结构的纵向追加 |
| `/import` | 表头映射、清洗、业务校验、部分接收和源位置追踪 |
| `/import-report` | 可修改的 XLSX 错误报告、单元格高亮和源位置明细 |
| `/session` | 持久化浏览器 Worker 会话：工作表预览、可视化映射、批量纠错和延后传输完整结果 |
| `/errors` | 结构化错误码、上下文和序列化 |
| `/formula` | 公式计算及跨表依赖 |
| `/workbook` | 保留工作簿内容修改、公式重算 |
| `/stream` | CSV 流式读写、排序数据流比较 |
| `/excel-stream` | XLSX 流式导出 |
| `/excel-node` | Node 本地 XLSX 流式读取 |
| `/types` | 公共 TypeScript 类型 |

旧根入口继续兼容，根入口和 `/compare` 不加载第三方运行时代码。安装时包含完整文件依赖，前端构建按实际引用纳入模块，Excel 依赖使用时再加载。详见 [按需导入](https://sheetdelta.nimokit.com/docs/zh/imports.html)。

## 数据规则

- npm 不上传数据，不包含统计或广告。
- 比较保留旧的文本规则；严格类型需显式开启。缺失、重复主键报错。
- 合并、去重区分主键类型：数字 `1` 和文本 `'1'` 不同。
- 清洗返回变更和失败记录，合并冲突默认报错，不静默覆盖。
- Excel 默认读取显示文本；原始模式保留基本类型，日期为数字序列值。公式只读取缓存结果，不求值。
- Excel 默认限制 20 MiB、每张表 50,000 物理数据行、1,000 列，可配置，超限报错。
- 数组 API 和工作簿修改在内存中处理；专用流式 API 增量处理，Node XLSX 读取在可配置限制内缓存共享字符串。公式支持范围以文档列表为准，不执行宏、不比较样式差异。
- 数值采用 JavaScript 浮点数；精确小数请使用规范文本，已损坏的编号无法恢复。

支持 ESM、Node.js 18+ 和支持 structuredClone 的现代浏览器，内置类型声明。详见 [完整流程](https://sheetdelta.nimokit.com/docs/zh/workflow.html) 与 [升级说明](https://sheetdelta.nimokit.com/docs/zh/migration.html)。

## 浏览器工具

独立网页提供文件比较、可视化差异、规则保存和 CSV 下载，当前为中文界面、单列键。新增校验/清洗/合并模块通过 npm 使用。网页限制保持为每文件 10 MB、每工作簿 50,000 总数据行、每表 100 列，没有远程统计或第三方广告。

## 本地开发

使用 Node.js 24.10+、npm 11.5.1+。

```sh
npm ci
npm run dev          # 浏览器工具：http://127.0.0.1:5178
npm run docs:dev     # 文档站：http://127.0.0.1:5179/docs/
```

```sh
npm run check        # 单元测试、类型检查、工具构建
npm run test:e2e     # 现有浏览器工具回归测试
npm run site:build   # 构建中英文文档和工具到 dist/
npm run site:check   # 验证静态路由、语言和默认主题
npm run pack:core    # 在 artifacts/ 生成 npm 压缩包
```

macOS 测试默认使用 Chrome。Linux 先运行 `npx playwright install --with-deps chromium`，或通过 `CHROME_PATH` 指定浏览器。

## 项目目录

| 目录 | 用途 |
| --- | --- |
| `packages/core/` | 发布到 npm 的 TypeScript 比较核心 |
| `apps/docs/` | VitePress 文档，中英文 Markdown |
| `apps/web/` | React 浏览器工具和本地文件解析 |
| `scripts/` | npm 包和静态站点验证 |
| `tests/` | 核心、解析和浏览器回归测试 |
| `docs/RELEASING.md` | npm 发布维护说明 |
| `docs/HOSTING.md` | 文档站托管与更新说明 |

## 贡献与发布

创建功能分支和 PR，通过必需检查后 squash 合并。`fix(core): ...` 发布补丁版本，`feat(core): ...` 发布功能版本，不兼容修改在正文写 `BREAKING CHANGE:`。文档和 `web` 范围的提交不会单独触发 npm 发版。

每次合并到 `master` 后，GitHub Actions 检查包和文档，通过后自动把文档站及浏览器工具部署到 [GitHub Pages](https://sheetdelta.nimokit.com/docs/)，同时使用可信发布更新符合发版规则的 npm 版本。纯文档修改也会更新网站，不会产生空的 npm 版本。正式版本和变更记录以 Git 标签、GitHub Releases 和 npm 为准；开发工作区保留初始版本号。详见 [发布维护指南](docs/RELEASING.md)。

修改文档时，请同时维护英文页面和 `apps/docs/zh/` 中对应的中文页面。语言切换会保留当前章节。报告问题时请提供不含敏感信息的最小复现。

## 开源协议

[MIT](LICENSE)。文件解析使用 Papa Parse 和官方 SheetJS 0.20.3 分发版本，文档使用 VitePress。

## Worker 导入与框架示例

通过 `sheetdelta-core/worker` 按需导入 `runImportWorker` 和 `installImportWorker`，在线程内处理 CSV/Excel 导入和纠错报告，支持取消及超时。React/Vue 不进入核心依赖。[接入指南及限制](https://sheetdelta.nimokit.com/docs/zh/worker-imports) · [在线示例](https://sheetdelta.nimokit.com/examples/)。

## 导入纠错与性能

通过 `sheetdelta-core/import` 按需导入 `repairImport`，修改来源单元格后重新全量校验，无需再次解析文件。React/Vue 示例支持页面内纠错。[使用方法与可复现性能数据](https://sheetdelta.nimokit.com/docs/zh/import-repair)，仓库内运行 `npm run bench:import` 可执行已解析表格基准。

## Worker 纠错与按需报告

通过 `sheetdelta-core/worker` 的 `runRepairWorker`、`runReportWorker` 将纠错与 XLSX 报告生成移到独立线程。React/Vue 示例支持点击问题定位修改、下载时生成报告，以及编辑成功前复用报告缓存。[接入指南](https://sheetdelta.nimokit.com/docs/zh/worker-imports)。

## 持久化导入工作台

交互式导入可使用 `sheetdelta-core/session` 的 `createImportSession`。CSV 或 Excel 只在持久化 Worker 中解析一次；页面仅接收有限工作表预览，可映射陌生表头、一次提交多处来源单元格纠错、按需生成报告，并在交付时才收集完整可提交行。[完整指南](https://sheetdelta.nimokit.com/docs/zh/import-sessions) · [React/Vue 在线工作台](https://sheetdelta.nimokit.com/examples/)。
