# Worker 导入与 React / Vue 接入

将 CSV/Excel 解析、映射、清洗、校验及纠错工作簿生成放到独立线程。[打开 React 和 Vue 工作台](https://sheetdelta.nimokit.com/examples/) · [完整示例源码](https://github.com/yyyz1011/sheetdelta/tree/master/apps/import-examples)。示例界面使用英文，两套框架均可实际上传文件。

## 1. 创建 Worker 模块

```ts
// import.worker.ts
/// <reference lib="webworker" />
import { installImportWorker } from 'sheetdelta-core/worker';
installImportWorker(self);
```

业务 `rowRules`、`tableRules`、`batchRules` 在这里作为第二个参数注册。函数不能通过结构化克隆跨线程传递，原有业务规则的并发和超时配置仍然有效。

## 2. 导入文件

```ts
import { runImportWorker } from 'sheetdelta-core/worker';
const controller = new AbortController();
const { result, report } = await runImportWorker(
  () => new Worker(new URL('./import.worker.ts', import.meta.url), { type: 'module' }),
  file, // File、Blob、CSV 文本、ArrayBuffer 或 Uint8Array
  { version: 1, id: 'supplier', revision: 1, format: 'csv', fields: [
    { key: 'sku', requiredColumn: true, rule: { required: true, unique: true } },
    { key: 'qty', clean: { type: 'number' }, rule: { min: 0 } }
  ] },
  { signal: controller.signal, timeoutMs: 120_000, report: true,
    mode: 'valid-rows', onProgress: ({ phase }) => console.log(phase) }
);
console.log(result.rows); // 可提交数据，不会自动提交服务器
// report 为 XLSX 字节；Data 工作表保留原始值，供用户修改。
```

Excel 模板设置 `format: 'excel'` 和 `sheet: 'Data'` 等工作表名称。应用打包器负责解析工厂中的模块 URL 并产出 Worker 文件；通过 HTTP(S) 运行构建结果，确认应用 CSP 允许加载 Worker。

## React / Vue 接入流程

[在线示例](https://sheetdelta.nimokit.com/examples/)使用同一供应商模板：下载 CSV 样例后导入，三行中一行通过。下载纠错工作簿，修改 **Data** 中的负数数量和未知 Yes/No 值；选择 **Excel**，重新导入 **Data** 工作表。

- React 用 `useRef` 保存控制器，组件卸载、替换任务前调用 `abort()`。
- Vue 在响应式结果之外保存控制器，并在 `onBeforeUnmount` 中取消。
- 两套示例均忽略旧任务回调、禁止重复提交、显示来源行问题，并释放下载对象 URL。
- React/Vue 仅是示例应用的依赖，不会随着核心 npm 包安装。

## 取消、进度与边界

每次调用创建独立 Worker，成功、失败、取消、超时均释放。任务运行时调用 `controller.abort()` 返回 `ABORTED`，也能终止同步 Excel 解析。整个任务默认最多 120 秒，超时返回 `WORKER_TIMEOUT`；脚本加载或通信异常返回 `WORKER_FAILED`。

进度为阶段提示：read、parse、原有处理阶段、可选 report、complete；同步解析期间不是精确字节百分比。进度回调抛错会使任务失败。

Blob 在调用侧异步读取；取消可丢弃结果，但无法终止浏览器本身的 `Blob.arrayBuffer()`。调用者的字节缓冲区先复制再转移，原缓冲区不会失效。本流程仍保留解析后的行，**不是流式处理**；请设置原有文件及行数限制，大数据使用[流式接口](./streaming)。终止 Worker 不会撤回已发送的远端业务请求。

## API 参考

[runImportWorker](./api/run-import-worker) · [installImportWorker](./api/install-import-worker) · [可复用模板](./reusable-imports)
