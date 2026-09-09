---
description: "Low-level compatibility export: find descendant elements by local name across namespaces."
---

# elements

[API reference](./all) / [Low-level helpers](./all#helpers)

Low-level compatibility export: find descendant elements by local name across namespaces.

::: info Low-level compatibility helper
Prefer the higher-level workflow linked below for application code.
:::

## Import {#import}

```js
import { elements } from 'sheetdelta-core/workbook';
```

## Signature {#signature}

```ts
elements(doc: Document | Element, name: string): Element[]
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `doc` | Yes | `Document \| Element` |
| `name` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../workbooks).

## Return value {#returns}

```ts
Element[]
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { elements } from 'sheetdelta-core/workbook';
import { parseXml } from 'sheetdelta-core/workbook';
const nodes = elements(parseXml('<root><item id="1"/></root>'),'item');
console.log(nodes[0].getAttribute('id')); // 1
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../workbooks)
- [parseXml](./parse-xml)
- [relationshipPath](./relationship-path)
- [assertRecord](./assert-record)
- [fail](./fail)
- [wrapError](./wrap-error)
