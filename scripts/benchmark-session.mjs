import { performance } from 'node:perf_hooks';
import { writeExcel, readExcel } from '../packages/core/dist/excel.js';
import { prepareImport } from '../packages/core/dist/import.js';

const rowCount = Number(process.env.ROWS ?? 10000);
const samples = Number(process.env.SAMPLES ?? 7);
const rows = Array.from({ length: rowCount }, (_, index) => ({
  'Product ID': `SKU-${String(index).padStart(6, '0')}`,
  Stock: String(index % 19),
  Enabled: index % 2 ? 'Yes' : 'No',
  Note: `supplier-${index % 31}`,
}));
const bytes = await writeExcel([{ name: 'Inventory', rows }]);
const schema = {
  fields: [
    { key: 'sku', source: 'Product ID', rule: { required: true, unique: true } },
    { key: 'qty', source: 'Stock', clean: { type: 'number' } },
    { key: 'active', source: 'Enabled' },
  ],
};
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const repeated = [], retained = [];
for (let sample = 0; sample < samples; sample++) {
  global.gc?.();
  let start = performance.now();
  for (let pass = 0; pass < 2; pass++) {
    const [table] = await readExcel(bytes);
    await prepareImport(table, schema, { mode: 'valid-rows' });
  }
  repeated.push(performance.now() - start);
  global.gc?.();
  start = performance.now();
  const [table] = await readExcel(bytes);
  await prepareImport(table, schema, { mode: 'valid-rows' });
  const result = await prepareImport(table, schema, { mode: 'valid-rows' });
  retained.push(performance.now() - start);
  if (sample === samples - 1) {
    const compact = {
      status: result.status,
      valid: result.valid,
      summary: result.summary,
      mappings: result.mappings,
      issues: result.issues,
      changeCount: result.changes.length,
      preview: result.processedRows.slice(0, 20),
    };
    const fullBytes = Buffer.byteLength(JSON.stringify(result));
    const compactBytes = Buffer.byteLength(JSON.stringify(compact));
    console.log(JSON.stringify({ rowCount, workbookBytes: bytes.length, fullResultBytes: fullBytes, compactStateBytes: compactBytes, payloadReductionPercent: Number((100 * (1 - compactBytes / fullBytes)).toFixed(2)) }));
  }
}
console.log(JSON.stringify({ rowCount, samples, repeatedParseMs: repeated.map(value => Number(value.toFixed(2))), retainedParseMs: retained.map(value => Number(value.toFixed(2))), repeatedMedianMs: Number(median(repeated).toFixed(2)), retainedMedianMs: Number(median(retained).toFixed(2)), savedPercent: Number((100 * (1 - median(retained) / median(repeated))).toFixed(2)) }));
