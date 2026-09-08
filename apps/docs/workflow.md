# Complete workflow

Read → clean → validate → compare → export. This runnable example keeps identifiers as text and explicitly converts prices. Both input tables are checked before comparison.

```ts
import { readCsv } from 'sheetdelta-core/csv';
import { cleanTable } from 'sheetdelta-core/clean';
import { validateTable } from 'sheetdelta-core/validate';
import { compareTables } from 'sheetdelta-core/compare';
import { exportDiffExcel } from 'sheetdelta-core/excel';

const before = readCsv('sku,price\n001,10.00');
const after = readCsv('sku,price\n001,12.00');
function prepare(rows: typeof before.rows) {
  const cleaned = cleanTable(rows, { price: { trim: true, type: 'number' } });
  if (cleaned.issues.length) throw new Error(JSON.stringify(cleaned.issues));
  const checked = validateTable(cleaned.rows, {
    sku: { required: true, type: 'string', unique: true },
    price: { required: true, type: 'number', min: 0 },
  });
  if (!checked.valid) throw new Error(JSON.stringify(checked.issues));
  return cleaned.rows;
}
const result = compareTables(prepare(before.rows), prepare(after.rows), { keys: ['sku'] });
const report = await exportDiffExcel(result);
console.log(result.summary.changed, report.byteLength); // 1, XLSX byte length
```

For Excel inputs, replace `readCsv` with `await readExcel(bytes)` and select the desired table. Save report bytes with Node `writeFile`, or download a Blob in the browser.

Cleaning and comparison use IEEE 754 for numbers; normalize exact-decimal amounts to a canonical text format instead when rounding is unacceptable. No data, filenames or reports are sent to a remote service.
