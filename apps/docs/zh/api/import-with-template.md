---
description: "应用已保存的字段和文件布局，业务回调、限制、进度和取消由应用运行时提供。"
---

# importWithTemplate

[API 参考](./all) / [导入与纠错](./all#import)

应用已保存的字段和文件布局，业务回调、限制、进度和取消由应用运行时提供。

## 导入方式 {#import}

```js
import { importWithTemplate } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
importWithTemplate(input: string | ArrayBuffer | Uint8Array<ArrayBufferLike>, template: ImportTemplate, options?: TemplateImportOptions | undefined): Promise<ImportResult>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `input` | 是 | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `template` | 是 | `ImportTemplate` |
| `options` | 否 | `TemplateImportOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../reusable-imports).

相关类型：[`ImportResult`](./types#importresult) · [`ImportTemplate`](./types#importtemplate) · [`TemplateImportOptions`](./types#templateimportoptions).

## 返回值 {#returns}

```ts
Promise<ImportResult>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { importWithTemplate } from 'sheetdelta-core/import';
const result = await importWithTemplate('sku\n001',{version:1,id:'supplier',revision:1,format:'csv',fields:[{key:'sku',requiredColumn:true}]});
console.log(result.rows[0].sku); // 001
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../reusable-imports)
- [runRepairWorker](./run-repair-worker)
- [runReportWorker](./run-report-worker)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
