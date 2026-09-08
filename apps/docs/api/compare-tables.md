# compareTables

Match records by key and return a structured, synchronous comparison.

## Signature

```ts
compareTables(
  left: readonly Row[],
  right: readonly Row[],
  options: CompareOptions,
): DiffResult
```

```ts
type Cell = string | number | boolean | null | undefined;
type Row = Record<string, Cell>;

type CompareOptions = {
  keys: { left: string; right: string }[];
  columns: { left: string; right: string; numericTolerance?: number }[];
  trim?: boolean;
  ignoreCase?: boolean;
};
```

## Options

| Option | Required | Default | Purpose |
| --- | --- | --- | --- |
| `keys` | Yes | — | One or more unique key mappings |
| `columns` | Yes | — | One or more comparison field mappings |
| `trim` | No | `false` | Ignore surrounding whitespace |
| `ignoreCase` | No | `false` | Compare text case-insensitively |
| `columns[].numericTolerance` | No | Text comparison | Maximum absolute numeric difference |

## Return value

`DiffResult` contains `rows`, `summary`, and a cloned `options` object.

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
