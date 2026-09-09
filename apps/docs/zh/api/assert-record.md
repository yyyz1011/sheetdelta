---
description: "底层兼容导出：拒绝 null、数组和非对象，抛出 INVALID_OPTIONS；不校验字段内容。"
---

# assertRecord

[API 参考](./all) / [底层辅助函数](./all#helpers)

底层兼容导出：拒绝 null、数组和非对象，抛出 INVALID_OPTIONS；不校验字段内容。

::: info 底层兼容辅助函数
业务代码优先使用下方关联的高级功能接口。
:::

## 导入方式 {#import}

```js
import { assertRecord } from 'sheetdelta-core/errors';
```

## 函数签名 {#signature}

```ts
assertRecord(value: unknown, label: string): void
```

## 参数 {#parameters}

| 参数 | 必填 | 类型 |
| --- | --- | --- |
| `value` | 是 | `unknown` |
| `label` | 是 | `string` |

选项含义、默认值与限制： [使用指南](../errors).

## 返回值 {#returns}

```ts
void
```

## 可运行案例 {#example}

先执行 `npm install sheetdelta-core`，将以下代码保存为 `.mjs` 文件，用 Node.js 18+ 运行。

```js
import { assertRecord } from 'sheetdelta-core/errors';
assertRecord({keys:['id']},'options');
console.log('valid options');
```

## 相关 API 与指南 {#related}

- [用法、默认值与限制](../errors)
- [parseXml](./parse-xml)
- [elements](./elements)
- [relationshipPath](./relationship-path)
- [fail](./fail)
- [wrapError](./wrap-error)
