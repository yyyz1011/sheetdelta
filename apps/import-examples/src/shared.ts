import {
  runImportWorker,
  type WorkerImportResult,
} from "sheetdelta-core/worker";
import type { ImportTemplate } from "sheetdelta-core/import";
export const supplierFields: ImportTemplate["fields"] = [
  {
    key: "sku",
    requiredColumn: true,
    rule: { required: true, unique: true },
  },
  {
    key: "qty",
    requiredColumn: true,
    clean: { type: "number" },
    rule: { required: true, min: 0 },
  },
  {
    key: "active",
    requiredColumn: true,
    clean: {
      dictionary: {
        entries: [
          { from: "Yes", to: true },
          { from: "No", to: false },
        ],
      },
    },
  },
];
export function importSupplier(
  file: File,
  format: "csv" | "excel",
  sheet: string,
  signal: AbortSignal,
  progress: (phase: string) => void,
): Promise<WorkerImportResult> {
  const template: ImportTemplate = {
    version: 1,
    id: "supplier",
    revision: 1,
    format,
    ...(format === "excel" && sheet.trim() ? { sheet: sheet.trim() } : {}),
    fields: supplierFields,
  };
  return runImportWorker(
    () =>
      new Worker(new URL("./import.worker.ts", import.meta.url), {
        type: "module",
      }),
    file,
    template,
    {
      signal,
      mode: "valid-rows",
      report: true,
      fileName: file.name,
      onProgress: (event) => progress(event.phase),
    },
  );
}
export function downloadReport(bytes: Uint8Array) {
  const url = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "import-errors.xlsx";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function repairSupplier(
  previous: WorkerImportResult,
  row: number,
  column: string,
  value: string,
  signal: AbortSignal,
  progress: (phase: string) => void,
): Promise<WorkerImportResult> {
  const { repairImport } = await import("sheetdelta-core/import");
  const result = await repairImport(
    previous.result,
    [{ row, column, value }],
    { fields: supplierFields },
    { signal, mode: "valid-rows", onProgress: (e) => progress(e.phase) },
  );
  const { exportImportReport } = await import("sheetdelta-core/import-report");
  if (signal.aborted) throw new Error("Repair cancelled.");
  const report = await exportImportReport(result);
  if (signal.aborted) throw new Error("Repair cancelled.");
  return { result, report };
}
