---
description: "用独立浏览器 Worker 导入，支持取消、超时及纠错工作簿；模块 Worker 配置见指南。"
---

# runImportWorker

[API 参考](./all) / [导入与纠错](./all#import)

用独立浏览器 Worker 导入，支持取消、超时及纠错工作簿；模块 Worker 配置见指南。

## 导入方式 {#import}

```js
import { runImportWorker } from 'sheetdelta-core/worker';
```

## 函数签名 {#signature}

```ts
runImportWorker(createWorker: () => Worker, input: string | ArrayBuffer | Uint8Array<ArrayBufferLike> | Blob, template: ImportTemplate, options?: WorkerImportOptions | undefined): Promise<WorkerImportResult>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `createWorker` | 是 | `() => Worker` |
| `input` | 是 | `string \| ArrayBuffer \| Uint8Array<ArrayBufferLike> \| Blob` |
| `template` | 是 | `ImportTemplate` |
| `options` | 否 | `WorkerImportOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../worker-imports).

相关类型：[`ImportTemplate`](./types#importtemplate) · [`WorkerImportResult`](./types#workerimportresult) · [`WorkerImportOptions`](./types#workerimportoptions).

## 返回值 {#returns}

```ts
Promise<WorkerImportResult>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { runImportWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
controller.abort();
let code;
try { await runImportWorker(() => { throw new Error('Must not start'); }, 'sku\n001', {version:1,id:'supplier',revision:1,format:'csv',fields:[{key:'sku'}]}, {signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../worker-imports)
- [createImportSession](./create-import-session)
- [installImportSessionWorker](./install-import-session-worker)
- [runRepairWorker](./run-repair-worker)
- [runReportWorker](./run-report-worker)
- [repairImport](./repair-import)
- [installImportWorker](./install-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
