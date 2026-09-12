---
description: "修改原始来源单元格后重新清洗和全量校验，不再读取文件，不修改先前结果。"
---

# repairImport

[API 参考](./all) / [导入与纠错](./all#import)

修改原始来源单元格后重新清洗和全量校验，不再读取文件，不修改先前结果。

## 导入方式 {#import}

```js
import { repairImport } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
repairImport(previous: ImportResult, edits: readonly ImportCellEdit[], schema: ImportSchema, options?: ImportOptions | undefined): Promise<ImportResult>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `previous` | 是 | `ImportResult` |
| `edits` | 是 | `readonly ImportCellEdit[]` |
| `schema` | 是 | `ImportSchema` |
| `options` | 否 | `ImportOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../import-repair).

相关类型：[`ImportSchema`](./types#importschema) · [`ImportOptions`](./types#importoptions) · [`ImportResult`](./types#importresult) · [`ImportCellEdit`](./types#importcelledit).

## 返回值 {#returns}

```ts
Promise<ImportResult>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { repairImport } from 'sheetdelta-core/import';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'sku'}, {key:'qty',clean:{type:'number'},rule:{min:0}}]};
const previous = await importFile('sku,qty\n001,-2',schema,{format:'csv'});
const result = await repairImport(previous,[{row:1,column:'qty',value:'2'}],schema);
console.log(result.rows[0].qty); // 2
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-repair)
- [createImportSession](./create-import-session)
- [installImportSessionWorker](./install-import-session-worker)
- [runRepairWorker](./run-repair-worker)
- [runReportWorker](./run-report-worker)
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
