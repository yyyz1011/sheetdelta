---
description: "按需在线程中生成 XLSX 报告字节，不重复校验数据。"
---

# runReportWorker

[API 参考](./all) / [导入与纠错](./all#import)

按需在线程中生成 XLSX 报告字节，不重复校验数据。

## 导入方式 {#import}

```js
import { runReportWorker } from 'sheetdelta-core/worker';
```

## 函数签名 {#signature}

```ts
runReportWorker(createWorker: () => Worker, result: ImportResult, options?: WorkerTaskOptions | undefined): Promise<Uint8Array<ArrayBufferLike>>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `createWorker` | 是 | `() => Worker` |
| `result` | 是 | `ImportResult` |
| `options` | 否 | `WorkerTaskOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../worker-imports).

相关类型：[`ImportResult`](./types#importresult) · [`WorkerTaskOptions`](./types#workertaskoptions).

## 返回值 {#returns}

```ts
Promise<Uint8Array<ArrayBufferLike>>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { runReportWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
controller.abort();
let code;
try { await runReportWorker(() => { throw new Error('Must not start'); }, {}, {signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../worker-imports)
- [runRepairWorker](./run-repair-worker)
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
