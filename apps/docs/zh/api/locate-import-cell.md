---
description: "把原始数据行位置和标准字段映射回来源；只有 Excel 工作表位置提供 A1 地址。"
---

# locateImportCell

[API 参考](./all) / [导入与纠错](./all#import)

把原始数据行位置和标准字段映射回来源；只有 Excel 工作表位置提供 A1 地址。

## 导入方式 {#import}

```js
import { locateImportCell } from 'sheetdelta-core/import';
```

## 函数签名 {#signature}

```ts
locateImportCell(result: Pick<ImportResult, "original" | "mappings" | "rowSources">, row: number, field: string): ImportLocation
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `result` | 是 | `Pick<ImportResult, "original" \| "mappings" \| "rowSources">` |
| `row` | 是 | `number` |
| `field` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../import-workflow).

相关类型：[`ImportLocation`](./types#importlocation) · [`ImportResult`](./types#importresult).

## 返回值 {#returns}

```ts
ImportLocation
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { locateImportCell } from 'sheetdelta-core/import';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const source = locateImportCell(result,1,'qty');
console.log(source.sourceRow, source.sourceColumn); // 2 qty
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-workflow)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [exportImportReport](./export-import-report)
