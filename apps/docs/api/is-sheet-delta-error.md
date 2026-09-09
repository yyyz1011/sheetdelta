---
description: "Same-realm type guard for SheetDeltaError. Serialized Worker errors are plain objects and do not pass this guard."
---

# isSheetDeltaError

[API reference](./all) / [Errors](./all#errors)

Same-realm type guard for SheetDeltaError. Serialized Worker errors are plain objects and do not pass this guard.

## Import {#import}

```js
import { isSheetDeltaError } from 'sheetdelta-core/errors';
```

Also exported from：`sheetdelta-core`.

## Signature {#signature}

```ts
isSheetDeltaError(error: unknown): error is SheetDeltaError
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `error` | Yes | `unknown` |

Option meanings, defaults and limits： [Usage guide](../errors).

## Return value {#returns}

```ts
boolean
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { isSheetDeltaError } from 'sheetdelta-core/errors';
import { SheetDeltaError } from 'sheetdelta-core/errors';
console.log(isSheetDeltaError(new SheetDeltaError('INVALID_DATA','Bad data'))); // true
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../errors)
- [SheetDeltaError](./sheet-delta-error)
- [TableValidationError](./table-validation-error)
- [MergeConflictError](./merge-conflict-error)
