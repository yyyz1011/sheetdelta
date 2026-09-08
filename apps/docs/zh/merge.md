# 合并与追加

## mergeTables(left, right, options)

按唯一键关联另一张表，为记录补充字段。

```ts
import { mergeTables, MergeConflictError, appendTables } from 'sheetdelta-core/merge';
const merged = mergeTables(
  [{ id: '001', name: 'Cup' }],
  [{ id: '001', stock: 20 }],
  { keys: ['id'], join: 'left' },
);
// merged.rows: [{ id: '001', name: 'Cup', stock: 20 }]
```

| 参数 | 默认值 | 行为 |
| --- | --- | --- |
| `keys` | 必填 | 一个或多个同名主键列 |
| `join` | `'full'` | `'left'` 左连接、`'inner'` 内连接、`'full'` 全连接 |
| `conflict` | `'error'` | 报错，或显式选择 `'left'` / `'right'` 一侧的值 |

拒绝缺失、空白和重复主键。主键使用带类型的元组，数字 `1` 和字符串 `'1'` 不同；与比较模块兼容旧版的文本主键规则不同，混合数据源时请先显式清洗。

同名非主键字段两侧都存在且值不精确相等时构成冲突；显式 null 是值，不等同于缺失字段。默认抛出含 `conflicts` 的 `MergeConflictError`。显式选择一侧时仍返回所有 `{ key, column, left, right }` 冲突记录。

返回 `{ rows, conflicts, summary }`。汇总含 `matched`、`leftOnly`、`rightOnly`、`total`；未匹配计数反映输入，即使连接模式不输出这些行。匹配和左侧独有行保持左表顺序，全连接再追加右侧独有行。不修改输入。不同名主键需先重命名，不支持多对多连接。

## appendTables(tables, options?)

纵向追加记录，返回 `{ rows, columns, sources }`。来源为 `{ table, row }`，表号和行号都从 1 开始。

```ts
const result = appendTables([[{ id: '001' }], [{ id: '002', note: 'New' }]], {
  schema: 'union',
});
// rows: [{ id: '001', note: null }, { id: '002', note: 'New' }]
```

默认 `'strict'` 要求每行拥有相同字段。`'union'` 对缺失字段补 null。列顺序按首次出现排列。追加保留重复记录，需要去重时另行调用 `deduplicateTable`。
