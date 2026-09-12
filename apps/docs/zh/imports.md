# 单包，按功能导入

只需安装一个包，再选择项目需要的入口。

```sh
npm install sheetdelta-core
```

| 入口 | 导出功能 | 运行时加载的第三方依赖 |
| --- | --- | --- |
| `sheetdelta-core` | `compareTables`、`compareTablesAsync`、`SheetDeltaError`、`isSheetDeltaError`、`exportDiffCsv`、`TableValidationError`、类型 | 无 |
| `sheetdelta-core/compare` | `compareTables`、`compareTablesAsync`、`TableValidationError` | 无 |
| `sheetdelta-core/csv` | `readCsv`、`readCsvBytes`、`writeCsv`、`exportDiffCsv` | Papa Parse |
| `sheetdelta-core/excel` | `readExcel`、`writeExcel`、`exportDiffExcel` | 调用时加载 SheetJS；报告还使用 fflate |
| `sheetdelta-core/validate` | `validateTable`、`isIsoDate` | 无 |
| `sheetdelta-core/clean` | `cleanTable`、`deduplicateTable` | 无 |
| `sheetdelta-core/merge` | `mergeTables`、`appendTables`、`MergeConflictError` | 无 |
| `sheetdelta-core/errors` | `SheetDeltaError`, `isSheetDeltaError` | 无 |
| `sheetdelta-core/formula` | `calculateWorkbook` | 无 |
| `sheetdelta-core/workbook` | `patchWorkbook`, `recalculateExcel` | XML DOM + fflate; SheetJS 用于重算读取 |
| `sheetdelta-core/stream` | `readCsvStream`, `writeCsvStream`, `compareSortedStreams`, `compareStreamKeys` | 无 |
| `sheetdelta-core/excel-stream` | `writeExcelStream` | fflate |
| `sheetdelta-core/excel-node` | `readExcelStream` | yauzl + saxes + XML DOM; 仅 Node |
| `sheetdelta-core/import` | `mapImportHeaders`, `prepareImport`, `importFile`, `locateImportCell` | 读取时延迟加载 CSV/Excel 依赖 |
| `sheetdelta-core/import-report` | `exportImportReport` | 导出时加载 SheetJS + fflate |
| `sheetdelta-core/session` | `createImportSession`、`installImportSessionWorker` | 在应用自有浏览器 Worker 内使用 CSV/Excel 解析器 |
| `sheetdelta-core/types` | 公共 TypeScript 类型、`TableValidationError` | 无 |

```ts
import { compareTables } from 'sheetdelta-core/compare';
import type { CompareInputOptions, TableData } from 'sheetdelta-core/types';
const options: CompareInputOptions = { keys: ['id'] };
const result = compareTables([{ id: '001', price: 10 }], [{ id: '001', price: 12 }], options);
```

## 使用时再加载 Excel

```ts
async function handleExcel(file: File) {
  const { readExcel } = await import('sheetdelta-core/excel');
  return readExcel(await file.arrayBuffer());
}
```

npm 安装会下载完整包及其依赖。按需导入控制应用的依赖关系，并不减少 npm 安装体积。生产构建工具可以拆分动态导入并移除未使用导出；Node.js 本身不会自动裁剪。`/compare` 不加载 CSV 或 Excel 引擎。

根入口保持轻量并兼容旧代码；新功能通过子路径访问。内部源码路径不属于公共 API。

[所有 51 个运行时 API 的使用方法与可运行案例](./api/all) · [类型参考](./api/types) · [持久化导入工作台](./import-sessions)
