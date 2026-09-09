# Schema validation

Check data before importing it into an application. Validation does not mutate or coerce values and returns all discovered issues.

```ts
import { validateTable } from 'sheetdelta-core/validate';
const result = validateTable([{ sku: '001', price: -1 }], {
  sku: { type: 'string', required: true, unique: true },
  price: { type: 'number', min: 0 },
});
console.log(result.valid); // false
console.log(result.issues[0]); // code: 'min', row: 1, column: 'price', value: -1, message
```

## validateTable(rows, schema, options?)

The schema is a record of column names to rules. `allowUnknown: false` rejects columns not named in the schema; extra columns are allowed by default.

| Rule | Behavior |
| --- | --- |
| `required` | Reject null, undefined, empty and whitespace-only strings |
| `type` | `'string'`, `'number'`, `'boolean'`, or `'date'`; numbers must be finite |
| `unique` | Report every occurrence of duplicate nonblank values, including the first |
| `min`, `max` | Inclusive bounds for numeric values |
| `minLength`, `maxLength` | Bounds for string UTF-16 length |
| `enum` | Allowed primitive values using exact equality |
| `pattern` | Regular-expression source string applied to strings |

Use `type` alongside range/string rules to reject incompatible value types. Optional blank values skip other rules. Date values must be valid calendar dates in `YYYY-MM-DD` format; ambiguous local dates and timestamps are rejected. `isIsoDate(text)` exposes the same calendar check.

Results contain `valid`, `issues`, `validRows`, and `invalidRows`. Each issue has `code`, `row`, `column`, `value`, `message`; row indices are one-based data positions. Unique checks distinguish numeric `1` from string `'1'`. Invalid schemas and regular expressions throw configuration errors. Keep schema patterns trusted.

CSV and display-mode Excel values are strings. Use [cleanTable](./clean) with explicit conversions before numeric validation, or read Excel in raw mode. To find a source file row, use `table.rowNumbers[issue.row - 1]`.

## Issue budgets and business rules

`validateTable` accepts optional `maxIssues` (positive integer). Exceeding it throws `LIMIT_EXCEEDED` without a truncated result. Omitting it preserves the existing unbounded issue count. For required source columns and cross-field rules, use the [import workflow](./import-workflow); cell `required` is not a separate header check.
