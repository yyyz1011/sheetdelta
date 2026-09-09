# compareTables

Match records by key and return a structured, synchronous comparison.

## Signature

```ts
compareTables(
  left: readonly Row[],
  right: readonly Row[],
  options: CompareInputOptions,
): DiffResult
```

```ts
type Cell = string | number | boolean | null | undefined;
type Row = Record<string, Cell>;

type CompareInputOptions = {
  keys: (string | { left: string; right: string })[];
  columns?: (string | { left: string; right: string; numericTolerance?: number; trim?: boolean; ignoreCase?: boolean })[];
  ignoreColumns?: string[];
  valueMode?: "text" | "strict";
  emptyValues?: "equal" | "distinct";
  trim?: boolean;
  ignoreCase?: boolean;
};
```

## Options

| Option | Required | Default | Purpose |
| --- | --- | --- | --- |
| `keys` | Yes | — | One or more unique key mappings |
| `columns` | No | Common non-key columns | String names or field mappings; explicit empty arrays are rejected |
| `trim` | No | `false` | Ignore surrounding whitespace |
| `ignoreCase` | No | `false` | Compare text case-insensitively |
| `columns[].numericTolerance` | No | Text comparison | Maximum absolute numeric difference |

## Return value

`DiffResult` contains `rows`, `summary`, `schema` and a cloned, resolved `options` object. `schema` contains `added`, `removed` and `common` column names inferred from record keys. Schema changes alone do not change row statuses. Empty input arrays carry no column schema.

| Row property | Description |
| --- | --- |
| `key` | Normalized string tuple |
| `status` | `added`, `removed`, `changed`, or `unchanged` |
| `before`, `after` | Original record references, when present |
| `leftIndex`, `rightIndex` | Zero-based input positions, when present |
| `changes` | Array of `{ leftColumn, rightColumn, before, after }` |

`summary` includes the four status counts, `total` (all result rows), `before` (left input count), and `after` (right input count).

## Ordering and references

Matched and removed records follow left input order. Added records follow right input order afterward. Changing row order alone does not mark records as changed. Added and removed records have an empty `changes` array.

Inputs are not mutated. Returned records reference your input objects; clone the inputs before comparing if you need an independent snapshot. Options are cloned.

## Errors

See [Validation & errors](../validation) for `TableValidationError.issues` and configuration errors.

## Shorthand and new rules

```ts
import { compareTables } from "sheetdelta-core/compare";
const result = compareTables([{ id: 1, value: 10 }], [{ id: 1, value: "10" }], {
  keys: ["id"], ignoreColumns: ["updatedAt"], valueMode: "strict", emptyValues: "distinct",
});
```

`ignoreColumns` excludes names on either side, including explicit value mappings, but never removes key validation. Strict value mode distinguishes primitive types; empty-values mode distinguishes null, undefined and empty text. Field-level `trim` and `ignoreCase` override global rules for values, not keys. Existing `CompareOptions` retains explicit required mappings for source compatibility.

## Large jobs and compact results

`includeUnchanged` defaults to `true`. Set it to `false` to retain only changed/added/removed records while preserving complete summary counts. Use `compareTablesAsync` for progress and cancellation; see [async comparison](../async). Comparison accepts primitive `Cell` values only and rejects nonfinite numbers and object values.
