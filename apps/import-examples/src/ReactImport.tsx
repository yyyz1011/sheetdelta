import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ImportSession,
  ImportSessionState,
} from "sheetdelta-core/session";
import type { ImportCellEdit } from "sheetdelta-core/import";
import {
  downloadReport,
  errorText,
  openSupplierSession,
  supplierFields,
  targets,
} from "./shared";

const initialMapping = (headers: string[]) =>
  Object.fromEntries(
    targets.map(({ key }) => [
      key,
      headers.find((header) => header.toLowerCase() === key) ?? headers[0] ?? "",
    ]),
  );

export function ReactImport() {
  const [file, setFile] = useState<File>();
  const [format, setFormat] = useState<"csv" | "excel">("csv");
  const [headerRow, setHeaderRow] = useState(1);
  const [session, setSession] = useState<ImportSession>();
  const [sheet, setSheet] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [state, setState] = useState<ImportSessionState>();
  const [phase, setPhase] = useState("Choose a file");
  const [busy, setBusy] = useState(false);
  const [edits, setEdits] = useState<ImportCellEdit[]>([]);
  const [editRow, setEditRow] = useState(1);
  const [editColumn, setEditColumn] = useState("");
  const [editValue, setEditValue] = useState("");
  const [collected, setCollected] = useState<number>();
  const controller = useRef<AbortController | null>(null);
  const sheetRef = useRef("");
  const report = useRef<Uint8Array | undefined>(undefined);
  const replacement = useRef<HTMLInputElement>(null);
  const selected = session?.inspection.sheets.find((item) => item.name === sheet);
  const headers = selected?.headers ?? [];
  const stage = state ? (state.valid ? 4 : 3) : session ? 2 : file ? 1 : 0;
  const progress = useMemo(
    () => ["File", "Map", "Validate", "Deliver"],
    [],
  );

  useEffect(
    () => () => {
      controller.current?.abort();
      session?.close();
    },
    [session],
  );

  const run = async <T,>(job: (signal: AbortSignal) => Promise<T>) => {
    const task = new AbortController();
    controller.current = task;
    setBusy(true);
    try {
      return await job(task.signal);
    } catch (error) {
      setPhase(errorText(error));
    } finally {
      if (controller.current === task) {
        controller.current = null;
        setBusy(false);
      }
    }
  };

  async function open() {
    if (!file) return;
    session?.close();
    setSession(undefined);
    setState(undefined);
    setEdits([]);
    setCollected(undefined);
    report.current = undefined;
    const opened = await run((signal) =>
      openSupplierSession(file, format, headerRow, signal, setPhase),
    );
    if (!opened) return;
    const first = opened.inspection.sheets[0];
    setSession(opened);
    setSheet(first.name);
    sheetRef.current = first.name;
    setMapping(initialMapping(first.headers));
    setEditColumn(first.headers[0] ?? "");
    setPhase(`${opened.inspection.sheets.length} sheet · ${first.rowCount} rows inspected`);
  }

  function chooseSheet(name: string) {
    setSheet(name);
    sheetRef.current = name;
    const next = session!.inspection.sheets.find((item) => item.name === name)!;
    setMapping(initialMapping(next.headers));
    setEditColumn(next.headers[0] ?? "");
    setState(undefined);
    setEdits([]);
    setCollected(undefined);
    report.current = undefined;
    setPhase(`${next.rowCount} rows ready to map`);
  }

  async function validate() {
    if (!session || !sheet || Object.values(mapping).some((value) => !value)) return;
    const next = await run((signal) =>
      session.prepare(sheetRef.current, { fields: supplierFields(mapping) }, {
        signal,
        mode: "valid-rows",
        onProgress: (event) => setPhase(event.phase),
      }),
    );
    if (!next) return;
    setState(next);
    setEdits([]);
    setCollected(undefined);
    report.current = undefined;
    setPhase(`${next.summary.accepted} accepted / ${next.summary.total} rows`);
  }

  function queueEdit() {
    if (!editColumn || editRow < 1) return;
    setEdits((current) => [
      ...current.filter((edit) => edit.row !== editRow || edit.column !== editColumn),
      { row: editRow, column: editColumn, value: editValue },
    ]);
    setEditValue("");
  }

  async function applyEdits() {
    if (!session || !edits.length) return;
    const next = await run((signal) =>
      session.repair(edits, {
        signal,
        mode: "valid-rows",
        onProgress: (event) => setPhase(event.phase),
      }),
    );
    if (!next) return;
    setState(next);
    setEdits([]);
    setCollected(undefined);
    report.current = undefined;
    setPhase(`${next.summary.accepted} accepted / ${next.summary.total} rows`);
  }

  async function download() {
    if (!session) return;
    const bytes = report.current ?? (await run((signal) => session.report({ signal, onProgress: (event) => setPhase(event.phase) })));
    if (!bytes) return;
    report.current = bytes;
    downloadReport(bytes);
    setPhase(`${state?.summary.accepted ?? 0} accepted / ${state?.summary.total ?? 0} rows`);
  }

  async function collect() {
    if (!session) return;
    const result = await run((signal) => session.result({ signal }));
    if (!result) return;
    setCollected(result.rows.length);
    setPhase(`${result.rows.length} rows collected for submission`);
  }

  return (
    <>
      <div className="panel-heading">
        <p className="eyebrow">REACT / PERSISTENT WORKER</p>
        <h2>Supplier intake</h2>
      </div>
      <ol className="pipeline" aria-label="Import stages">
        {progress.map((label, index) => (
          <li key={label} className={index < stage ? "done" : index === stage ? "current" : ""}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div className="input-grid">
        <label>File<input type="file" accept=".csv,.xlsx,.xls" disabled={busy} onChange={(event) => {
          session?.close(); setSession(undefined); setState(undefined); setFile(event.target.files?.[0]); setPhase("Open the file to inspect it");
        }} /></label>
        <label>Format<select value={format} disabled={busy || Boolean(session)} onChange={(event) => setFormat(event.target.value as "csv" | "excel")}><option value="csv">CSV</option><option value="excel">Excel</option></select></label>
        <label>Header row<input type="number" min="1" value={headerRow} disabled={busy || Boolean(session)} onChange={(event) => setHeaderRow(Number(event.target.value))} /></label>
      </div>
      <div className="actions"><button disabled={!file || busy} onClick={open}>Open file</button><button className="secondary" disabled={!busy} onClick={() => controller.current?.abort()}>Cancel</button></div>
      <p role="status" aria-live="polite">{phase}</p>
      {session && selected && <>
        <div className="work-section">
          <div className="section-title"><span>02</span><div><h3>Map the source</h3><p>Choose a sheet and connect its headers to the fields your app expects.</p></div></div>
          {session.inspection.sheets.length > 1 && <label>Worksheet<select aria-label="Worksheet" value={sheet} onChange={(event) => chooseSheet(event.target.value)}>{session.inspection.sheets.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>}
          <div className="mapping-grid">{targets.map((target) => <label key={target.key}><span>{target.label}</span><select aria-label={`${target.label} source`} value={mapping[target.key] ?? ""} onChange={(event) => setMapping({ ...mapping, [target.key]: event.target.value })}><option value="">Select a header</option>{headers.map((header) => <option key={header}>{header}</option>)}</select></label>)}</div>
          <div className="table-wrap"><table><thead><tr><th>#</th>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{selected.preview.map((row, index) => <tr key={index}><td>{selected.rowNumbers[index]}</td>{headers.map((header) => <td key={header}>{String(row[header] ?? "")}</td>)}</tr>)}</tbody></table></div>
          <button disabled={busy || Object.values(mapping).some((value) => !value)} onClick={validate}>Validate mapping</button>
        </div>
      </>}
      {state && <div className="work-section">
        <div className="section-title"><span>03</span><div><h3>Repair in batches</h3><p>{state.summary.errors} errors · {state.summary.warnings} warnings · {state.changeCount} cleaned values</p></div></div>
        <div className="metrics"><b>{state.summary.total}<small>rows</small></b><b>{state.summary.accepted}<small>accepted</small></b><b className={state.summary.errors ? "danger" : "safe"}>{state.summary.errors}<small>errors</small></b></div>
        {state.issues.length > 0 && <ul className="issues">{state.issues.slice(0, 20).map((issue, index) => <li key={index}><div><b>Row {issue.source?.sourceRow ?? "—"} · {issue.column ?? "row"}</b><span>{issue.message}</span></div>{issue.row && issue.source?.sourceColumn && <button className="secondary issue-edit" onClick={() => { setEditRow(issue.row!); setEditColumn(issue.source!.sourceColumn!); setEditValue(String(issue.sourceValue ?? "")); replacement.current?.focus(); }}>Queue fix</button>}</li>)}</ul>}
        <fieldset disabled={busy}><legend>Batch correction</legend><div className="repair-grid"><label>Data row<input aria-label="Data row" type="number" min="1" max={state.summary.total} value={editRow} onChange={(event) => setEditRow(Number(event.target.value))} /></label><label>Source column<select aria-label="Source column" value={editColumn} onChange={(event) => setEditColumn(event.target.value)}>{headers.map((header) => <option key={header}>{header}</option>)}</select></label><label>Replacement value<input aria-label="Replacement value" ref={replacement} value={editValue} onChange={(event) => setEditValue(event.target.value)} /></label></div><div className="actions"><button className="secondary" onClick={queueEdit}>Add to batch</button><button disabled={!edits.length} onClick={applyEdits}>Apply {edits.length || ""} changes</button></div>{edits.length > 0 && <p className="queue">Queued: {edits.map((edit) => `row ${edit.row} / ${edit.column}`).join(" · ")}</p>}</fieldset>
        <div className="delivery"><button className="secondary" disabled={busy} onClick={download}>Download repair workbook</button><button disabled={busy || !state.summary.accepted} onClick={collect}>Collect accepted rows</button>{collected !== undefined && <strong>{collected} rows ready</strong>}</div>
      </div>}
    </>
  );
}
