---
description: "Join conflict error containing each key/column and both values. Extends SheetDeltaError."
---

# MergeConflictError

[API reference](./all) / [Errors](./all#errors)

Join conflict error containing each key/column and both values. Extends SheetDeltaError.

## Import {#import}

```js
import { MergeConflictError } from 'sheetdelta-core/merge';
```

## Signature {#signature}

```ts
MergeConflictError(conflicts: MergeConflict[]): MergeConflictError
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `conflicts` | Yes | `MergeConflict[]` |

Option meanings, defaults and limits： [Usage guide](../merge).

Related types：[`MergeConflict`](./types#mergeconflict).

## Return value {#returns}

```ts
MergeConflictError
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { MergeConflictError } from 'sheetdelta-core/merge';
const error = new MergeConflictError([{key:['1'],column:'qty',left:1,right:2}]);
console.log(error.toJSON().conflicts.length); // 1
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../merge)
- [SheetDeltaError](./sheet-delta-error)
- [isSheetDeltaError](./is-sheet-delta-error)
- [TableValidationError](./table-validation-error)
