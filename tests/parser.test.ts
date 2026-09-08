import { describe, it, expect } from 'vitest';
import { matrixToSheet, parseFile, sampleFiles } from '../apps/web/src/data';
import { compareTables } from '../packages/core/src/index';
describe('file parsing', () => {
  it('keeps IDs as strings, parses quoted commas and multiline fields', async () => {
    const file = new File(['\uFEFFSKU,name,price\r\n001,"a,b",10.00\r\n002,"line\nnext",20'], 'products.csv');
    const parsed = await parseFile(file);
    expect(parsed.sheets[0].rows[0]).toEqual({ SKU: '001', name: 'a,b', price: '10.00' });
    expect(parsed.sheets[0].rows[1].name).toBe('line\nnext');
  });
  it('detects semicolon and supports TSV', async () => {
    expect((await parseFile(new File(['id;price\n01;10'], 'data.csv'))).sheets[0].rows[0].id).toBe('01');
    expect((await parseFile(new File(['id\tprice\n01\t10'], 'data.tsv'))).sheets[0].rows[0].price).toBe('10');
  });
  it('rejects broken quoting, duplicate/empty headers and excess columns', async () => {
    await expect(parseFile(new File(['id,price\n1,"oops'], 'bad.csv'))).rejects.toThrow('CSV 格式');
    expect(() => matrixToSheet([['id', 'id'], ['x', 'y']], 'test')).toThrow('重复列名');
    expect(() => matrixToSheet([['id', ''], ['x', 'y']], 'test')).toThrow('空列名');
    expect(() => matrixToSheet([['id'], ['x', 'y']], 'test')).toThrow('列数超过');
  });
  it('supports header-only CSV and rejects empty files', async () => {
    expect((await parseFile(new File(['id,price'], 'empty.csv'))).sheets[0].rows).toHaveLength(0);
    await expect(parseFile(new File([''], 'empty.csv'))).rejects.toThrow('为空');
  });
  it('reads XLSX with multiple sheets and formatted leading zeros', async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['id', 'price'], ['001', 10]]), '商品');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['id', 'price'], ['002', 20]]), '库存');
    const parsed = await parseFile(new File([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], 'data.xlsx'));
    expect(parsed.sheets.map(s => s.name)).toEqual(['商品', '库存']);
    expect(parsed.sheets[0].rows[0].id).toBe('001');
  });
  it('rejects unsupported extensions and oversized inputs', async () => {
    await expect(parseFile(new File(['hi'], 'a.txt'))).rejects.toThrow('请选择');
    await expect(parseFile(new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'big.csv'))).rejects.toThrow('超过 10 MB');
  });
  it('computes the demo summary from sample data', () => {
    const [a, b] = sampleFiles();
    expect(compareTables(a.sheets[0].rows, b.sheets[0].rows, { keys: [{ left: 'SKU', right: 'SKU' }], columns: ['商品名称', '分类', '价格', '库存'].map(h => ({ left: h, right: h })) }).summary).toMatchObject({ added: 1, removed: 1, changed: 2, unchanged: 5 });
  });
});
