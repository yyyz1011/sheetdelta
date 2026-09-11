---
description: "Run a dedicated browser Worker with cancellation, deadline and optional repair workbook. See the guide for the module worker setup."
---

# runImportWorker

[API reference](./all) / [Import & repair](./all#import)

Run a dedicated browser Worker with cancellation, deadline and optional repair workbook. See the guide for the module worker setup.

## Import {#import}

```js
import { runImportWorker } from 'sheetdelta-core/worker';
```

## Signature {#signature}

```ts
runImportWorker(createWorker: () => Worker, input: string | ArrayBuffer | Uint8Array<ArrayBufferLike> | Blob, template: ImportTemplate, options?: WorkerImportOptions | undefined): Promise<WorkerImportResult>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `createWorker` | Yes | `() => Worker` |
| `input` | Yes | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike> \| Blob` |
| `template` | Yes | `ImportTemplate` |
| `options` | No | `WorkerImportOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../worker-imports).

Related types：[`ImportTemplate`](./types#importtemplate) · [`WorkerImportResult`](./types#workerimportresult) · [`WorkerImportOptions`](./types#workerimportoptions).

## Return value {#returns}

```ts
Promise<WorkerImportResult>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { runImportWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
controller.abort();
let code;
try { await runImportWorker(() => { throw new Error('Must not start'); }, 'sku\n001', {version:1,id:'supplier',revision:1,format:'csv',fields:[{key:'sku'}]}, {signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../worker-imports)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
