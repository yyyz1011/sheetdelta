---
description: A TypeScript toolkit for Excel and CSV data with selective imports. Start here, explore examples, and find the API you need.
---
<div class="doc-eyebrow">SHEETDELTA / DOCUMENTATION</div>

# Excel and CSV data, ready for your application.

<p class="doc-lead">Read, validate, clean, compare and merge table data. Export useful Excel reports with one package and focused imports.</p>

<div class="doc-meta"><span>TypeScript + JavaScript</span><span>Selective imports</span><span>MIT licensed</span></div>

```sh
npm install sheetdelta-core
```

<div class="delta-preview"><header><span>Matched by SKU</span><span>1 field changed</span></header><div class="delta-line"><span>001 · price</span><span><del>129.00</del></span><span><ins>119.00</ins></span></div></div>

## Choose your starting point

<div class="doc-paths"><a class="doc-path" href="./quick-start.html"><strong>Build your first comparison →</strong><span>Install the package and get a useful result in a few lines.</span></a><a class="doc-path" href="./browser-tool.html"><strong>Compare files in the browser →</strong><span>Upload CSV or Excel files locally. No code required.</span></a><a class="doc-path" href="./api/all.html"><strong>Explore the API →</strong><span>Options, return types, ordering, and validation.</span></a><a class="doc-path" href="./mapping.html"><strong>Map your data →</strong><span>Different column names, composite keys, and identifiers.</span></a></div>

## What the package does

- Matches rows using one or more unique key fields, independent of row order.
- Reports **added**, **removed**, **changed**, and **unchanged** records.
- Keeps before/after values and field-level changes together.
- Supports column mappings, text normalization, and optional numeric tolerance.
- Validates missing or duplicate keys before returning a result.
- Exports a CSV report with spreadsheet formula escaping enabled by default.

## Package or browser tool?

| | npm package | Browser tool |
| --- | --- | --- |
| Input | Records, CSV text, XLSX/XLS bytes | CSV, TSV, XLSX, XLS files |
| Matching | Single or composite keys | One key column |
| Output | Typed results, CSV and XLSX reports | Visual comparison and CSV download |
| Best for | Application integration | Checking files by hand |

File APIs are available through `/csv` and `/excel`. Comparison, validation, cleaning and merge modules operate on records. Formula calculation, template-preserving edits and streaming have dedicated modules below. Cell-format comparison is not provided.

## Runtime requirements

Use ESM in Node.js 18+ or a modern browser with `structuredClone`. Type declarations are included. For large datasets in the browser, use cooperative async comparison or run work in a Web Worker.

## Explore the toolkit

- [Selective imports](./imports): one installation, isolated feature modules.
- [Excel files & reports](./excel) and [CSV files](./csv): read files and export results.
- [Validation](./validate), [cleaning](./clean), and [merge](./merge): prepare data for your application.
- [Complete workflow](./workflow): a runnable import-to-report example.
- [Migration](./migration): compatibility and deliberate behavior choices.

## Reliability tools

- [Async & Workers](./async): progress, cancellation and compact difference results.
- [Structured errors](./errors): stable codes and source context.
- [Compatibility & performance](./compatibility): independently generated workbooks, reproducible benchmarks and explicit limits.

## Advanced workbook workflows

- [Formula calculation](./formulas): business functions, cross-sheet dependencies and exact lookups.
- [Workbook editing](./workbooks): patch values while retaining styles, charts and other contents.
- [Streaming](./streaming): incremental CSV/XLSX I/O and sorted comparisons.

## Import and repair

[From header mapping to an error workbook](./import-workflow): check missing columns separately from empty values, run business rules, retain source positions, then repair and reimport. The [complete API reference](./api/all) includes an executable example for every runtime API; the [type reference](./api/types) lists all option shapes.
