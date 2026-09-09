import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
let browserBundle: string;
test.beforeAll(async () => {
  const result = await build({ stdin: { contents: "export { importFile } from 'sheetdelta-core/import'; export { exportImportReport } from 'sheetdelta-core/import-report'; export { patchWorkbook } from 'sheetdelta-core/workbook';", resolveDir: process.cwd() }, bundle: true, format: 'esm', platform: 'browser', write: false });
  browserBundle = result.outputFiles[0].text;
});

test('browser import, XLSX error report, repair and cancellation', async ({ page }) => {
  await page.goto('/');
  await page.route('**/sheetdelta-test-api.js', route => route.fulfill({ contentType: 'application/javascript', body: browserBundle }));
  const base = '/sheetdelta-test-api.js';
  const result = await page.evaluate(async base => {
    const { importFile, exportImportReport, patchWorkbook } = await import(base);
    const schema = { fields: [{ key: 'sku', aliases: ['商品编号'], requiredColumn: true }, { key: 'qty', aliases: ['数量'], clean: { type: 'number' }, rule: { min: 0 } }] };
    const invalid = await importFile('商品编号,数量\n001,-2', schema, { format: 'csv' });
    const report = await exportImportReport(invalid);
    const corrected = await patchWorkbook(report, [{ sheet: 'Data', cell: 'B2', value: 2 }]);
    const valid = await importFile(corrected, schema, { format: 'excel', sheet: 'Data', excel: { values: 'raw' } });
    const controller = new AbortController(); let abortCode;
    try {
      await importFile('商品编号,数量\n001,1\n002,2', schema, { format: 'csv', batchSize: 1, signal: controller.signal, onProgress: (event: { phase: string }) => { if (event.phase === 'clean') controller.abort(); } });
    } catch (error) { abortCode = (error as { code: string }).code; }
    return { status: invalid.status, acceptedBefore: invalid.rows.length, issueRow: invalid.issues[0].source.sourceRow, rows: valid.rows, source: valid.sources[0], abortCode };
  }, base);
  expect(result.status).toBe('invalid'); expect(result.acceptedBefore).toBe(0); expect(result.issueRow).toBe(2);
  expect(result.rows).toEqual([{ sku: '001', qty: 2 }]); expect(result.source.positionKind).toBe('worksheet-row'); expect(result.abortCode).toBe('ABORTED');
});
