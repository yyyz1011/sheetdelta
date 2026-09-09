---
description: "Low-level compatibility export: reject null, arrays and non-objects with INVALID_OPTIONS. Does not validate row contents."
---

# assertRecord

[API reference](./all) / [Low-level helpers](./all#helpers)

Low-level compatibility export: reject null, arrays and non-objects with INVALID_OPTIONS. Does not validate row contents.

::: info Low-level compatibility helper
Prefer the higher-level workflow linked below for application code.
:::

## Import {#import}

```js
import { assertRecord } from 'sheetdelta-core/errors';
```

## Signature {#signature}

```ts
assertRecord(value: unknown, label: string): void
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `value` | Yes | `unknown` |
| `label` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../errors).

## Return value {#returns}

```ts
void
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { assertRecord } from 'sheetdelta-core/errors';
assertRecord({keys:['id']},'options');
console.log('valid options');
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../errors)
- [parseXml](./parse-xml)
- [elements](./elements)
- [relationshipPath](./relationship-path)
- [fail](./fail)
- [wrapError](./wrap-error)
