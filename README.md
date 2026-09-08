# SheetDelta

Compare tables by unique keys, find added, removed, and changed records, and export a useful CSV report. Includes a dependency-free TypeScript library and a browser tool for Excel and CSV files.

**English** · [简体中文](README.zh-CN.md)

[Documentation](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/) · [中文文档](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/zh/) · [Browser tool](https://sheetdelta.snowy-hero-3539.chatgpt.site/playground/) · [npm](https://www.npmjs.com/package/sheetdelta-core) · [Releases](https://github.com/yyyz1011/sheetdelta/releases)

## Install

```sh
npm install sheetdelta-core
```

ESM, Node.js 18+ or a modern browser with `structuredClone`. TypeScript declarations are included; the library has no runtime dependencies.

## Quick example

```ts
import { compareTables, exportDiffCsv } from 'sheetdelta-core';

const result = compareTables(
  [{ sku: '001', price: '129.00' }],
  [{ id: '001', price: '119.00' }],
  {
    keys: [{ left: 'sku', right: 'id' }],
    columns: [{ left: 'price', right: 'price' }],
  },
);

console.log(result.summary.changed); // 1
const csv = exportDiffCsv(result);
```

Read the [quick start](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/quick-start.html), [API reference](https://sheetdelta.snowy-hero-3539.chatgpt.site/docs/api/compare-tables.html), or [package README](packages/core/README.md).

## Features

- Key-based matching independent of row order, with composite keys and different column names.
- Structured added/removed/changed/unchanged records and field-level before/after values.
- Optional whitespace normalization, case-insensitive comparison, and per-field numeric tolerance.
- Explicit errors for missing columns, blank keys, and duplicate keys.
- CSV export with formula escaping enabled by default.
- A browser tool for CSV, TSV, XLSX, and XLS: worksheet selection, visual comparison, filters, export, and saved rules.
- Searchable English and Chinese documentation, with a light/dark theme switch. New visits default to English and light mode; theme preferences are remembered.

## Browser tool and privacy

Files are parsed and compared in a browser worker. They are not uploaded or persisted. Local storage contains only saved rule names, mappings, and options. There are currently no third-party ads or remote analytics.

The tool currently has a Chinese interface. Limits: 10 MB per file, 50,000 total workbook data rows, and 100 columns per sheet. The core supports composite keys; the tool currently selects one key column.

Excel comparison uses displayed values. It does not recalculate formulas or compare styles, comments, or merged-cell semantics. Preserve identifiers as text before parsing. Numeric tolerance uses IEEE 754 numbers; use normalized text for exact decimal comparisons. Import CSV identifier columns as text to prevent Excel from dropping leading zeros.

## Local development

Use Node.js 24.10+ and npm 11.5.1+.

```sh
npm ci
npm run dev          # Browser tool: http://127.0.0.1:5178
npm run docs:dev     # Documentation: http://127.0.0.1:5179/docs/
```

```sh
npm run check        # Unit tests, TypeScript checks, tool build
npm run test:e2e     # Existing browser-tool regression suite
npm run site:build   # Build bilingual docs and browser tool into dist/
npm run site:check   # Validate static routes, locales, and theme defaults
npm run pack:core    # Build the distributable npm tarball in artifacts/
```

Browser tests use Chrome on macOS. On Linux, install Chromium with `npx playwright install --with-deps chromium`, or set `CHROME_PATH`.

## Repository structure

| Path | Purpose |
| --- | --- |
| `packages/core/` | Published TypeScript comparison library |
| `apps/docs/` | VitePress documentation: English and Chinese Markdown |
| `apps/web/` | React browser tool and local file parsing |
| `scripts/` | Package and static-site validation |
| `tests/` | Core, parser, and browser regressions |
| `docs/RELEASING.md` | npm release maintenance |
| `docs/HOSTING.md` | Documentation hosting and update instructions |

## Contributing and releases

Create a branch, open a PR, and squash-merge after required checks pass. Use `fix(core): ...` for patches, `feat(core): ...` for features, and a `BREAKING CHANGE:` body for incompatible changes. Documentation and `web`-scoped changes do not publish a new npm version.

GitHub Actions publishes npm releases from `master` using trusted publishing. Versions and release notes are recorded in Git tags, GitHub Releases, and npm. The development workspace retains its baseline package version. See [release maintenance](docs/RELEASING.md).

For documentation changes, update both the English page and its counterpart under `apps/docs/zh/`. Translation switches keep the current page. Report bugs with a small reproduction that contains no sensitive data.

## License

[MIT](LICENSE). File parsing uses Papa Parse and the official SheetJS 0.20.3 distribution; documentation uses VitePress.
