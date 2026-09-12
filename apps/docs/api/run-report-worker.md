---
description: "Generate XLSX report bytes in a dedicated worker when requested, without revalidating the data."
---

# runReportWorker

[API reference](./all) / [Import & repair](./all#import)

Generate XLSX report bytes in a dedicated worker when requested, without revalidating the data.

## Import {#import}

```js
import { runReportWorker } from 'sheetdelta-core/worker';
```

## Signature {#signature}

```ts
runReportWorker(createWorker: () => Worker, result: ImportResult, options?: WorkerTaskOptions | undefined): Promise<Uint8Array<ArrayBufferLike>>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `createWorker` | Yes | `() => Worker` |
| `result` | Yes | `ImportResult` |
| `options` | No | `WorkerTaskOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../worker-imports).

Related types：[`ImportResult`](./types#importresult) · [`WorkerTaskOptions`](./types#workertaskoptions).

## Return value {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { runReportWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
controller.abort();
let code;
try { await runReportWorker(() => { throw new Error('Must not start'); }, {}, {signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../worker-imports)
- [runRepairWorker](./run-repair-worker)
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
