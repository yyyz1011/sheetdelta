---
description: "在独立模块 Worker 中安装导入处理器，业务回调在此注册，返回监听器清理函数。"
---

# installImportWorker

[API 参考](./all) / [导入与纠错](./all#import)

在独立模块 Worker 中安装导入处理器，业务回调在此注册，返回监听器清理函数。

## 导入方式 {#import}

```js
import { installImportWorker } from 'sheetdelta-core/worker';
```

## 函数签名 {#signature}

```ts
installImportWorker(scope: ImportWorkerScope, rules?: Pick<TemplateImportOptions, "rowRules" | "tableRules" | "batchRules"> | undefined): () => void
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `scope` | 是 | `ImportWorkerScope` |
| `rules` | 否 | `Pick<TemplateImportOptions, "rowRules" \| "tableRules" \| "batchRules"> \| undefined` |

选项含义、默认值与限制： [使用指南](../worker-imports).

相关类型：[`TemplateImportOptions`](./types#templateimportoptions) · [`ImportWorkerScope`](./types#importworkerscope).

## 返回值 {#returns}

```ts
() => void
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { installImportWorker } from 'sheetdelta-core/worker';
const listeners = new Set();
const scope = {addEventListener:(_, fn)=>listeners.add(fn),removeEventListener:(_, fn)=>listeners.delete(fn),postMessage:()=>{}};
const dispose = installImportWorker(scope);
console.log(listeners.size); // 1
dispose();
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../worker-imports)
- [runImportWorker](./run-import-worker)
- [serializeImportTemplate](./serialize-import-template)
- [parseImportTemplate](./parse-import-template)
- [importWithTemplate](./import-with-template)
- [importFile](./import-file)
- [prepareImport](./prepare-import)
- [mapImportHeaders](./map-import-headers)
- [locateImportCell](./locate-import-cell)
- [exportImportReport](./export-import-report)
