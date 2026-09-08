# Quick start

Install the package, choose a unique key, and compare two arrays of records.

## Install

::: code-group
```sh [npm]
npm install sheetdelta-core
```
```sh [pnpm]
pnpm add sheetdelta-core
```
```sh [yarn]
yarn add sheetdelta-core
```
:::

The package is ESM. In Node.js, use an `.mjs` file or set `"type": "module"` in your project's `package.json`.

## Compare records

```ts
import { compareTables, exportDiffCsv } from 'sheetdelta-core';

const before = [
  { sku: '001', price: '129.00', stock: 20 },
  { sku: '002', price: '49.00', stock: 8 },
];
const after = [
  { sku: '001', price: '119.00', stock: 20 },
  { sku: '003', price: '79.00', stock: 12 },
];

const result = compareTables(before, after, {
  keys: [{ left: 'sku', right: 'sku' }],
  columns: [
    { left: 'price', right: 'price' },
    { left: 'stock', right: 'stock' },
  ],
});

console.log(result.summary);
// { added: 1, removed: 1, changed: 1, unchanged: 0,
//   total: 3, before: 2, after: 2 }

const csv = exportDiffCsv(result);
```

## Read the result

`result.summary` counts each status. `result.rows` contains each record's key, status, before/after objects, and field-level changes. The example returns one changed, one removed, and one added record.

```ts
for (const row of result.rows) {
  if (row.status === 'changed') {
    console.log(row.key, row.changes);
  }
}
```

## Save the report in Node.js

```ts
import { writeFile } from 'node:fs/promises';
await writeFile('changes.csv', csv, 'utf8');
```

In a browser, put the CSV text in a Blob and download it. See [CSV export](./api/export-diff-csv).
