import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { catalog } from './api-catalog.mjs';
const write = process.argv.includes('--write');
const pkg = JSON.parse(readFileSync('packages/core/package.json','utf8'));
const paths = Object.values(pkg.exports).map(e => resolve('packages/core',e.types));
const program = ts.createProgram(paths,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,skipLibCheck:true});
const checker = program.getTypeChecker(); const entries = new Map(), signatures = new Map(), types = new Map();
for (const [entry, target] of Object.entries(pkg.exports)) {
  const module = await import(pathToFileURL(resolve('packages/core',target.import)));
  const name = entry === '.' ? pkg.name : pkg.name + entry.slice(1);
  const source = program.getSourceFile(resolve('packages/core',target.types));
  const symbols = checker.getExportsOfModule(checker.getSymbolAtLocation(source));
  for (let symbol of symbols) {
    const exported = symbol.name;
    if (symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
    const declaration = symbol.declarations?.[0];
    if (typeof module[exported] === 'function') {
      assert.ok(catalog[exported],`Missing API example: ${name}.${exported}`);
      entries.set(exported,[...(entries.get(exported)??[]),name]);
      const type = checker.getTypeOfSymbolAtLocation(symbol,declaration);
      const signature = type.getCallSignatures()[0] ?? type.getConstructSignatures()[0];
      assert.ok(signature,`Missing declaration: ${exported}`);
      signatures.set(exported,checker.signatureToString(signature,undefined,ts.TypeFormatFlags.NoTruncation));
    } else if (declaration && (ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration))) {
      const value = types.get(exported) ?? {declaration:declaration.getText(),entries:[]};
      value.entries.push(name); types.set(exported,value);
    }
  }
}
assert.deepEqual([...entries.keys()].sort(),Object.keys(catalog).sort(),'Stale API catalog');
for (const [name,spec] of Object.entries(catalog)) assert.ok(entries.get(name).includes(`${pkg.name}/${spec.entry}`),`${name}: canonical entry`);
for (const zh of [false,true]) {
  const prefix = `apps/docs/${zh?'zh/':''}api/`; mkdirSync(prefix,{recursive:true});
  let page = zh ? '# 完整 API 使用参考\n\n' : '# Complete API usage reference\n\n';
  page += zh ? `覆盖当前所有 **${entries.size} 个运行时函数和错误类**，包括各入口重复导出的同名 API。每个示例独立可运行，并由 CI 执行。参数类型见下方签名，所有选项和限制见对应功能指南与[类型参考](./types)。\n\n` : `Covers all **${entries.size} runtime functions and error classes**, including aliases across entry points. Every example runs independently in CI. Signatures show parameter/return types; linked guides describe options and limits. See the [type reference](./types) for complete option shapes.\n\n`;
  page += zh ? '底层兼容辅助函数单独标注；通常应使用对应高级接口。示例以 Node ESM 运行；`readExcelStream` 是仅 Node 的接口，浏览器文件保存方式见 Excel 指南。\n\n' : 'Low-level compatibility helpers are marked; prefer the corresponding high-level API. Examples run as Node ESM; `readExcelStream` is Node-only. Browser file-saving recipes are in the Excel guide.\n\n';
  for (const [name,spec] of Object.entries(catalog)) {
    page += `## ${name}\n\n${zh?spec.zh:spec.en}\n\n`;
    page += `${zh?'导入入口':'Available from'}: ${entries.get(name).map(e=>'`'+e+'`').join(', ')}.\n\n`;
    if(spec.lowLevel) page += zh?'**底层兼容辅助函数。**\n\n':'**Low-level compatibility helper.**\n\n';
    page += '```ts\n'+name+signatures.get(name)+'\n```\n\n';
    page += `[${zh?'参数、返回值与限制说明':'Options, return values and limits'}](../${spec.guide})\n\n`;
    page += '```js\n'+`import { ${name} } from '${pkg.name}/${spec.entry}';\n`+spec.example+'\n```\n\n';
  }
  let typePage = zh ? '# API 类型参考\n\n' : '# API type reference\n\n';
  typePage += zh?'以下声明来自发布构建，CI 校验与源码同步。字段含义、默认值及案例见[完整 API 使用参考](./all)和功能指南。类型名称可通过文档搜索定位。\n\n':'These declarations come from the release build and are checked in CI. Field semantics, defaults and examples are linked from the [complete API usage reference](./all). Search by type name.\n\n';
  for(const [name,value] of [...types].sort(([a],[b])=>a.localeCompare(b))) typePage+=`## ${name}\n\n${value.entries.map(e=>'`'+e+'`').join(', ')}\n\n\`\`\`ts\n${value.declaration}\n\`\`\`\n\n`;
  for(const [path,content] of [[prefix+'all.md',page],[prefix+'types.md',typePage]]) if(write) writeFileSync(path,content); else assert.equal(readFileSync(path,'utf8'),content,`API docs are stale: run npm run docs:api after building (${path})`);
  if (!write) {
    mkdirSync(resolve('artifacts'), { recursive: true });
    const dir = mkdtempSync(resolve('artifacts/api-examples-'));
    try {
      for(const [name,spec] of Object.entries(catalog)) {
        const path = join(dir,name+'.mjs');
        writeFileSync(path,`import assert from 'node:assert/strict';\nimport { ${name} } from '${pkg.name}/${spec.entry}';\n${spec.example}\n${spec.check};\n`);
        try { execFileSync(process.execPath,[path],{encoding:'utf8',stdio:'pipe',timeout:30000}); }
        catch(error) { throw new Error(`${zh?'Chinese':'English'} API example failed: ${name}\n${error.stderr ?? error.message}`); }
      }
    } finally { rmSync(dir,{recursive:true,force:true}); }
  }
}
console.log(`${entries.size} runtime APIs, ${[...entries.values()].reduce((n,v)=>n+v.length,0)} export bindings, ${types.size} types: bilingual documentation ${write?'generated':'and executable examples PASS'}`);
