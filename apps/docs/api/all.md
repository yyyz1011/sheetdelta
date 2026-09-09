# Complete API usage reference

Covers all **41 runtime functions and error classes**, including aliases across entry points. Every example runs independently in CI. Signatures show parameter/return types; linked guides describe options and limits. See the [type reference](./types) for complete option shapes.

Low-level compatibility helpers are marked; prefer the corresponding high-level API. Examples run as Node ESM; `readExcelStream` is Node-only. Browser file-saving recipes are in the Excel guide.

## compareTables

Compare by unique keys; returns rows, summary, schema and resolved options. Inputs are not mutated.

Available from: `sheetdelta-core`, `sheetdelta-core/compare`.

```ts
compareTables(left: readonly Row[], right: readonly Row[], options: CompareInputOptions): DiffResult
```

[Options, return values and limits](../api/compare-tables)

```js
import { compareTables } from 'sheetdelta-core/compare';
const before = [{id:'001', qty:1}];
const after = [{id:'001', qty:2}];
const result = compareTables(before, after, {keys:['id']});
console.log(result.summary.changed); // 1
```

## compareTablesAsync

Same comparison with cooperative batching, progress and cancellation. Returns a Promise; it does not automatically create a Worker.

Available from: `sheetdelta-core`, `sheetdelta-core/compare`.

```ts
compareTablesAsync(left: readonly Row[], right: readonly Row[], options: CompareInputOptions, execution?: AsyncCompareOptions): Promise<DiffResult>
```

[Options, return values and limits](../async)

```js
import { compareTablesAsync } from 'sheetdelta-core/compare';
const before = [{id:'001', qty:1}];
const after = [{id:'001', qty:2}];
const result = await compareTablesAsync(before, after, {keys:['id']}, {batchSize:64});
console.log(result.summary.changed); // 1
```

## exportDiffCsv

Export a DiffResult as CSV. changesOnly and escapeFormulae default to true.

Available from: `sheetdelta-core`, `sheetdelta-core/csv`.

```ts
exportDiffCsv(result: DiffResult, { changesOnly, escapeFormulae }?: { changesOnly?: boolean; escapeFormulae?: boolean; }): string
```

[Options, return values and limits](../api/export-diff-csv)

```js
import { exportDiffCsv } from 'sheetdelta-core/csv';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const csv = exportDiffCsv(result);
console.log(csv.includes('changed')); // true
```

## readCsv

Parse text to TableData; values stay strings. CSV positions count records, including multiline fields as one record.

Available from: `sheetdelta-core/csv`.

```ts
readCsv(text: string, options?: CsvReadOptions): TableData
```

[Options, return values and limits](../csv)

```js
import { readCsv } from 'sheetdelta-core/csv';
const table = readCsv('id,qty\n001,2');
console.log(table.rows[0].id); // 001
```

## readCsvBytes

Decode bytes with explicit encoding, then parse. Invalid encoding/data and byte limits produce structured errors.

Available from: `sheetdelta-core/csv`.

```ts
readCsvBytes(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: CsvByteReadOptions): TableData
```

[Options, return values and limits](../csv)

```js
import { readCsvBytes } from 'sheetdelta-core/csv';
const table = readCsvBytes(new TextEncoder().encode('id,qty\n001,2'), {encoding:'utf-8'});
console.log(table.rows[0].id); // 001
```

## writeCsv

Write literal values as quoted CSV with configurable columns, delimiter, BOM and formula escaping.

Available from: `sheetdelta-core/csv`.

```ts
writeCsv(rows: readonly Row[], options?: CsvWriteOptions): string
```

[Options, return values and limits](../csv)

```js
import { writeCsv } from 'sheetdelta-core/csv';
const csv = writeCsv([{id:'001', qty:2}], {columns:['id','qty'], bom:false});
console.log(csv.includes('001')); // true
```

## readExcel

