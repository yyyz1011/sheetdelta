# Comparison rules

The default behavior compares normalized text. Numeric tolerance is opt-in for each comparison field.

## Default value handling

| Values | Default comparison |
| --- | --- |
| `null`, `undefined`, `''` | Equal |
| `10`, `'10'` | Equal |
| `'10.0'`, `'10'` | Different |
| `'001'`, `'1'` | Different |
| `'A'`, `'a'` | Different |
| `' A '`, `'A'` | Different |

Cell values may be strings, numbers, booleans, null, or undefined. Objects and arrays are outside the supported cell type.

## Text normalization

`trim: true` removes surrounding whitespace. `ignoreCase: true` lowercases using the `en-US` locale. Both options apply to keys and comparison fields and default to `false`.

::: warning Normalization can create duplicate keys
With `ignoreCase: true`, keys `'A'` and `'a'` become identical. The input then fails validation rather than silently selecting one row.
:::

## Numeric tolerance

```ts
const options = {
  keys: [{ left: 'sku', right: 'sku' }],
  columns: [{ left: 'price', right: 'price', numericTolerance: 0.01 }],
  trim: true,
  ignoreCase: false,
};
```

`numericTolerance` must be finite and non-negative. Values are equal when their absolute difference is within tolerance. Only finite plain numeric strings participate; currency symbols, grouped numbers, and other text stay text comparisons. Tolerance does not affect key matching.

## Precision

Calculations use JavaScript IEEE 754 numbers, not decimal arithmetic. For exact money comparisons, normalize to a consistent text representation or integer minor units before comparing.

## Additional rules

Omit `columns` to infer common non-key fields; `ignoreColumns` excludes named fields. `valueMode: "strict"` distinguishes primitive types. `emptyValues: "distinct"` distinguishes null, undefined and empty strings. Individual comparison mappings may set `trim` and `ignoreCase` without changing key normalization. `result.schema` lists added, removed and common columns inferred from record keys.
