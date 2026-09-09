---
description: "Import an already parsed TableData. Returns original and processed rows, eligible rows, issues, audit and source locations."
---

# prepareImport

[API reference](./all) / [Import & repair](./all#import)

Import an already parsed TableData. Returns original and processed rows, eligible rows, issues, audit and source locations.

## Import {#import}

```js
import { prepareImport } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
prepareImport(table: TableData, schema: ImportSchema, options?: ImportOptions | undefined): Promise<ImportResult>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `table` | Yes | `TableData` |
| `schema` | Yes | `ImportSchema` |
| `options` | No | `ImportOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../import-workflow).

Related types：[`TableData`](./types#tabledata) · [`ImportSchema`](./types#importschema) · [`ImportOptions`](./types#importoptions) · [`ImportResult`](./types#importresult).

## Return value {#returns}

```ts
Promise<ImportResult>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { prepareImport } from 'sheetdelta-core/import';
import { readCsv } from 'sheetdelta-core/csv';
const result = await prepareImport(readCsv('id,qty\n001,2'), {fields:[{key:'id'}, {key:'qty',clean:{type:'number'}}]}, {format:'csv'});
console.log(result.rows[0].qty); // 2
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-workflow)
- [importFile](./import-file)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
