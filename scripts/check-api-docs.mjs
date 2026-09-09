import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { catalog } from './api-catalog.mjs';
import { apiGroups, apiSlug } from './api-navigation.mjs';
const write = process.argv.includes('--write');
const pkg = JSON.parse(readFileSync('packages/core/package.json','utf8'));
const paths = Object.values(pkg.exports).map(e => resolve('packages/core',e.types));
const program = ts.createProgram(paths,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.NodeNext,moduleResolution:ts.ModuleResolutionKind.NodeNext,skipLibCheck:true,strictNullChecks:true});
const checker = program.getTypeChecker(); const entries = new Map(), signatures = new Map(), types = new Map();
const details = new Map();
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
      details.set(exported, {
        parameters: signature.parameters.map(parameter => {
          const declaration = parameter.valueDeclaration;
          return { name: declaration?.name.getText() ?? parameter.name, optional: !!(parameter.flags & ts.SymbolFlags.Optional) || !!declaration?.questionToken || !!declaration?.initializer,
            type: checker.typeToString(checker.getTypeOfSymbolAtLocation(parameter,declaration),undefined,ts.TypeFormatFlags.NoTruncation) };
        }),
        returns: checker.typeToString(checker.getReturnTypeOfSignature(signature),undefined,ts.TypeFormatFlags.NoTruncation),
      });
    } else if (declaration && (ts.isInterfaceDeclaration(declaration) || ts.isTypeAliasDeclaration(declaration))) {
      const value = types.get(exported) ?? {declaration:declaration.getText(),entries:[]};
      value.entries.push(name); types.set(exported,value);
    }
  }
}
assert.deepEqual([...entries.keys()].sort(),Object.keys(catalog).sort(),'Stale API catalog');
assert.deepEqual(apiGroups.flatMap(group => group.apis).sort(), [...entries.keys()].sort(), 'Every API belongs to exactly one navigation group');
for (const [name,spec] of Object.entries(catalog)) assert.ok(entries.get(name).includes(`${pkg.name}/${spec.entry}`),`${name}: canonical entry`);
for (const zh of [false,true]) {
  const prefix = `apps/docs/${zh?'zh/':''}api/`; mkdirSync(prefix,{recursive:true});
  const outputs = [];
  const label = (en, cn) => zh ? cn : en;
  let page = `---\noutline: [2, 2]\nsearch: false\ndescription: ${label('Find every SheetDelta API by task, with parameters and runnable examples.', '按任务查找 SheetDelta 全部 API、参数和可运行案例。')}\n---\n\n# ${label('API reference', 'API 参考')}\n\n`;
  page += label(`**${entries.size} APIs, organized by task.** Open a function for its import, parameters, return value and runnable example. Search by function name with the search button in the header.\n\n`, `**${entries.size} 个 API，按任务分类。** 点击函数查看导入方式、参数、返回值和可运行案例；也可使用顶栏搜索按函数名查找。\n\n`);
  page += label('[Start with the import workflow](../import-workflow) · [Choose an import entry](../imports) · [Browse all types](./types)\n\n', '[从导入纠错流程开始](../import-workflow) · [选择按需导入入口](../imports) · [查看全部类型](./types)\n\n');
  for (const group of apiGroups) {
    page += `## ${group[zh?'zh':'en']} {#${group.id}}\n\n`;
    page += `| API | ${label('Use it to', '用途')} |\n| --- | --- |\n`;
    for (const name of group.apis) {
      const spec = catalog[name], slug = apiSlug(name), info = details.get(name);
      const guide = spec.guide + (name === 'compareTables' ? label('#options', '#配置选项') : name === 'exportDiffCsv' ? label('#report-columns', '#报告列') : '');
      page += `| <span id="${name.toLowerCase()}"></span>[${name}](./${slug}) | ${spec[zh?'zh':'en']} |\n`;
      let detail = `---\ndescription: ${JSON.stringify(spec[zh?'zh':'en'])}\n---\n\n# ${name}\n\n[${label('API reference','API 参考')}](./all) / [${group[zh?'zh':'en']}](./all#${group.id})\n\n${spec[zh?'zh':'en']}\n\n`;
      if (spec.lowLevel) detail += `::: info ${label('Low-level compatibility helper', '底层兼容辅助函数')}\n${label('Prefer the higher-level workflow linked below for application code.', '业务代码优先使用下方关联的高级功能接口。')}\n:::\n\n`;
      if (name === 'readExcelStream') detail += `::: warning ${label('Node.js only','仅限 Node.js')}\n${label('This API reads a local file path. It cannot run in a browser.', '此 API 读取本地文件路径，不能在浏览器中运行。')}\n:::\n\n`;
      detail += `## ${label('Import', '导入方式')} {#import}\n\n\`\`\`js\nimport { ${name} } from '${pkg.name}/${spec.entry}';\n\`\`\`\n\n`;
      if(entries.get(name).length>1) detail += `${label('Also exported from','也可从以下入口导入')}：${entries.get(name).filter(e=>e!==`${pkg.name}/${spec.entry}`).map(e=>'`'+e+'`').join(', ')}.\n\n`;
      detail += `## ${label('Signature', '函数签名')} {#signature}\n\n\`\`\`ts\n${name}${signatures.get(name)}\n\`\`\`\n\n`;
      detail += `## ${label('Parameters', '参数')} {#parameters}\n\n| ${label('Parameter','参数')} | ${label('Required','必填')} | ${label('Type','类型')} |\n| --- | --- | --- |\n`;
      for(const parameter of info.parameters) detail += `| \`${parameter.name.replaceAll('|','\\|')}\` | ${parameter.optional?label('No','否'):label('Yes','是')} | \`${parameter.type.replaceAll('|','\\|')}\` |\n`;
      const relatedTypes = [...types.keys()].filter(type => new RegExp(`\\b${type}\\b`).test(signatures.get(name)));
      detail += `\n${label('Option meanings, defaults and limits','选项含义、默认值与限制')}： [${label('Usage guide','使用指南')}](../${guide}).\n\n`;
      if(relatedTypes.length)detail += `${label('Related types','相关类型')}：${relatedTypes.map(type=>`[\`${type}\`](./types#${type.toLowerCase()})`).join(' · ')}.\n\n`;
      detail += `## ${label('Return value','返回值')} {#returns}\n\n\`\`\`ts\n${info.returns}\n\`\`\`\n\n`;
      if(name==='exportDiffCsv') detail += label('The string includes a UTF-8 BOM, comma delimiters, quoted fields and CRLF line endings. Embedded quotes are escaped. Set `changesOnly: false` to include unchanged rows.\n\n', '返回文本包含 UTF-8 BOM、逗号分隔符、带引号字段及 CRLF 换行，字段内引号会被转义。设置 `changesOnly: false` 可包含未变化记录。\n\n');
      detail += `## ${label('Runnable example','可运行案例')} {#example}\n\n${label('Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.', '先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。')}\n\n\`\`\`js\nimport { ${name} } from '${pkg.name}/${spec.entry}';\n${spec.example}\n\`\`\`\n\n`;
      if(['compareTables','exportDiffCsv'].includes(name)) {
        const notes = readFileSync(`scripts/api-notes/${zh?'zh':'en'}/${slug}.md`,'utf8');
        const start = notes.search(zh ? /^## (配置选项|报告列)/m : /^## (Options|Report columns)/m);
        assert.ok(start>=0, `Missing detailed notes: ${name}`);
        detail += notes.slice(start) + '\n\n';
      }
      detail += `## ${label('Related APIs and guides','相关 API 与指南')} {#related}\n\n`;
      detail += `- [${label('Usage, defaults and limits','用法、默认值与限制')}](../${guide})\n`;
      detail += group.apis.filter(other=>other!==name).map(other=>`- [${other}](./${apiSlug(other)})`).join('\n')+'\n';
      outputs.push([prefix+slug+'.md',detail]);
    }
    page += '\n';
  }
  let typePage = zh ? '# API 类型参考\n\n' : '# API type reference\n\n';
  typePage += zh?'以下声明来自发布构建，CI 校验与源码同步。字段含义、默认值及案例见[完整 API 使用参考](./all)和功能指南。类型名称可通过文档搜索定位。\n\n':'These declarations come from the release build and are checked in CI. Field semantics, defaults and examples are linked from the [complete API usage reference](./all). Search by type name.\n\n';
  for(const [name,value] of [...types].sort(([a],[b])=>a.localeCompare(b))) typePage+=`## ${name}\n\n${value.entries.map(e=>'`'+e+'`').join(', ')}\n\n\`\`\`ts\n${value.declaration}\n\`\`\`\n\n`;
  for(const [path,content] of [...outputs,[prefix+'all.md',page],[prefix+'types.md',typePage]]) if(write) writeFileSync(path,content); else assert.equal(readFileSync(path,'utf8'),content,`API docs are stale: run npm run docs:api after building (${path})`);
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
