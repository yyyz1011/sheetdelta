# exportDiffCsv

Turn a comparison result into a CSV report with before/after columns.

## Signature and defaults

```ts
exportDiffCsv(result, {
  changesOnly: true,
  escapeFormulae: true,
});
```

Returns a string with a UTF-8 BOM, comma delimiters, quoted fields, and CRLF line endings. Embedded quotes are escaped. Pass `changesOnly: false` to include unchanged records.

## Report columns

The header starts with `change_type`, `key`, `old_row`, and `new_row`. Each selected mapping adds `old:<column>` and `new:<column>` fields. The key is JSON-encoded. Row positions assume a spreadsheet with one header row, so the first input record is exported as row 2.

## Formula escaping

By default, potential spreadsheet formula prefixes receive a leading apostrophe. This includes values starting with `=`, `+`, `-`, `@`, tab, or carriage return, including leading whitespace. Negative numbers can therefore appear with an apostrophe. Only disable escaping for trusted consumers.

Formula escaping does not control Excel's automatic type inference. Import identifier columns as text when leading zeros matter.

## Browser download

```ts
const url = URL.createObjectURL(
  new Blob([exportDiffCsv(result)], { type: 'text/csv;charset=utf-8' }),
);
const link = document.createElement('a');
link.href = url;
link.download = 'changes.csv';
document.body.appendChild(link);
link.click();
link.remove();
setTimeout(() => URL.revokeObjectURL(url), 1000);
```

## Node.js export

```ts
import { writeFile } from 'node:fs/promises';
await writeFile('changes.csv', exportDiffCsv(result), 'utf8');
```
