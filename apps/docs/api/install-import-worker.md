---
description: "Install the import message handler in a dedicated module worker; register business callbacks there. Returns listener cleanup."
---

# installImportWorker

[API reference](./all) / [Import & repair](./all#import)

Install the import message handler in a dedicated module worker; register business callbacks there. Returns listener cleanup.

## Import {#import}

```js
import { installImportWorker } from 'sheetdelta-core/worker';
```

## Signature {#signature}

```ts
installImportWorker(scope: ImportWorkerScope, rules?: Pick<TemplateImportOptions, "rowRules" | "tableRules" | "batchRules"> | undefined): () => void
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `scope` | Yes | `ImportWorkerScope` |
| `rules` | No | `Pick<TemplateImportOptions, "rowRules" \| "tableRules" \| "batchRules"> \| undefined` |

Option meanings, defaults and limits： [Usage guide](../worker-imports).

Related types：[`TemplateImportOptions`](./types#templateimportoptions) · [`ImportWorkerScope`](./types#importworkerscope).

## Return value {#returns}

```ts
() => void
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { installImportWorker } from 'sheetdelta-core/worker';
const listeners = new Set();
const scope = {addEventListener:(_, fn)=>listeners.add(fn),removeEventListener:(_, fn)=>listeners.delete(fn),postMessage:()=>{}};
const dispose = installImportWorker(scope);
console.log(listeners.size); // 1
dispose();
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../worker-imports)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
