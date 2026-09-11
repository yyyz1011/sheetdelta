---
description: "生成 Data、Issues、Summary 三张表；Data 保留原值便于修正，不复制原文件样式。"
---

# exportImportReport

[API 参考](./all) / [导入与纠错](./all#import)

生成 Data、Issues、Summary 三张表；Data 保留原值便于修正，不复制原文件样式。

## 导入方式 {#import}

```js
import { exportImportReport } from 'sheetdelta-core/import-report';
```

## 函数签名 {#signature}

```ts
exportImportReport(result: ImportResult): Promise<Uint8Array<ArrayBufferLike>>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `result` | 是 | `ImportResult` |

选项含义、默认值与限制： [使用指南](../import-workflow).

相关类型：[`ImportResult`](./types#importresult).

## 返回值 {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { exportImportReport } from 'sheetdelta-core/import-report';
import { importFile } from 'sheetdelta-core/import';
const schema = {fields:[{key:'id', requiredColumn:true}, {key:'qty', clean:{type:'number'}, rule:{min:0}}]};
const result = await importFile('id,qty\n001,-2', schema, {format:'csv'});
const bytes = await exportImportReport(result);
console.log(bytes instanceof Uint8Array); // true
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-workflow)
- [repairImport](./repair-import)
- [runImportWorker](./run-import-worker)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
