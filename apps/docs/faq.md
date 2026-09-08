# Frequently asked questions

## Does installing the package upload my data?

No. The core compares records in your process and has no network functionality. The browser tool also processes files locally.

## Can I pass an Excel file to compareTables?

No. Parse the file into records first, then call `compareTables`. Use the [browser tool](./browser-tool) for a ready-made file workflow.

## Why does a reordered file have no changes?

Rows are matched by key. Moving an otherwise identical record does not change its status. Result rows still follow the documented input ordering.

## Why are 10 and 10.0 different?

They are different text representations. Set `numericTolerance: 0` on that comparison field to compare numeric values without accepting any nonzero difference.

## Can the library compare nested objects?

Cells support primitive values only. Flatten nested values into columns before comparing.

## Does it support CommonJS require?

The package is ESM. Use an ESM import, or dynamic `import('sheetdelta-core')` from CommonJS.

## Can I contribute or report a bug?

Open an [issue](https://github.com/yyyz1011/sheetdelta/issues) with a small, non-sensitive reproduction. Contributions go through a PR. The project uses the MIT license.

## Where are release notes?

See [GitHub Releases](https://github.com/yyyz1011/sheetdelta/releases). Core fixes and features merged into master publish automatically after tests pass; documentation and website-only changes do not produce npm releases.
