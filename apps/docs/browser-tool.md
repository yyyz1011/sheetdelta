# Browser tool

Compare files without writing code. The current tool interface is in Chinese; this guide explains the workflow in English.

<a class="doc-path" href="/playground/" target="_blank" rel="noopener"><strong>Open the table comparison tool ↗</strong><span>Your files are processed in your browser.</span></a>

## Compare two files

1. Choose the original file under **原始表格** and the updated file under **更新后的表格**. You can also start with **试用商品示例** (try sample data).
2. For Excel workbooks, choose the worksheet on each side.
3. Select an identifier column in each table. Use **比较字段** to map and choose comparison columns.
4. Click **开始比较** to compare. Filter added, removed, or changed records and inspect old/new values.
5. Choose **导出差异 CSV** to download a report.

## Save a repeatable rule

Choose **保存规则** to save the column mappings and comparison options. Use **我的规则** to apply a saved rule to another pair of files. Up to 20 rules are stored in this browser; the files themselves are not saved.

## Supported files and limits

| Item | Limit |
| --- | --- |
| File formats | CSV, TSV, XLSX, XLS |
| File size | 10 MB per file |
| Workbook data | 50,000 total rows |
| Columns | 100 per sheet |
| File encoding | UTF-8, with a GB18030 fallback for CSV/TSV |

The first nonempty record is treated as the header. Duplicate or empty column names are rejected. Completely empty rows are skipped. CSV records may span physical lines when quoted.

## Privacy and workbook behavior

Files are parsed and compared locally in a Web Worker. Files are not uploaded or persisted; saved rules contain names, mappings, and options only. No third-party advertising or remote analytics are currently configured.

Excel comparison uses displayed values, does not recalculate formulas, and ignores styling, comments, and merged-cell semantics. Recalculate and save workbooks in Excel first if needed. The current limits do not constitute comprehensive protection against malicious workbook decompression workloads.
