# 完整 API 使用参考

覆盖当前所有 **41 个运行时函数和错误类**，包括各入口重复导出的同名 API。每个示例独立可运行，并由 CI 执行。参数类型见下方签名，所有选项和限制见对应功能指南与[类型参考](./types)。

底层兼容辅助函数单独标注；通常应使用对应高级接口。示例以 Node ESM 运行；`readExcelStream` 是仅 Node 的接口，浏览器文件保存方式见 Excel 指南。

## compareTables

按唯一键比较，返回差异行、汇总、列结构和解析后的选项；不修改输入。

导入入口: `sheetdelta-core`, `sheetdelta-core/compare`.

```ts
compareTables(left: readonly Row[], right: readonly Row[], options: CompareInputOptions): DiffResult
```

[参数、返回值与限制说明](../api/compare-tables)

```js
import { compareTables } from 'sheetdelta-core/compare';
const before = [{id:'001', qty:1}];
const after = [{id:'001', qty:2}];
const result = compareTables(before, after, {keys:['id']});
console.log(result.summary.changed); // 1
```

## compareTablesAsync

分批比较，支持进度与取消，返回 Promise；不会自动创建 Worker。

导入入口: `sheetdelta-core`, `sheetdelta-core/compare`.

```ts
compareTablesAsync(left: readonly Row[], right: readonly Row[], options: CompareInputOptions, execution?: AsyncCompareOptions): Promise<DiffResult>
```

[参数、返回值与限制说明](../async)

```js
import { compareTablesAsync } from 'sheetdelta-core/compare';
const before = [{id:'001', qty:1}];
const after = [{id:'001', qty:2}];
const result = await compareTablesAsync(before, after, {keys:['id']}, {batchSize:64});
console.log(result.summary.changed); // 1
```

## exportDiffCsv

将差异结果导出为 CSV；changesOnly 和 escapeFormulae 默认开启。

导入入口: `sheetdelta-core`, `sheetdelta-core/csv`.

```ts
exportDiffCsv(result: DiffResult, { changesOnly, escapeFormulae }?: { changesOnly?: boolean; escapeFormulae?: boolean; }): string
```

[参数、返回值与限制说明](../api/export-diff-csv)

```js
import { exportDiffCsv } from 'sheetdelta-core/csv';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const csv = exportDiffCsv(result);
console.log(csv.includes('changed')); // true
```

## readCsv

解析文本，字段保留字符串；位置按 CSV 记录计数，多行字段仍算一条记录。

导入入口: `sheetdelta-core/csv`.

```ts
readCsv(text: string, options?: CsvReadOptions): TableData
```

[参数、返回值与限制说明](../csv)

```js
import { readCsv } from 'sheetdelta-core/csv';
const table = readCsv('id,qty\n001,2');
console.log(table.rows[0].id); // 001
```

## readCsvBytes

按明确编码解码字节后解析；编码错误、数据错误和字节超限返回结构化异常。

导入入口: `sheetdelta-core/csv`.

```ts
readCsvBytes(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: CsvByteReadOptions): TableData
```

[参数、返回值与限制说明](../csv)

```js
import { readCsvBytes } from 'sheetdelta-core/csv';
const table = readCsvBytes(new TextEncoder().encode('id,qty\n001,2'), {encoding:'utf-8'});
console.log(table.rows[0].id); // 001
```

## writeCsv

按指定列和分隔符导出带引号的 CSV，可配置 BOM 与公式转义。

导入入口: `sheetdelta-core/csv`.

```ts
writeCsv(rows: readonly Row[], options?: CsvWriteOptions): string
```

[参数、返回值与限制说明](../csv)

```js
import { writeCsv } from 'sheetdelta-core/csv';
const csv = writeCsv([{id:'001', qty:2}], {columns:['id','qty'], bom:false});
console.log(csv.includes('001')); // true
```

## readExcel

读取 XLSX/XLS 字节，可选工作表、原始值/显示值和资源限制；公式读取缓存。

导入入口: `sheetdelta-core/excel`.