Read XLSX/XLS bytes with sheet selection, raw/display policies and resource limits. Formulas use cached values.

Available from: `sheetdelta-core/excel`.

```ts
readExcel(input: ExcelInput, options?: ExcelReadOptions): Promise<TableData[]>
```

[Options, return values and limits](../excel)

```js
import { readExcel } from 'sheetdelta-core/excel';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const tables = await readExcel(bytes, {values:'raw'});
console.log(tables[0].rows[0].qty); // 2
```

## writeExcel

Create a data workbook from named sheets. Text stays literal, including formula-shaped strings.

Available from: `sheetdelta-core/excel`.

```ts
writeExcel(sheets: readonly ExcelSheet[]): Promise<Uint8Array<ArrayBufferLike>>
```

[Options, return values and limits](../excel)

```js
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
console.log(bytes instanceof Uint8Array); // true
```

## exportDiffExcel

Return an XLSX summary with highlighted Added, Removed and Changed sheets.

Available from: `sheetdelta-core/excel`.

```ts
exportDiffExcel(result: DiffResult): Promise<Uint8Array<ArrayBufferLike>>
```

[Options, return values and limits](../excel)

```js
import { exportDiffExcel } from 'sheetdelta-core/excel';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const bytes = await exportDiffExcel(result);
console.log(bytes instanceof Uint8Array); // true
```

## validateTable

Check built-in column rules without coercion. Returns valid/invalid data-row indices and all issues; maxIssues can fail explicitly.

Available from: `sheetdelta-core/validate`.

```ts
validateTable(rows: readonly Row[], schema: TableSchema, options?: { allowUnknown?: boolean; maxIssues?: number; }): ValidationResult
```

[Options, return values and limits](../validate)

```js
import { validateTable } from 'sheetdelta-core/validate';
const result = validateTable([{price:-1}], {price:{type:'number',min:0}}, {maxIssues:100});
console.log(result.issues[0].code); // min
```

## isIsoDate

Check a real calendar date in YYYY-MM-DD form; reject locale strings and impossible dates.

Available from: `sheetdelta-core/validate`.

```ts
isIsoDate(value: string): boolean
```

[Options, return values and limits](../validate)

```js
import { isIsoDate } from 'sheetdelta-core/validate';
console.log(isIsoDate('2024-02-29')); // true
console.log(isIsoDate('2025-02-29')); // false
```

## cleanTable

Apply explicit trimming/case/type rules. Returns new rows, changed-value audit and failed conversions.

Available from: `sheetdelta-core/clean`.

```ts
cleanTable(rows: readonly Row[], rules: Record<string, CleanRule>): { rows: Row[]; changes: CleanChange[]; issues: CleanIssue[]; }
```

[Options, return values and limits](../clean)

```js
import { cleanTable } from 'sheetdelta-core/clean';
const result = cleanTable([{id:'001',qty:' 2 '}], {qty:{trim:true,type:'number'}});
console.log(result.rows[0].qty); // 2
```

## deduplicateTable

Explicitly retain first/last rows per typed composite key. Returns retained rows, removed indices and duplicate groups.

Available from: `sheetdelta-core/clean`.

```ts
deduplicateTable(rows: readonly Row[], options: { keys: string[]; keep?: "first" | "last"; }): { rows: { [x: string]: Cell; }[]; removedRows: number[]; duplicateGroups: number[][]; }
```

[Options, return values and limits](../clean)

```js
import { deduplicateTable } from 'sheetdelta-core/clean';
const result = deduplicateTable([{id:'1',v:1},{id:'1',v:2}], {keys:['id'],keep:'last'});
console.log(result.rows[0].v); // 2
```

## mergeTables

Join unique-key tables with explicit join/conflict policies; the default rejects conflicting values.

Available from: `sheetdelta-core/merge`.

