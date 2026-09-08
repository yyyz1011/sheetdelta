# Cleaning & deduplication

## cleanTable(rows, rules)

Apply explicit column rules and retain an audit of each changed value.

```ts
import { cleanTable, deduplicateTable } from 'sheetdelta-core/clean';
const cleaned = cleanTable([{ id: '001', price: ' 12.50 ', active: 'false' }], {
  price: { trim: true, type: 'number' },
  active: { type: 'boolean' },
});
// cleaned.rows: [{ id: '001', price: 12.5, active: false }]
// cleaned.changes: [{ row, column, before, after }, ...]
// cleaned.issues: []
```

Rules: `trim`, `case: 'lower' | 'upper'`, `emptyValue`, and `type: 'string' | 'number' | 'boolean'`. Order is trimming → case → empty replacement → type conversion. Only configured, existing own fields are processed. Unconfigured IDs retain their text representation. Empty values stay empty unless a replacement is configured.

Number conversion accepts finite plain numeric strings, not currency/grouping notation. Unsafe integers are rejected. Decimal conversion uses JavaScript IEEE 754 numbers, not exact decimal arithmetic. Boolean conversion accepts only booleans or the exact strings `'true'` / `'false'`.

Returns `{ rows, changes, issues }`. Inputs are never mutated. If a field conversion fails, that field remains completely unchanged and an issue `{ row, column, value, code: 'conversion' }` is returned. Successful changes to other fields remain available. Callers decide whether to proceed when issues exist.

## deduplicateTable(rows, options)

```ts
const result = deduplicateTable([{ id: 'a', n: 1 }, { id: 'a', n: 2 }], {
  keys: ['id'], keep: 'last',
});
// rows: [{ id: 'a', n: 2 }], removedRows: [1], duplicateGroups: [[1, 2]]
```

`keys` is a nonempty list, including composite keys. `keep` defaults to `'first'`; `'last'` is opt-in. Returned rows follow their retained input positions. Missing/blank keys throw. Keys are type-sensitive: numeric `1` and string `'1'` differ. Normalize explicitly before deduplicating if needed.

Indices in changes, issues, removedRows and duplicateGroups are one-based data positions. Deduplication is only performed when you explicitly call this function; comparison never silently removes duplicates.
