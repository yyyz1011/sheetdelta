# 异步比较与 Worker

`compareTablesAsync` 与 `compareTables` 使用相同的比较规则和输出顺序，在行批次之间让出执行机会，以便处理进度和取消。

```ts
import { compareTablesAsync } from 'sheetdelta-core/compare';
import { SheetDeltaError } from 'sheetdelta-core/errors';

const controller = new AbortController();
try {
  const result = await compareTablesAsync(
    [{ id: '001', price: 10 }],
    [{ id: '001', price: 12 }],
    { keys: ['id'], includeUnchanged: false },
    {
      signal: controller.signal,
      batchSize: 2048,
      onProgress: ({ phase, processed, total }) => console.log(phase, processed, total),
    },
  );
  console.log(result.summary.changed); // 1
} catch (error) {
  if (error instanceof SheetDeltaError && error.code === 'ABORTED') {
    console.log('已取消');
  } else throw error;
}
// 任务运行期间，将取消按钮连接到 controller.abort()。
```

## 执行选项

第四个参数支持 `signal?: AbortSignal`、`batchSize?: number`（默认 `2048`，必须是正整数）和 `onProgress?: (progress) => void`。

进度阶段为 `scan`、`index`、`compare`、`append`、`complete`。`processed` 表示工作量单位，不是匹配行数；`total` 为两侧输入行数之和的三倍。较小任务可能没有部分中间阶段通知。空输入完成时为 `0 / 0`，请根据 `complete` 判断完成，避免除以零。

取消会抛出错误码为 `ABORTED` 的 `SheetDeltaError`，不会返回部分结果。进度回调抛出的异常会继续向上传递。任务运行时不要修改输入数组、记录或比较选项。取消检查发生在批次之间，不能中断单行内部的处理。

同步和异步 API 都支持 `includeUnchanged: false`：从 `result.rows` 中省略未变化记录，但保留完整汇总，包括 `summary.total` 和 `summary.unchanged`。它减少结果占用；输入和键索引仍在内存中。

## 浏览器大任务使用 Worker

异步比较是在当前线程协作调度，不会自动创建其他线程。XLSX 解析和导出在依赖加载后也会执行同步计算。大文件应将读取、比较、导出放到 Worker 中。

仓库提供[比较 Worker](https://github.com/yyyz1011/sheetdelta/blob/master/examples/browser/compare.worker.ts) 和 [Vite 客户端](https://github.com/yyyz1011/sheetdelta/blob/master/examples/browser/client.ts)。将两个源文件复制进应用即可，不需要安装第二个包。示例为每个任务创建 Worker，传递进度、接收取消，并在结束或错误后销毁。它处理已解析的行数据，没有包含 XLSX 导入界面。

浏览器消息会克隆行数据和序列化后的错误。接收线程应检查 `error.code`，不要用 `instanceof`。传递原始文件时，如果发送方不再需要字节，可转移 `ArrayBuffer` 所有权。参见[错误处理](./errors)和[兼容性与性能](./compatibility)。
