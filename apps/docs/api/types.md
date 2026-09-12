# API type reference

These declarations come from the release build and are checked in CI. Field semantics, defaults and examples are linked from the [complete API usage reference](./all). Search by type name.

## AsyncCompareOptions

`sheetdelta-core`, `sheetdelta-core/compare`

```ts
export interface AsyncCompareOptions {
    signal?: AbortSignal;
    batchSize?: number;
    onProgress?: (progress: CompareProgress) => void;
}
```

## Cell

`sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`

```ts
export type Cell = string | number | boolean | null | undefined;
```

## CellEdit

`sheetdelta-core/workbook`

```ts
export interface CellEdit {
    sheet: string;
    cell: string;
    value?: Cell;
    formula?: string;
    cachedValue?: Cell;
}
```

## Change

`sheetdelta-core`, `sheetdelta-core/types`

```ts
export interface Change {
    leftColumn: string;
    rightColumn: string;
    before: Cell;
    after: Cell;
}
```

## CleanChange

`sheetdelta-core/clean`

```ts
export interface CleanChange {
    row: number;
    column: string;
    before: Cell;
    after: Cell;
}
```

## CleanIssue

`sheetdelta-core/clean`

```ts
export interface CleanIssue {
    row: number;
    column: string;
    value: Cell;
    code: 'conversion' | 'dictionary';
}
```

## CleanRule

`sheetdelta-core/clean`

```ts
export interface CleanRule {
    trim?: boolean;
    case?: 'lower' | 'upper';
    emptyValue?: Cell;
    type?: 'string' | 'number' | 'boolean';
    dictionary?: ValueDictionary;
}
```

## ColumnPair

`sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`

```ts
export interface ColumnPair {
    left: string;
    right: string;
    numericTolerance?: number;
    trim?: boolean;
    ignoreCase?: boolean;
}
```

## ColumnRule

`sheetdelta-core/validate`

```ts
export interface ColumnRule {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'date';
    unique?: boolean;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    enum?: readonly Cell[];
    pattern?: string;
}
```

## CompareInputOptions

`sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`

```ts
export interface CompareInputOptions {
    keys: (string | ColumnPair)[];
    columns?: (string | ColumnPair)[];
    ignoreColumns?: string[];
    trim?: boolean;
    ignoreCase?: boolean;
    valueMode?: 'text' | 'strict';
    emptyValues?: 'equal' | 'distinct';
    includeUnchanged?: boolean;
}
```

## CompareOptions

`sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`

```ts
export interface CompareOptions extends Omit<CompareInputOptions, 'keys' | 'columns'> {
    keys: ColumnPair[];
    columns: ColumnPair[];
}
```

## CompareProgress

`sheetdelta-core`, `sheetdelta-core/compare`

```ts
export interface CompareProgress {
    phase: 'scan' | 'index' | 'compare' | 'append' | 'complete';
    processed: number;
    total: number;
}
```

## CsvByteReadOptions

`sheetdelta-core/csv`

```ts
export interface CsvByteReadOptions extends CsvReadOptions {
    encoding?: string;
    maxBytes?: number;
}
```

## CsvReadOptions

`sheetdelta-core/csv`

```ts
export interface CsvReadOptions extends TableReadOptions {
    delimiter?: string;
    name?: string;
}
```

## CsvStreamReadOptions

`sheetdelta-core/stream`

```ts
export interface CsvStreamReadOptions extends StreamOptions {
    delimiter?: string;
    encoding?: string;
    maxRows?: number;
    maxFieldChars?: number;
    maxRecordChars?: number;
    skipEmptyLines?: boolean;
}
```

## CsvStreamWriteOptions

`sheetdelta-core/stream`

```ts
export interface CsvStreamWriteOptions extends StreamOptions {
    columns: string[];
    delimiter?: string;
    bom?: boolean;
    escapeFormulae?: boolean;
}
```

## CsvWriteOptions

`sheetdelta-core/csv`

```ts
export interface CsvWriteOptions {
    columns?: string[];
    delimiter?: string;
    bom?: boolean;
    escapeFormulae?: boolean;
}
```

## DataIssue

`sheetdelta-core`, `sheetdelta-core/types`

```ts
export interface DataIssue {
    side: 'left' | 'right';
    code: 'missing-key' | 'duplicate-key' | 'missing-column';
    rows: number[];
    column?: string;
    key?: string[];
}
```

## DiffResult

`sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`

```ts
export interface DiffResult {
    rows: DiffRow[];
    summary: Record<Status, number> & {
        total: number;
        before: number;
        after: number;
    };
    options: ResolvedCompareOptions;
    schema: {
        added: string[];
        removed: string[];
        common: string[];
    };
}
```

## DiffRow

`sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`

