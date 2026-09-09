import test from 'node:test';
import assert from 'node:assert/strict';
import { ensurePagesHttps } from './ensure-pages-https.mjs';

const page = (state = 'new', enforced = false) => ({ cname: 'sheetdelta.nimokit.com', https_enforced: enforced, https_certificate: { state } });
const response = (body, status = 200, headers = {}) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
function harness(sequence, overrides = {}) {
  let time = 0;
  const calls = [], logs = [];
  const options = {
    repository: 'yyyz1011/sheetdelta', token: 'test-token-never-log',
    now: () => time, sleep: async ms => { time += ms; },
    maxWaitMs: 100, intervalMs: 10, requestTimeoutMs: 5,
    log: text => logs.push(text),
    fetchImpl: async (url, options) => {
      calls.push({ url, ...options });
      const next = sequence.shift();
      if (next instanceof Error) throw next;
      assert.ok(next, 'Unexpected extra API call');
      return next;
    },
    ...overrides,
  };
  return { run: () => ensurePagesHttps(options), calls, logs };
}

test('a network timeout during polling recovers and enables HTTPS', async () => {
  const h = harness([response(page()), new Error('i/o timeout'), response(page('approved')), response(null, 204), response(page('approved', true))]);
  await h.run();
  assert.deepEqual(h.calls.map(c => c.method), ['GET', 'GET', 'GET', 'PUT', 'GET']);
  assert.equal(h.calls[3].body, '{"https_enforced":true}');
  assert.ok(h.logs.some(line => line.includes('Retrying')));
  assert.ok(!h.logs.join().includes('test-token-never-log'));
});

test('an uncertain PUT is recovered by reading status before another write', async () => {
  const h = harness([response(page('approved')), new Error('connection reset'), response(page('approved', true))]);
  await h.run();
  assert.deepEqual(h.calls.map(c => c.method), ['GET', 'PUT', 'GET']);
});

test('temporary HTTP failures and truncated JSON recover', async () => {
  for (const transient of [response({}, 502), response({}, 429), response({}, 403, {'x-ratelimit-remaining':'0'}), response({}, 403, {'retry-after':'30'}), new Response('{')]) {
    const h = harness([transient, response(page('approved', true))]);
    await h.run();
    assert.equal(h.calls.length, 2);
  }
});

test('authorization errors, wrong domain and certificate failures fail without retrying', async () => {
  for (const [value, message] of [
    [response({}, 401), /HTTP 401/],
    [response({}, 403), /HTTP 403/],
    [response({...page(), cname:'unexpected.example.com'}), /Unexpected Pages domain/],
    [response(page('bad_authz')), /bad_authz/],
  ]) {
    const h = harness([value]);
    await assert.rejects(h.run, message);
    assert.equal(h.calls.length, 1);
  }
});

test('repeated network failures stop after the retry limit', async () => {
  const h = harness(Array.from({length:5}, () => new Error('timeout with secret details')));
  await assert.rejects(h.run, /bounded retries/);
  assert.equal(h.calls.length, 5);
  assert.ok(!h.logs.join().includes('secret details'));
});

test('pending certificates stop at the wall-clock deadline', async () => {
  const h = harness([response(page()), response(page()), response(page())], {maxWaitMs:25});
  await assert.rejects(h.run, /wait deadline/);
  assert.equal(h.calls.length, 3);
});

test('network requests have an abort deadline', async () => {
  let aborted = false;
  const h = harness([], {
    maxFailures:1,
    fetchImpl: async (_url, {signal}) => new Promise((_, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('missing abort')), 500);
      signal.addEventListener('abort', () => { aborted = true; clearTimeout(keepAlive); reject(signal.reason); });
    }),
  });
  await assert.rejects(h.run, /bounded retries/);
  assert.ok(aborted);
});
