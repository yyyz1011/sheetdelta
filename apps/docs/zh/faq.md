# 常见问题

## 安装这个包会上传我的数据吗？

不会。核心包在当前进程中比较数据，不包含网络请求功能。浏览器工具也在本地处理文件。

## 能直接把 Excel 文件传给 compareTables 吗？

不能。请先把文件解析成对象记录，再调用 `compareTables`。需要现成的文件操作流程，可以使用 [浏览器工具](./browser-tool)。

## 为什么文件行顺序改变，却没有差异？

记录按键匹配。同一条记录仅改变位置不会被判定为修改，结果仍按文档说明的输入顺序排列。

## 为什么 10 和 10.0 不相同？

它们的文本表示不同。可为该比较字段设置 `numericTolerance: 0`，按数值比较，同时不接受任何非零差值。

## 能比较嵌套对象吗？

单元格只支持基本值类型。请先把嵌套值展开到列中。

## 支持 CommonJS 的 require 吗？

核心包使用 ESM。请使用 ESM import，或在 CommonJS 中动态调用 `import('sheetdelta-core')`。

## 如何贡献或报告问题？

在 [GitHub Issues](https://github.com/yyyz1011/sheetdelta/issues) 中提供不含敏感信息的最小复现。代码贡献通过 PR 提交，项目采用 MIT 协议。

## 在哪里看更新记录？

查看 [GitHub Releases](https://github.com/yyyz1011/sheetdelta/releases)。核心修复和功能合并到 master 后，测试通过即可自动发布；文档和网站维护不会单独触发 npm 发版。

## npm 如何读取 Excel？

先调用 `sheetdelta-core/excel` 的 `readExcel`，再将选中表的 rows 交给 `compareTables`。详见 [Excel 指南](./excel) 与 [完整流程](./workflow)。
