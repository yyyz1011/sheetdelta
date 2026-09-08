# 表里 SheetDelta

在浏览器里比较两份 Excel / CSV：按唯一编号匹配记录，查看新增、删除和修改，导出差异，保存规则供下次使用。

这是独立的新项目，不依赖当前目录中的其他应用。npm 包名为 `sheetdelta-core`；[GitHub 仓库](https://github.com/yyyz1011/sheetdelta)。首次 npm 发布和可信发布绑定仍需完成，网站尚未部署到公网。

## 启动

开发和自动发布使用 Node.js 24.10+、npm 11.5.1+；npm 核心包的使用者只需 Node.js 18+。

```sh
npm install
npm run dev
```

打开 http://127.0.0.1:5178 。可以直接点「试用商品示例」，也可以选择真实文件。

```sh
npm run check        # 单元测试、类型检查与生产构建
npm run test:e2e     # 浏览器工作流测试
npm run pack:core    # 生成 artifacts/sheetdelta-core-0.1.0.tgz
```

浏览器测试默认使用 macOS 的 Google Chrome；Linux/CI 使用 `npx playwright install --with-deps chromium` 安装测试浏览器；也可设置 `CHROME_PATH`。生产构建位于 `apps/web/dist`，可由静态服务器托管。`/guide/` 与 `/docs/` 为真正的静态 HTML 页面，托管时应支持目录 index.html。

## 已实现

- CSV（UTF-8 / GB18030 回退）、TSV、XLSX / XLS；Excel 多工作表选择。
- 按编号匹配，忽略行顺序；保留文本 SKU 前导零。
- 字段选择和两侧不同列名映射。
- 可选忽略首尾空格、大小写、字段级数值容差。
- 阻止重复编号、缺少编号、重复/空表头等不确定比较。
- 新增/删除/修改/未变化统计，单元格前后值高亮，搜索和分页。
- 导出含前后字段与记录位置的差异 CSV，默认转义公式前缀。
- 最多 20 条本地规则，持久化、应用、删除。
- 桌面和手机界面；文件读取与比较通过 Web Worker 执行。
- 静态使用指南、npm 接入文档，以及无文件内容的本地事件挂钩。
- 独立的无运行时依赖 npm 核心包，包含 TypeScript 声明。

## 目录

```text
apps/web/             网站界面、文件解析、Web Worker
apps/web/guide/       静态使用指南
apps/web/docs/        静态开发者文档
packages/core/        可打包的 TypeScript 比较引擎
tests/               核心、文件解析和浏览器回归测试
artifacts/           本地 npm 打包产物
docs/qa/             验证记录与已知边界
.impeccable/review/   桌面与手机截图
PRODUCT.md           产品范围和未决事项
DESIGN.md            界面设计记录
```

## 数据语义与边界

每个文件最多 10 MB；整个工作簿最多 50,000 数据行，每张表最多 100 列。首个非空记录是表头，空记录忽略。CSV 中包含换行的引号字段仍是一条记录，提示/导出中的行号是 CSV 记录位置。

Excel 比较显示值，不计算公式、不比较样式、批注或合并单元格语义。公式需先在 Excel 内重新计算并保存；不能恢复源文件已丢失的前导零。当前网站只选择单列键，核心支持复合键。数值容差使用 IEEE 754 Number，精确金额建议按标准化文本比较。导出按字符串保留原内容，但 Excel 自行打开 CSV 可能再次推断数字格式；通过导入向导指定编号列为文本可保留零前缀。

文件不上传、不持久化；localStorage 只保存规则名称、列名和选项。当前没有第三方广告、远程统计或账户系统。尚未验证真实流量、回访率、广告收益、跨浏览器完整兼容性和恶意工作簿解压资源边界。

## 后续上线事项

选定网站域名和静态托管、按实际隐私与广告方案接入统计。npm 发布流程见 [发布维护指南](docs/RELEASING.md)。站内先看真实文件的成功比较、导出和回访，示例点击单独记录。当前事件只派发在浏览器内部，不构成线上 UV 统计。

SheetJS 采用官方 0.20.3 分发源，而非 npm registry 中陈旧版本；锁文件固定依赖。参考：https://docs.sheetjs.com/docs/getting-started/installation/frameworks/
