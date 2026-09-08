import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist', { recursive: true });
cpSync('apps/docs/.vitepress/dist', 'dist/docs', { recursive: true });
cpSync('apps/web/dist', 'dist/playground', { recursive: true });
writeFileSync('dist/index.html', '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=/docs/"><title>SheetDelta Documentation</title><link rel="canonical" href="https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/"></head><body><a href="/docs/">SheetDelta Documentation</a></body></html>');
writeFileSync('dist/robots.txt', 'User-agent: *\nAllow: /\nSitemap: https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/sitemap.xml\n');
console.log('Site assembled: documentation + browser tool');