```ts
mergeTables(left: readonly Row[], right: readonly Row[], options: MergeOptions): { rows: Row[]; conflicts: MergeConflict[]; summary: { matched: number; leftOnly: number; rightOnly: number; total: number; }; }
```

[Options, return values and limits](../merge)

```js
import { mergeTables } from 'sheetdelta-core/merge';
const result = mergeTables([{id:'1',name:'Cup'}], [{id:'1',stock:2}], {keys:['id'],join:'left'});
console.log(result.rows[0].stock); // 2
```

## appendTables

Append rows using strict or union columns. Source table/row indices are one-based.

Available from: `sheetdelta-core/merge`.

```ts
appendTables(tables: readonly (readonly Row[])[], options?: { schema?: "strict" | "union"; }): { rows: Row[]; columns: string[]; sources: { table: number; row: number; }[]; }
```

[Options, return values and limits](../merge)

```js
import { appendTables } from 'sheetdelta-core/merge';
const result = appendTables([[{id:'1'}],[{id:'2',note:'new'}]], {schema:'union'});
console.log(result.rows.length); // 2
```

## calculateWorkbook

Calculate the documented formula subset. Formula errors appear in the errors array and in cell values.

Available from: `sheetdelta-core/formula`.

```ts
calculateWorkbook(input: FormulaWorkbook, options?: FormulaOptions): { sheets: Record<string, Record<string, Cell>>; errors: FormulaIssue[]; }
```

[Options, return values and limits](../formulas)

```js
import { calculateWorkbook } from 'sheetdelta-core/formula';
const result = calculateWorkbook({Data:{A1:2,B1:{formula:'=A1*3'}}});
console.log(result.sheets.Data.B1); // 6
```

## cellPosition

Convert an A1 address into one-based row and column numbers. Reject out-of-range Excel addresses.

Available from: `sheetdelta-core/formula`.

```ts
cellPosition(address: string): { row: number; column: number; }
```

[Options, return values and limits](../formulas)

```js
import { cellPosition } from 'sheetdelta-core/formula';
const position = cellPosition('$B$3');
console.log(position); // { row: 3, column: 2 }
```

## cellAddress

Convert one-based Excel row/column coordinates into an A1 address.

Available from: `sheetdelta-core/formula`.

```ts
cellAddress(row: number, column: number): string
```

[Options, return values and limits](../formulas)

```js
import { cellAddress } from 'sheetdelta-core/formula';
console.log(cellAddress(3,2)); // B3
```

## patchWorkbook

Edit explicitly addressed cells while retaining untouched package content. Formula caches clear by default.

Available from: `sheetdelta-core/workbook`.

```ts
patchWorkbook(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, edits: readonly CellEdit[], options?: PatchWorkbookOptions): Promise<Uint8Array<ArrayBufferLike>>
```

[Options, return values and limits](../workbooks)

```js
import { patchWorkbook } from 'sheetdelta-core/workbook';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const changed = await patchWorkbook(bytes, [{sheet:'Data',cell:'B2',value:3}]);
console.log(changed instanceof Uint8Array); // true
```

## recalculateExcel

Recalculate supported formulas and write fresh caches. Unsupported/error formulas cause an atomic failure.

Available from: `sheetdelta-core/workbook`.

```ts
recalculateExcel(input: ArrayBuffer | Uint8Array<ArrayBufferLike>, options?: WorkbookOptions & FormulaOptions): Promise<Uint8Array<ArrayBufferLike>>
```

[Options, return values and limits](../workbooks)

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

Consume consistent byte or string chunks and yield rows with logical record numbers. Backpressure is consumer-driven.

Available from: `sheetdelta-core/stream`.

```ts
readCsvStream(source: AsyncIterable<string | Uint8Array<ArrayBufferLike>>, options?: CsvStreamReadOptions): AsyncGenerator<{ row: Row; rowNumber: number; }, any, any>
```

[Options, return values and limits](../streaming)

