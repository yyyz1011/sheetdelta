# Keys & column mapping

A key identifies the same record on both sides. Comparison columns tell SheetDelta which values matter.

## Choose a stable key

Use a SKU, order ID, or another identifier that is unique within each input. Row numbers are usually a poor key because rows can move. Matching is exact after any enabled text normalization; fuzzy matching is not supported.

## Map different column names

Each mapping has a `left` name from the original input and a `right` name from the updated input. The names do not need to match.

## Use composite keys

If an order contains multiple line items, use both order and line IDs:

```ts
const options = {
  keys: [
    { left: 'orderId', right: 'order_id' },
    { left: 'lineId', right: 'line_id' },
  ],
  columns: [{ left: 'unitPrice', right: 'price' }],
};
```

Composite keys are encoded as tuples, avoiding collisions caused by joining values with a delimiter. Every key component must be present and nonblank, and the full tuple must be unique on each side.

## Preserve identifiers

Keep identifiers such as `'001'` as strings. The value `'001'` is different from `'1'`. If a file parser already converted it to `1`, the comparison cannot restore the original leading zeros.

## Select comparison fields

Supply at least one comparison mapping. Unselected fields do not affect a record's status. A column may only appear once per side within the key group or comparison group. Key fields may also be included in the comparison group when needed.
