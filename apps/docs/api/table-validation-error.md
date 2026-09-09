---
description: "Comparison input error carrying duplicate/missing-key/column issues. Extends SheetDeltaError; supports toJSON()."
---

# TableValidationError

[API reference](./all) / [Errors](./all#errors)

Comparison input error carrying duplicate/missing-key/column issues. Extends SheetDeltaError; supports toJSON().

## Import {#import}

```js
import { TableValidationError } from 'sheetdelta-core/types';
```

Also exported from：`sheetdelta-core`, `sheetdelta-core/compare`.

## Signature {#signature}

```ts
TableValidationError(issues: DataIssue[]): TableValidationError
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `issues` | Yes | `DataIssue[]` |

Option meanings, defaults and limits： [Usage guide](../validation).

Related types：[`DataIssue`](./types#dataissue).

## Return value {#returns}

```ts
TableValidationError
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { TableValidationError } from 'sheetdelta-core/types';
const error = new TableValidationError([{side:'left',code:'missing-key',rows:[1],column:'id'}]);
console.log(error.toJSON().issues.length); // 1
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../validation)
- [SheetDeltaError](./sheet-delta-error)
- [isSheetDeltaError](./is-sheet-delta-error)
- [MergeConflictError](./merge-conflict-error)