```ts
readExcel(input: ExcelInput, options?: ExcelReadOptions): Promise<TableData[]>
```

[参数、返回值与限制说明](../excel)

```js
import { readExcel } from 'sheetdelta-core/excel';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const tables = await readExcel(bytes, {values:'raw'});
console.log(tables[0].rows[0].qty); // 2
```

## writeExcel

从具名工作表生成数据工作簿；以等号开头的文本仍是文本。

导入入口: `sheetdelta-core/excel`.

```ts
writeExcel(sheets: readonly ExcelSheet[]): Promise<Uint8Array<ArrayBufferLike>>
```

[参数、返回值与限制说明](../excel)

```js
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
console.log(bytes instanceof Uint8Array); // true
```

## exportDiffExcel

返回包含汇总及新增、删除、修改高亮工作表的 XLSX。

导入入口: `sheetdelta-core/excel`.

```ts
exportDiffExcel(result: DiffResult): Promise<Uint8Array<ArrayBufferLike>>
```

[参数、返回值与限制说明](../excel)

```js
import { exportDiffExcel } from 'sheetdelta-core/excel';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const bytes = await exportDiffExcel(result);
console.log(bytes instanceof Uint8Array); // true
```

## validateTable

执行内置列规则，不转换类型；返回有效/无效数据行位置和问题，maxIssues 可限制问题数量。

导入入口: `sheetdelta-core/validate`.

```ts
validateTable(rows: readonly Row[], schema: TableSchema, options?: { allowUnknown?: boolean; maxIssues?: number; }): ValidationResult
```

[参数、返回值与限制说明](../validate)

```js
import { validateTable } from 'sheetdelta-core/validate';
const result = validateTable([{price:-1}], {price:{type:'number',min:0}}, {maxIssues:100});
console.log(result.issues[0].code); // min
```

## isIsoDate

检查 YYYY-MM-DD 格式的真实日期；拒绝地区格式和不存在的日期。

导入入口: `sheetdelta-core/validate`.

```ts
isIsoDate(value: string): boolean
```

[参数、返回值与限制说明](../validate)

```js
import { isIsoDate } from 'sheetdelta-core/validate';
console.log(isIsoDate('2024-02-29')); // true
console.log(isIsoDate('2025-02-29')); // false
```

## cleanTable

执行显式空白、大小写和类型转换规则，返回新数据、修改审计和转换失败。

导入入口: `sheetdelta-core/clean`.

```ts
cleanTable(rows: readonly Row[], rules: Record<string, CleanRule>): { rows: Row[]; changes: CleanChange[]; issues: CleanIssue[]; }
```

[参数、返回值与限制说明](../clean)

```js
import { cleanTable } from 'sheetdelta-core/clean';
const result = cleanTable([{id:'001',qty:' 2 '}], {qty:{trim:true,type:'number'}});
console.log(result.rows[0].qty); // 2
```

## deduplicateTable

按类型敏感的复合键显式保留首条/末条，返回保留行、删除位置和重复组。

导入入口: `sheetdelta-core/clean`.

```ts
deduplicateTable(rows: readonly Row[], options: { keys: string[]; keep?: "first" | "last"; }): { rows: { [x: string]: Cell; }[]; removedRows: number[]; duplicateGroups: number[][]; }
```

[参数、返回值与限制说明](../clean)

```js
import { deduplicateTable } from 'sheetdelta-core/clean';
const result = deduplicateTable([{id:'1',v:1},{id:'1',v:2}], {keys:['id'],keep:'last'});
console.log(result.rows[0].v); // 2
```

## mergeTables

按唯一键连接表格，显式选择连接/冲突策略；默认拒绝冲突值。

导入入口: `sheetdelta-core/merge`.

```ts
mergeTables(left: readonly Row[], right: readonly Row[], options: MergeOptions): { rows: Row[]; conflicts: MergeConflict[]; summary: { matched: number; leftOnly: number; rightOnly: number; total: number; }; }
```

[参数、返回值与限制说明](../merge)

