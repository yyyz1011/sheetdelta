---
description: "Low-level compatibility export: parse XML with DTD/entity declarations rejected. Not a general-purpose XML security sandbox."
---

# parseXml

[API reference](./all) / [Low-level helpers](./all#helpers)

Low-level compatibility export: parse XML with DTD/entity declarations rejected. Not a general-purpose XML security sandbox.

::: info Low-level compatibility helper
Prefer the higher-level workflow linked below for application code.
:::

## Import {#import}

```js
import { parseXml } from 'sheetdelta-core/workbook';
```

## Signature {#signature}

```ts
parseXml(xml: string): Document
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `xml` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../workbooks).

## Return value {#returns}

```ts
Document
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { parseXml } from 'sheetdelta-core/workbook';
const doc = parseXml('<root><item id="1"/></root>');
console.log(doc.documentElement.localName); // root
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../workbooks)
- [elements](./elements)
- [relationshipPath](./relationship-path)
- [assertRecord](./assert-record)
- [fail](./fail)
- [wrapError](./wrap-error)
