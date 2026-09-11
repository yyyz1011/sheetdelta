---
outline: [2, 2]
search: false
description: 按任务查找 SheetDelta 全部 API、参数和可运行案例。
---

# API 参考

**46 个 API，按任务分类。** 点击函数查看导入方式、参数、返回值和可运行案例；也可使用顶栏搜索按函数名查找。

[从导入纠错流程开始](../import-workflow) · [选择按需导入入口](../imports) · [查看全部类型](./types)

## 导入与纠错 {#import}

| API | 用途 |
| --- | --- |
| <span id="runimportworker"></span>[runImportWorker](./run-import-worker) | 用独立浏览器 Worker 导入，支持取消、超时及纠错工作簿；模块 Worker 配置见指南。 |
| <span id="installimportworker"></span>[installImportWorker](./install-import-worker) | 在独立模块 Worker 中安装导入处理器，业务回调在此注册，返回监听器清理函数。 |
| <span id="serializeimporttemplate"></span>[serializeImportTemplate](./serialize-import-template) | 校验并序列化版本 1 的 JSON 模板；拒绝回调、未知属性及超限配置。 |
| <span id="parseimporttemplate"></span>[parseImportTemplate](./parse-import-template) | 解析并校验可复用导入配置；不支持的版本和无效字段明确报错。 |
| <span id="importwithtemplate"></span>[importWithTemplate](./import-with-template) | 应用已保存的字段和文件布局，业务回调、限制、进度和取消由应用运行时提供。 |
| <span id="importfile"></span>[importFile](./import-file) | 按明确格式读取文件并执行导入；CSV 接受文本/字节，Excel 接受字节且需确定一个工作表。 |
| <span id="prepareimport"></span>[prepareImport](./prepare-import) | 处理已解析的 TableData，返回原始/处理后/可提交数据、问题、审计和来源。 |
| <span id="mapimportheaders"></span>[mapImportHeaders](./map-import-headers) | 解析标准字段/别名或显式源表头；缺列、歧义和重复映射以问题返回。 |
| <span id="locateimportcell"></span>[locateImportCell](./locate-import-cell) | 把原始数据行位置和标准字段映射回来源；只有 Excel 工作表位置提供 A1 地址。 |
| <span id="exportimportreport"></span>[exportImportReport](./export-import-report) | 生成 Data、Issues、Summary 三张表；Data 保留原值便于修正，不复制原文件样式。 |

## Excel 读写 {#excel}

| API | 用途 |
| --- | --- |
| <span id="readexcel"></span>[readExcel](./read-excel) | 读取 XLSX/XLS 字节，可选工作表、原始值/显示值和资源限制；公式读取缓存。 |
| <span id="writeexcel"></span>[writeExcel](./write-excel) | 从具名工作表生成数据工作簿；以等号开头的文本仍是文本。 |
| <span id="exportdiffexcel"></span>[exportDiffExcel](./export-diff-excel) | 返回包含汇总及新增、删除、修改高亮工作表的 XLSX。 |

## CSV 读写 {#csv}

| API | 用途 |
| --- | --- |
| <span id="readcsv"></span>[readCsv](./read-csv) | 解析文本，字段保留字符串；位置按 CSV 记录计数，多行字段仍算一条记录。 |
| <span id="readcsvbytes"></span>[readCsvBytes](./read-csv-bytes) | 按明确编码解码字节后解析；编码错误、数据错误和字节超限返回结构化异常。 |
| <span id="writecsv"></span>[writeCsv](./write-csv) | 按指定列和分隔符导出带引号的 CSV，可配置 BOM 与公式转义。 |
| <span id="exportdiffcsv"></span>[exportDiffCsv](./export-diff-csv) | 将差异结果导出为 CSV；changesOnly 和 escapeFormulae 默认开启。 |

## 比较与合并 {#compare}

| API | 用途 |
| --- | --- |
| <span id="comparetables"></span>[compareTables](./compare-tables) | 按唯一键比较，返回差异行、汇总、列结构和解析后的选项；不修改输入。 |
| <span id="comparetablesasync"></span>[compareTablesAsync](./compare-tables-async) | 分批比较，支持进度与取消，返回 Promise；不会自动创建 Worker。 |
| <span id="mergetables"></span>[mergeTables](./merge-tables) | 按唯一键连接表格，显式选择连接/冲突策略；默认拒绝冲突值。 |
| <span id="appendtables"></span>[appendTables](./append-tables) | 按严格列结构或列并集纵向追加；来源表和行位置从 1 开始。 |

## 清洗与校验 {#clean}

