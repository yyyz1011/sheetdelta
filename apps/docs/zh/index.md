---
description: 无运行时依赖的 TypeScript 表格对比工具。快速上手、查看示例，或直接查阅 API。
---
<div class="doc-eyebrow">SHEETDELTA / 中文文档</div>

# 找出变化，保留完整上下文。

<p class="doc-lead">按记录的唯一标识比较两份表格。即使行顺序改变，也能找到对应的数据，并获得可直接用于业务逻辑的差异结果。</p>

<div class="doc-meta"><span>TypeScript + JavaScript</span><span>零运行时依赖</span><span>MIT 开源协议</span></div>

```sh
npm install sheetdelta-core
```

<div class="delta-preview"><header><span>按 SKU 匹配</span><span>1 个字段变化</span></header><div class="delta-line"><span>001 · price</span><span><del>129.00</del></span><span><ins>119.00</ins></span></div></div>

## 从这里开始

<div class="doc-paths"><a class="doc-path" href="./quick-start.html"><strong>接入第一次比较 →</strong><span>安装 npm 包，用几行代码得到比较结果。</span></a><a class="doc-path" href="./browser-tool.html"><strong>在浏览器中比较文件 →</strong><span>本地读取 Excel 或 CSV，无需编写代码。</span></a><a class="doc-path" href="./api/compare-tables.html"><strong>查阅 API →</strong><span>配置选项、返回类型、结果顺序和数据校验。</span></a><a class="doc-path" href="./mapping.html"><strong>映射你的数据 →</strong><span>处理不同列名、复合键和文本编号。</span></a></div>

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
| 输入 | JavaScript 对象数组 | CSV、TSV、XLSX、XLS 文件 |
| 匹配 | 单列键或复合键 | 单列键 |
| 输出 | 带类型的结果和 CSV 文本 | 可视化差异和 CSV 下载 |
| 适合 | 集成到业务系统 | 手动核对文件 |

核心包负责比较记录，文件解析由浏览器工具单独处理。不计算 Excel 公式，也不比较单元格样式。

## 运行环境

支持 Node.js 18+ 的 ESM 环境，以及支持 `structuredClone` 的现代浏览器。内置 TypeScript 类型声明。比较是同步执行的，浏览器处理较大数据集时建议放入 Web Worker。
