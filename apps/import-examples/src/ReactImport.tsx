import { useEffect, useRef, useState } from "react";
import type { WorkerImportResult } from "sheetdelta-core/worker";
import { importSupplier, downloadReport } from "./shared";
export function ReactImport() {
  const [file, setFile] = useState<File>(),
    [format, setFormat] = useState<"csv" | "excel">("csv"),
    [sheet, setSheet] = useState("Data");
  const [phase, setPhase] = useState("Choose a file"),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<WorkerImportResult>();
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      controller.current = null;
    },
    [],
  );
  async function start() {
    if (!file) return;
    controller.current?.abort();
    const task = new AbortController();
    controller.current = task;
    setBusy(true);
    setResult(undefined);
    try {
      const value = await importSupplier(
        file,
        format,
        sheet,
        task.signal,
        (p) => {
          if (controller.current === task) setPhase(p);
        },
      );
      if (controller.current === task) {
        setResult(value);
        setPhase(
          `${value.result.summary.accepted} accepted / ${value.result.summary.total} rows`,
        );
      }
    } catch (error) {
      if (controller.current === task)
        setPhase(error instanceof Error ? error.message : String(error));
    } finally {
      if (controller.current === task) {
        setBusy(false);
        controller.current = null;
      }
    }
  }
  return (
    <>
      <p className="eyebrow">01 / REACT</p>
      <h2>Supplier import</h2>
      <label>
        File
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          disabled={busy}
          onChange={(event) => {
            setFile(event.target.files?.[0]);
            setResult(undefined);
            setPhase("Choose Import to validate");
          }}
        />
      </label>
      <label>
        Format
        <select
          disabled={busy}
          value={format}
          onChange={(e) => setFormat(e.target.value as "csv" | "excel")}
        >
          <option value="csv">CSV</option>
          <option value="excel">Excel</option>
        </select>
      </label>
      {format === "excel" && (
        <label>
          Sheet
          <input
            disabled={busy}
            value={sheet}
            onChange={(e) => setSheet(e.target.value)}
          />
        </label>
      )}
      <div className="actions">
        <button disabled={!file || busy} onClick={start}>
          Import
        </button>
        <button
          className="secondary"
          disabled={!busy}
          onClick={() => controller.current?.abort()}
        >
          Cancel
        </button>
      </div>
      <p role="status" aria-live="polite">
        {phase}
      </p>
      {result && (
        <>
          <p>
            {result.result.summary.errors} errors ·{" "}
            {result.result.summary.warnings} warnings
          </p>
          <ul>
            {result.result.issues.slice(0, 20).map((issue, i) => (
              <li key={i}>
                Row {issue.source?.sourceRow ?? "—"} · {issue.column}:{" "}
                {issue.message}
              </li>
            ))}
          </ul>
          {result.report && (
            <button
              className="secondary"
              onClick={() => downloadReport(result.report!)}
            >
              Download repair workbook
            </button>
          )}
        </>
      )}
    </>
  );
}
