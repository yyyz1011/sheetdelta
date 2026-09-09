# 保留工作簿并修改

`patchWorkbook` 在现有 OOXML 工作簿中修改指定单元格，保留无关的文件内容。`recalculateExcel` 为[支持的公式](./formulas)生成新缓存。

```ts
import { writeExcel, readExcel } from 'sheetdelta-core/excel';
import { patchWorkbook, recalculateExcel } from 'sheetdelta-core/workbook';
const template = await writeExcel([{ name: 'Orders', rows: [{ id: '001', qty: 2, total: 0 }] }]);
const changed = await patchWorkbook(template, [
  { sheet: 'Orders', cell: 'B2', value: 4 },
  { sheet: 'Orders', cell: 'C2', formula: '=B2*3' },
]);
const output = await recalculateExcel(changed);
console.log((await readExcel(output, { values: 'raw' }))[0].rows[0].total); // 12
```

## patchWorkbook(bytes, edits, options?)

异步接受 `ArrayBuffer` 或 `Uint8Array`，返回新的工作簿字节，不修改输入。每项修改指定准确的 `sheet`、A1 `cell`，以及 `value` 或 `formula` 二选一。值为有限基础类型，null/undefined 清空值并保留样式。以 `=` 开头的字符串仍为字面文本，只有放在 `formula` 中才是公式。可用 `cachedValue` 明确提供公式缓存。

保留已有单元格样式属性、行列格式、工作表设置和未修改 ZIP 条目。新单元格或行按 A1 位置插入，已有使用区域会扩大。新单元格不会推断样式；该 API 不负责移动行、复制样式，也不会因插入业务表行而改写公式引用。

未修改 ZIP 条目在解压后的**内容字节保持一致**。ZIP 压缩结果、时间戳、被修改工作表的 XML 序列化可能不同。测试覆盖图表、VBA 内容、批注、超链接、数据校验、冻结窗格、筛选、隐藏表和 Strict OOXML 命名空间。VBA 字节会保留，但不会执行或编辑。

## 修改后的公式缓存

`recalculateOnOpen` 默认 `true`：清除各工作表的现有公式缓存，并要求表格应用打开时完整自动重算，避免把旧缓存误认为新的计算结果。图表和透视表缓存会保留，可能需要在应用中刷新。

如需立即得到计算结果，在修改后调用 `recalculateExcel`。明确指定 `recalculateOnOpen: false` 会保留其他缓存，此时调用方负责保证缓存新鲜度。修改公式输入后，请勿依赖这个选项保留的旧值。

`recalculateExcel(bytes, options?)` 重算支持的公式并写入缓存。遇到不支持或出错的公式、已有 Excel 错误单元格、不支持的公式组，会整体失败，不返回部分更新文件。选项包含以下工作簿限制以及[公式计算选项](./formulas)。

## 限制与范围

| 选项 | 默认值 |
| --- | --- |
| `maxBytes` | 20 MiB 压缩输入 |
| `maxUncompressedBytes` | ZIP 条目声明的解压内容总量 200 MiB |
| `maxEntries` | 10,000 个 ZIP 条目 |

此操作在内存中保留工作簿；大规模新数据导出使用[流式 API](./streaming)。超出限制会报错而非截断，这些限制不等于进程内存的硬隔离。

- 支持 `.xlsx` 和 `.xlsm` OOXML 包，包括已测试的 Strict 命名空间。保存时保持原扩展名和工作簿内容类型。
- 不支持通过此 API 编辑二进制 `.xls`、加密文件和带数字签名的包。
- 合并区域仅允许修改左上角锚点；数组或溢出区域，以及共享公式、数据表公式的独立单元格修改会被拒绝。
- 未触及的公式组、任意工作簿对象及源样式会保留，但不会完整解释其语义。该 API 不承担通用表格排版编辑器的功能。

参见[兼容性证据](./compatibility)，其中包括修改后交由 LibreOffice 重新打开并重算的业务工作簿。
