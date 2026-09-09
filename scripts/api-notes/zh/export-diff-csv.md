# exportDiffCsv

将比较结果转换为包含变化前后字段的 CSV 报告。

## 函数调用与默认值

```ts
exportDiffCsv(result, {
  changesOnly: true,
  escapeFormulae: true,
});
```

返回带 UTF-8 BOM 的字符串，使用逗号分隔、双引号包裹字段、CRLF 换行，并转义字段内双引号。传入 `changesOnly: false` 可同时导出未变化记录。

## 报告列

表头以 `change_type`、`key`、`old_row`、`new_row` 开始。每个选中映射生成 `old:<列名>` 和 `new:<列名>` 字段。键使用 JSON 编码。行号按电子表格存在一行表头计算，因此第一条输入记录导出为第 2 行。

## 公式转义

默认在可能被电子表格视为公式的内容前添加单引号，包括以 `=`、`+`、`-`、`@`、制表符或回车开头的文本，也检查前导空白。因此负数也可能显示出单引号。仅在输出接收方可信时关闭转义。

公式转义不控制 Excel 自动推断数据类型。需要保留编号前导零时，请将编号列按文本导入。

## 浏览器下载

```ts
const url = URL.createObjectURL(
  new Blob([exportDiffCsv(result)], { type: 'text/csv;charset=utf-8' }),
);
const link = document.createElement('a');
link.href = url;
link.download = 'changes.csv';
document.body.appendChild(link);
link.click();
link.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

## Node.js 导出

```ts
import { writeFile } from 'node:fs/promises';
await writeFile('changes.csv', exportDiffCsv(result), 'utf8');
```
