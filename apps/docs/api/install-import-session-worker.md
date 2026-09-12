---
description: "Install the persistent import-session protocol in an application-owned module Worker. Register callback rules in this Worker."
---

# installImportSessionWorker

[API reference](./all) / [Import & repair](./all#import)

Install the persistent import-session protocol in an application-owned module Worker. Register callback rules in this Worker.

## Import {#import}

```js
import { installImportSessionWorker } from 'sheetdelta-core/session';
```

## Signature {#signature}

```ts
installImportSessionWorker(scope: SessionWorkerScope, rules?: Pick<ImportSchema, "rowRules" | "tableRules" | "batchRules"> | undefined): () => void
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `scope` | Yes | `SessionWorkerScope` |
| `rules` | No | `Pick<ImportSchema, "rowRules" \| "tableRules" \| "batchRules"> \| undefined` |

Option meanings, defaults and limits： [Usage guide](../import-sessions).

Related types：[`ImportSchema`](./types#importschema).

## Return value {#returns}

```ts
() => void
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { installImportSessionWorker } from 'sheetdelta-core/session';
const listeners = new Set();
const scope = {addEventListener:(_, fn)=>listeners.add(fn),removeEventListener:(_, fn)=>listeners.delete(fn),postMessage:()=>{}};
const dispose = installImportSessionWorker(scope);
console.log(listeners.size); // 1
dispose();
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-sessions)
- [createImportSession](./create-import-session)
- [runRepairWorker](./run-repair-worker)
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
