import {
  createImportSession,
  type ImportSession,
} from "sheetdelta-core/session";
import type { ImportField } from "sheetdelta-core/import";

export const targets = [
  { key: "sku", label: "SKU", rule: { required: true, unique: true } },
  { key: "qty", label: "Quantity", clean: { type: "number" as const }, rule: { required: true, min: 0 } },
  {
    key: "active",
    label: "Active",
    clean: { dictionary: { entries: [{ from: "Yes", to: true }, { from: "No", to: false }] } },
  },
] as const;

export function supplierFields(mapping: Record<string, string>): ImportField[] {
  return targets.map((target) => ({
    key: target.key,
    source: mapping[target.key],
    requiredColumn: true,
    ...(target.key === "qty" ? { clean: target.clean, rule: target.rule } : {}),
    ...(target.key === "sku" ? { rule: target.rule } : {}),
    ...(target.key === "active" ? { clean: target.clean } : {}),
  }));
}

export function openSupplierSession(
  file: File,
  format: "csv" | "excel",
  headerRow: number,
  signal: AbortSignal,
  progress: (phase: string) => void,
): Promise<ImportSession> {
  return createImportSession(
    () => new Worker(new URL("./import.worker.ts", import.meta.url), { type: "module" }),
    file,
    {
      format,
      headerRow,
      fileName: file.name,
      previewRows: 8,
      signal,
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

export const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
