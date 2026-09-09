---
description: "底层兼容导出：解析 XML，拒绝 DTD/实体声明；不是通用 XML 安全沙箱。"
---

# parseXml

[API 参考](./all) / [底层辅助函数](./all#helpers)

底层兼容导出：解析 XML，拒绝 DTD/实体声明；不是通用 XML 安全沙箱。

::: info 底层兼容辅助函数
业务代码优先使用下方关联的高级功能接口。
:::

## 导入方式 {#import}

```js
import { parseXml } from 'sheetdelta-core/workbook';
```

## 函数签名 {#signature}

```ts
parseXml(xml: string): Document
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `xml` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../workbooks).

## 返回值 {#returns}

```ts
Document
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { parseXml } from 'sheetdelta-core/workbook';
const doc = parseXml('<root><item id="1"/></root>');
console.log(doc.documentElement.localName); // root
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../workbooks)
- [elements](./elements)
- [relationshipPath](./relationship-path)
- [assertRecord](./assert-record)
- [fail](./fail)
- [wrapError](./wrap-error)
