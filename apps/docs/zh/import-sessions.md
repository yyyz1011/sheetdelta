---
description: 用持久化 Worker 只解析一次陌生 Excel 或 CSV，然后预览、映射、批量纠错，并延后传输完整数据。
---

# 持久化导入工作台

当浏览器用户需要先查看陌生工作簿、再决定如何导入时，使用 `sheetdelta-core/session`。同一个 Worker 在会话期间保留解析结果；工作表预览、字段映射、多轮纠错和报告都复用这些数据，只有调用 `result()` 时，完整可提交行才会传回主线程。

[打开 React 与 Vue 在线工作台](https://sheetdelta.nimokit.com/examples/)

## 1. 安装 Worker 处理器

```ts
// import.worker.ts
/// <reference lib="webworker" />
import { installImportSessionWorker } from 'sheetdelta-core/session';

installImportSessionWorker(self, {
  // 应用自有的 rowRules、tableRules、batchRules 写在这里。
});
```

函数无法通过 Worker 结构化克隆。业务规则函数留在线程模块里，页面只发送字段、清洗和内置校验等声明式配置。

## 2. 打开一次并检查

```ts
import { createImportSession } from 'sheetdelta-core/session';

const session = await createImportSession(
  () => new Worker(new URL('./import.worker.ts', import.meta.url), { type: 'module' }),
  file,
  {
    format: file.name.endsWith('.csv') ? 'csv' : 'excel',
    headerRow: 1,
    previewRows: 20,
    fileName: file.name,
  },
);

for (const sheet of session.inspection.sheets) {
  console.log(sheet.name, sheet.headers, sheet.rowCount, sheet.preview);
}
```

`previewRows` 默认 20，可设为 1–100。检查结果不会返回所有行。分页预览调用 `session.preview(sheet, { offset, limit })`，`limit` 同样最多 100。表头属于解析结果，修改 `headerRow` 需要新建会话。

## 3. 映射并校验

```ts
const state = await session.prepare('Inventory', {
  fields: [
    { key: 'sku', source: '商品编号', requiredColumn: true, rule: { required: true, unique: true } },
    { key: 'qty', source: '库存', clean: { type: 'number' }, rule: { min: 0 } },
  ],
}, { mode: 'valid-rows' });

console.log(state.summary, state.issues, state.preview);
```

紧凑状态包含统计、映射、问题、问题对应的当前来源值，以及有限的处理后预览；不会携带完整原始行、处理行和可提交行。

## 4. 批量纠错并交付

```ts
const repaired = await session.repair([
  { row: 2, column: '库存', value: '3' },
  { row: 8, column: '启用', value: '是' },
]);

const reportBytes = await session.report(); // 需要时才生成
const final = await session.result();        // 此时才传输完整数据
await submit(final.rows);
session.close();
```

编辑的 `row` 是从 1 开始的数据行位置，`column` 是精确来源表头。纠错会基于 Worker 中保留的来源数据重新执行全部清洗和校验。`close()` 可重复调用。

## 生命周期、取消与限制

- 同一时间只执行一个命令；并发调用返回 `SESSION_BUSY`。
- 取消或超时会终止 Worker 并关闭会话，因为同步 XLSX 解析无法在原线程里安全中断。
- 会话关闭后的调用返回 `SESSION_CLOSED`。
- 每个命令默认超时 120 秒；文件、行、列和单元格预算继续由 CSV/Excel 读取及导入选项控制。
- 会话会在内存中保留解析后的工作簿。用户换文件、离开页面或提交完成时应调用 `close()`。
- CSV 文本和调用方字节会先复制；File 只读取一次，再转移其独占缓冲区。

## 如何选择接口

交互式“检查 → 映射 → 纠错 → 交付”使用 `createImportSession`；一次性导入使用 [`runImportWorker`](./worker-imports)；已解析数据在主线程时使用 [`repairImport`](./import-repair)；服务端超大任务使用[流式接口](./streaming)。

## API 参考

[createImportSession](./api/create-import-session) · [installImportSessionWorker](./api/install-import-session-worker) · [全部会话类型](./api/types)
