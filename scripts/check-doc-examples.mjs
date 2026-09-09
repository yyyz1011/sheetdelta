import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
mkdirSync('artifacts', { recursive: true });
for (const locale of ['', 'zh/']) for (const page of ['workflow', 'async', 'errors']) {
  const markdown = readFileSync(`apps/docs/${locale}${page}.md`, 'utf8');
  const code = markdown.match(/```ts\n([\s\S]*?)```/)?.[1];
  assert.ok(code);
  const js = ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const file = 'artifacts/doc-example.mjs';
  try {
    writeFileSync(file, js);
    const output = execFileSync(process.execPath, [file], { encoding: 'utf8' });
    if (page === 'workflow') assert.match(output, /^1 \d+/);
    if (page === 'async') assert.match(output, /complete[\s\S]*1/);
    if (page === 'errors') assert.match(output, /INVALID_HEADER/);
  } finally { unlinkSync(file); }
}
console.log('English and Chinese workflow, async and error documentation examples: PASS');
