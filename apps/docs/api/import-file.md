---
description: "Read an explicitly selected file format and run the import workflow. CSV accepts text/bytes; Excel accepts bytes and requires one selected sheet."
---

# importFile

[API reference](./all) / [Import & repair](./all#import)

Read an explicitly selected file format and run the import workflow. CSV accepts text/bytes; Excel accepts bytes and requires one selected sheet.

## Import {#import}

```js
import { importFile } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
importFile(input: string | ArrayBuffer | Uint8Array<ArrayBufferLike>, schema: ImportSchema, options: ImportFileOptions): Promise<ImportResult>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `input` | Yes | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `schema` | Yes | `ImportSchema` |
| `options` | Yes | `ImportFileOptions` |

Option meanings, defaults and limits： [Usage guide](../import-workflow).

Related types：[`ImportSchema`](./types#importschema) · [`ImportResult`](./types#importresult) · [`ImportFileOptions`](./types#importfileoptions).

## Return value {#returns}

```ts
Promise<ImportResult>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { importFile } from 'sheetdelta-core/import';
const result = await importFile('id,qty\n001,-2', {fields:[{key:'id'}, {key:'qty',clean:{type:'number'},rule:{min:0}}]}, {format:'csv'});
console.log(result.status, result.rows.length); // invalid 0
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-workflow)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
