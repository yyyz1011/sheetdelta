# Structured errors

Library validation and import failures use `SheetDeltaError`. Handle stable codes rather than matching English messages.

```ts
import { SheetDeltaError, isSheetDeltaError } from 'sheetdelta-core/errors';
import { readCsv } from 'sheetdelta-core/csv';
try {
  readCsv('id,id\n001,2');
} catch (error) {
  if (isSheetDeltaError(error)) {
    console.log(error.code, error.context); // INVALID_HEADER, source information
    console.log(error.toJSON()); // message, code, context; no cause or stack
  } else throw error;
}
```

| Code | Meaning / action |
| --- | --- |
| `INVALID_OPTIONS` | Correct invalid keys, limits, mappings or policies |
| `INVALID_DATA` | Supply row records with supported primitive values |
| `INVALID_HEADER` | Fix blank, duplicate or missing headers |
| `LIMIT_EXCEEDED` | Reduce input or deliberately raise the reported limit |
| `INVALID_CSV` | Check quoting and selected text encoding |
| `INVALID_WORKBOOK` | Check actual XLSX/XLS bytes; damaged/encrypted workbooks are unsupported |
| `SHEET_NOT_FOUND`, `EMPTY_WORKBOOK` | Correct sheet selection or provide readable data |
| `TABLE_VALIDATION` | Comparison key/column issues; inspect `issues` |
| `MISSING_KEY`, `DUPLICATE_KEY` | Merge/deduplication key problems; inspect source context |
| `SCHEMA_MISMATCH`, `MERGE_CONFLICT` | Fix append schema or choose a merge conflict policy |
| `FORMULA_REJECTED`, `MERGED_CELLS`, `CELL_ERROR` | An Excel import policy rejected a cell |
| `ABORTED` | The caller cancelled comparison |
| `EXPORT_FAILED` | Generated report could not be constructed |

Context is operation-specific and may contain `operation`, `sheet`, `row`, `column`, `cell`, `side`, `limit`, `actual` or `option`. CSV rows mean logical records; worksheet rows are physical one-based rows; comparison/merge rows are one-based input data positions. Not every failure has every field.

`TableValidationError` remains available from the root and `/compare`; its `issues` array is preserved. `MergeConflictError` remains available from `/merge` with `conflicts`. Both now extend `SheetDeltaError`, and `toJSON()` includes their issue/conflict details. A validator's expected findings and cleaning conversion issues still return in their result objects rather than throw.

`isSheetDeltaError` uses `instanceof` in the current realm. Worker messages contain plain serialized objects, so inspect `code` after crossing threads. Arbitrary caller callback exceptions, dependency-loading failures and resource exhaustion are not guaranteed to become library errors. Avoid logging sensitive cell data contained in issues or conflicts.
