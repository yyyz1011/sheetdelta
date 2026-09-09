---
description: "Export a DiffResult as CSV. changesOnly and escapeFormulae default to true."
---

# exportDiffCsv

[API reference](./all) / [CSV files](./all#csv)

Export a DiffResult as CSV. changesOnly and escapeFormulae default to true.

## Import {#import}

```js
import { exportDiffCsv } from 'sheetdelta-core/csv';
```

Also exported from：`sheetdelta-core`.

## Signature {#signature}

```ts
exportDiffCsv(result: DiffResult, { changesOnly, escapeFormulae }?: { changesOnly?: boolean | undefined; escapeFormulae?: boolean | undefined; } | undefined): string
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `result` | Yes | `DiffResult` |
| `{ changesOnly, escapeFormulae }` | No | `{ changesOnly?: boolean \| undefined; escapeFormulae?: boolean \| undefined; } \| undefined` |

Option meanings, defaults and limits： [Usage guide](../api/export-diff-csv#report-columns).

Related types：[`DiffResult`](./types#diffresult).

## Return value {#returns}

```ts
string
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { exportDiffCsv } from 'sheetdelta-core/csv';
import { compareTables } from 'sheetdelta-core/compare';
const result = compareTables([{id:'1',v:1}], [{id:'1',v:2}], {keys:['id']});
const csv = exportDiffCsv(result);
console.log(csv.includes('changed')); // true
```

## Report columns

The header starts with `change_type`, `key`, `old_row`, and `new_row`. Each selected mapping adds `old:<column>` and `new:<column>` fields. The key is JSON-encoded. Row positions assume a spreadsheet with one header row, so the first input record is exported as row 2.

## Formula escaping

By default, potential spreadsheet formula prefixes receive a leading apostrophe. This includes values starting with `=`, `+`, `-`, `@`, tab, or carriage return, including leading whitespace. Negative numbers can therefore appear with an apostrophe. Only disable escaping for trusted consumers.

Formula escaping does not control Excel's automatic type inference. Import identifier columns as text when leading zeros matter.

## Browser download

```ts
const url = URL.createObjectURL(
  new Blob([exportDiffCsv(result)], { type: 'text/csv;charset=utf-8' }),
);
const link = document.createElement('a');
link.href = url;
link.download = 'changes.csv';
document.body.appendChild(link);
link.click();
link.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

## Node.js export

```ts
import { writeFile } from 'node:fs/promises';
await writeFile('changes.csv', exportDiffCsv(result), 'utf8');
```


## Related APIs and guides {#related}

- [Usage, defaults and limits](../api/export-diff-csv#report-columns)
- [readCsv](./read-csv)
- [readCsvBytes](./read-csv-bytes)
- [writeCsv](./write-csv)
