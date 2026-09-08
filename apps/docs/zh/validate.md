# 数据校验

将数据导入应用前先检查。校验不会修改数据或隐式转换类型，返回所有发现的问题。

```ts
import { validateTable } from 'sheetdelta-core/validate';
const result = validateTable([{ sku: '001', price: -1 }], {
  sku: { type: 'string', required: true, unique: true },
  price: { type: 'number', min: 0 },
});
console.log(result.valid); // false
console.log(result.issues[0]); // code: 'min', row: 1, column: 'price', value: -1, message
```

## validateTable(rows, schema, options?)

schema 以列名为键、规则为值。`allowUnknown: false` 拒绝未声明的列；默认允许额外列。

| 规则 | 行为 |
| --- | --- |
| `required` | 拒绝 null、undefined、空字符串和纯空白字符串 |
| `type` | `'string'`、`'number'`、`'boolean'`、`'date'`；数字必须有限 |
| `unique` | 报告非空重复值的所有位置，包括第一次出现 |
| `min`、`max` | 数字范围，包含边界 |
| `minLength`、`maxLength` | 字符串 UTF-16 长度范围 |
| `enum` | 按精确相等比较允许的基本值 |
| `pattern` | 对字符串应用正则表达式源文本 |

范围、字符串规则应搭配 `type` 使用，以拒绝错误类型。非必填空值跳过其他规则。日期只接受有效的 `YYYY-MM-DD`，不接受歧义日期或时间戳；`isIsoDate(text)` 可单独调用。

结果包括 `valid`、`issues`、`validRows`、`invalidRows`。每个问题含 `code`、`row`、`column`、`value`、`message`；行号是从 1 开始的数据位置。唯一性检查区分数字 `1` 与字符串 `'1'`。无效 schema 或正则会抛出配置错误，正则规则应来自可信配置。

CSV 和 Excel 显示模式返回字符串。数字校验前可用 [cleanTable](./clean) 显式转换，或以原始模式读取 Excel。源文件行号通过 `table.rowNumbers[issue.row - 1]` 定位。
