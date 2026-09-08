# 校验与错误处理

SheetDelta 在比较前检查两侧输入。数据不合法时抛出 `TableValidationError`，不返回部分比较结果。

## 处理数据问题

```ts
import { compareTables, TableValidationError } from 'sheetdelta-core';

try {
  compareTables(
    [{ id: '001', price: 10 }, { id: '001', price: 12 }],
    [{ id: '001', price: 11 }],
    { keys: [{ left: 'id', right: 'id' }],
      columns: [{ left: 'price', right: 'price' }] },
  );
} catch (error) {
  if (error instanceof TableValidationError) {
    console.log(error.issues);
    // [{ side: 'left', code: 'duplicate-key', rows: [1, 2], key: ['001'] }]
  } else {
    throw error;
  }
}
```

## 错误代码

| 代码 | 含义 | 处理方式 |
| --- | --- | --- |
| `missing-key` | 某个键字段为空 | 补全编号，或删除不完整记录 |
| `duplicate-key` | 某一侧存在标准化后相同的键 | 去重，或使用复合键 |
| `missing-column` | 缺少选中的键列或比较列 | 修正映射，或补全列 |

每个问题包含 `side`、`code` 和 `rows`，相关情况下还包含 `column` 或 `key`。行号是**从 1 开始的输入数据行号**，不包含表头。原文件只有一行表头且未过滤行时，加 1 可对应电子表格行号。

## 配置错误

映射列表为空、列名为空、重复映射或数值容差不合法时，会抛出普通 `Error`。请将配置错误与输入数据质量问题分别处理。
