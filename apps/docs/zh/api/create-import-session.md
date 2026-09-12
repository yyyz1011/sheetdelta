---
description: "打开持久化浏览器 Worker：CSV/Excel 只解析一次，返回有限预览，并复用线程内数据完成映射、批量纠错、报告和延后结果收集。"
---

# createImportSession

[API 参考](./all) / [导入与纠错](./all#import)

打开持久化浏览器 Worker：CSV/Excel 只解析一次，返回有限预览，并复用线程内数据完成映射、批量纠错、报告和延后结果收集。

## 导入方式 {#import}

```js
import { createImportSession } from 'sheetdelta-core/session';
```

## 函数签名 {#signature}

```ts
createImportSession(createWorker: () => Worker, input: string | ArrayBuffer | Uint8Array<ArrayBufferLike> | Blob, options: ImportSessionOpenOptions): Promise<ImportSession>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `createWorker` | 是 | `() => Worker` |
| `input` | 是 | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike> \| Blob` |
| `options` | 是 | `ImportSessionOpenOptions` |

选项含义、默认值与限制： [使用指南](../import-sessions).

相关类型：[`ImportSessionOpenOptions`](./types#importsessionopenoptions) · [`ImportSession`](./types#importsession).

## 返回值 {#returns}

```ts
Promise<ImportSession>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { createImportSession } from 'sheetdelta-core/session';
const controller = new AbortController();
controller.abort();
let code;
try { await createImportSession(() => { throw new Error('Must not start'); }, 'sku\n001', {format:'csv',signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-sessions)
- [installImportSessionWorker](./install-import-session-worker)
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
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
