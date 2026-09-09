# One package, focused imports

Install once, then import the functionality your application needs.

```sh
npm install sheetdelta-core
```

| Entry | Exports | Runtime dependencies loaded |
| --- | --- | --- |
| `sheetdelta-core` | `compareTables`, `compareTablesAsync`, `exportDiffCsv`, `SheetDeltaError`, `isSheetDeltaError`, `TableValidationError`, types | None |
| `sheetdelta-core/compare` | `compareTables`, `compareTablesAsync`, `TableValidationError` | None |
| `sheetdelta-core/csv` | `readCsv`, `readCsvBytes`, `writeCsv`, `exportDiffCsv` | Papa Parse |
| `sheetdelta-core/excel` | `readExcel`, `writeExcel`, `exportDiffExcel` | SheetJS when called; fflate for reports |
| `sheetdelta-core/validate` | `validateTable`, `isIsoDate` | None |
| `sheetdelta-core/clean` | `cleanTable`, `deduplicateTable` | None |
| `sheetdelta-core/merge` | `mergeTables`, `appendTables`, `MergeConflictError` | None |
| `sheetdelta-core/errors` | `SheetDeltaError`, `isSheetDeltaError` | None |
| `sheetdelta-core/formula` | `calculateWorkbook` | None |
| `sheetdelta-core/workbook` | `patchWorkbook`, `recalculateExcel` | XML DOM + fflate; SheetJS for recalculation import |
| `sheetdelta-core/stream` | `readCsvStream`, `writeCsvStream`, `compareSortedStreams`, `compareStreamKeys` | None |
| `sheetdelta-core/excel-stream` | `writeExcelStream` | fflate |
| `sheetdelta-core/excel-node` | `readExcelStream` | yauzl + saxes + XML DOM; Node only |
| `sheetdelta-core/types` | Shared TypeScript types; `TableValidationError` | None |

```ts
import { compareTables } from 'sheetdelta-core/compare';
import type { CompareInputOptions, TableData } from 'sheetdelta-core/types';

const options: CompareInputOptions = { keys: ['id'] };
const result = compareTables([{ id: '001', price: 10 }], [{ id: '001', price: 12 }], options);
```

## Load Excel when needed

```ts
async function handleExcel(file: File) {
  const { readExcel } = await import('sheetdelta-core/excel');
  return readExcel(await file.arrayBuffer());
}
```

The npm installation includes the complete package and its dependencies. Selective imports control the application's dependency graph, not the npm download size. Production bundlers can split dynamic imports and remove unused exports. Node.js does not automatically tree-shake code. Importing `/compare` does not load the CSV parser or Excel engine.

The root entry stays lightweight and preserves previous imports. New features are deliberately accessed through subpaths. Internal file paths are not public APIs.
