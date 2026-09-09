---
description: "Check a real calendar date in YYYY-MM-DD form; reject locale strings and impossible dates."
---

# isIsoDate

[API reference](./all) / [Clean & validate](./all#clean)

Check a real calendar date in YYYY-MM-DD form; reject locale strings and impossible dates.

## Import {#import}

```js
import { isIsoDate } from 'sheetdelta-core/validate';
```

## Signature {#signature}

```ts
isIsoDate(value: string): boolean
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `value` | Yes | `string` |

Option meanings, defaults and limits： [Usage guide](../validate).

## Return value {#returns}

```ts
boolean
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { isIsoDate } from 'sheetdelta-core/validate';
console.log(isIsoDate('2024-02-29')); // true
console.log(isIsoDate('2025-02-29')); // false
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../validate)
- [cleanTable](./clean-table)
- [deduplicateTable](./deduplicate-table)
- [validateTable](./validate-table)
