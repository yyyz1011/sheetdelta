import { expect, test } from '@playwright/test';
import fs from 'node:fs';

test('sample comparison, filter, export, saved rules and persistence', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '试用商品示例', exact: true }).click();
  await expect(page.getByRole('heading', { name: '比较结果' })).toBeVisible();
  await expect(page.locator('.diff-table tbody tr')).toHaveCount(4);
  await expect(page.locator('.summary-item.changed strong')).toHaveText('2行');
  await page.getByRole('button', { name: '全部记录', exact: true }).click();
  await expect(page.locator('.diff-table tbody tr')).toHaveCount(9);
  await page.getByRole('textbox', { name: '搜索比较结果' }).fill('001');
  await expect(page.locator('.diff-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.new-value')).toContainText('119.00');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出差异 CSV' }).click();
  const download = await downloadPromise;
  const csv = fs.readFileSync((await download.path())!, 'utf8');
  expect(csv).toContain('changed'); expect(csv).toContain('001'); expect(csv).toContain('added'); expect(csv).toContain('removed'); expect(csv).not.toContain('unchanged');
  await page.getByRole('button', { name: '保存规则', exact: true }).click();
  await page.getByLabel('给这条规则起个名字').fill('每周商品核对');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: /我的规则/ }).click();
  await expect(page.getByRole('button', { name: /每周商品核对 SKU/ })).toBeVisible();
  await page.getByRole('button', { name: /每周商品核对 SKU/ }).click();
  await expect(page.locator('.notice[role="status"]')).toContainText('请先导入');
});

test('real CSV upload preserves IDs, handles duplicate errors and recovers', async ({ page }) => {
  await page.goto('/');
  const old = 'SKU,价格,库存\n001,10,20\n002,15,30';
  const bad = 'SKU,价格,库存\n001,12,20\n001,15,30';
  await page.getByLabel('选择原始表格', { exact: true }).setInputFiles({ name: 'old.csv', mimeType: 'text/csv', buffer: Buffer.from(old) });
  await page.getByLabel('选择更新后的表格', { exact: true }).setInputFiles({ name: 'new.csv', mimeType: 'text/csv', buffer: Buffer.from(bad) });
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('001');
  await expect(page.getByRole('alert')).toContainText('重复');
  await page.getByLabel('选择更新后的表格', { exact: true }).setInputFiles({ name: 'fixed.csv', mimeType: 'text/csv', buffer: Buffer.from('SKU,价格,库存\n002,15,30\n001,12,20') });
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await expect(page.locator('.diff-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.key-cell')).toHaveText('001');
  await page.getByRole('button', { name: /比较字段/ }).click();
  await page.locator('.mapping-line').filter({ hasText: '价格' }).getByRole('checkbox').uncheck();
  await expect(page.locator('.results-panel')).toHaveCount(0);
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await expect(page.getByText('所选字段没有变化', { exact: true })).toBeVisible();
});

test('xlsx file upload and worksheet selection run through the browser worker', async ({ page }) => {
  const XLSX = await import('xlsx');
  function workbook(price: number) {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['id', 'price'], ['001', 0]]), '占位');
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([['id', 'price'], ['001', price]]), '商品');
    return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' });
  }
  await page.goto('/');
  await page.getByLabel('选择原始表格', { exact: true }).setInputFiles({ name: 'old.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: workbook(10) });
  await page.getByLabel('选择更新后的表格', { exact: true }).setInputFiles({ name: 'new.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: workbook(12) });
  await page.getByLabel('原始表格工作表', { exact: true }).selectOption('1');
  await page.getByLabel('更新后的表格工作表', { exact: true }).selectOption('1');
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await expect(page.locator('.new-value')).toContainText('12');
});

test('renamed fields, tolerance, swap and removal invalidate stale results', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('选择原始表格', { exact: true }).setInputFiles({ name: 'a.csv', mimeType: 'text/csv', buffer: Buffer.from('SKU,价格\n001,10.00') });
  await page.getByLabel('选择更新后的表格', { exact: true }).setInputFiles({ name: 'b.csv', mimeType: 'text/csv', buffer: Buffer.from('编号,售价\n001,10') });
  await page.getByRole('button', { name: /比较字段/ }).click();
  await page.locator('.mapping-line').getByRole('checkbox').check();
  await page.getByLabel('价格数值容差', { exact: true }).fill('0');
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await expect(page.getByText('所选字段没有变化', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '交换原始与更新表格', exact: true }).click();
  await expect(page.locator('.results-panel')).toHaveCount(0);
  await page.getByRole('button', { name: '开始比较', exact: true }).click();
  await expect(page.getByText('所选字段没有变化', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '移除原始表格', exact: true }).click();
  await expect(page.getByRole('button', { name: '开始比较', exact: true })).toBeDisabled();
  await expect(page.locator('.results-panel')).toHaveCount(0);
});

test('desktop and mobile screenshots, no page overflow or runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '.impeccable/review/desktop.png', fullPage: true });
  await page.getByRole('button', { name: '试用商品示例', exact: true }).click();
  await expect(page.locator('.diff-table tbody tr')).toHaveCount(4);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '.impeccable/review/desktop-results.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '.impeccable/review/mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: '试用商品示例', exact: true }).click();
  await expect(page.locator('.diff-table tbody tr')).toHaveCount(4);
  await page.screenshot({ path: '.impeccable/review/mobile-results.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('guides and developer documentation are real reachable pages', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: '如何使用', exact: true }).click();
  await expect(page.getByRole('heading', { name: '两份表格，找出真正的变化。' })).toBeVisible();
  await page.goto('/docs/');
  await expect(page.getByRole('heading', { name: '把比较能力，接入你的项目。' })).toBeVisible();
});
