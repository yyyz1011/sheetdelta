# Formula calculation

Use `sheetdelta-core/formula` to evaluate the supported formula subset without loading file parsers. Use `recalculateExcel` from `/workbook` to update formula caches in an XLSX/XLSM file.

```ts
import { calculateWorkbook } from 'sheetdelta-core/formula';
const result = calculateWorkbook({
  Orders: { A1: 2, A2: 3, B1: { formula: '=A1*12.5' }, B2: { formula: '=A2*5' } },
  Summary: { A1: { formula: '=SUM(Orders!B1:B2)' } },
});
console.log(result.sheets.Summary.A1); // 40
console.log(result.errors); // []
```

## calculateWorkbook(workbook, options?)

The input maps worksheet names to cell addresses. A cell contains a string, finite number, boolean, null/undefined, or `{ formula: string }`. Formulas may start with `=`. Addresses accept `$A$1` or `A1`; sheet and cell references are case-insensitive. Duplicate sheet names or normalized addresses are rejected. Inputs are not mutated.

The result is `{ sheets, errors }`. `sheets` maps the original sheet names to computed primitive values. Formula errors appear as codes in the affected output cells and as `{ sheet, cell, formula, code, message }` entries. Dependent cells are recalculated from current input values; there is no persistent stale cache between calls. A blank scalar reference evaluates to zero.

| Supported functions | Scope |
| --- | --- |
| `SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `COUNTA` | Scalar arguments and rectangular A1 ranges |
| `IF`, `IFERROR`, `IFNA` | Selected branches are evaluated lazily |
| `AND`, `OR`, `NOT`, `TRUE`, `FALSE` | Logical operations |
| `ABS`, `ROUND` | JavaScript-number arithmetic; ROUND supports integral digits |
| `LEN`, `LOWER`, `UPPER`, `TRIM`, `CONCAT`, `CONCATENATE` | Basic text processing; TRIM collapses ASCII spaces |
| `COUNTIF`, `SUMIF` | Equality and comparison criteria; no wildcard criteria |
| `INDEX` | Scalar result using positive row/column positions |
| `MATCH` | Explicit exact mode `0` only |
| `VLOOKUP`, `HLOOKUP` | Explicit exact mode `FALSE` or `0` only |
| `XLOOKUP` | Exact, forward search; optional not-found value |

Operators: `+ - * / ^ % & = <> < > <= >=`, parentheses, quoted strings with doubled quotes, rectangular ranges and references such as `'Unit Prices'!$B$2`. Exponentiation follows Excel's left-associative order. Text comparisons ignore case. Ranges in numeric aggregate functions ignore text and booleans; literal arguments use the function's coercion rules.

## Errors and limits

Common codes: `#DIV/0!`, `#VALUE!`, `#REF!`, `#NAME?`, `#NUM!`, `#N/A`; circular references use `#CYCLE!`. Invalid input/options throw `SheetDeltaError`; ordinary formula evaluation problems return in `errors`.

| Option | Default | Meaning |
| --- | --- | --- |
| `maxCells` | `100000` | Defined input cells |
| `maxRangeCells` | `100000` | Cells in one expanded range |
| `maxDepth` | `128` | Expression/dependency evaluation depth; maximum configurable value 512 |
| `maxOperations` | `1000000` | Shared cell-resolution/expression work budget |

Formula text is limited to 8,192 characters. No JavaScript `eval`, macros, external links or network functions are executed.

## Compatibility boundary

This is an explicit formula subset, not the complete Excel calculation engine. Named ranges, structured table references, dynamic/spill arrays, full-column ranges, wildcard/approximate lookups, locale-specific separators, omitted arguments, volatile date/time functions and financial/statistical catalogs are not supported. Unsupported syntax/functions return errors rather than reusing cached answers. Decimal results follow JavaScript number precision.

The invoice fixture compares 11 calculated cells against LibreOffice-generated caches; numeric comparisons permit floating-point rounding differences. See [compatibility evidence](./compatibility) and [workbook editing](./workbooks).

## Cross-application type rules

Numeric aggregates ignore text and booleans in both single-cell and range references; direct arguments follow function coercion. This follows [Microsoft's SUM documentation](https://learn.microsoft.com/en-us/office/vba/api/excel.worksheetfunction.sum). Numeric criteria in this API match numeric text and exclude booleans; text criteria compare case-insensitively. Normalize types before sharing calculations between spreadsheet applications.

The expanded oracle contains 53 formulas: 44 agree with LibreOffice caches, while 9 mixed-type cases explicitly assert this API's documented rules and retain the differences. They are not counted as cross-application matches. The invoice fixture adds 11 agreed formula results. Recognized `_xlfn.` and `_xlws.` prefixes can be read; workbook output qualifies supported newer functions with their required prefix.
