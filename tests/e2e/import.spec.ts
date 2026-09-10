import { expect, test } from '@playwright/test';
import { build } from 'esbuild';
let browserBundle: string;
test.beforeAll(async () => {
  const result = await build({ stdin: { contents: "export { importFile, importWithTemplate, serializeImportTemplate, parseImportTemplate } from 'sheetdelta-core/import'; export { exportImportReport } from 'sheetdelta-core/import-report'; export { patchWorkbook } from 'sheetdelta-core/workbook';", resolveDir: process.cwd() }, bundle: true, format: 'esm', platform: 'browser', write: false });
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


test('browser saved template, dictionary, batch lookup and timeout', async ({ page }) => {
  await page.goto('/');
  await page.route('**/sheetdelta-test-api.js', route => route.fulfill({ contentType: 'application/javascript', body: browserBundle }));
  const result = await page.evaluate(async () => {
    const base = '/sheetdelta-test-api.js';
    const api = await import(base);
    const saved = api.serializeImportTemplate({ version: 1, id: 'supplier', revision: 1, format: 'csv', fields: [
      { key: 'sku' }, { key: 'active', clean: { dictionary: { entries: [{ from: 'Yes', to: true }] } } },
    ] });
    const template = api.parseImportTemplate(saved);
    const imported = await api.importWithTemplate('sku,active\n001,Yes\n999,Yes', template, {
      mode: 'valid-rows', batchValidation: { batchSize: 1, concurrency: 2 },
      batchRules: [{ id: 'lookup', validate: async (rows: { row: number; values: { sku: string } }[]) => rows.filter(row => row.values.sku !== '001').map(row => ({ row: row.row, code: 'unknown', message: 'Unknown SKU', column: 'sku', severity: 'error' })) }],
    });
    let timeout;
    try { await api.importWithTemplate('sku,active\n001,Yes', template, { batchValidation: { timeoutMs: 10 }, batchRules: [{ id: 'timeout', validate: () => new Promise(() => {}) }] }); }
    catch (error) { timeout = (error as { code: string }).code; }
    return { status: imported.status, rows: imported.rows, sourceRow: imported.issues[0].source.sourceRow, timeout };
  });
  expect(result).toEqual({ status: 'partial', rows: [{ sku: '001', active: true }], sourceRow: 3, timeout: 'VALIDATION_TIMEOUT' });
});
