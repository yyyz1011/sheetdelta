---
description: "Compare by unique keys; returns rows, summary, schema and resolved options. Inputs are not mutated."
---

# compareTables

[API reference](./all) / [Compare & merge](./all#compare)

Compare by unique keys; returns rows, summary, schema and resolved options. Inputs are not mutated.

## Import {#import}

```js
import { compareTables } from 'sheetdelta-core/compare';
```

Also exported from：`sheetdelta-core`.

## Signature {#signature}

```ts
compareTables(left: readonly Row[], right: readonly Row[], options: CompareInputOptions): DiffResult
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `left` | Yes | `readonly Row[]` |
| `right` | Yes | `readonly Row[]` |
| `options` | Yes | `CompareInputOptions` |

Option meanings, defaults and limits： [Usage guide](../api/compare-tables#options).

Related types：[`Row`](./types#row) · [`CompareInputOptions`](./types#compareinputoptions) · [`DiffResult`](./types#diffresult).

## Return value {#returns}

```ts
DiffResult
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { compareTables } from 'sheetdelta-core/compare';
const before = [{id:'001', qty:1}];
const after = [{id:'001', qty:2}];
const result = compareTables(before, after, {keys:['id']});
console.log(result.summary.changed); // 1
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


## Related APIs and guides {#related}

- [Usage, defaults and limits](../api/compare-tables#options)
- [compareTablesAsync](./compare-tables-async)
- [mergeTables](./merge-tables)
- [appendTables](./append-tables)
