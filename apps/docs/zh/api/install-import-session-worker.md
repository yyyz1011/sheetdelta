---
description: "在应用自有模块 Worker 中安装持久化导入会话协议；回调规则需在线程内注册。"
---

# installImportSessionWorker

[API 参考](./all) / [导入与纠错](./all#import)

在应用自有模块 Worker 中安装持久化导入会话协议；回调规则需在线程内注册。

## 导入方式 {#import}

```js
import { installImportSessionWorker } from 'sheetdelta-core/session';
```

## 函数签名 {#signature}

```ts
installImportSessionWorker(scope: SessionWorkerScope, rules?: Pick<ImportSchema, "rowRules" | "tableRules" | "batchRules"> | undefined): () => void
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `scope` | 是 | `SessionWorkerScope` |
| `rules` | 否 | `Pick<ImportSchema, "rowRules" \| "tableRules" \| "batchRules"> \| undefined` |

选项含义、默认值与限制： [使用指南](../import-sessions).

相关类型：[`ImportSchema`](./types#importschema).

## 返回值 {#returns}

```ts
() => void
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { installImportSessionWorker } from 'sheetdelta-core/session';
const listeners = new Set();
const scope = {addEventListener:(_, fn)=>listeners.add(fn),removeEventListener:(_, fn)=>listeners.delete(fn),postMessage:()=>{}};
const dispose = installImportSessionWorker(scope);
console.log(listeners.size); // 1
dispose();
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../import-sessions)
- [createImportSession](./create-import-session)
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
