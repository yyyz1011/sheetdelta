---
description: "Return an XLSX summary with highlighted Added, Removed and Changed sheets."
---

# exportDiffExcel

[API reference](./all) / [Excel files](./all#excel)

Return an XLSX summary with highlighted Added, Removed and Changed sheets.

## Import {#import}

```js
import { exportDiffExcel } from 'sheetdelta-core/excel';
```

## Signature {#signature}

```ts
exportDiffExcel(result: DiffResult): Promise<Uint8Array<ArrayBufferLike>>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `result` | Yes | `DiffResult` |

Option meanings, defaults and limits： [Usage guide](../excel).

Related types：[`DiffResult`](./types#diffresult).

## Return value {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { exportDiffExcel } from 'sheetdelta-core/excel';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const bytes = await exportDiffExcel(result);
console.log(bytes instanceof Uint8Array); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../excel)
- [readExcel](./read-excel)
- [writeExcel](./write-excel)