```ts
export interface DiffRow {
    key: string[];
    status: Status;
    before?: Row;
    after?: Row;
    leftIndex?: number;
    rightIndex?: number;
    changes: Change[];
}
```

## ErrorCode

`sheetdelta-core`, `sheetdelta-core/errors`

```ts
export type ErrorCode = 'INVALID_OPTIONS' | 'INVALID_DATA' | 'INVALID_HEADER' | 'LIMIT_EXCEEDED' | 'INVALID_CSV' | 'INVALID_WORKBOOK' | 'SHEET_NOT_FOUND' | 'EMPTY_WORKBOOK' | 'MISSING_KEY' | 'DUPLICATE_KEY' | 'SCHEMA_MISMATCH' | 'MERGE_CONFLICT' | 'TABLE_VALIDATION' | 'FORMULA_REJECTED' | 'MERGED_CELLS' | 'CELL_ERROR' | 'ABORTED' | 'EXPORT_FAILED' | 'VALIDATION_TIMEOUT' | 'VALIDATION_FAILED' | 'WORKER_FAILED' | 'WORKER_TIMEOUT';
```

## ErrorContext

`sheetdelta-core`, `sheetdelta-core/errors`

```ts
export interface ErrorContext {
    operation?: string;
    sheet?: string;
    row?: number;
    column?: string;
    cell?: string;
    side?: string;
    limit?: number;
    actual?: number;
    option?: string;
}
```

## ExcelInput

`sheetdelta-core/excel`

```ts
export type ExcelInput = ArrayBuffer | Uint8Array;
```

## ExcelReadOptions

`sheetdelta-core/excel`

```ts
export interface ExcelReadOptions extends TableReadOptions {
    maxUncompressedBytes?: number;
    maxEntries?: number;
    sheets?: string[];
    values?: 'display' | 'raw';
    maxBytes?: number;
    maxTotalRows?: number;
    maxCells?: number;
    hiddenSheets?: 'include' | 'exclude';
    formulas?: 'cached' | 'reject';
    mergedCells?: 'anchor' | 'reject';
    cellErrors?: 'reject' | 'text';
}
```

## ExcelSheet

`sheetdelta-core/excel`

```ts
export interface ExcelSheet {
    name: string;
    rows: readonly Row[];
    columns?: string[];
}
```

## ExcelStreamReadOptions

`sheetdelta-core/excel-node`

```ts
export interface ExcelStreamReadOptions {
    sheet?: string;
    headerRow?: number;
    maxRows?: number;
    maxColumns?: number;
    maxUncompressedBytes?: number;
    maxSharedStringChars?: number;
    maxEntries?: number;
    formulas?: 'cached' | 'reject';
    cellErrors?: 'reject' | 'text';
    signal?: AbortSignal;
}
```

## ExcelStreamRow

`sheetdelta-core/excel-node`

```ts
export interface ExcelStreamRow {
    sheet: string;
    row: Row;
    rowNumber: number;
    date1904: boolean;
}
```

## ExcelStreamWriteOptions

`sheetdelta-core/excel-stream`

```ts
export interface ExcelStreamWriteOptions {
    columns: string[];
    sheetName?: string;
    signal?: AbortSignal;
    maxRows?: number;
}
```

## FormulaCell

`sheetdelta-core/formula`

```ts
export type FormulaCell = Cell | {
    formula: string;
};
```

## FormulaIssue

`sheetdelta-core/formula`

```ts
export interface FormulaIssue {
    sheet: string;
    cell: string;
    formula: string;
    code: string;
    message: string;
}
```

## FormulaOptions

`sheetdelta-core/formula`

```ts
export interface FormulaOptions {
    maxCells?: number;
    maxRangeCells?: number;
    maxDepth?: number;
    maxOperations?: number;
}
```

## FormulaWorkbook

`sheetdelta-core/formula`

```ts
export type FormulaWorkbook = Record<string, Record<string, FormulaCell>>;
```

## ImportBatchOptions

`sheetdelta-core/import`

```ts
export interface ImportBatchOptions {
    batchSize?: number;
    concurrency?: number;
    timeoutMs?: number;
}
```

## ImportBatchRow

`sheetdelta-core/import`

```ts
export interface ImportBatchRow {
    readonly row: number;
    readonly values: Readonly<Row>;
}
```

## ImportBatchRule

`sheetdelta-core/import`

```ts
export interface ImportBatchRule {
    id: string;
    /** Issues use global one-based data row numbers from the input items, not batch offsets. */
    validate: (rows: readonly ImportBatchRow[], context: {
        signal: AbortSignal;
    }) => Promise<readonly Omit<ImportIssue, 'source' | 'ruleId'>[]>;
}
```

## ImportCellEdit

`sheetdelta-core/import`

