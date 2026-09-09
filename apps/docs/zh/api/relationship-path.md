---
description: "底层兼容导出：解析 OOXML 包内关系路径；不用于文件系统或 URL 路径。"
---

# relationshipPath

[API 参考](./all) / [底层辅助函数](./all#helpers)

底层兼容导出：解析 OOXML 包内关系路径；不用于文件系统或 URL 路径。

::: info 底层兼容辅助函数
业务代码优先使用下方关联的高级功能接口。
:::

## 导入方式 {#import}

```js
import { relationshipPath } from 'sheetdelta-core/workbook';
```

## 函数签名 {#signature}

```ts
relationshipPath(base: string, target: string): string
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `base` | 是 | `string` |
| `target` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../workbooks).

## 返回值 {#returns}

```ts
string
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { relationshipPath } from 'sheetdelta-core/workbook';
console.log(relationshipPath('xl/workbook.xml','worksheets/sheet1.xml')); // xl/worksheets/sheet1.xml
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../workbooks)
- [parseXml](./parse-xml)
- [elements](./elements)
- [assertRecord](./assert-record)
- [fail](./fail)
- [wrapError](./wrap-error)
