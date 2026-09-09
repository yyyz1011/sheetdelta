// Bundle for the browser, then execute the same worker in a Node transport adapter.
// This verifies message/progress/cancellation logic, not a browser performance claim.
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { Worker } from 'node:worker_threads';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const directory = mkdtempSync(join(tmpdir(), 'sheetdelta-worker-'));
try {
  const bundle = await build({ entryPoints: ['examples/browser/compare.worker.ts'], bundle: true, platform: 'browser', format: 'esm', write: false });
  writeFileSync(join(directory, 'worker.mjs'), `import { parentPort } from 'node:worker_threads';
globalThis.self = { addEventListener: (_, callback) => parentPort.on('message', data => callback({ data })), postMessage: data => parentPort.postMessage(data) };
${bundle.outputFiles[0].text}`);
  for (const cancel of [false, true]) {
    const worker = new Worker(join(directory, 'worker.mjs'));
    try {
      const messages = [];
      const done = new Promise((resolve, reject) => {
        worker.on('error', reject);
        worker.on('message', message => {
          messages.push(message);
          if (cancel && message.type === 'progress') worker.postMessage({ type: 'cancel', id: 'test' });
          if (message.type === 'error' || message.type === 'result') resolve(message);
        });
      });
      const rows = Array.from({ length: 10_000 }, (_, id) => ({ id: String(id), price: 10 }));
      worker.postMessage({ type: 'compare', id: 'test', left: rows, right: rows.map(r => ({ ...r, price: 11 })), options: { keys: ['id'] } });
      let timer;
      const terminal = await Promise.race([done, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Worker timed out')), 10_000); })]).finally(() => clearTimeout(timer));
      assert.ok(messages.some(m => m.type === 'progress'));
      if (cancel) { assert.equal(terminal.type, 'error'); assert.equal(terminal.error.code, 'ABORTED'); assert.ok(!messages.some(m => m.type === 'result')); }
      else { assert.equal(terminal.type, 'result'); assert.equal(terminal.result.summary.changed, 10_000); }
    } finally { await worker.terminate(); }
  }
  console.log('Browser worker bundle; Node transport success, progress, cancellation: PASS');
} finally { rmSync(directory, { recursive: true, force: true }); }
