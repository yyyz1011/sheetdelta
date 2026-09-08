# sheetdelta-core

Dependency-free, key-based table comparison for TypeScript and JavaScript. Supports column mappings, composite keys, explicit numeric tolerance, actionable validation errors, and CSV export. Source: [yyyz1011/sheetdelta](https://github.com/yyyz1011/sheetdelta).

## Installation

```sh
npm install sheetdelta-core
```

## Local installation

Build and pack from the workspace root:

```sh
npm run pack:core
# Then, in a consuming project:
npm install /path/to/sheetdelta/artifacts/sheetdelta-core-0.1.0.tgz
```

## Usage

```ts
import { compareTables, exportDiffCsv, TableValidationError } from 'sheetdelta-core';

const result = compareTables(
  [{ sku: '001', price: '129.00' }],
  [{ id: '001', price: '119.00' }],
  {
    keys: [{ left: 'sku', right: 'id' }],
    columns: [{ left: 'price', right: 'price' }],
    trim: true,
  },
);

result.summary.changed; // 1
result.rows[0].changes; // [{ leftColumn, rightColumn, before, after }]
const csv = exportDiffCsv(result); // UTF-8 BOM; changed records only
```

## API

`compareTables(left, right, options): DiffResult`

- `keys`: one or more `{ left, right }` pairs. Composite keys are encoded as tuples, without delimiter collisions. Keys must be present and unique on each side after normalization.
- `columns`: one or more `{ left, right, numericTolerance? }` pairs. Unselected values do not affect equality. Each side's column may only be mapped once within a group.
- `trim`, `ignoreCase`: default `false`; affect both keys and values.
- `numericTolerance`: omitted by default (text comparison). A finite non-negative absolute tolerance, opt-in per value field. Only finite plain numeric strings are compared as numbers. This uses IEEE 754 numbers, not decimal arithmetic.

Cell values are strings, numbers, booleans, null or undefined. Null/undefined compare like empty strings. Numbers normalize to strings. `001` remains distinct from `1`. Keys that become empty or duplicate after normalization are rejected.

`DiffResult.rows` has `status` (`added`, `removed`, `changed`, `unchanged`), normalized `key` tuple, `before`, `after`, zero-based `leftIndex`/`rightIndex`, and field-level `changes`. `summary` includes each status count plus `total`, `before`, and `after`. Matched and removed rows follow the left input order; additions follow the right input order afterward. Row references are retained; clone inputs if you need a detached snapshot. Options are cloned.

`TableValidationError.issues` has `side`, `code` (`missing-key`, `duplicate-key`, `missing-column`), and one-based input data row numbers, excluding a header. Invalid configurations throw ordinary `Error`.

`exportDiffCsv(result, { changesOnly = true, escapeFormulae = true }): string`

Exports status, JSON-encoded key tuple, row positions and old/new values for all key and comparison mappings. CSV rows assume a header at spreadsheet row 1. Fields are quoted; embedded quotes are escaped. Potential formula prefixes are prefixed with an apostrophe. Formula escaping may change the visible representation of negative numbers; disable only for trusted output consumers. Formula escaping does not prevent spreadsheet software from inferring numeric types, so import identifier columns as text if needed.

## Runtime

ESM, Node.js 18+ or modern browsers with `structuredClone`. TypeScript declarations are included. Synchronous comparison; use a Worker for large browser inputs. File parsing is deliberately outside this package. XLSX formulas, formatting differences, and fuzzy matching are not supported.

MIT license.
