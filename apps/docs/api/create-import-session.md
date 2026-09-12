---
description: "Open a persistent browser Worker that parses a CSV/Excel file once, returns bounded previews, then reuses retained data for mapping, batch repair, reports and deferred result collection."
---

# createImportSession

[API reference](./all) / [Import & repair](./all#import)

Open a persistent browser Worker that parses a CSV/Excel file once, returns bounded previews, then reuses retained data for mapping, batch repair, reports and deferred result collection.

## Import {#import}

```js
import { createImportSession } from 'sheetdelta-core/session';
```

## Signature {#signature}

```ts
createImportSession(createWorker: () => Worker, input: string | ArrayBuffer | Uint8Array<ArrayBufferLike> | Blob, options: ImportSessionOpenOptions): Promise<ImportSession>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `createWorker` | Yes | `() => Worker` |
| `input` | Yes | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike> \| Blob` |
| `options` | Yes | `ImportSessionOpenOptions` |

Option meanings, defaults and limits： [Usage guide](../import-sessions).

Related types：[`ImportSessionOpenOptions`](./types#importsessionopenoptions) · [`ImportSession`](./types#importsession).

## Return value {#returns}

```ts
Promise<ImportSession>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { createImportSession } from 'sheetdelta-core/session';
const controller = new AbortController();
controller.abort();
let code;
try { await createImportSession(() => { throw new Error('Must not start'); }, 'sku\n001', {format:'csv',signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-sessions)
- [installImportSessionWorker](./install-import-session-worker)
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
