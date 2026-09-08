# Merge & append

## mergeTables(left, right, options)

Join records by unique keys to enrich data from another table.

```ts
import { mergeTables, MergeConflictError, appendTables } from 'sheetdelta-core/merge';
const merged = mergeTables(
  [{ id: '001', name: 'Cup' }],
  [{ id: '001', stock: 20 }],
  { keys: ['id'], join: 'left' },
);
// merged.rows: [{ id: '001', name: 'Cup', stock: 20 }]
```

| Option | Default | Behavior |
| --- | --- | --- |
| `keys` | Required | One or more same-named key columns |
| `join` | `'full'` | `'left'`, `'inner'`, or `'full'` |
| `conflict` | `'error'` | Throw, or explicitly prefer `'left'` / `'right'` values |

Missing, blank and duplicate keys are rejected. Keys use typed tuples: numeric `1` and string `'1'` are distinct. This differs from comparison's backwards-compatible text key normalization; clean inputs explicitly when mixing sources.

A conflict occurs when the same non-key column is present on both sides and values differ by exact equality. Explicit null is a value, not a missing field. The default throws `MergeConflictError` with a `conflicts` array. With a preference policy, all conflicts are still returned as `{ key, column, left, right }`.

Returns `{ rows, conflicts, summary }`; summary contains `matched`, `leftOnly`, `rightOnly`, `total`. Unmatched counts describe input records even when excluded by join mode. Matched/left-only rows follow left order, then right-only rows for a full join. Inputs are not mutated. Rename differing key columns before merging; many-to-many joins are not supported.

## appendTables(tables, options?)

Append records vertically. Returns `{ rows, columns, sources }`; each source is `{ table, row }`, both one-based.

```ts
const result = appendTables([[{ id: '001' }], [{ id: '002', note: 'New' }]], {
  schema: 'union',
});
// rows: [{ id: '001', note: null }, { id: '002', note: 'New' }]
```

The default `'strict'` schema requires the same own columns on every row. `'union'` fills missing columns with null. Column order follows first appearance. Appending preserves duplicates; call `deduplicateTable` separately if required.
