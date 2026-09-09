---
description: 支持按需导入的 TypeScript Excel 与 CSV 数据工具包。读取、校验、清洗、比较、合并并导出报告。
---
<div class="doc-eyebrow">SHEETDELTA / 中文文档</div>

# 让 Excel 与 CSV 数据接入你的应用。

<p class="doc-lead">用一个包完成读取、校验、清洗、比较和合并，生成可交付的 Excel 报告。按功能导入，保留清晰的数据处理规则。</p>

<div class="doc-meta"><span>TypeScript + JavaScript</span><span>按需导入</span><span>MIT 开源协议</span></div>

```sh
npm install sheetdelta-core
```

<div class="delta-preview"><header><span>按 SKU 匹配</span><span>1 个字段变化</span></header><div class="delta-line"><span>001 · price</span><span><del>129.00</del></span><span><ins>119.00</ins></span></div></div>

## 从这里开始

<div class="doc-paths"><a class="doc-path" href="./quick-start.html"><strong>接入第一次比较 →</strong><span>安装 npm 包，用几行代码得到比较结果。</span></a><a class="doc-path" href="./browser-tool.html"><strong>在浏览器中比较文件 →</strong><span>本地读取 Excel 或 CSV，无需编写代码。</span></a><a class="doc-path" href="./api/all.html"><strong>查阅 API →</strong><span>配置选项、返回类型、结果顺序和数据校验。</span></a><a class="doc-path" href="./mapping.html"><strong>映射你的数据 →</strong><span>处理不同列名、复合键和文本编号。</span></a></div>

## 核心包能做什么

- 按一个或多个唯一键匹配记录，不受行顺序影响。
- 区分**新增、删除、修改和未变化**四种状态。
- 保留变化前后值和字段级差异。
- 支持字段映射、文本标准化和可选数值容差。
- 在返回结果前校验缺少编号、重复编号等数据问题。
- 导出 CSV 差异报告，默认开启电子表格公式转义。

## 选择核心包还是浏览器工具？

| | npm 核心包 | 浏览器工具 |
| --- | --- | --- |
| 输入 | 对象数组、CSV 文本、XLSX/XLS 字节 | CSV、TSV、XLSX、XLS 文件 |
| 匹配 | 单列键或复合键 | 单列键 |
| 输出 | 类型化结果、CSV、XLSX 报告 | 可视化差异和 CSV 下载 |
| 适合 | 集成到业务系统 | 手动核对文件 |

通过 `/csv` 和 `/excel` 读取文件；比较、校验、清洗、合并基于统一记录结构。公式计算、保留模板修改和流式处理通过独立入口提供；不提供单元格样式差异比较。

## 运行环境

支持 Node.js 18+ 的 ESM 环境，以及支持 `structuredClone` 的现代浏览器。内置 TypeScript 类型声明。比较是同步执行的，浏览器处理较大数据集时建议放入 Web Worker。

## 完整工具包

- [按需导入](./imports)：一个安装包，多个独立功能入口。
- [Excel 文件与报告](./excel)、[CSV 文件](./csv)：读取文件并导出结果。
- [数据校验](./validate)、[清洗与去重](./clean)、[合并与追加](./merge)：准备业务数据。
- [完整流程](./workflow)：从导入到报告的可运行示例。
- [升级说明](./migration)：旧 API 兼容与显式规则。

## 可靠性工具

- [异步与 Worker](./async)：进度、取消和精简差异结果。
- [结构化错误](./errors)：稳定错误码和源位置。
- [兼容性与性能](./compatibility)：独立生成的工作簿样本、可复现基准与明确边界。

## 进一步处理工作簿

- [公式计算](./formulas)：常见业务函数、跨表依赖与精确查询。
- [保留工作簿修改](./workbooks)：修改指定值，保留样式、图表和其他内容。
- [流式处理](./streaming)：CSV、XLSX 逐行读写与有序数据流比较。

## 导入与纠错

[从表头映射到错误工作簿](./import-workflow)：独立检查缺列和空值，执行跨字段规则，保留源位置，修正后重新导入。[完整 API 使用方法](./api/all)包含每个运行时接口的可执行案例，[类型参考](./api/types)列出所有选项结构。