```js
import { mergeTables } from 'sheetdelta-core/merge';
const result = mergeTables([{id:'1',name:'Cup'}], [{id:'1',stock:2}], {keys:['id'],join:'left'});
console.log(result.rows[0].stock); // 2
```

## appendTables

按严格列结构或列并集纵向追加；来源表和行位置从 1 开始。

导入入口: `sheetdelta-core/merge`.

```ts
appendTables(tables: readonly (readonly Row[])[], options?: { schema?: "strict" | "union"; }): { rows: Row[]; columns: string[]; sources: { table: number; row: number; }[]; }
```

[参数、返回值与限制说明](../merge)

```js
import { appendTables } from 'sheetdelta-core/merge';
const result = appendTables([[{id:'1'}],[{id:'2',note:'new'}]], {schema:'union'});
console.log(result.rows.length); // 2
```

## calculateWorkbook

计算已明确支持的公式子集；公式错误在 errors 和单元格结果中返回。

导入入口: `sheetdelta-core/formula`.

```ts
calculateWorkbook(input: FormulaWorkbook, options?: FormulaOptions): { sheets: Record<string, Record<string, Cell>>; errors: FormulaIssue[]; }
```

[参数、返回值与限制说明](../formulas)

```js
import { calculateWorkbook } from 'sheetdelta-core/formula';
const result = calculateWorkbook({Data:{A1:2,B1:{formula:'=A1*3'}}});
console.log(result.sheets.Data.B1); // 6
```

## cellPosition

把 A1 地址转换为从 1 开始的行列编号；拒绝超出 Excel 范围的地址。

导入入口: `sheetdelta-core/formula`.

```ts
cellPosition(address: string): { row: number; column: number; }
```

[参数、返回值与限制说明](../formulas)

```js
import { cellPosition } from 'sheetdelta-core/formula';
const position = cellPosition('$B$3');
console.log(position); // { row: 3, column: 2 }
```

## cellAddress

把从 1 开始的 Excel 行列坐标转换为 A1 地址。

导入入口: `sheetdelta-core/formula`.

```ts
cellAddress(row: number, column: number): string
```

[参数、返回值与限制说明](../formulas)

```js
import { cellAddress } from 'sheetdelta-core/formula';
console.log(cellAddress(3,2)); // B3
```

## patchWorkbook

按地址修改单元格并保留未修改包内容；默认清除公式缓存。

导入入口: `sheetdelta-core/workbook`.

```ts
patchWorkbook(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, edits: readonly CellEdit[], options?: PatchWorkbookOptions): Promise<Uint8Array<ArrayBufferLike>>
```

[参数、返回值与限制说明](../workbooks)

```js
import { patchWorkbook } from 'sheetdelta-core/workbook';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const changed = await patchWorkbook(bytes, [{sheet:'Data',cell:'B2',value:3}]);
console.log(changed instanceof Uint8Array); // true
```

## recalculateExcel

重算支持的公式并写缓存；不支持或错误的公式使操作整体失败。

导入入口: `sheetdelta-core/workbook`.

```ts
recalculateExcel(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: WorkbookOptions & FormulaOptions): Promise<Uint8Array<ArrayBufferLike>>
```

[参数、返回值与限制说明](../workbooks)

```js
import { recalculateExcel } from 'sheetdelta-core/workbook';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
import { patchWorkbook } from 'sheetdelta-core/workbook';
import { readExcel } from 'sheetdelta-core/excel';
const changed = await patchWorkbook(bytes, [{sheet:'Data',cell:'B2',formula:'=3*4'}]);
const tables = await readExcel(await recalculateExcel(changed), {values:'raw'});
console.log(tables[0].rows[0].qty); // 12
```

## readCsvStream

消费同类型的字节块或文本块，逐条返回数据和记录号；消费者控制读取速度。

导入入口: `sheetdelta-core/stream`.

```ts
readCsvStream(source: AsyncIterable<string | Uint8Array<ArrayBufferLike>>, options?: CsvStreamReadOptions): AsyncGenerator<{ row: Row; rowNumber: number; }, any, any>
```

