---
description: "Low-level compatibility export: resolve an OOXML relationship target inside a package. Not a filesystem/URL resolver."
---

# relationshipPath

[API reference](./all) / [Low-level helpers](./all#helpers)

Low-level compatibility export: resolve an OOXML relationship target inside a package. Not a filesystem/URL resolver.

::: info Low-level compatibility helper
Prefer the higher-level workflow linked below for application code.
:::

## Import {#import}

```js
import { relationshipPath } from 'sheetdelta-core/workbook';
```

## Signature {#signature}

```ts
relationshipPath(base: string, target: string): string
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `base` | Yes | `string` |
| `target` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../workbooks).

## Return value {#returns}

```ts
string
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { relationshipPath } from 'sheetdelta-core/workbook';
console.log(relationshipPath('xl/workbook.xml','worksheets/sheet1.xml')); // xl/worksheets/sheet1.xml
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../workbooks)
- [parseXml](./parse-xml)
- [elements](./elements)
- [assertRecord](./assert-record)
- [fail](./fail)
- [wrapError](./wrap-error)
