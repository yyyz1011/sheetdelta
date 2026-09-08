import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
mkdirSync('artifacts', { recursive: true });
for (const locale of ['', 'zh/']) {
  const markdown = readFileSync(`apps/docs/${locale}workflow.md`, 'utf8');
  const code = markdown.match(/```ts\n([\s\S]*?)```/)?.[1];
  assert.ok(code);
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const file = 'artifacts/doc-example.mjs';
  try {
    writeFileSync(file, js);
    assert.match(execFileSync(process.execPath, [file], { encoding: 'utf8' }), /^1 \d+/);
  } finally { unlinkSync(file); }
}
console.log('English and Chinese end-to-end documentation examples: PASS');
