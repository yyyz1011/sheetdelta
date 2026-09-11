---
description: "解析并校验可复用导入配置；不支持的版本和无效字段明确报错。"
---

# parseImportTemplate

[API 参考](./all) / [导入与纠错](./all#import)

解析并校验可复用导入配置；不支持的版本和无效字段明确报错。

## 导入方式 {#import}

```js
import { parseImportTemplate } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
parseImportTemplate(json: string): ImportTemplate
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `json` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../reusable-imports).

相关类型：[`ImportTemplate`](./types#importtemplate).

## 返回值 {#returns}

```ts
ImportTemplate
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { parseImportTemplate } from 'sheetdelta-core/import';
const template = parseImportTemplate('{"version":1,"id":"supplier","revision":1,"format":"csv","fields":[{"key":"sku"}]}');
console.log(template.revision); // 1
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../reusable-imports)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
