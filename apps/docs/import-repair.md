# Repair and revalidate without re-uploading

Use `repairImport` to change cells in an existing import result. The file is not parsed again. The result contains the corrected source data, refreshed issues and eligible rows; the previous result stays unchanged.

```ts
import { importFile, repairImport } from 'sheetdelta-core/import';
const schema = { fields: [
  { key: 'sku', aliases: ['SKU'], rule: { unique: true } },
  { key: 'qty', clean: { type: 'number' as const }, rule: { min: 0 } }
] };
const previous = await importFile('SKU,qty\n001,-2', schema, { format: 'csv' });
const result = await repairImport(previous, [
  { row: 1, column: 'qty', value: '2' }
], schema, { mode: 'valid-rows' });
console.log(result.rows); // [{ sku: '001', qty: 2 }]
```

## Coordinates and guarantees

- `row` is the one-based **original data-row index**, excluding headers. It is not the worksheet row number or the index in eligible `rows`.
- `column` is the exact **source header**, such as `SKU`, not a canonical alias such as `sku`. Issue `source.sourceColumn` provides this header.
- Duplicate edits for one cell, invalid coordinates and non-finite values are rejected. Use `null` to clear a cell.
- Cleaning, uniqueness and all supplied business rules run again across the entire table. Changing a key can invalidate another row; row-only validation would miss this.
- Pass the same schema and runtime rules again; they are not stored in `ImportResult`. Supply `mode: 'valid-rows'` again if desired; default mode is strict. File name and source-position kind are inferred from prior row sources unless overridden.
- Mapping can be repaired by passing an updated schema and an empty edit list. Missing columns cannot be created through cell edits.
- The new result's `original` is the corrected source table. Its change log describes cleaning in that run, not a persistent history of manual edits; retain earlier results if needed.

## Try React or Vue

[Open the workbench](https://sheetdelta.nimokit.com/examples/). Import the sample, then use **Repair a source cell**: data row `2`, column `qty`, value `3`; then data row `3`, column `active`, value `Yes`. All three rows become eligible without uploading again.

Initial file imports use a Worker. The current repair example runs cooperative preparation on the calling thread and lazily regenerates the report; synchronous validation/report work can still occupy that thread. This is not a virtualized spreadsheet editor or a bounded-memory import engine.

## Performance measurements

Local synthetic parsed-table benchmark, **2026-09-12, Apple M4, macOS arm64, Node 25.9.0**. One warmup followed by five measured runs; values below are medians. Each row has five fields, three cleaning changes and a unique key; no custom business callbacks.

| Operation | v0.7.0 | Optimized | Time reduction |
| --- | ---: | ---: | ---: |
| Prepare 1,000 rows | 7.77 ms | 6.44 ms | 17% |
| Prepare 10,000 rows | 73.76 ms | 47.94 ms | 35% |
| Prepare 50,000 rows | 355.14 ms | 228.08 ms | 36% |
| Match 1,000 headers | 34.71 ms | 1.53 ms | 96% |

The optimization builds header indexes, reuses source-column locations and avoids frozen snapshots and batch waits when no business rules exist. It also reuses cleaning/validation rule entries rather than rebuilding them per row.

These measurements exclude CSV/XLSX parsing, report generation, Worker transfer and network time. They do not establish peak-memory savings or the same speedup for all workloads. Results depend on row width, rules, machine and GC. Full-table validation remains intentional for correctness.

Run `npm run bench:import`. The [raw measurements](https://github.com/yyyz1011/sheetdelta/blob/master/benchmarks/import-2026-09-12.json) retain all five samples and methodology. The script accepts a built `import.js` module path to compare a prior version using the same fixture.

[API reference](./api/repair-import) · [Streaming alternatives](./streaming)
