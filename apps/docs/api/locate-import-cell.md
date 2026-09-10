---
description: "Resolve an original data-row index and canonical field to source position. Only Excel worksheet positions have A1 cell addresses."
---

# locateImportCell

[API reference](./all) / [Import & repair](./all#import)

Resolve an original data-row index and canonical field to source position. Only Excel worksheet positions have A1 cell addresses.

## Import {#import}

```js
import { locateImportCell } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
locateImportCell(result: Pick<ImportResult, "original" | "mappings" | "rowSources">, row: number, field: string): ImportLocation
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `result` | Yes | `Pick<ImportResult, "original" \| "mappings" \| "rowSources">` |
| `row` | Yes | `number` |
| `field` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../import-workflow).

Related types：[`ImportLocation`](./types#importlocation) · [`ImportResult`](./types#importresult).

## Return value {#returns}

```ts
ImportLocation
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { locateImportCell } from 'sheetdelta-core/import';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const source = locateImportCell(result,1,'qty');
console.log(source.sourceRow, source.sourceColumn); // 2 qty
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-workflow)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [exportImportReport](./export-import-report)
