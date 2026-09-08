# 清洗与去重

## cleanTable(rows, rules)

按列显式处理，并保留每次修改的记录。

```ts
import { cleanTable, deduplicateTable } from 'sheetdelta-core/clean';
const cleaned = cleanTable([{ id: '001', price: ' 12.50 ', active: 'false' }], {
  price: { trim: true, type: 'number' },
  active: { type: 'boolean' },
});
// cleaned.rows: [{ id: '001', price: 12.5, active: false }]
// cleaned.changes: [{ row, column, before, after }, ...]
// cleaned.issues: []
```

支持 `trim`、`case: 'lower' | 'upper'`、`emptyValue`、`type: 'string' | 'number' | 'boolean'`。顺序为去空格 → 大小写 → 空值替换 → 类型转换。仅处理已配置且实际存在的自有字段；未配置的编号仍是文本。未设置替换时，空值不会变成零。

数字转换接受有限的普通数字文本，不接受货币符号或千分位；拒绝不安全整数。小数使用 JavaScript IEEE 754，并非精确十进制运算。布尔转换只接受布尔值或精确的 `'true'`、`'false'` 字符串。

返回 `{ rows, changes, issues }`，不修改输入。某字段转换失败时，该字段完全保留原值，并返回 `{ row, column, value, code: 'conversion' }`；其他字段的成功修改仍保留。是否继续由调用方决定。

## deduplicateTable(rows, options)

```ts
const result = deduplicateTable([{ id: 'a', n: 1 }, { id: 'a', n: 2 }], {
  keys: ['id'], keep: 'last',
});
// rows: [{ id: 'a', n: 2 }], removedRows: [1], duplicateGroups: [[1, 2]]
```

`keys` 是非空列名列表，支持联合主键。`keep` 默认 `'first'`，可显式选择 `'last'`。结果按保留记录的原始位置排序。缺失或空主键会报错。主键区分类型，数字 `1` 与字符串 `'1'` 不同；需要统一时先显式清洗。

所有变更、问题、删除位置和重复组的行号均从 1 开始。只有显式调用此函数才会去重；比较不会偷偷删除重复记录。
