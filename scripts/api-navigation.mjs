export const apiSlug = name => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
export const apiGroups = [
  { id: 'import', en: 'Import & repair', zh: '导入与纠错', apis: ['serializeImportTemplate', 'parseImportTemplate', 'importWithTemplate', 'importFile', 'prepareImport', 'mapImportHeaders', 'locateImportCell', 'exportImportReport'] },
  { id: 'excel', en: 'Excel files', zh: 'Excel 读写', apis: ['readExcel', 'writeExcel', 'exportDiffExcel'] },
  { id: 'csv', en: 'CSV files', zh: 'CSV 读写', apis: ['readCsv', 'readCsvBytes', 'writeCsv', 'exportDiffCsv'] },
  { id: 'compare', en: 'Compare & merge', zh: '比较与合并', apis: ['compareTables', 'compareTablesAsync', 'mergeTables', 'appendTables'] },
  { id: 'clean', en: 'Clean & validate', zh: '清洗与校验', apis: ['cleanTable', 'deduplicateTable', 'validateTable', 'isIsoDate'] },
  { id: 'workbook', en: 'Workbooks & formulas', zh: '工作簿与公式', apis: ['patchWorkbook', 'recalculateExcel', 'calculateWorkbook', 'cellPosition', 'cellAddress'] },
  { id: 'stream', en: 'Streaming', zh: '流式处理', apis: ['readCsvStream', 'writeCsvStream', 'readExcelStream', 'writeExcelStream', 'compareSortedStreams', 'compareStreamKeys'] },
  { id: 'errors', en: 'Errors', zh: '错误处理', apis: ['SheetDeltaError', 'isSheetDeltaError', 'TableValidationError', 'MergeConflictError'] },
  { id: 'helpers', en: 'Low-level helpers', zh: '底层辅助函数', apis: ['parseXml', 'elements', 'relationshipPath', 'assertRecord', 'fail', 'wrapError'] },
];
export function apiSidebar(zh = false) {
  const p = zh ? '/zh/api/' : '/api/';
  return apiGroups.map(group => ({ text: group[zh ? 'zh' : 'en'], collapsed: true, items: group.apis.map(name => ({ text: name, link: p + apiSlug(name) })) }));
}