[参数、返回值与限制说明](../streaming)

```js
import { readCsvStream } from 'sheetdelta-core/stream';
async function* chunks(){yield new TextEncoder().encode('id,qty\n001,2');}
let first;
for await (const item of readCsvStream(chunks())) { first = item.row; }
console.log(first.id); // 001
```

## writeCsvStream

从行迭代器生成 CSV 字节块，必须指定列；直接写入目标才能保留流式优势。

导入入口: `sheetdelta-core/stream`.

```ts
writeCsvStream(rows: AsyncIterable<Row> | Iterable<Row>, options: CsvStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

[参数、返回值与限制说明](../streaming)

```js
import { writeCsvStream } from 'sheetdelta-core/stream';
let size = 0;
for await (const chunk of writeCsvStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## compareStreamKeys

生成有序流比较要求的文本元组排序顺序；排序和比较应使用相同规范化选项。

导入入口: `sheetdelta-core/stream`.

```ts
compareStreamKeys(a: Row, b: Row, keys: string[], options?: Pick<CompareInputOptions, "trim" | "ignoreCase">): number
```

[参数、返回值与限制说明](../streaming)

```js
import { compareStreamKeys } from 'sheetdelta-core/stream';
const rows = [{id:'2'}, {id:'10'}];
rows.sort((a,b) => compareStreamKeys(a,b,['id']));
console.log(rows.map(r => r.id)); // ['10', '2']
```

## compareSortedStreams

比较已排序且键唯一的数据流，需指定比较列；错误可能发生在部分结果已输出之后。

导入入口: `sheetdelta-core/stream`.

```ts
compareSortedStreams(left: AsyncIterable<Row> | Iterable<Row>, right: AsyncIterable<Row> | Iterable<Row>, options: CompareInputOptions, execution?: StreamOptions): AsyncGenerator<DiffRow, any, any>
```

[参数、返回值与限制说明](../streaming)

```js
import { compareSortedStreams } from 'sheetdelta-core/stream';
let changed = 0;
for await (const row of compareSortedStreams([{id:'1',qty:1}], [{id:'1',qty:2}], {keys:['id'],columns:['qty']})) if(row.status==='changed') changed++;
console.log(changed); // 1
```

## writeExcelStream

逐块写出一个新的纯数据 XLSX 工作表，无需收集所有行。

导入入口: `sheetdelta-core/excel-stream`.

```ts
writeExcelStream(rows: AsyncIterable<Row> | Iterable<Row>, options: ExcelStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

[参数、返回值与限制说明](../streaming)

```js
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
let size = 0;
for await (const chunk of writeExcelStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## readExcelStream

仅 Node 的本地 XLSX 逐行读取，返回原始值和来源行；共享字符串受明确预算约束。

导入入口: `sheetdelta-core/excel-node`.

```ts
readExcelStream(path: string, options?: ExcelStreamReadOptions): AsyncGenerator<ExcelStreamRow, any, any>
```

[参数、返回值与限制说明](../streaming)

```js
import { readExcelStream } from 'sheetdelta-core/excel-node';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const dir = await mkdtemp(join(tmpdir(),'sheetdelta-example-'));
let id;
try {
  const path = join(dir,'data.xlsx');
  await writeFile(path,bytes);
  for await (const item of readExcelStream(path)) id = item.row.id;
  console.log(id); // 001
} finally { await rm(dir,{recursive:true,force:true}); }
```

## mapImportHeaders

解析标准字段/别名或显式源表头；缺列、歧义和重复映射以问题返回。

导入入口: `sheetdelta-core/import`.

```ts
mapImportHeaders(headers: readonly string[], fields: readonly ImportField[], options?: { allowUnknownColumns?: boolean; }): { mappings: { field: string; column: string; candidates: string[]; }[]; issues: ImportIssue[]; unknownColumns: string[]; valid: boolean; }
```

[参数、返回值与限制说明](../import-workflow)

```js
import { mapImportHeaders } from 'sheetdelta-core/import';
const result = mapImportHeaders(['商品编号'], [{key:'sku',aliases:['商品编号'],requiredColumn:true}]);
console.log(result.mappings[0].column); // 商品编号
```

## prepareImport

处理已解析的 TableData，返回原始/处理后/可提交数据、问题、审计和来源。

导入入口: `sheetdelta-core/import`.

```ts
prepareImport(table: TableData, schema: ImportSchema, options?: ImportOptions): Promise<ImportResult>
```

[参数、返回值与限制说明](../import-workflow)

```js
import { prepareImport } from 'sheetdelta-core/import';
import { readCsv } from 'sheetdelta-core/csv';
const result = await prepareImport(readCsv('id,qty\n001,2'), {fields:[{key:'id'}, {key:'qty',clean:{type:'number'}}]}, {format:'csv'});
console.log(result.rows[0].qty); // 2
```

## importFile

按明确格式读取文件并执行导入；CSV 接受文本/字节，Excel 接受字节且需确定一个工作表。

导入入口: `sheetdelta-core/import`.

```ts
importFile(input: string | ArrayBuffer | Uint8Array<ArrayBufferLike>, schema: ImportSchema, options: ImportFileOptions): Promise<ImportResult>
```

[参数、返回值与限制说明](../import-workflow)

```js
import { importFile } from 'sheetdelta-core/import';
const result = await importFile('id,qty\n001,-2', {fields:[{key:'id'}, {key:'qty',clean:{type:'number'},rule:{min:0}}]}, {format:'csv'});
console.log(result.status, result.rows.length); // invalid 0
```

## locateImportCell

把原始数据行位置和标准字段映射回来源；只有 Excel 工作表位置提供 A1 地址。

导入入口: `sheetdelta-core/import`.

```ts
locateImportCell(result: Pick<ImportResult, "original" | "mappings" | "rowSources">, row: number, field: string): ImportLocation
```

[参数、返回值与限制说明](../import-workflow)

```js
import { locateImportCell } from 'sheetdelta-core/import';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const source = locateImportCell(result,1,'qty');
console.log(source.sourceRow, source.sourceColumn); // 2 qty
```

## exportImportReport

生成 Data、Issues、Summary 三张表；Data 保留原值便于修正，不复制原文件样式。

导入入口: `sheetdelta-core/import-report`.

```ts
exportImportReport(result: ImportResult): Promise<Uint8Array<ArrayBufferLike>>
```

[参数、返回值与限制说明](../import-workflow)

```js
import { exportImportReport } from 'sheetdelta-core/import-report';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const bytes = await exportImportReport(result);
console.log(bytes instanceof Uint8Array); // true
```

## SheetDeltaError

构造包含稳定错误码与上下文的异常；toJSON() 适合 Worker 传输，反序列化后检查 code。

导入入口: `sheetdelta-core`, `sheetdelta-core/errors`.

```ts
SheetDeltaError(code: ErrorCode, message: string, context?: ErrorContext, options?: ErrorOptions): SheetDeltaError
```

[参数、返回值与限制说明](../errors)

```js
import { SheetDeltaError } from 'sheetdelta-core/errors';
const error = new SheetDeltaError('INVALID_DATA','Missing value',{row:2,column:'qty'});
console.log(error.toJSON().code); // INVALID_DATA
```

## isSheetDeltaError

同一运行环境中的类型守卫；序列化后的 Worker 异常是普通对象，不会通过此检查。

导入入口: `sheetdelta-core`, `sheetdelta-core/errors`.

```ts
isSheetDeltaError(error: unknown): error is SheetDeltaError
```

[参数、返回值与限制说明](../errors)

```js
import { isSheetDeltaError } from 'sheetdelta-core/errors';
import { SheetDeltaError } from 'sheetdelta-core/errors';
console.log(isSheetDeltaError(new SheetDeltaError('INVALID_DATA','Bad data'))); // true
```

## TableValidationError

比较输入错误，携带重复键、缺键、缺列问题；继承 SheetDeltaError，支持 toJSON()。

导入入口: `sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`.

```ts
TableValidationError(issues: DataIssue[]): TableValidationError
```

[参数、返回值与限制说明](../validation)

```js
import { TableValidationError } from 'sheetdelta-core/types';
const error = new TableValidationError([{side:'left',code:'missing-key',rows:[1],column:'id'}]);
console.log(error.toJSON().issues.length); // 1
```

## MergeConflictError

连接冲突异常，包含键、列及两侧值；继承 SheetDeltaError。

导入入口: `sheetdelta-core/merge`.

```ts
MergeConflictError(conflicts: MergeConflict[]): MergeConflictError
```

[参数、返回值与限制说明](../merge)

```js
import { MergeConflictError } from 'sheetdelta-core/merge';
const error = new MergeConflictError([{key:['1'],column:'qty',left:1,right:2}]);
console.log(error.toJSON().conflicts.length); // 1
```

## parseXml

底层兼容导出：解析 XML，拒绝 DTD/实体声明；不是通用 XML 安全沙箱。

导入入口: `sheetdelta-core/workbook`.

**底层兼容辅助函数。**

```ts
parseXml(xml: string): Document
```

[参数、返回值与限制说明](../workbooks)

```js
import { parseXml } from 'sheetdelta-core/workbook';
const doc = parseXml('<root><item id="1"/></root>');
console.log(doc.documentElement.localName); // root
```

## elements

底层兼容导出：按局部名称查找各命名空间中的后代元素。

导入入口: `sheetdelta-core/workbook`.

**底层兼容辅助函数。**

```ts
elements(doc: Document | Element, name: string): Element[]
```

[参数、返回值与限制说明](../workbooks)

```js
import { elements } from 'sheetdelta-core/workbook';
import { parseXml } from 'sheetdelta-core/workbook';
const nodes = elements(parseXml('<root><item id="1"/></root>'),'item');
console.log(nodes[0].getAttribute('id')); // 1
```

## relationshipPath

底层兼容导出：解析 OOXML 包内关系路径；不用于文件系统或 URL 路径。

导入入口: `sheetdelta-core/workbook`.

**底层兼容辅助函数。**

```ts
relationshipPath(base: string, target: string): string
```

[参数、返回值与限制说明](../workbooks)

```js
import { relationshipPath } from 'sheetdelta-core/workbook';
console.log(relationshipPath('xl/workbook.xml','worksheets/sheet1.xml')); // xl/worksheets/sheet1.xml
```

## assertRecord

底层兼容导出：拒绝 null、数组和非对象，抛出 INVALID_OPTIONS；不校验字段内容。

导入入口: `sheetdelta-core/errors`.

**底层兼容辅助函数。**

```ts
assertRecord(value: unknown, label: string): void
```

[参数、返回值与限制说明](../errors)

```js
import { assertRecord } from 'sheetdelta-core/errors';
assertRecord({keys:['id']},'options');
console.log('valid options');
```

## fail

底层兼容导出：直接抛出指定错误码、说明和上下文的 SheetDeltaError。

导入入口: `sheetdelta-core/errors`.

**底层兼容辅助函数。**

```ts
fail(code: ErrorCode, message: string, context?: ErrorContext): never
```

[参数、返回值与限制说明](../errors)

```js
import { fail } from 'sheetdelta-core/errors';
let code;
try { fail('INVALID_DATA','Missing ID',{column:'id'}); } catch(error) { code = error.code; }
console.log(code); // INVALID_DATA
```

## wrapError

底层兼容导出：已有 SheetDeltaError 原样抛出，其他异常包装并保留 cause；始终抛出异常。

导入入口: `sheetdelta-core/errors`.

**底层兼容辅助函数。**

```ts
wrapError(error: unknown, code: ErrorCode, message: string, context?: ErrorContext): never
```

[参数、返回值与限制说明](../errors)

```js
import { wrapError } from 'sheetdelta-core/errors';
let code;
try { wrapError(new Error('parse failed'),'INVALID_CSV','Cannot read CSV'); } catch(error) { code = error.code; }
console.log(code); // INVALID_CSV
```