```js
import { readCsvStream } from 'sheetdelta-core/stream';
async function* chunks(){yield new TextEncoder().encode('id,qty\n001,2');}
let first;
for await (const item of readCsvStream(chunks())) { first = item.row; }
console.log(first.id); // 001
```

## writeCsvStream

Yield CSV byte chunks from row iterables; columns are required. Write chunks to a destination to retain streaming benefits.

Available from: `sheetdelta-core/stream`.

```ts
writeCsvStream(rows: AsyncIterable<Row> | Iterable<Row>, options: CsvStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

[Options, return values and limits](../streaming)

```js
import { writeCsvStream } from 'sheetdelta-core/stream';
let size = 0;
for await (const chunk of writeCsvStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## compareStreamKeys

Comparator for exactly the text-tuple ordering required by compareSortedStreams; use identical normalization options.

Available from: `sheetdelta-core/stream`.

```ts
compareStreamKeys(a: Row, b: Row, keys: string[], options?: Pick<CompareInputOptions, "trim" | "ignoreCase">): number
```

[Options, return values and limits](../streaming)

```js
import { compareStreamKeys } from 'sheetdelta-core/stream';
const rows = [{id:'2'}, {id:'10'}];
rows.sort((a,b) => compareStreamKeys(a,b,['id']));
console.log(rows.map(r => r.id)); // ['10', '2']
```

## compareSortedStreams

Compare already sorted unique-key iterables with explicit columns. Errors may follow previously emitted rows.

Available from: `sheetdelta-core/stream`.

```ts
compareSortedStreams(left: AsyncIterable<Row> | Iterable<Row>, right: AsyncIterable<Row> | Iterable<Row>, options: CompareInputOptions, execution?: StreamOptions): AsyncGenerator<DiffRow, any, any>
```

[Options, return values and limits](../streaming)

```js
import { compareSortedStreams } from 'sheetdelta-core/stream';
let changed = 0;
for await (const row of compareSortedStreams([{id:'1',qty:1}], [{id:'1',qty:2}], {keys:['id'],columns:['qty']})) if(row.status==='changed') changed++;
console.log(changed); // 1
```

## writeExcelStream

Write one new literal-value XLSX sheet as byte chunks. No whole-row collection is required.

Available from: `sheetdelta-core/excel-stream`.

```ts
writeExcelStream(rows: AsyncIterable<Row> | Iterable<Row>, options: ExcelStreamWriteOptions): AsyncGenerator<Uint8Array<ArrayBufferLike>, any, any>
```

[Options, return values and limits](../streaming)

```js
import { writeExcelStream } from 'sheetdelta-core/excel-stream';
let size = 0;
for await (const chunk of writeExcelStream([{id:'001'}], {columns:['id']})) size += chunk.length;
console.log(size > 0); // true
```

## readExcelStream

Node-only local-file XLSX reader. Yields raw values and source rows; shared strings are retained within a configured budget.

Available from: `sheetdelta-core/excel-node`.

```ts
readExcelStream(path: string, options?: ExcelStreamReadOptions): AsyncGenerator<ExcelStreamRow, any, any>
```

[Options, return values and limits](../streaming)

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

Resolve canonical keys/aliases or exact explicit source headers. Missing required columns and ambiguous/reused matches are returned as issues.

Available from: `sheetdelta-core/import`.

```ts
mapImportHeaders(headers: readonly string[], fields: readonly ImportField[], options?: { allowUnknownColumns?: boolean; }): { mappings: { field: string; column: string; candidates: string[]; }[]; issues: ImportIssue[]; unknownColumns: string[]; valid: boolean; }
```

[Options, return values and limits](../import-workflow)

```js
import { mapImportHeaders } from 'sheetdelta-core/import';
const result = mapImportHeaders(['商品编号'], [{key:'sku',aliases:['商品编号'],requiredColumn:true}]);
console.log(result.mappings[0].column); // 商品编号
```

## prepareImport

Import an already parsed TableData. Returns original and processed rows, eligible rows, issues, audit and source locations.

Available from: `sheetdelta-core/import`.

```ts
prepareImport(table: TableData, schema: ImportSchema, options?: ImportOptions): Promise<ImportResult>
```

[Options, return values and limits](../import-workflow)

```js
import { prepareImport } from 'sheetdelta-core/import';
import { readCsv } from 'sheetdelta-core/csv';
const result = await prepareImport(readCsv('id,qty\n001,2'), {fields:[{key:'id'}, {key:'qty',clean:{type:'number'}}]}, {format:'csv'});
console.log(result.rows[0].qty); // 2
```

## importFile

Read an explicitly selected file format and run the import workflow. CSV accepts text/bytes; Excel accepts bytes and requires one selected sheet.

Available from: `sheetdelta-core/import`.

```ts
importFile(input: string | ArrayBuffer | Uint8Array<ArrayBufferLike>, schema: ImportSchema, options: ImportFileOptions): Promise<ImportResult>
```

[Options, return values and limits](../import-workflow)

```js
import { importFile } from 'sheetdelta-core/import';
const result = await importFile('id,qty\n001,-2', {fields:[{key:'id'}, {key:'qty',clean:{type:'number'},rule:{min:0}}]}, {format:'csv'});
console.log(result.status, result.rows.length); // invalid 0
```

## locateImportCell

Resolve an original data-row index and canonical field to source position. Only Excel worksheet positions have A1 cell addresses.

Available from: `sheetdelta-core/import`.

```ts
locateImportCell(result: Pick<ImportResult, "original" | "mappings" | "rowSources">, row: number, field: string): ImportLocation
```

[Options, return values and limits](../import-workflow)

```js
import { locateImportCell } from 'sheetdelta-core/import';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const source = locateImportCell(result,1,'qty');
console.log(source.sourceRow, source.sourceColumn); // 2 qty
```

## exportImportReport

Generate Data, Issues and Summary sheets. Data keeps original values for repair; original formatting is not copied.

Available from: `sheetdelta-core/import-report`.

```ts
exportImportReport(result: ImportResult): Promise<Uint8Array<ArrayBufferLike>>
```

[Options, return values and limits](../import-workflow)

```js
import { exportImportReport } from 'sheetdelta-core/import-report';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const bytes = await exportImportReport(result);
console.log(bytes instanceof Uint8Array); // true
```

## SheetDeltaError

Construct a stable error with code/context. toJSON() is suitable for Worker transport; inspect code after deserialization.

Available from: `sheetdelta-core`, `sheetdelta-core/errors`.

```ts
SheetDeltaError(code: ErrorCode, message: string, context?: ErrorContext, options?: ErrorOptions): SheetDeltaError
```

[Options, return values and limits](../errors)

```js
import { SheetDeltaError } from 'sheetdelta-core/errors';
const error = new SheetDeltaError('INVALID_DATA','Missing value',{row:2,column:'qty'});
console.log(error.toJSON().code); // INVALID_DATA
```

## isSheetDeltaError

Same-realm type guard for SheetDeltaError. Serialized Worker errors are plain objects and do not pass this guard.

Available from: `sheetdelta-core`, `sheetdelta-core/errors`.

```ts
isSheetDeltaError(error: unknown): error is SheetDeltaError
```

[Options, return values and limits](../errors)

```js
import { isSheetDeltaError } from 'sheetdelta-core/errors';
import { SheetDeltaError } from 'sheetdelta-core/errors';
console.log(isSheetDeltaError(new SheetDeltaError('INVALID_DATA','Bad data'))); // true
```

## TableValidationError

Comparison input error carrying duplicate/missing-key/column issues. Extends SheetDeltaError; supports toJSON().

Available from: `sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`.

```ts
TableValidationError(issues: DataIssue[]): TableValidationError
```

[Options, return values and limits](../validation)

```js
import { TableValidationError } from 'sheetdelta-core/types';
const error = new TableValidationError([{side:'left',code:'missing-key',rows:[1],column:'id'}]);
console.log(error.toJSON().issues.length); // 1
```

## MergeConflictError

Join conflict error containing each key/column and both values. Extends SheetDeltaError.

Available from: `sheetdelta-core/merge`.

```ts
MergeConflictError(conflicts: MergeConflict[]): MergeConflictError
```

[Options, return values and limits](../merge)

```js
import { MergeConflictError } from 'sheetdelta-core/merge';
const error = new MergeConflictError([{key:['1'],column:'qty',left:1,right:2}]);
console.log(error.toJSON().conflicts.length); // 1
```

## parseXml

Low-level compatibility export: parse XML with DTD/entity declarations rejected. Not a general-purpose XML security sandbox.

Available from: `sheetdelta-core/workbook`.

**Low-level compatibility helper.**

```ts
parseXml(xml: string): Document
```

[Options, return values and limits](../workbooks)

```js
import { parseXml } from 'sheetdelta-core/workbook';
const doc = parseXml('<root><item id="1"/></root>');
console.log(doc.documentElement.localName); // root
```

## elements

Low-level compatibility export: find descendant elements by local name across namespaces.

Available from: `sheetdelta-core/workbook`.

**Low-level compatibility helper.**

```ts
elements(doc: Document | Element, name: string): Element[]
```

[Options, return values and limits](../workbooks)

```js
import { elements } from 'sheetdelta-core/workbook';
import { parseXml } from 'sheetdelta-core/workbook';
const nodes = elements(parseXml('<root><item id="1"/></root>'),'item');
console.log(nodes[0].getAttribute('id')); // 1
```

## relationshipPath

Low-level compatibility export: resolve an OOXML relationship target inside a package. Not a filesystem/URL resolver.

Available from: `sheetdelta-core/workbook`.

**Low-level compatibility helper.**

```ts
relationshipPath(base: string, target: string): string
```

[Options, return values and limits](../workbooks)

```js
import { relationshipPath } from 'sheetdelta-core/workbook';
console.log(relationshipPath('xl/workbook.xml','worksheets/sheet1.xml')); // xl/worksheets/sheet1.xml
```

## assertRecord

Low-level compatibility export: reject null, arrays and non-objects with INVALID_OPTIONS. Does not validate row contents.

Available from: `sheetdelta-core/errors`.

**Low-level compatibility helper.**

```ts
assertRecord(value: unknown, label: string): void
```

[Options, return values and limits](../errors)

```js
import { assertRecord } from 'sheetdelta-core/errors';
assertRecord({keys:['id']},'options');
console.log('valid options');
```

## fail

Low-level compatibility export: always throw a SheetDeltaError with code, message and context.

Available from: `sheetdelta-core/errors`.

**Low-level compatibility helper.**

```ts
fail(code: ErrorCode, message: string, context?: ErrorContext): never
```

[Options, return values and limits](../errors)

```js
import { fail } from 'sheetdelta-core/errors';
let code;
try { fail('INVALID_DATA','Missing ID',{column:'id'}); } catch(error) { code = error.code; }
console.log(code); // INVALID_DATA
```

## wrapError

Low-level compatibility export: rethrow an existing SheetDeltaError, otherwise wrap with cause. Always throws.

Available from: `sheetdelta-core/errors`.

**Low-level compatibility helper.**

```ts
wrapError(error: unknown, code: ErrorCode, message: string, context?: ErrorContext): never
```

[Options, return values and limits](../errors)

```js
import { wrapError } from 'sheetdelta-core/errors';
let code;
try { wrapError(new Error('parse failed'),'INVALID_CSV','Cannot read CSV'); } catch(error) { code = error.code; }
console.log(code); // INVALID_CSV
```

