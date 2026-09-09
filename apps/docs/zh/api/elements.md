---
description: "底层兼容导出：按局部名称查找各命名空间中的后代元素。"
---

# elements

[API 参考](./all) / [底层辅助函数](./all#helpers)

底层兼容导出：按局部名称查找各命名空间中的后代元素。

::: info 底层兼容辅助函数
业务代码优先使用下方关联的高级功能接口。
:::

## 导入方式 {#import}

```js
import { elements } from 'sheetdelta-core/workbook';
```

## 函数签名 {#signature}

```ts
elements(doc: Document | Element, name: string): Element[]
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `doc` | 是 | `Document \| Element` |
| `name` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../workbooks).

## 返回值 {#returns}

```ts
Element[]
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { elements } from 'sheetdelta-core/workbook';
import { parseXml } from 'sheetdelta-core/workbook';
const nodes = elements(parseXml('<root><item id="1"/></root>'),'item');
console.log(nodes[0].getAttribute('id')); // 1
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../workbooks)
- [parseXml](./parse-xml)
- [relationshipPath](./relationship-path)
- [assertRecord](./assert-record)
- [fail](./fail)
- [wrapError](./wrap-error)
