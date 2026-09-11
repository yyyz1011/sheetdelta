---
description: "校验并序列化版本 1 的 JSON 模板；拒绝回调、未知属性及超限配置。"
---

# serializeImportTemplate

[API 参考](./all) / [导入与纠错](./all#import)

校验并序列化版本 1 的 JSON 模板；拒绝回调、未知属性及超限配置。

## 导入方式 {#import}

```js
import { serializeImportTemplate } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
serializeImportTemplate(template: ImportTemplate): string
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `template` | 是 | `ImportTemplate` |

选项含义、默认值与限制： [使用指南](../reusable-imports).

相关类型：[`ImportTemplate`](./types#importtemplate).

## 返回值 {#returns}

```ts
string
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { serializeImportTemplate } from 'sheetdelta-core/import';
const json = serializeImportTemplate({version:1,id:'supplier',revision:1,format:'csv',fields:[{key:'sku',requiredColumn:true}]});
console.log(JSON.parse(json).id); // supplier
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../reusable-imports)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
