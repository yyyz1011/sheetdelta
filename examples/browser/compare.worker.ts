/// <reference lib="webworker" />
import { compareTablesAsync } from 'sheetdelta-core/compare';
import { SheetDeltaError } from 'sheetdelta-core/errors';
import type { Row, CompareInputOptions } from 'sheetdelta-core/types';
const jobs = new Map<string, AbortController>();
type Request = { type: 'cancel'; id: string } | { type: 'compare'; id: string; left: Row[]; right: Row[]; options: CompareInputOptions };
self.addEventListener('message', async (event: MessageEvent<Request>) => {
  const message = event.data;
  if (message.type === 'cancel') { jobs.get(message.id)?.abort(); return; }
  if (jobs.has(message.id)) return;
  const controller = new AbortController(); jobs.set(message.id, controller);
  try {
    const result = await compareTablesAsync(message.left, message.right, message.options, {
      signal: controller.signal,
      onProgress: progress => self.postMessage({ type: 'progress', id: message.id, progress }),
    });
    self.postMessage({ type: 'result', id: message.id, result });
  } catch (error) {
    self.postMessage({ type: 'error', id: message.id, error: error instanceof SheetDeltaError ? error.toJSON() : { code: 'UNEXPECTED', message: String(error) } });
  } finally { jobs.delete(message.id); }
});
