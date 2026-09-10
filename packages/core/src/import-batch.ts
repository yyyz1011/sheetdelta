import { SheetDeltaError, fail, wrapError } from './errors.js';
import type { Row } from './types.js';
import type { ImportIssue } from './import.js';

export interface ImportBatchRow { readonly row: number; readonly values: Readonly<Row> }
export interface ImportBatchRule {
  id: string;
  /** Issues use global one-based data row numbers from the input items, not batch offsets. */
  validate: (rows: readonly ImportBatchRow[], context: { signal: AbortSignal }) => Promise<readonly Omit<ImportIssue, 'source' | 'ruleId'>[]>;
}
export interface ImportBatchOptions { batchSize?: number; concurrency?: number; timeoutMs?: number }

export function batchOptions(options: ImportBatchOptions = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) fail('INVALID_OPTIONS', 'batchValidation must be an object.');
  const result = { batchSize: options.batchSize ?? 100, concurrency: options.concurrency ?? 4, timeoutMs: options.timeoutMs ?? 30000 };
  for (const [key, ceiling] of [['batchSize', 10000], ['concurrency', 32], ['timeoutMs', 2147483647]] as const) {
    if (!Number.isSafeInteger(result[key]) || result[key] < 1 || result[key] > ceiling) fail('INVALID_OPTIONS', `Invalid batch ${key}.`);
  }
  return result;
}

/** Run bounded windows to avoid retaining results for the whole table; output order is deterministic. */
export async function runBatchRules(rows: readonly Readonly<Row>[], rules: readonly ImportBatchRule[], options: ImportBatchOptions | undefined, signal: AbortSignal | undefined, maxIssues: number, accept: (raw: unknown, id: string) => void, progress: (processed: number) => void) {
  const settings = batchOptions(options);
  const group = new AbortController();
  // Fan out through one listener: Node warns above ten listeners on an AbortSignal.
  const stops = new Set<() => void>();
  const abortChildren = () => { for (const stop of stops) stop(); };
  group.signal.addEventListener('abort', abortChildren, { once: true });
  const cancel = () => group.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  async function execute(rule: ImportBatchRule, start: number) {
    if (group.signal.aborted) fail('ABORTED', 'Batch validation cancelled.');
    const input = Object.freeze(rows.slice(start, start + settings.batchSize).map((values, i) => Object.freeze({ row: start + i + 1, values })));
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: () => void = () => {};
    try {
      const stopped = new Promise<never>((_, reject) => {
        onAbort = () => { reject(new SheetDeltaError('ABORTED', 'Batch validation cancelled.')); controller.abort(); };
        stops.add(onAbort);
        timer = setTimeout(() => { reject(new SheetDeltaError('VALIDATION_TIMEOUT', `Batch rule ${rule.id} timed out.`, { operation: rule.id })); controller.abort(); }, settings.timeoutMs);
      });
      const raw = await Promise.race([Promise.resolve().then(() => {
        if (controller.signal.aborted) fail('ABORTED', 'Batch validation cancelled.');
        return rule.validate(input, { signal: controller.signal });
      }), stopped]);
      if (!Array.isArray(raw)) fail('INVALID_OPTIONS', 'Batch rules must return issue arrays.');
      if (raw.length > maxIssues) fail('LIMIT_EXCEEDED', 'Batch rule issue budget exceeded.');
      for (const issue of raw) {
        if (!issue || typeof issue !== 'object') fail('INVALID_OPTIONS', 'Invalid batch issue.');
        if (issue.row !== undefined && (!Number.isInteger(issue.row) || issue.row < start + 1 || issue.row > start + input.length)) fail('INVALID_OPTIONS', 'Batch issue row must belong to that batch.');
      }
      return raw;
    } catch (error) {
      wrapError(error, 'VALIDATION_FAILED', `Batch rule ${rule.id} failed.`, { operation: rule.id });
    } finally {
      clearTimeout(timer); stops.delete(onAbort); controller.abort();
    }
  }
  try {
    for (const rule of rules) {
      for (let start = 0; start < rows.length; start += settings.batchSize * settings.concurrency) {
        const work = [];
        for (let i = start; i < Math.min(rows.length, start + settings.batchSize * settings.concurrency); i += settings.batchSize) work.push(execute(rule, i));
        const results = await Promise.all(work);
        if (group.signal.aborted) fail('ABORTED', 'Batch validation cancelled.');
        for (const result of results) accept(result, rule.id);
        progress(Math.min(rows.length, start + settings.batchSize * settings.concurrency));
      }
    }
  } finally { group.abort(); group.signal.removeEventListener('abort', abortChildren); signal?.removeEventListener('abort', cancel); }
}
