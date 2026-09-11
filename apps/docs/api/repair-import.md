---
description: "Edit original source cells without reading the file again, then rerun all cleaning and validation. Earlier results are not mutated."
---

# repairImport

[API reference](./all) / [Import & repair](./all#import)

Edit original source cells without reading the file again, then rerun all cleaning and validation. Earlier results are not mutated.

## Import {#import}

```js
import { repairImport } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
repairImport(previous: ImportResult, edits: readonly ImportCellEdit[], schema: ImportSchema, options?: ImportOptions | undefined): Promise<ImportResult>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `previous` | Yes | `ImportResult` |
| `edits` | Yes | `readonly ImportCellEdit[]` |
| `schema` | Yes | `ImportSchema` |
| `options` | No | `ImportOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../import-repair).

Related types：[`ImportSchema`](./types#importschema) · [`ImportOptions`](./types#importoptions) · [`ImportResult`](./types#importresult) · [`ImportCellEdit`](./types#importcelledit).

## Return value {#returns}

```ts
Promise<ImportResult>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { repairImport } from 'sheetdelta-core/import';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'sku'}, {key:'qty',clean:{type:'number'},rule:{min:0}}]};
const previous = await importFile('sku,qty\n001,-2',schema,{format:'csv'});
const result = await repairImport(previous,[{row:1,column:'qty',value:'2'}],schema);
console.log(result.rows[0].qty); // 2
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-repair)
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
