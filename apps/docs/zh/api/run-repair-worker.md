---
description: "在独立 Worker 中纠错及重新校验，默认不生成报告；业务回调在线程内注册。"
---

# runRepairWorker

[API 参考](./all) / [导入与纠错](./all#import)

在独立 Worker 中纠错及重新校验，默认不生成报告；业务回调在线程内注册。

## 导入方式 {#import}

```js
import { runRepairWorker } from 'sheetdelta-core/worker';
```

## 函数签名 {#signature}

```ts
runRepairWorker(createWorker: () => Worker, previous: ImportResult, edits: readonly ImportCellEdit[], schema: Omit<ImportSchema, "rowRules" | "tableRules" | "batchRules">, options?: WorkerRepairOptions | undefined): Promise<WorkerImportResult>
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `createWorker` | 是 | `() => Worker` |
| `previous` | 是 | `ImportResult` |
| `edits` | 是 | `readonly ImportCellEdit[]` |
| `schema` | 是 | `Omit<ImportSchema, "rowRules" \| "tableRules" \| "batchRules">` |
| `options` | 否 | `WorkerRepairOptions \| undefined` |

选项含义、默认值与限制： [使用指南](../worker-imports).

相关类型：[`ImportSchema`](./types#importschema) · [`ImportResult`](./types#importresult) · [`ImportCellEdit`](./types#importcelledit) · [`WorkerImportResult`](./types#workerimportresult) · [`WorkerRepairOptions`](./types#workerrepairoptions).

## 返回值 {#returns}

```ts
Promise<WorkerImportResult>
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { runRepairWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
controller.abort();
let code;
try { await runRepairWorker(() => { throw new Error('Must not start'); }, {}, [], {fields:[{key:'sku'}]}, {signal:controller.signal}); } catch(error) { code = error.code; }
console.log(code); // ABORTED
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../worker-imports)
- [createImportSession](./create-import-session)
- [installImportSessionWorker](./install-import-session-worker)
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
