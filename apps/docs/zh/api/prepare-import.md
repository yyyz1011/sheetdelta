---
description: "处理已解析的 TableData，返回原始/处理后/可提交数据、问题、审计和来源。"
---

# prepareImport

[API 参考](./all) / [导入与纠错](./all#import)

处理已解析的 TableData，返回原始/处理后/可提交数据、问题、审计和来源。

## 导入方式 {#import}

```js
import { prepareImport } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
prepareImport(table: TableData, schema: ImportSchema, options?: ImportOptions | undefined): Promise<ImportResult>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `table` | 是 | `TableData` |
| `schema` | 是 | `ImportSchema` |
| `options` | 否 | `ImportOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../import-workflow).

相关类型：[`TableData`](./types#tabledata) · [`ImportSchema`](./types#importschema) · [`ImportOptions`](./types#importoptions) · [`ImportResult`](./types#importresult).

## 返回值 {#returns}

```ts
Promise<ImportResult>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { prepareImport } from 'sheetdelta-core/import';
import { readCsv } from 'sheetdelta-core/csv';
const result = await prepareImport(readCsv('id,qty\n001,2'), {fields:[{key:'id'}, {key:'qty',clean:{type:'number'}}]}, {format:'csv'});
console.log(result.rows[0].qty); // 2
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-workflow)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
