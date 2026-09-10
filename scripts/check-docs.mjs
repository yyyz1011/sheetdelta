import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { pathToFileURL } from 'node:url';
import MiniSearch from 'minisearch';
import config from '../apps/docs/.vitepress/config.mjs';
import { apiGroups, apiSlug } from './api-navigation.mjs';
const pages = [...new Set(['reusable-imports', 'import-workflow', 'api/all', 'api/types', 'index', 'quick-start', 'browser-tool', 'mapping', 'comparison', 'validation', 'api/compare-tables', 'api/export-diff-csv', 'faq', 'imports', 'excel', 'csv', 'validate', 'clean', 'merge', 'workflow', 'migration', 'async', 'errors', 'compatibility', 'formulas', 'workbooks', 'streaming', ...apiGroups.flatMap(group=>group.apis.map(name=>'api/'+apiSlug(name)))])];
const sidebarLinks = items => items.flatMap(item => [...(item.link ? [item.link] : []), ...sidebarLinks(item.items ?? [])]);
for(const zh of [false,true]) for(const name of apiGroups.flatMap(group=>group.apis)) assert.ok(sidebarLinks(config.locales[zh?'zh':'root'].themeConfig.sidebar).includes(`${zh?'/zh':''}/api/${apiSlug(name)}`), `Missing sidebar API: ${name}`);
assert.equal(config.lang, 'en-US');
assert.equal(config.appearance.initialValue, 'light');
assert.equal(config.themeConfig.search.provider, 'local');
assert.equal(config.locales.zh.lang, 'zh-CN');
let checked = 0;
for (const prefix of ['', 'zh/']) for (const page of pages) {
  const path = `dist/docs/${prefix}${page}.html`;
  const html = readFileSync(path, 'utf8');
  assert.match(html, new RegExp(`lang="${prefix ? 'zh-CN' : 'en-US'}"`));
  assert.ok(html.includes('VPSidebar'), path);
  assert.ok(html.includes('VPSwitchAppearance'), path);
  const script = html.match(/<script id="check-dark-mode">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, `Pre-paint theme script: ${path}`);
  for (const preference of [null, 'dark', 'light']) {
    const classes = new Set();
    runInNewContext(script, { localStorage: { getItem: () => preference }, window: { matchMedia: () => ({ matches: true }) }, document: { documentElement: { classList: { add: s => classes.add(s) } } } });
    assert.equal(classes.has('dark'), preference === 'dark', 'OS dark preference must not override default light or a saved choice');
  }
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|data:|mailto:)/.test(raw)) continue;
    const url = new URL(raw.replaceAll('&amp;', '&'), `https://example.com/docs/${prefix}${page === 'index' ? '' : page + '.html'}`);
    let target = resolve('dist', '.' + decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) target += '/index.html';
    assert.ok(existsSync(target), `Missing local link: ${raw} in ${path}`);
    if(url.hash && target.endsWith('.html')) assert.ok(readFileSync(target,'utf8').includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `Missing anchor: ${raw} in ${path}`);
  }
  checked++;
}
assert.ok(readdirSync('dist/docs/assets/chunks').filter(name => /localSearchIndex/.test(name)).length === 2, 'Built local search indexes');
assert.equal(readFileSync('dist/404.html', 'utf8'), readFileSync('dist/docs/404.html', 'utf8'), 'GitHub Pages uses the documentation 404 page');
assert.equal(readFileSync('dist/.nojekyll', 'utf8'), '');
assert.match(readFileSync('dist/index.html', 'utf8'), /url=\/docs\//);
assert.match(readFileSync('dist/playground/index.html', 'utf8'), /\/playground\/assets\//);
for (const name of ['README.md', 'README.zh-CN.md']) assert.ok(readFileSync(name, 'utf8').includes('https://sheetdelta.nimokit.com/docs/'));
console.log(`${checked} localized pages, internal links, search indexes, theme defaults and saved preferences: PASS`);

for (const [locale, query] of [['root', 'numericTolerance'], ['zh', '字段']]) {
  const file = readdirSync('dist/docs/assets/chunks').find(name => name.startsWith('@localSearchIndex' + locale + '.'));
  const { default: data } = await import(pathToFileURL(resolve('dist/docs/assets/chunks', file)));
  const index = MiniSearch.loadJSON(data, { fields: ['title', 'titles', 'text'], storeFields: ['title', 'titles'], ...config.themeConfig.search.options.miniSearch.options });
  assert.ok(index.search(query, { prefix: true, combineWith: 'AND' }).length > 0, `${locale} search: ${query}`);
}
console.log('English API search and Chinese keyword search: PASS');
for(const locale of ['root','zh']) {
  const file = readdirSync('dist/docs/assets/chunks').find(name=>name.startsWith('@localSearchIndex'+locale+'.'));
  const {default:data} = await import(pathToFileURL(resolve('dist/docs/assets/chunks',file)));
  const index=MiniSearch.loadJSON(data,{fields:['title','titles','text'],storeFields:['title','titles'],...config.themeConfig.search.options.miniSearch.options});
  for(const query of ['importFile','import file']) assert.ok(index.search(query,{...config.themeConfig.search.options.miniSearch.searchOptions,prefix:true}).some(result=>result.id.includes('/api/import-file')),`${locale}: API page discoverable by ${query}`);
}
console.log(`${apiGroups.flatMap(group => group.apis).length} APIs in both sidebars; direct API search and internal anchors: PASS`);
