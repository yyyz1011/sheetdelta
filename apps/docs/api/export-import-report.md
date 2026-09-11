---
description: "Generate Data, Issues and Summary sheets. Data keeps original values for repair; original formatting is not copied."
---

# exportImportReport

[API reference](./all) / [Import & repair](./all#import)

Generate Data, Issues and Summary sheets. Data keeps original values for repair; original formatting is not copied.

## Import {#import}

```js
import { exportImportReport } from 'sheetdelta-core/import-report';
```

## Signature {#signature}

```ts
exportImportReport(result: ImportResult): Promise<Uint8Array<ArrayBufferLike>>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `result` | Yes | `ImportResult` |

Option meanings, defaults and limits： [Usage guide](../import-workflow).

Related types：[`ImportResult`](./types#importresult).

## Return value {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { exportImportReport } from 'sheetdelta-core/import-report';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const bytes = await exportImportReport(result);
console.log(bytes instanceof Uint8Array); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-workflow)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