| API | 用途 |
| --- | --- |
| <span id="cleantable"></span>[cleanTable](./clean-table) | 执行显式空白、大小写和类型转换规则，返回新数据、修改审计和转换失败。 |
| <span id="deduplicatetable"></span>[deduplicateTable](./deduplicate-table) | 按类型敏感的复合键显式保留首条/末条，返回保留行、删除位置和重复组。 |
| <span id="validatetable"></span>[validateTable](./validate-table) | 执行内置列规则，不转换类型；返回有效/无效数据行位置和问题，maxIssues 可限制问题数量。 |
| <span id="isisodate"></span>[isIsoDate](./is-iso-date) | 检查 YYYY-MM-DD 格式的真实日期；拒绝地区格式和不存在的日期。 |

## 工作簿与公式 {#workbook}

| API | 用途 |
| --- | --- |
| <span id="patchworkbook"></span>[patchWorkbook](./patch-workbook) | 按地址修改单元格并保留未修改包内容；默认清除公式缓存。 |
| <span id="recalculateexcel"></span>[recalculateExcel](./recalculate-excel) | 重算支持的公式并写缓存；不支持或错误的公式使操作整体失败。 |
| <span id="calculateworkbook"></span>[calculateWorkbook](./calculate-workbook) | 计算已明确支持的公式子集；公式错误在 errors 和单元格结果中返回。 |
| <span id="cellposition"></span>[cellPosition](./cell-position) | 把 A1 地址转换为从 1 开始的行列编号；拒绝超出 Excel 范围的地址。 |
| <span id="celladdress"></span>[cellAddress](./cell-address) | 把从 1 开始的 Excel 行列坐标转换为 A1 地址。 |

## 流式处理 {#stream}

| API | 用途 |
| --- | --- |
| <span id="readcsvstream"></span>[readCsvStream](./read-csv-stream) | 消费同类型的字节块或文本块，逐条返回数据和记录号；消费者控制读取速度。 |
| <span id="writecsvstream"></span>[writeCsvStream](./write-csv-stream) | 从行迭代器生成 CSV 字节块，必须指定列；直接写入目标才能保留流式优势。 |
| <span id="readexcelstream"></span>[readExcelStream](./read-excel-stream) | 仅 Node 的本地 XLSX 逐行读取，返回原始值和来源行；共享字符串受明确预算约束。 |
| <span id="writeexcelstream"></span>[writeExcelStream](./write-excel-stream) | 逐块写出一个新的纯数据 XLSX 工作表，无需收集所有行。 |
| <span id="comparesortedstreams"></span>[compareSortedStreams](./compare-sorted-streams) | 比较已排序且键唯一的数据流，需指定比较列；错误可能发生在部分结果已输出之后。 |
| <span id="comparestreamkeys"></span>[compareStreamKeys](./compare-stream-keys) | 生成有序流比较要求的文本元组排序顺序；排序和比较应使用相同规范化选项。 |

## 错误处理 {#errors}

| API | 用途 |
| --- | --- |
| <span id="sheetdeltaerror"></span>[SheetDeltaError](./sheet-delta-error) | 构造包含稳定错误码与上下文的异常；toJSON() 适合 Worker 传输，反序列化后检查 code。 |
| <span id="issheetdeltaerror"></span>[isSheetDeltaError](./is-sheet-delta-error) | 同一运行环境中的类型守卫；序列化后的 Worker 异常是普通对象，不会通过此检查。 |
| <span id="tablevalidationerror"></span>[TableValidationError](./table-validation-error) | 比较输入错误，携带重复键、缺键、缺列问题；继承 SheetDeltaError，支持 toJSON()。 |
| <span id="mergeconflicterror"></span>[MergeConflictError](./merge-conflict-error) | 连接冲突异常，包含键、列及两侧值；继承 SheetDeltaError。 |

## 底层辅助函数 {#helpers}

| API | 用途 |
| --- | --- |
| <span id="parsexml"></span>[parseXml](./parse-xml) | 底层兼容导出：解析 XML，拒绝 DTD/实体声明；不是通用 XML 安全沙箱。 |
| <span id="elements"></span>[elements](./elements) | 底层兼容导出：按局部名称查找各命名空间中的后代元素。 |
| <span id="relationshippath"></span>[relationshipPath](./relationship-path) | 底层兼容导出：解析 OOXML 包内关系路径；不用于文件系统或 URL 路径。 |
| <span id="assertrecord"></span>[assertRecord](./assert-record) | 底层兼容导出：拒绝 null、数组和非对象，抛出 INVALID_OPTIONS；不校验字段内容。 |
| <span id="fail"></span>[fail](./fail) | 底层兼容导出：直接抛出指定错误码、说明和上下文的 SheetDeltaError。 |
| <span id="wraperror"></span>[wrapError](./wrap-error) | 底层兼容导出：已有 SheetDeltaError 原样抛出，其他异常包装并保留 cause；始终抛出异常。 |

