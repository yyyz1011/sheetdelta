import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { cpus } from 'node:os';
import { compareTables, compareTablesAsync } from '../packages/core/dist/compare.js';

console.log(JSON.stringify({ node: process.version, platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model }));
for (const count of [10_000, 50_000, 100_000]) {
  const before = Array.from({ length: count }, (_, i) => ({ id: String(i).padStart(8, '0'), price: i / 10, stock: i % 100, category: `C${i % 20}`, active: true }));
  const after = before.map((row, i) => ({ ...row, stock: row.stock + (i % 100 === 0 ? 1 : 0) }));
  for (const mode of ['sync', 'async']) {
    globalThis.gc?.();
    const start = performance.now(), heapBefore = process.memoryUsage().heapUsed;
    const options = { keys: ['id'], includeUnchanged: false };
    const result = mode === 'sync' ? compareTables(before, after, options) : await compareTablesAsync(before, after, options);
    assert.equal(result.summary.changed, count / 100);
    assert.equal(result.summary.total, count);
    assert.equal(result.rows.length, count / 100);
    console.log(JSON.stringify({ rowsPerSide: count, columns: 5, mode, milliseconds: Math.round(performance.now() - start), heapDeltaMiB: +( (process.memoryUsage().heapUsed - heapBefore) / 1024 ** 2).toFixed(1), retainedResults: result.rows.length }));
  }
}
