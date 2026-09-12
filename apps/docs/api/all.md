---
outline: [2, 2]
search: false
description: Find every SheetDelta API by task, with parameters and runnable examples.
---

# API reference

**49 APIs, organized by task.** Open a function for its import, parameters, return value and runnable example. Search by function name with the search button in the header.

[Start with the import workflow](../import-workflow) · [Choose an import entry](../imports) · [Browse all types](./types)

## Import & repair {#import}

| API | Use it to |
| --- | --- |
| <span id="runrepairworker"></span>[runRepairWorker](./run-repair-worker) | Repair source cells and revalidate in a dedicated worker; reports are optional and disabled by default. Register business callbacks inside the worker. |
| <span id="runreportworker"></span>[runReportWorker](./run-report-worker) | Generate XLSX report bytes in a dedicated worker when requested, without revalidating the data. |
| <span id="repairimport"></span>[repairImport](./repair-import) | Edit original source cells without reading the file again, then rerun all cleaning and validation. Earlier results are not mutated. |
| <span id="runimportworker"></span>[runImportWorker](./run-import-worker) | Run a dedicated browser Worker with cancellation, deadline and optional repair workbook. See the guide for the module worker setup. |
| <span id="installimportworker"></span>[installImportWorker](./install-import-worker) | Install the import message handler in a dedicated module worker; register business callbacks there. Returns listener cleanup. |
| <span id="serializeimporttemplate"></span>[serializeImportTemplate](./serialize-import-template) | Validate and serialize a version-1 JSON template; reject callbacks, unknown properties and oversized configuration. |
| <span id="parseimporttemplate"></span>[parseImportTemplate](./parse-import-template) | Parse validated, portable import configuration. Unsupported versions and invalid fields fail explicitly. |
| <span id="importwithtemplate"></span>[importWithTemplate](./import-with-template) | Apply saved fields and file layout with application-provided runtime rules, limits, progress and cancellation. |
| <span id="importfile"></span>[importFile](./import-file) | Read an explicitly selected file format and run the import workflow. CSV accepts text/bytes; Excel accepts bytes and requires one selected sheet. |
| <span id="prepareimport"></span>[prepareImport](./prepare-import) | Import an already parsed TableData. Returns original and processed rows, eligible rows, issues, audit and source locations. |
| <span id="mapimportheaders"></span>[mapImportHeaders](./map-import-headers) | Resolve canonical keys/aliases or exact explicit source headers. Missing required columns and ambiguous/reused matches are returned as issues. |
| <span id="locateimportcell"></span>[locateImportCell](./locate-import-cell) | Resolve an original data-row index and canonical field to source position. Only Excel worksheet positions have A1 cell addresses. |
| <span id="exportimportreport"></span>[exportImportReport](./export-import-report) | Generate Data, Issues and Summary sheets. Data keeps original values for repair; original formatting is not copied. |

## Excel files {#excel}

| API | Use it to |
| --- | --- |
| <span id="readexcel"></span>[readExcel](./read-excel) | Read XLSX/XLS bytes with sheet selection, raw/display policies and resource limits. Formulas use cached values. |
| <span id="writeexcel"></span>[writeExcel](./write-excel) | Create a data workbook from named sheets. Text stays literal, including formula-shaped strings. |
| <span id="exportdiffexcel"></span>[exportDiffExcel](./export-diff-excel) | Return an XLSX summary with highlighted Added, Removed and Changed sheets. |

## CSV files {#csv}

| API | Use it to |
| --- | --- |
| <span id="readcsv"></span>[readCsv](./read-csv) | Parse text to TableData; values stay strings. CSV positions count records, including multiline fields as one record. |
| <span id="readcsvbytes"></span>[readCsvBytes](./read-csv-bytes) | Decode bytes with explicit encoding, then parse. Invalid encoding/data and byte limits produce structured errors. |
| <span id="writecsv"></span>[writeCsv](./write-csv) | Write literal values as quoted CSV with configurable columns, delimiter, BOM and formula escaping. |
| <span id="exportdiffcsv"></span>[exportDiffCsv](./export-diff-csv) | Export a DiffResult as CSV. changesOnly and escapeFormulae default to true. |

## Compare & merge {#compare}

| API | Use it to |
| --- | --- |
| <span id="comparetables"></span>[compareTables](./compare-tables) | Compare by unique keys; returns rows, summary, schema and resolved options. Inputs are not mutated. |
| <span id="comparetablesasync"></span>[compareTablesAsync](./compare-tables-async) | Same comparison with cooperative batching, progress and cancellation. Returns a Promise; it does not automatically create a Worker. |
| <span id="mergetables"></span>[mergeTables](./merge-tables) | Join unique-key tables with explicit join/conflict policies; the default rejects conflicting values. |
| <span id="appendtables"></span>[appendTables](./append-tables) | Append rows using strict or union columns. Source table/row indices are one-based. |

