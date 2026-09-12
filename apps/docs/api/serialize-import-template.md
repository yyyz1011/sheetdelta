---
description: "Validate and serialize a version-1 JSON template; reject callbacks, unknown properties and oversized configuration."
---

# serializeImportTemplate

[API reference](./all) / [Import & repair](./all#import)

Validate and serialize a version-1 JSON template; reject callbacks, unknown properties and oversized configuration.

## Import {#import}

```js
import { serializeImportTemplate } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
serializeImportTemplate(template: ImportTemplate): string
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `template` | Yes | `ImportTemplate` |

Option meanings, defaults and limits： [Usage guide](../reusable-imports).

Related types：[`ImportTemplate`](./types#importtemplate).

## Return value {#returns}

```ts
string
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { serializeImportTemplate } from 'sheetdelta-core/import';
const json = serializeImportTemplate({version:1,id:'supplier',revision:1,format:'csv',fields:[{key:'sku',requiredColumn:true}]});
console.log(JSON.parse(json).id); // supplier
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../reusable-imports)
- [createImportSession](./create-import-session)
- [installImportSessionWorker](./install-import-session-worker)
- [runRepairWorker](./run-repair-worker)
- [runReportWorker](./run-report-worker)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
