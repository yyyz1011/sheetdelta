import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

class RetryableError extends Error {}

export async function ensurePagesHttps({
  repository, token, hostname = 'sheetdelta.nimokit.com',
  fetchImpl = fetch, now = Date.now,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  log = console.log, maxWaitMs = 45 * 60_000, intervalMs = 30_000,
  requestTimeoutMs = 15_000, maxFailures = 5,
}) {
  if (!token || !/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) {
    throw new Error('GH_TOKEN and a valid GH_REPO are required.');
  }
  const endpoint = `https://api.github.com/repos/${repository}/pages`;
  const deadline = now() + maxWaitMs;
  let failures = 0;
  let lastState = 'pending';
  const pause = () => sleep(Math.max(0, Math.min(intervalMs, deadline - now())));

  async function request(method = 'GET') {
    let response;
    try {
      response = await fetchImpl(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          ...(method === 'PUT' ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(method === 'PUT' ? { body: JSON.stringify({ https_enforced: true }) } : {}),
        signal: AbortSignal.timeout(Math.max(1, Math.min(requestTimeoutMs, deadline - now()))),
      });
    } catch {
      // Never include request headers, tokens, or raw fetch errors in Actions logs.
      throw new RetryableError('GitHub API network request failed or timed out.');
    }
    const rateLimited = response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || response.headers.has('retry-after'));
    if ([408, 429].includes(response.status) || response.status >= 500 || rateLimited) {
      throw new RetryableError(`GitHub API temporarily unavailable (HTTP ${response.status}).`);
    }
    if (!response.ok) {
      throw new Error(`GitHub Pages API rejected ${method} (HTTP ${response.status}); check repository access and Pages settings.`);
    }
    if (method === 'PUT') return;
    try {
      return await response.json();
    } catch {
      throw new RetryableError('GitHub API returned an incomplete response.');
    }
  }

  function validate(page) {
    if (page?.cname !== hostname) throw new Error('Unexpected Pages domain; check repository Pages settings.');
    if (typeof page.https_enforced !== 'boolean') throw new Error('GitHub Pages response is missing the HTTPS status.');
  }

  while (now() < deadline) {
    try {
      const page = await request();
      validate(page);
      if (page.https_enforced) {
        log(`HTTPS is enforced for ${hostname}.`);
        return;
      }
      lastState = page.https_certificate?.state ?? 'pending';
      if (['errored', 'bad_authz', 'authorization_revoked', 'dns_changed'].includes(lastState)) {
        throw new Error(`Certificate state: ${lastState}. Check Pages domain and DNS settings.`);
      }
      if (lastState === 'approved') {
        await request('PUT');
        const verified = await request();
        validate(verified);
        if (verified.https_enforced) {
          log(`HTTPS is now enforced for ${hostname}.`);
          return;
        }
      }
      failures = 0;
      log(`Certificate state: ${lastState}; waiting for GitHub.`);
    } catch (error) {
      if (!(error instanceof RetryableError)) throw error;
      failures++;
      log(`${error.message} Retrying (${failures}/${maxFailures}).`);
      if (failures >= maxFailures) {
        throw new Error('GitHub API remained unavailable after bounded retries. Re-run the documentation job; the uploaded site is preserved.');
      }
    }
    await pause();
  }
  throw new Error(`Certificate is still pending (${lastState}) after the wait deadline. Re-run the documentation job after GitHub completes provisioning.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  ensurePagesHttps({ repository: process.env.GH_REPO, token: process.env.GH_TOKEN })
    .catch(error => {
      console.error(`::error::${error.message}`);
      process.exitCode = 1;
    });
}
