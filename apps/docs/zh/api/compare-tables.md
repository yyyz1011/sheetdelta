# compareTables

按键匹配记录，同步返回结构化比较结果。

## 函数签名

```ts
compareTables(
  left: readonly Row[],
  right: readonly Row[],
  options: CompareOptions,
): DiffResult
```

```ts
type Cell = string | number | boolean | null | undefined;
type Row = Record<string, Cell>;

type CompareOptions = {
  keys: { left: string; right: string }[];
  columns: { left: string; right: string; numericTolerance?: number }[];
  trim?: boolean;
  ignoreCase?: boolean;
};
```

## 配置选项

| 选项 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `keys` | 是 | — | 一个或多个唯一键映射 |
| `columns` | 是 | — | 一个或多个比较字段映射 |
| `trim` | 否 | `false` | 忽略首尾空白 |
| `ignoreCase` | 否 | `false` | 忽略文本大小写 |
| `columns[].numericTolerance` | 否 | 文本比较 | 允许的数值绝对差 |

## 返回值

`DiffResult` 包含 `rows`、`summary` 和克隆后的 `options`。

| 行属性 | 含义 |
| --- | --- |
| `key` | 标准化后的字符串元组 |
| `status` | `added`、`removed`、`changed` 或 `unchanged` |
| `before`、`after` | 对应侧的原始记录引用（若存在） |
| `leftIndex`、`rightIndex` | 从 0 开始的输入位置（若存在） |
| `changes` | `{ leftColumn, rightColumn, before, after }` 数组 |

`summary` 包含四种状态的计数、`total`（结果总行数）、`before`（左侧输入数量）和 `after`（右侧输入数量）。

## 顺序和对象引用

匹配记录和删除记录按左侧输入顺序排列，新增记录随后按右侧输入顺序追加。仅改变行顺序不算修改。新增和删除记录的 `changes` 数组为空。

函数不会修改输入。返回的记录对象引用输入对象；若需要独立快照，请先克隆输入再比较。配置选项会被克隆。

## 错误处理

`TableValidationError.issues` 和配置错误详见 [校验与错误处理](../validation)。
