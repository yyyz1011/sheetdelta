---
description: "Check built-in column rules without coercion. Returns valid/invalid data-row indices and all issues; maxIssues can fail explicitly."
---

# validateTable

[API reference](./all) / [Clean & validate](./all#clean)

Check built-in column rules without coercion. Returns valid/invalid data-row indices and all issues; maxIssues can fail explicitly.

## Import {#import}

```js
import { validateTable } from 'sheetdelta-core/validate';
```

## Signature {#signature}

```ts
validateTable(rows: readonly Row[], schema: TableSchema, options?: { allowUnknown?: boolean | undefined; maxIssues?: number | undefined; } | undefined): ValidationResult
```

## Parameters {#parameters}

| Parameter | Required | Type |
| --- | --- | --- |
| `rows` | Yes | `readonly Row[]` |
| `schema` | Yes | `TableSchema` |
| `options` | No | `{ allowUnknown?: boolean \| undefined; maxIssues?: number \| undefined; } \| undefined` |

Option meanings, defaults and limits： [Usage guide](../validate).

Related types：[`Row`](./types#row) · [`TableSchema`](./types#tableschema) · [`ValidationResult`](./types#validationresult).

## Return value {#returns}

```ts
ValidationResult
```

## Runnable example {#example}

Install with `npm install sheetdelta-core`, then save this example as an `.mjs` file and run it with Node.js 18+.

```js
import { validateTable } from 'sheetdelta-core/validate';
const result = validateTable([{price:-1}], {price:{type:'number',min:0}}, {maxIssues:100});
console.log(result.issues[0].code); // min
```

## Related APIs and guides {#related}

- [Usage, defaults and limits](../validate)
- [cleanTable](./clean-table)
- [deduplicateTable](./deduplicate-table)
- [isIsoDate](./is-iso-date)
