---
description: "Node-only local-file XLSX reader. Yields raw values and source rows; shared strings are retained within a configured budget."
---

# readExcelStream

[API reference](./all) / [Streaming](./all#stream)

Node-only local-file XLSX reader. Yields raw values and source rows; shared strings are retained within a configured budget.

::: warning Node.js only
This API reads a local file path. It cannot run in a browser.
:::

## Import {#import}

```js
import { readExcelStream } from 'sheetdelta-core/excel-node';
```

## Signature {#signature}

```ts
readExcelStream(path: string, options?: ExcelStreamReadOptions | undefined): AsyncGenerator<ExcelStreamRow, any, any>
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `path` | Yes | `string` |
| `options` | No | `ExcelStreamReadOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../streaming).

Related types：[`ExcelStreamReadOptions`](./types#excelstreamreadoptions) · [`ExcelStreamRow`](./types#excelstreamrow).

## Return value {#returns}

```ts
AsyncGenerator<ExcelStreamRow, any, any>
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { readExcelStream } from 'sheetdelta-core/excel-node';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeExcel } from 'sheetdelta-core/excel';
const bytes = await writeExcel([{name:'Data', rows:[{id:'001', qty:2}]}]);
const dir = await mkdtemp(join(tmpdir(),'sheetdelta-example-'));
let id;
try {
  const path = join(dir,'data.xlsx');
  await writeFile(path,bytes);
  for await (const item of readExcelStream(path)) id = item.row.id;
  console.log(id); // 001
} finally { await rm(dir,{recursive:true,force:true}); }
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../streaming)
- [readCsvStream](./read-csv-stream)
- [writeCsvStream](./write-csv-stream)
- [writeExcelStream](./write-excel-stream)
- [compareSortedStreams](./compare-sorted-streams)
- [compareStreamKeys](./compare-stream-keys)
