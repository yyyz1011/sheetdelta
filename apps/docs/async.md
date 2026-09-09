# Async comparison & Workers

`compareTablesAsync` uses the same comparison rules and output order as `compareTables`. It yields between row batches so progress and cancellation can be handled.

```ts
import { compareTablesAsync } from 'sheetdelta-core/compare';
import { SheetDeltaError } from 'sheetdelta-core/errors';

const controller = new AbortController();
try {
  const result = await compareTablesAsync(
    [{ id: '001', price: 10 }],
    [{ id: '001', price: 12 }],
    { keys: ['id'], includeUnchanged: false },
    {
      signal: controller.signal,
      batchSize: 2048,
      onProgress: ({ phase, processed, total }) => console.log(phase, processed, total),
    },
  );
  console.log(result.summary.changed); // 1
} catch (error) {
  if (error instanceof SheetDeltaError && error.code === 'ABORTED') {
    console.log('Cancelled');
  } else throw error;
}
// Connect a cancel button to controller.abort() while the task is running.
```

## Execution options

The fourth argument accepts `signal?: AbortSignal`, `batchSize?: number` (default `2048`, positive integer), and `onProgress?: (progress) => void`.

Progress phases are `scan`, `index`, `compare`, `append`, and `complete`. `processed` counts work units, not matched rows; `total` is three times the combined input row count. Small jobs may skip intermediate phase notifications. Empty inputs complete with `0 / 0`; use the `complete` phase instead of dividing by zero.

Cancellation rejects with `SheetDeltaError` code `ABORTED` and returns no partial result. Callback exceptions propagate. Do not mutate the input arrays, records or comparison options while a comparison is running. Abort checks occur between batches; expensive individual rows cannot be interrupted mid-row.

`includeUnchanged: false` works with both comparison APIs. It omits unchanged entries from `result.rows` while preserving all summary counts, including `summary.total` and `summary.unchanged`. This reduces result storage; input arrays and key indexes remain in memory.

## Use a Worker for browser workloads

Async comparison is cooperative scheduling on the current thread, not automatic parallelism. XLSX parsing and export also perform synchronous work after loading dependencies. For large files, move file reading, comparison and export into a Worker.

The repository includes a [comparison Worker](https://github.com/yyyz1011/sheetdelta/blob/master/examples/browser/compare.worker.ts) and a [Vite client](https://github.com/yyyz1011/sheetdelta/blob/master/examples/browser/client.ts). Copy both into your application; these are source examples, not another npm package. The example uses one worker per task, forwards progress, accepts cancellation and terminates after completion or error. It compares already parsed rows; it does not implement an XLSX import UI.

Browser messages clone row data and serialized errors. Check `error.code` in the receiving thread instead of `instanceof`. For raw file bytes, transfer an `ArrayBuffer` when you no longer need it in the sender. See [errors](./errors) and [compatibility & performance](./compatibility).
