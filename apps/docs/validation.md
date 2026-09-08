# Validation & errors

SheetDelta checks both inputs before producing a comparison. Invalid records raise a `TableValidationError`; no partial result is returned.

## Handle data issues

```ts
import { compareTables, TableValidationError } from 'sheetdelta-core';

try {
  compareTables(
    [{ id: '001', price: 10 }, { id: '001', price: 12 }],
    [{ id: '001', price: 11 }],
    { keys: [{ left: 'id', right: 'id' }],
      columns: [{ left: 'price', right: 'price' }] },
  );
} catch (error) {
  if (error instanceof TableValidationError) {
    console.log(error.issues);
    // [{ side: 'left', code: 'duplicate-key', rows: [1, 2], key: ['001'] }]
  } else {
    throw error;
  }
}
```

## Issue codes

| Code | Meaning | How to resolve |
| --- | --- | --- |
| `missing-key` | A key component is blank | Fill the identifier or remove the incomplete record |
| `duplicate-key` | A normalized key appears more than once on one side | Deduplicate records or use a composite key |
| `missing-column` | A selected key or comparison column is absent | Correct the mapping or supply the column |

An issue includes `side`, `code`, and `rows`; `column` and `key` are included when relevant. Row numbers are **1-based input data rows**, excluding a header. For an unchanged file layout with one header, add 1 to locate the spreadsheet row.

## Configuration errors

Empty mapping lists, empty column names, repeated mappings, and invalid numeric tolerance throw ordinary `Error` objects. Handle these separately from data-quality issues.
