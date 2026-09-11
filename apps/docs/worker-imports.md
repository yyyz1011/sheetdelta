# Worker imports with React and Vue

Keep CSV/Excel parsing, mapping, cleaning, validation and repair-workbook generation off the UI thread. [Open the React and Vue workbench](https://sheetdelta.nimokit.com/examples/) or [browse the complete source](https://github.com/yyyz1011/sheetdelta/tree/master/apps/import-examples).

## 1. Create the worker module

```ts
// import.worker.ts
/// <reference lib="webworker" />
import { installImportWorker } from 'sheetdelta-core/worker';
installImportWorker(self);
```

Register application-specific `rowRules`, `tableRules` and `batchRules` as the second argument here. Functions cannot cross the structured-clone boundary; keep business callbacks inside this module. Their existing timeout and concurrency options still apply.

## 2. Import a file

```ts
import { runImportWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
const { result, report } = await runImportWorker(
  () => new Worker(new URL('./import.worker.ts', import.meta.url), { type: 'module' }),
  file, // File, Blob, CSV string, ArrayBuffer or Uint8Array
  { version: 1, id: 'supplier', revision: 1, format: 'csv', fields: [
    { key: 'sku', requiredColumn: true, rule: { required: true, unique: true } },
    { key: 'qty', clean: { type: 'number' }, rule: { min: 0 } }
  ] },
  { signal: controller.signal, timeoutMs: 120_000, report: true,
    mode: 'valid-rows', onProgress: ({ phase }) => console.log(phase) }
);
console.log(result.rows); // Eligible rows only; does not submit to a server.
// report is XLSX bytes when report: true. Its Data sheet preserves original values.
```

For Excel use `format: 'excel'` and a `sheet` in the template, such as `sheet: 'Data'`. The factory lets your bundler resolve and emit the module worker. Serve the built assets over HTTP(S); verify your application CSP permits its worker scripts.

## React and Vue integration

The [live examples](https://sheetdelta.nimokit.com/examples/) use the same supplier schema in two independent components. Download the sample CSV, select it, and import: one of three rows is accepted. Download the repair workbook, fix negative quantity and the unknown Yes/No value in **Data**, select **Excel**, and re-import **Data**.

- React: hold the AbortController in `useRef`; abort on unmount and before a replacement job.
- Vue: hold the controller outside reactive result state; abort in `onBeforeUnmount`.
- Both examples ignore callbacks from an obsolete task, disable duplicate imports, show source row issues, and release downloaded object URLs.
- React and Vue are example-app dependencies. Installing `sheetdelta-core` does not install either framework.

## Cancellation, progress and limits

Each call owns one worker and terminates it on success, failure, cancellation or timeout. Call `controller.abort()` while the task is pending to reject with `ABORTED`, including during synchronous Excel parsing. The whole-job deadline defaults to 120 seconds and rejects with `WORKER_TIMEOUT`. Worker loading or communication failures use `WORKER_FAILED`.

Progress is phase-based: read, parse, existing preparation phases, optional report, then complete. It is not a byte-accurate progress bar during synchronous parsing. A progress callback that throws rejects the job.

Blob reading is asynchronous on the caller side; cancellation discards its eventual output but cannot stop `Blob.arrayBuffer()` itself. Caller-owned buffers are copied before transfer and remain usable. This workflow retains parsed rows and is **not streaming**; enforce the existing file/row limits and use [streaming APIs](./streaming) for bounded-memory workloads. Terminating a worker does not undo a remote business request it already sent.

## API reference

[runImportWorker](./api/run-import-worker) · [installImportWorker](./api/install-import-worker) · [Portable templates](./reusable-imports)
