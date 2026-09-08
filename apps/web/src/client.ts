import type { DataIssue } from 'sheetdelta-core';
let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason: unknown) => void; timer: ReturnType<typeof setTimeout> }>();
export class ProcessingError extends Error { constructor(message: string, public issues?: DataIssue[]) { super(message); } }
export function runWorker<T>(type: 'parse' | 'compare', payload: unknown): Promise<T> {
  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const task = pending.get(data.id);
      if (!task) return;
      clearTimeout(task.timer); pending.delete(data.id);
      if (data.error) task.reject(new ProcessingError(data.error, data.issues)); else task.resolve(data.value);
    };
    worker.onerror = () => resetWorker('文件处理器启动失败，请刷新页面后重试。');
  }
  return new Promise<T>((resolve, reject) => {
    const id = ++nextId;
    const timer = setTimeout(() => resetWorker('处理超过 30 秒，请减少数据量后重试。'), 30_000);
    pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timer });
    worker!.postMessage({ id, type, payload });
  });
}
function resetWorker(message: string) {
  worker?.terminate(); worker = undefined;
  for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new ProcessingError(message)); }
  pending.clear();
}
