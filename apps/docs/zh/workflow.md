# 完整处理流程

读取 → 清洗 → 校验 → 比较 → 导出。下面的完整示例保留文本编号，显式转换价格，并在比较前检查两张表。

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

Excel 输入可将 `readCsv` 换为 `await readExcel(bytes)` 并选择目标表。Node 使用 `writeFile` 保存报告字节，浏览器使用 Blob 下载。

数字转换和比较使用 IEEE 754；需要精确小数时，将金额统一为规范文本后比较。数据、文件名和报告不会发送到远程服务。