```ts
export interface ImportCellEdit {
    /** One-based original data-row index, not the worksheet row number. */
    row: number;
    /** Exact source header, not a canonical field alias. */
    column: string;
    value: Cell;
}
```

## ImportField

`sheetdelta-core/import`

```ts
export interface ImportField {
    key: string;
    aliases?: readonly string[];
    /** Explicit, exact source header; overrides aliases. */
    source?: string;
    requiredColumn?: boolean;
    clean?: CleanRule;
    rule?: ColumnRule;
}
```

## ImportFileOptions

`sheetdelta-core/import`

```ts
export interface ImportFileOptions extends Omit<ImportOptions, 'format'> {
    format: 'csv' | 'excel';
    csv?: CsvByteReadOptions;
    excel?: ExcelReadOptions;
    sheet?: string;
}
```

## ImportIssue

`sheetdelta-core/import`

```ts
export interface ImportIssue {
    code: string;
    message: string;
    severity: 'error' | 'warning';
    /** One-based position in processedRows, never a physical worksheet row. */
    row?: number;
    column?: string;
    ruleId?: string;
    source?: ImportLocation;
}
```

## ImportLocation

`sheetdelta-core/import`

```ts
export interface ImportLocation {
    fileName?: string;
    sheet: string;
    sourceRow?: number;
    positionKind: 'worksheet-row' | 'csv-record' | 'data-row';
    sourceColumn?: string;
    columnIndex?: number;
    cell?: string;
}
```

## ImportMapping

`sheetdelta-core/import`

```ts
export interface ImportMapping {
    field: string;
    column?: string;
    candidates: string[];
}
```

## ImportOptions

`sheetdelta-core/import`

```ts
export interface ImportOptions {
    mode?: 'strict' | 'valid-rows';
    fileName?: string;
    format?: 'table' | 'csv' | 'excel';
    signal?: AbortSignal;
    onProgress?: (event: ImportProgress) => void;
    batchValidation?: ImportBatchOptions;
    batchSize?: number;
    maxRows?: number;
    maxCells?: number;
    maxIssues?: number;
}
```

## ImportProgress

`sheetdelta-core/import`

```ts
export interface ImportProgress {
    phase: 'map' | 'clean' | 'validate' | 'rules' | 'batch-rules' | 'complete';
    processed: number;
    total: number;
}
```

## ImportResult

`sheetdelta-core/import`

```ts
export interface ImportResult {
    status: 'ready' | 'partial' | 'invalid';
    valid: boolean;
    /** Eligible rows only; strict mode returns no rows if any error exists. */
    rows: Row[];
    sources: ImportLocation[];
    processedRows: Row[];
    rowSources: ImportLocation[];
    original: TableData;
    mappings: ImportMapping[];
    issues: ImportIssue[];
    changes: (CleanChange & {
        source: ImportLocation;
    })[];
    validRows: number[];
    invalidRows: number[];
    summary: {
        total: number;
        accepted: number;
        errors: number;
        warnings: number;
    };
}
```

## ImportSchema

`sheetdelta-core/import`

```ts
export interface ImportSchema {
    fields: readonly ImportField[];
    allowUnknownColumns?: boolean;
    rowRules?: readonly RowRule[];
    tableRules?: readonly TableRule[];
    batchRules?: readonly ImportBatchRule[];
}
```

## ImportTemplate

`sheetdelta-core/import`

```ts
export interface ImportTemplate {
    version: 1;
    id: string;
    revision: number;
    format: 'csv' | 'excel';
    headerRow?: number;
    sheet?: string;
    delimiter?: string;
    encoding?: string;
    values?: 'display' | 'raw';
    fields: readonly ImportField[];
    allowUnknownColumns?: boolean;
}
```

## ImportWarning

`sheetdelta-core`, `sheetdelta-core/excel`, `sheetdelta-core/types`

```ts
export interface ImportWarning {
    code: 'FORMULA_NO_CACHE' | 'MERGED_CELLS' | 'HIDDEN_SHEET';
    message: string;
    sheet: string;
    row?: number;
    column?: string;
    cell?: string;
}
```

## ImportWorkerScope

`sheetdelta-core/worker`

```ts
export interface ImportWorkerScope {
    addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
    removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
    postMessage(message: unknown, transfer?: Transferable[]): void;
}
```

## MergeConflict

`sheetdelta-core/merge`

```ts
export interface MergeConflict {
    key: Cell[];
    column: string;
    left: Cell;
    right: Cell;
}
```

## MergeOptions

`sheetdelta-core/merge`

```ts
export interface MergeOptions {
    keys: string[];
    join?: 'left' | 'inner' | 'full';
    conflict?: 'error' | 'left' | 'right';
}
```

## PatchWorkbookOptions

`sheetdelta-core/workbook`

