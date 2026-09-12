---
description: "解析标准字段/别名或显式源表头；缺列、歧义和重复映射以问题返回。"
---

# mapImportHeaders

[API 参考](./all) / [导入与纠错](./all#import)

解析标准字段/别名或显式源表头；缺列、歧义和重复映射以问题返回。

## 导入方式 {#import}

```js
import { mapImportHeaders } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
mapImportHeaders(headers: readonly string[], fields: readonly ImportField[], options?: { allowUnknownColumns?: boolean | undefined; } | undefined): { mappings: { field: string; column: string | undefined; candidates: string[]; }[]; issues: ImportIssue[]; unknownColumns: string[]; valid: boolean; }
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `headers` | 是 | `readonly string[]` |
| `fields` | 是 | `readonly ImportField[]` |
| `options` | 否 | `{ allowUnknownColumns?: boolean \| undefined; } \| undefined` |

选项含义、默认值与限制： [使用指南](../import-workflow).

相关类型：[`ImportField`](./types#importfield) · [`ImportIssue`](./types#importissue).

## 返回值 {#returns}

```ts
{ mappings: { field: string; column: string | undefined; candidates: string[]; }[]; issues: ImportIssue[]; unknownColumns: string[]; valid: boolean; }
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { mapImportHeaders } from 'sheetdelta-core/import';
const result = mapImportHeaders(['商品编号'], [{key:'sku',aliases:['商品编号'],requiredColumn:true}]);
console.log(result.mappings[0].column); // 商品编号
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-workflow)
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
