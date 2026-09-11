---
description: "Parse validated, portable import configuration. Unsupported versions and invalid fields fail explicitly."
---

# parseImportTemplate

[API reference](./all) / [Import & repair](./all#import)

Parse validated, portable import configuration. Unsupported versions and invalid fields fail explicitly.

## Import {#import}

```js
import { parseImportTemplate } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
parseImportTemplate(json: string): ImportTemplate
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `json` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../reusable-imports).

Related types：[`ImportTemplate`](./types#importtemplate).

## Return value {#returns}

```ts
ImportTemplate
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { parseImportTemplate } from 'sheetdelta-core/import';
const template = parseImportTemplate('{"version":1,"id":"supplier","revision":1,"format":"csv","fields":[{"key":"sku"}]}');
console.log(template.revision); // 1
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../reusable-imports)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
