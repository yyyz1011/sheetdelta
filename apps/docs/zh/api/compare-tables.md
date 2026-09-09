# compareTables

按键匹配记录，同步返回结构化比较结果。

## 函数签名

```ts
compareTables(
  left: readonly Row[],
  right: readonly Row[],
  options: CompareInputOptions,
): DiffResult
```

```ts
type Cell = string | number | boolean | null | undefined;
type Row = Record<string, Cell>;

type CompareInputOptions = {
  keys: (string | { left: string; right: string })[];
  columns?: (string | { left: string; right: string; numericTolerance?: number; trim?: boolean; ignoreCase?: boolean })[];
  ignoreColumns?: string[];
  valueMode?: "text" | "strict";
  emptyValues?: "equal" | "distinct";
  trim?: boolean;
  ignoreCase?: boolean;
};
```

## 配置选项

| 选项 | 必填 | 默认值 | 用途 |
| --- | --- | --- | --- |
| `keys` | 是 | — | 一个或多个唯一键映射 |
| `columns` | 否 | 共同非主键列 | 列名或映射，显式空数组仍报错 |
| `trim` | 否 | `false` | 忽略首尾空白 |
| `ignoreCase` | 否 | `false` | 忽略文本大小写 |
| `columns[].numericTolerance` | 否 | 文本比较 | 允许的数值绝对差 |

## 返回值

`DiffResult` 包含 `rows`、`summary`、`schema` 和克隆后展开的 `options`。`schema` 包含新增、删除和共同列名。

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

## 简写与新增规则

```ts
import { compareTables } from "sheetdelta-core/compare";
const result = compareTables([{ id: 1, value: 10 }], [{ id: 1, value: "10" }], {
  keys: ["id"], ignoreColumns: ["updatedAt"], valueMode: "strict", emptyValues: "distinct",
});
```

`columns` 可省略，自动选共同非主键列；显式空数组仍报错。`ignoreColumns` 忽略任一侧同名字段，不取消主键校验。严格模式区分类型，空值模式区分 null、undefined、空字符串。字段级 `trim` 与 `ignoreCase` 只影响值。结果 `schema` 含新增、删除、共同列，不单独改变行状态；结构从记录推断，空数组不携带列定义。旧 `CompareOptions` 继续要求显式映射，简写用 `CompareInputOptions`。

## 大任务与精简结果

`includeUnchanged` 默认 `true`。设为 `false` 时仅保留变化行，但汇总仍包含所有行。使用 `compareTablesAsync` 可获取进度和取消支持，参见[异步比较](../async)。比较仅接受 `Cell` 基础类型，非有限数字和对象值会被拒绝。
