import Papa from 'papaparse';
import type { Row } from 'sheetdelta-core';

export interface Sheet { name: string; headers: string[]; rows: Row[]; rowNumbers: number[] }
export interface SourceFile { name: string; sheets: Sheet[]; size: number; sample?: boolean }
export const MAX_ROWS = 50_000;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function matrixToSheet(matrix: unknown[][], name: string): Sheet {
  const populated = matrix.map((cells, index) => ({ cells, line: index + 1 })).filter(({ cells }) => cells.some(value => value != null && String(value).trim() !== ''));
  const nonempty = populated.map(item => item.cells);
  if (!nonempty.length) throw new Error(`「${name}」为空，请选择包含表头的工作表。`);
  const headers = nonempty[0].map(value => String(value ?? '').trim());
  if (headers.length > 100) throw new Error('当前版本支持最多 100 列，请先删除不需要的列。');
  if (headers.some(value => !value)) throw new Error(`「${name}」存在空列名，请补全第一行表头后重试。`);
  if (new Set(headers).size !== headers.length) throw new Error(`「${name}」存在重复列名，请为每列设置不同的名称。`);
  if (nonempty.length - 1 > MAX_ROWS) throw new Error('每张表最多支持 50,000 行，请拆分后重试。');
  const rows = nonempty.slice(1).map((cells, index) => {
    if (cells.length > headers.length && cells.slice(headers.length).some(value => value != null && String(value) !== '')) throw new Error(`第 ${index + 2} 行的列数超过表头，请检查分隔符或补全表头。`);
    return Object.fromEntries(headers.map((header, i) => [header, cells[i] == null ? '' : String(cells[i])])) as Row;
  });
  return { name, headers, rows, rowNumbers: populated.slice(1).map(item => item.line) };
}

export async function parseFile(file: File): Promise<SourceFile> {
  if (file.size > MAX_FILE_SIZE) throw new Error('文件超过 10 MB，请缩小文件后重试。');
  const extension = file.name.split('.').pop()?.toLowerCase();
  const bytes = await file.arrayBuffer();
  if (extension === 'csv' || extension === 'tsv') {
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
    catch { text = new TextDecoder('gb18030').decode(bytes); }
    const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), { skipEmptyLines: false, dynamicTyping: false, delimiter: extension === 'tsv' ? '\t' : '' });
    const errors = parsed.errors.filter(error => error.code !== 'UndetectableDelimiter');
    if (errors.length) throw new Error(`CSV 格式有误：${errors[0].message}。请检查引号与分隔符。`);
    return { name: file.name, size: file.size, sheets: [matrixToSheet(parsed.data, '数据表')] };
  }
  if (extension !== 'xlsx' && extension !== 'xls') throw new Error('请选择 .csv、.tsv、.xlsx 或 .xls 文件。');
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(bytes, { type: 'array', cellDates: false, sheetRows: MAX_ROWS + 2 });
  const sheets: Sheet[] = [];
  for (const name of workbook.SheetNames) {
    const worksheet = workbook.Sheets[name];
    if (!worksheet['!ref']) continue;
    const range = XLSX.utils.decode_range(worksheet['!fullref'] ?? worksheet['!ref']);
    if (range.e.r > MAX_ROWS) throw new Error(`工作表「${name}」超过 50,000 行，请拆分后重试。`);
    const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false, defval: '', blankrows: true, range: 0 });
    if (!matrix.length) continue;
    sheets.push(matrixToSheet(matrix, name));
  }
  if (!sheets.length) throw new Error('工作簿没有可读取的工作表。');
  if (sheets.reduce((total, sheet) => total + sheet.rows.length, 0) > MAX_ROWS) throw new Error('工作簿总数据量超过 50,000 行，请保留需要比较的工作表后重试。');
  return { name: file.name, size: file.size, sheets };
}

export function sampleFiles(): [SourceFile, SourceFile] {
  const headers = ['SKU', '商品名称', '分类', '价格', '库存'];
  const old = [
    ['001', '日常随行杯 · 云白', '生活用品', '129.00', '240'],
    ['002', '轻量双肩包 · 雾蓝', '出行装备', '299.00', '86'],
    ['003', '桌面收纳盘 · 岩灰', '桌面好物', '69.00', '120'],
    ['004', '织物笔记本 · 松绿', '文具纸品', '49.00', '360'],
    ['005', '便携折叠伞 · 墨黑', '出行装备', '159.00', '64'],
    ['006', '手冲咖啡壶 · 砂白', '生活用品', '239.00', '42'],
    ['007', '磨砂中性笔 · 浅灰', '文具纸品', '12.00', '800'],
    ['008', '无线充电座 · 银色', '桌面好物', '199.00', '95'],
  ];
  const updated = old.filter(row => row[0] !== '005').map(row => [...row]).reverse();
  updated.find(row => row[0] === '001')![3] = '119.00';
  updated.find(row => row[0] === '002')![4] = '72';
  updated.push(['009', '旅行收纳袋 · 雾蓝', '出行装备', '89.00', '150']);
  return [old, updated].map((rows, i) => ({ name: `商品清单_${i ? '本周' : '上周'}.csv`, size: 1200, sheets: [matrixToSheet([headers, ...rows], '商品清单')], sample: true })) as [SourceFile, SourceFile];
}
