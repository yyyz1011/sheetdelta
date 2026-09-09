---
description: "Construct a stable error with code/context. toJSON() is suitable for Worker transport; inspect code after deserialization."
---

# SheetDeltaError

[API reference](./all) / [Errors](./all#errors)

Construct a stable error with code/context. toJSON() is suitable for Worker transport; inspect code after deserialization.

## Import {#import}

```js
import { SheetDeltaError } from 'sheetdelta-core/errors';
```

Also exported from：`sheetdelta-core`.

## Signature {#signature}

```ts
SheetDeltaError(code: ErrorCode, message: string, context?: ErrorContext | undefined, options?: ErrorOptions | undefined): SheetDeltaError
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `code` | Yes | `ErrorCode` |
| `message` | Yes | `string` |
| `context` | No | `ErrorContext \| undefined` |
| `options` | No | `ErrorOptions \| undefined` |

Option meanings, defaults and limits： [Usage guide](../errors).

Related types：[`ErrorCode`](./types#errorcode) · [`ErrorContext`](./types#errorcontext).

## Return value {#returns}

```ts
SheetDeltaError
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { SheetDeltaError } from 'sheetdelta-core/errors';
const error = new SheetDeltaError('INVALID_DATA','Missing value',{row:2,column:'qty'});
console.log(error.toJSON().code); // INVALID_DATA
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../errors)
- [isSheetDeltaError](./is-sheet-delta-error)
- [TableValidationError](./table-validation-error)
- [MergeConflictError](./merge-conflict-error)
