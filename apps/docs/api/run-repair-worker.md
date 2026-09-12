---
description: "Repair source cells and revalidate in a dedicated worker; reports are optional and disabled by default. Register business callbacks inside the worker."
---

# runRepairWorker

[API reference](./all) / [Import & repair](./all#import)

Repair source cells and revalidate in a dedicated worker; reports are optional and disabled by default. Register business callbacks inside the worker.

## Import {#import}

```js
import { runRepairWorker } from 'sheetdelta-core/worker';
```

## Signature {#signature}

```ts
runRepairWorker(createWorker: () => Worker, previous: ImportResult, edits: readonly ImportCellEdit[], schema: Omit<ImportSchema, "rowRules" | "tableRules" | "batchRules">, options?: WorkerRepairOptions | undefined): Promise<WorkerImportResult>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `createWorker` | Yes | `() => Worker` |
| `previous` | Yes | `ImportResult` |
| `edits` | Yes | `readonly ImportCellEdit[]` |
| `schema` | Yes | `Omit<ImportSchema, "rowRules" \| "tableRules" \| "batchRules">` |
| `options` | No | `WorkerRepairOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../worker-imports).

Related types：[`ImportSchema`](./types#importschema) · [`ImportResult`](./types#importresult) · [`ImportCellEdit`](./types#importcelledit) · [`WorkerImportResult`](./types#workerimportresult) · [`WorkerRepairOptions`](./types#workerrepairoptions).

## Return value {#returns}

```ts
Promise<WorkerImportResult>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { runRepairWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
controller.abort();
let code;
try { await runRepairWorker(() => { throw new Error('Must not start'); }, {}, [], {fields:[{key:'sku'}]}, {signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../worker-imports)
- [createImportSession](./create-import-session)
- [installImportSessionWorker](./install-import-session-worker)
- [runReportWorker](./run-report-worker)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
