import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const { name, version } = JSON.parse(readFileSync('packages/core/package.json', 'utf8'));
const tarball = resolve('artifacts', `${name}-${version}.tgz`);
const cwd = mkdtempSync(join(tmpdir(), 'sheetdelta-consumer-'));
try {
  writeFileSync(join(cwd, 'package.json'), '{"private":true,"type":"module"}');
  execFileSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd, stdio: 'pipe' });
  const code = `
    import assert from 'node:assert/strict';
    import { compareTables, exportDiffCsv, TableValidationError } from 'sheetdelta-core';
    const result = compareTables([{id:'001',price:10}], [{id:'001',price:12}], {
      keys:[{left:'id',right:'id'}], columns:[{left:'price',right:'price'}]
    });
    assert.equal(result.summary.changed, 1);
    assert.ok(exportDiffCsv(result).includes('changed'));
    assert.equal(typeof TableValidationError, 'function');
    console.log('Packed npm consumer: PASS');
  `;
  writeFileSync(join(cwd, 'smoke.mjs'), code);
  const output = execFileSync(process.execPath, ['smoke.mjs'], { cwd, encoding: 'utf8' });
  assert.match(output, /PASS/);
  process.stdout.write(output);
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
