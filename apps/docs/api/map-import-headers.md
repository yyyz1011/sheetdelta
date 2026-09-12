---
description: "Resolve canonical keys/aliases or exact explicit source headers. Missing required columns and ambiguous/reused matches are returned as issues."
---

# mapImportHeaders

[API reference](./all) / [Import & repair](./all#import)

Resolve canonical keys/aliases or exact explicit source headers. Missing required columns and ambiguous/reused matches are returned as issues.

## Import {#import}

```js
import { mapImportHeaders } from 'sheetdelta-core/import';
```

## Signature {#signature}

```ts
mapImportHeaders(headers: readonly string[], fields: readonly ImportField[], options?: { allowUnknownColumns?: boolean | undefined; } | undefined): { mappings: { field: string; column: string | undefined; candidates: string[]; }[]; issues: ImportIssue[]; unknownColumns: string[]; valid: boolean; }
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `headers` | Yes | `readonly string[]` |
| `fields` | Yes | `readonly ImportField[]` |
| `options` | No | `{ allowUnknownColumns?: boolean \| undefined; } \| undefined` |

Option meanings, defaults and limits： [Usage guide](../import-workflow).

Related types：[`ImportField`](./types#importfield) · [`ImportIssue`](./types#importissue).

## Return value {#returns}

```ts
{ mappings: { field: string; column: string | undefined; candidates: string[]; }[]; issues: ImportIssue[]; unknownColumns: string[]; valid: boolean; }
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { mapImportHeaders } from 'sheetdelta-core/import';
const result = mapImportHeaders(['商品编号'], [{key:'sku',aliases:['商品编号'],requiredColumn:true}]);
console.log(result.mappings[0].column); // 商品编号
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../import-workflow)
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
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