```ts
export interface PatchWorkbookOptions extends WorkbookOptions {
    recalculateOnOpen?: boolean;
}
```

## ResolvedCompareOptions

`sheetdelta-core`, `sheetdelta-core/types`

```ts
export type ResolvedCompareOptions = CompareOptions;
```

## Row

`sheetdelta-core`, `sheetdelta-core/compare`, `sheetdelta-core/types`

```ts
export type Row = Record<string, Cell>;
```

## RowRule

`sheetdelta-core/import`

```ts
export interface RowRule {
    id: string;
    validate: (row: Readonly<Row>, context: {
        row: number;
    }) => readonly Omit<ImportIssue, 'row' | 'source' | 'ruleId'>[];
}
```

## Status

`sheetdelta-core`, `sheetdelta-core/types`

```ts
export type Status = 'added' | 'removed' | 'changed' | 'unchanged';
```

## StreamOptions

`sheetdelta-core/stream`

```ts
export interface StreamOptions {
    signal?: AbortSignal;
}
```

## TableData

`sheetdelta-core`, `sheetdelta-core/csv`, `sheetdelta-core/excel`, `sheetdelta-core/types`

```ts
export interface TableData {
    name: string;
    headers: string[];
    rows: Row[];
    rowNumbers: number[];
    warnings?: ImportWarning[];
    metadata?: {
        date1904: boolean;
        hidden: boolean;
    };
}
```

## TableReadOptions

`sheetdelta-core`, `sheetdelta-core/types`

```ts
export interface TableReadOptions {
    headerRow?: number;
    maxRows?: number;
    maxColumns?: number;
    skipEmptyLines?: boolean;
}
```

## TableRule

`sheetdelta-core/import`

```ts
export interface TableRule {
    id: string;
    validate: (rows: readonly Readonly<Row>[]) => readonly Omit<ImportIssue, 'source' | 'ruleId'>[];
}
```

## TableSchema

`sheetdelta-core/validate`

```ts
export type TableSchema = Record<string, ColumnRule>;
```

## TemplateImportOptions

`sheetdelta-core/import`

```ts
export interface TemplateImportOptions extends Omit<ImportOptions, 'format'> {
    rowRules?: ImportSchema['rowRules'];
    tableRules?: ImportSchema['tableRules'];
    batchRules?: ImportSchema['batchRules'];
}
```

## ValidationIssue

`sheetdelta-core/validate`

```ts
export interface ValidationIssue {
    code: 'required' | 'type' | 'unique' | 'min' | 'max' | 'minLength' | 'maxLength' | 'enum' | 'pattern' | 'unknown-column';
    row: number;
    column: string;
    value: Cell;
    message: string;
}
```

## ValidationResult

`sheetdelta-core/validate`

```ts
export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
    validRows: number[];
    invalidRows: number[];
}
```

## ValueDictionary

`sheetdelta-core/clean`

```ts
export interface ValueDictionary {
    /** Type-sensitive literal mappings; duplicate inputs are rejected. */
    entries: readonly {
        from: Exclude<Cell, undefined>;
        to: Exclude<Cell, undefined>;
    }[];
    unknown?: 'error' | 'keep';
}
```

## WorkbookOptions

`sheetdelta-core/workbook`

```ts
export interface WorkbookOptions {
    maxBytes?: number;
    maxUncompressedBytes?: number;
    maxEntries?: number;
}
```

## WorkerImportOptions

`sheetdelta-core/worker`

```ts
export interface WorkerImportOptions extends Omit<TemplateImportOptions, "signal" | "onProgress" | "rowRules" | "tableRules" | "batchRules"> {
    signal?: AbortSignal;
    onProgress?: (progress: WorkerImportProgress) => void;
    /** Whole task deadline, including Blob reading. Default: 120 seconds. */
    timeoutMs?: number;
    /** Include an editable original-data error report. Default: false. */
    report?: boolean;
}
```

## WorkerImportProgress

`sheetdelta-core/worker`

```ts
export interface WorkerImportProgress {
    phase: "read" | "parse" | "report" | ImportProgress["phase"];
    processed: number;
    total: number;
}
```

## WorkerImportResult

`sheetdelta-core/worker`

```ts
export interface WorkerImportResult {
    result: ImportResult;
    report?: Uint8Array;
}
```

## WorkerRepairOptions

`sheetdelta-core/worker`

```ts
export interface WorkerRepairOptions extends Omit<ImportOptions, "onProgress"> {
    onProgress?: (progress: WorkerImportProgress) => void;
    timeoutMs?: number;
    report?: boolean;
}
```

## WorkerTaskOptions

`sheetdelta-core/worker`

```ts
export type WorkerTaskOptions = Pick<WorkerImportOptions, "signal" | "onProgress" | "timeoutMs">;
```