## Clean & validate {#clean}

| API | Use it to |
| --- | --- |
| <span id="cleantable"></span>[cleanTable](./clean-table) | Apply explicit trimming/case/type rules. Returns new rows, changed-value audit and failed conversions. |
| <span id="deduplicatetable"></span>[deduplicateTable](./deduplicate-table) | Explicitly retain first/last rows per typed composite key. Returns retained rows, removed indices and duplicate groups. |
| <span id="validatetable"></span>[validateTable](./validate-table) | Check built-in column rules without coercion. Returns valid/invalid data-row indices and all issues; maxIssues can fail explicitly. |
| <span id="isisodate"></span>[isIsoDate](./is-iso-date) | Check a real calendar date in YYYY-MM-DD form; reject locale strings and impossible dates. |

## Workbooks & formulas {#workbook}

| API | Use it to |
| --- | --- |
| <span id="patchworkbook"></span>[patchWorkbook](./patch-workbook) | Edit explicitly addressed cells while retaining untouched package content. Formula caches clear by default. |
| <span id="recalculateexcel"></span>[recalculateExcel](./recalculate-excel) | Recalculate supported formulas and write fresh caches. Unsupported/error formulas cause an atomic failure. |
| <span id="calculateworkbook"></span>[calculateWorkbook](./calculate-workbook) | Calculate the documented formula subset. Formula errors appear in the errors array and in cell values. |
| <span id="cellposition"></span>[cellPosition](./cell-position) | Convert an A1 address into one-based row and column numbers. Reject out-of-range Excel addresses. |
| <span id="celladdress"></span>[cellAddress](./cell-address) | Convert one-based Excel row/column coordinates into an A1 address. |

## Streaming {#stream}

| API | Use it to |
| --- | --- |
| <span id="readcsvstream"></span>[readCsvStream](./read-csv-stream) | Consume consistent byte or string chunks and yield rows with logical record numbers. Backpressure is consumer-driven. |
| <span id="writecsvstream"></span>[writeCsvStream](./write-csv-stream) | Yield CSV byte chunks from row iterables; columns are required. Write chunks to a destination to retain streaming benefits. |
| <span id="readexcelstream"></span>[readExcelStream](./read-excel-stream) | Node-only local-file XLSX reader. Yields raw values and source rows; shared strings are retained within a configured budget. |
| <span id="writeexcelstream"></span>[writeExcelStream](./write-excel-stream) | Write one new literal-value XLSX sheet as byte chunks. No whole-row collection is required. |
| <span id="comparesortedstreams"></span>[compareSortedStreams](./compare-sorted-streams) | Compare already sorted unique-key iterables with explicit columns. Errors may follow previously emitted rows. |
| <span id="comparestreamkeys"></span>[compareStreamKeys](./compare-stream-keys) | Comparator for exactly the text-tuple ordering required by compareSortedStreams; use identical normalization options. |

## Errors {#errors}

| API | Use it to |
| --- | --- |
| <span id="sheetdeltaerror"></span>[SheetDeltaError](./sheet-delta-error) | Construct a stable error with code/context. toJSON() is suitable for Worker transport; inspect code after deserialization. |
| <span id="issheetdeltaerror"></span>[isSheetDeltaError](./is-sheet-delta-error) | Same-realm type guard for SheetDeltaError. Serialized Worker errors are plain objects and do not pass this guard. |
| <span id="tablevalidationerror"></span>[TableValidationError](./table-validation-error) | Comparison input error carrying duplicate/missing-key/column issues. Extends SheetDeltaError; supports toJSON(). |
| <span id="mergeconflicterror"></span>[MergeConflictError](./merge-conflict-error) | Join conflict error containing each key/column and both values. Extends SheetDeltaError. |

## Low-level helpers {#helpers}

| API | Use it to |
| --- | --- |
| <span id="parsexml"></span>[parseXml](./parse-xml) | Low-level compatibility export: parse XML with DTD/entity declarations rejected. Not a general-purpose XML security sandbox. |
| <span id="elements"></span>[elements](./elements) | Low-level compatibility export: find descendant elements by local name across namespaces. |
| <span id="relationshippath"></span>[relationshipPath](./relationship-path) | Low-level compatibility export: resolve an OOXML relationship target inside a package. Not a filesystem/URL resolver. |
| <span id="assertrecord"></span>[assertRecord](./assert-record) | Low-level compatibility export: reject null, arrays and non-objects with INVALID_OPTIONS. Does not validate row contents. |
| <span id="fail"></span>[fail](./fail) | Low-level compatibility export: always throw a SheetDeltaError with code, message and context. |
| <span id="wraperror"></span>[wrapError](./wrap-error) | Low-level compatibility export: rethrow an existing SheetDeltaError, otherwise wrap with cause. Always throws. |

