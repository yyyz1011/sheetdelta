---
description: "Low-level compatibility export: always throw a SheetDeltaError with code, message and context."
---

# fail

[API reference](./all) / [Low-level helpers](./all#helpers)

Low-level compatibility export: always throw a SheetDeltaError with code, message and context.

::: info Low-level compatibility helper
Prefer the higher-level workflow linked below for application code.
:::

## Import {#import}

```js
import { fail } from 'sheetdelta-core/errors';
```

## Signature {#signature}

```ts
fail(code: ErrorCode, message: string, context?: ErrorContext | undefined): never
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `code` | Yes | `ErrorCode` |
| `message` | Yes | `string` |
| `context` | No | `ErrorContext \| undefined` |

Option meanings, defaults and limits： [Usage guide](../errors).

Related types：[`ErrorCode`](./types#errorcode) · [`ErrorContext`](./types#errorcontext).

## Return value {#returns}

```ts
never
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { fail } from 'sheetdelta-core/errors';
let code;
try { fail('INVALID_DATA','Missing ID',{column:'id'}); } catch(error) { code = error.code; }
console.log(code); // INVALID_DATA
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../errors)
- [parseXml](./parse-xml)
- [elements](./elements)
- [relationshipPath](./relationship-path)
- [assertRecord](./assert-record)
- [wrapError](./wrap-error)
