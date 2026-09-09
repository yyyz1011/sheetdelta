import type { Row, CompareInputOptions, DiffResult } from 'sheetdelta-core/types';
import type { CompareProgress } from 'sheetdelta-core/compare';
/** Vite-compatible example. One worker per task; dispose after success, error, or cancellation. */
export function startComparison(left: Row[], right: Row[], options: CompareInputOptions, onProgress?: (progress: CompareProgress) => void) {
  const worker = new Worker(new URL('./compare.worker.ts', import.meta.url), { type: 'module' });
  const id = crypto.randomUUID();
  const result = new Promise<DiffResult>((resolve, reject) => {
    worker.addEventListener('message', event => {
      if (event.data.id !== id) return;
      if (event.data.type === 'progress') {
        try { onProgress?.(event.data.progress); } catch (error) { worker.terminate(); reject(error); }
      }
      if (event.data.type === 'result') { worker.terminate(); resolve(event.data.result); }
      if (event.data.type === 'error') { worker.terminate(); reject(event.data.error); }
    });
    worker.addEventListener('error', event => { worker.terminate(); reject(new Error(event.message)); });
    try { worker.postMessage({ type: 'compare', id, left, right, options }); }
    catch (error) { worker.terminate(); reject(error); }
  });
  return { result, cancel: () => worker.postMessage({ type: 'cancel', id }) };
}
