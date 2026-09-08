# 表里 SheetDelta

按唯一键比较两份表格，找出新增、删除和修改，并导出 CSV 报告。项目包含无运行时依赖的 TypeScript 核心包，以及用于比较 Excel / CSV 文件的浏览器工具。

[English](README.md) · **简体中文**

[英文文档](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/) · [中文文档](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/zh/) · [浏览器工具](https://sheetdelta.snowy-hero-3539.chatgpt.site/playground/) · [npm](https://www.npmjs.com/package/sheetdelta-core) · [更新记录](https://github.com/yyyz1011/sheetdelta/releases)

## 安装

```sh
npm install sheetdelta-core
```

使用 ESM，支持 Node.js 18+ 或具有 `structuredClone` 的现代浏览器。内置 TypeScript 类型声明，无运行时依赖。

## 快速示例

```ts
import { compareTables, exportDiffCsv } from 'sheetdelta-core';

const result = compareTables(
  [{ sku: '001', price: '129.00' }],
  [{ id: '001', price: '119.00' }],
  {
    keys: [{ left: 'sku', right: 'id' }],
    columns: [{ left: 'price', right: 'price' }],
  },
);

console.log(result.summary.changed); // 1
const csv = exportDiffCsv(result);
```

继续阅读 [快速开始](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/zh/quick-start.html)、[API 参考](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/zh/api/compare-tables.html) 或 [核心包 README](packages/core/README.md)。

## 功能

- 按唯一键匹配，不受行顺序影响；支持复合键和两侧不同列名。
- 返回新增、删除、修改和未变化记录，以及字段级变化前后值。
- 可选忽略首尾空格、忽略大小写和字段级数值容差。
- 明确报告缺少列、空编号和重复编号等数据问题。
- CSV 导出默认开启公式转义。
- 浏览器工具支持 CSV、TSV、XLSX、XLS，以及工作表选择、差异展示、筛选、导出和保存规则。
- 文档提供中英文、全文搜索和明暗主题切换。首次打开默认英文浅色，之后记住主题选择。

## 浏览器工具与隐私

文件通过浏览器 Worker 在本地解析和比较，不上传、不持久化。localStorage 仅保存规则名称、映射和选项。目前没有第三方广告或远程统计。

工具界面当前为中文。每个文件最多 10 MB，工作簿总计最多 50,000 数据行，每张表最多 100 列。核心包支持复合键，工具目前选择单列键。

Excel 按显示值比较，不重新计算公式，不比较样式、批注或合并单元格语义。解析前请保留编号的文本类型。数值容差使用 IEEE 754 数字，精确金额建议先标准化为文本；导入 CSV 时应将编号列设为文本，避免 Excel 丢失前导零。

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

GitHub Actions 使用可信发布，从 `master` 自动更新 npm。正式版本和变更记录以 Git 标签、GitHub Releases 和 npm 为准；开发工作区保留初始版本号。详见 [发布维护指南](docs/RELEASING.md)。

修改文档时，请同时维护英文页面和 `apps/docs/zh/` 中对应的中文页面。语言切换会保留当前章节。报告问题时请提供不含敏感信息的最小复现。

## 开源协议

[MIT](LICENSE)。文件解析使用 Papa Parse 和官方 SheetJS 0.20.3 分发版本，文档使用 VitePress。
