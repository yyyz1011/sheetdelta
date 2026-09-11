---
description: "Apply saved fields and file layout with application-provided runtime rules, limits, progress and cancellation."
---

# importWithTemplate

[API reference](./all) / [Import & repair](./all#import)

Apply saved fields and file layout with application-provided runtime rules, limits, progress and cancellation.

## Import {#import}

```js
import { importWithTemplate } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
importWithTemplate(input: string | ArrayBuffer | Uint8Array<ArrayBufferLike>, template: ImportTemplate, options?: TemplateImportOptions | undefined): Promise<ImportResult>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `input` | Yes | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `template` | Yes | `ImportTemplate` |
| `options` | No | `TemplateImportOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../reusable-imports).

Related types：[`ImportResult`](./types#importresult) · [`ImportTemplate`](./types#importtemplate) · [`TemplateImportOptions`](./types#templateimportoptions).

## Return value {#returns}

```ts
Promise<ImportResult>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { importWithTemplate } from 'sheetdelta-core/import';
const result = await importWithTemplate('sku\n001',{version:1,id:'supplier',revision:1,format:'csv',fields:[{key:'sku',requiredColumn:true}]});
console.log(result.rows[0].sku); // 001
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../reusable-imports)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
