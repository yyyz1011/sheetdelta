import {
  runImportWorker,
  type WorkerImportResult,
} from "sheetdelta-core/worker";
import type { ImportTemplate } from "sheetdelta-core/import";
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
    fields: [
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
    ],
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
