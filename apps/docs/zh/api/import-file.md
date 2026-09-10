---
description: "按明确格式读取文件并执行导入；CSV 接受文本/字节，Excel 接受字节且需确定一个工作表。"
---

# importFile

[API 参考](./all) / [导入与纠错](./all#import)

按明确格式读取文件并执行导入；CSV 接受文本/字节，Excel 接受字节且需确定一个工作表。

## 导入方式 {#import}

```js
import { importFile } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
importFile(input: string | ArrayBuffer | Uint8Array<ArrayBufferLike>, schema: ImportSchema, options: ImportFileOptions): Promise<ImportResult>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `input` | 是 | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike>` |
| `schema` | 是 | `ImportSchema` |
| `options` | 是 | `ImportFileOptions` |

选项含义、默认值与限制： [使用指南](../import-workflow).

相关类型：[`ImportSchema`](./types#importschema) · [`ImportResult`](./types#importresult) · [`ImportFileOptions`](./types#importfileoptions).

## 返回值 {#returns}

```ts
Promise<ImportResult>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { importFile } from 'sheetdelta-core/import';
const result = await importFile('id,qty\n001,-2', {fields:[{key:'id'}, {key:'qty',clean:{type:'number'},rule:{min:0}}]}, {format:'csv'});
console.log(result.status, result.rows.length); // invalid 0
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-workflow)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
