import { SheetDeltaError, type ErrorCode } from "./errors.js";
import { readCsv, readCsvBytes, type CsvByteReadOptions } from "./csv.js";
import { readExcel, type ExcelReadOptions } from "./excel.js";
import {
  prepareImport,
  repairImport,
  type ImportCellEdit,
  type ImportIssue,
  type ImportLocation,
  type ImportMapping,
  type ImportOptions,
  type ImportProgress,
  type ImportResult,
  type ImportSchema,
} from "./import.js";
import type { Cell, Row, TableData } from "./types.js";

const protocol = "sheetdelta-session-v1";
const defaultPreviewRows = 20;
const maxPreviewRows = 100;

export interface ImportSessionProgress {
  phase: "read" | "parse" | "report" | ImportProgress["phase"];
  processed: number;
  total: number;
}

export interface ImportSessionOpenOptions {
  format: "csv" | "excel";
  headerRow?: number;
  csv?: Omit<CsvByteReadOptions, "headerRow" | "name">;
  excel?: Omit<ExcelReadOptions, "headerRow" | "sheets">;
  previewRows?: number;
  fileName?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: ImportSessionProgress) => void;
}

export interface ImportSessionCommandOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
  onProgress?: (progress: ImportSessionProgress) => void;
}

export interface ImportSessionSheet {
  name: string;
  headers: string[];
  rowCount: number;
  preview: Row[];
  rowNumbers: number[];
}

export interface ImportSessionInspection {
  format: "csv" | "excel";
  sheets: ImportSessionSheet[];
}

export interface ImportSessionPreview {
  sheet: string;
  offset: number;
  total: number;
  headers: string[];
  rows: Row[];
  rowNumbers: number[];
}

export interface ImportSessionIssue extends ImportIssue {
  /** Current value at the issue's source location, when one exists. */
  sourceValue?: Cell;
}

export interface ImportSessionRowPreview {
  row: number;
  source: ImportLocation;
  original: Row;
  processed: Row;
  valid: boolean;
}

/** Compact validation state. Full source/result rows stay in the worker until result() is called. */
export interface ImportSessionState {
  status: ImportResult["status"];
  valid: boolean;
  summary: ImportResult["summary"];
  mappings: ImportMapping[];
  issues: ImportSessionIssue[];
  changeCount: number;
  preview: ImportSessionRowPreview[];
}

type PortableSchema = Omit<ImportSchema, "rowRules" | "tableRules" | "batchRules">;
type PortableOptions = Omit<ImportOptions, "signal" | "onProgress">;

export interface ImportSession {
  readonly inspection: ImportSessionInspection;
  readonly closed: boolean;
  preview(
    sheet: string,
    options?: { offset?: number; limit?: number } & ImportSessionCommandOptions,
  ): Promise<ImportSessionPreview>;
  prepare(
    sheet: string,
    schema: PortableSchema,
    options?: PortableOptions & ImportSessionCommandOptions,
  ): Promise<ImportSessionState>;
  repair(
    edits: readonly ImportCellEdit[],
    options?: PortableOptions & ImportSessionCommandOptions,
  ): Promise<ImportSessionState>;
  result(options?: ImportSessionCommandOptions): Promise<ImportResult>;
  report(options?: ImportSessionCommandOptions): Promise<Uint8Array>;
  close(): void;
}

interface SessionWorkerScope {
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  postMessage(message: unknown, transfer?: Transferable[]): void;
}

function timeoutValue(value: number | undefined) {
  const timeout = value ?? 120000;
  if (!Number.isSafeInteger(timeout) || timeout < 1 || timeout > 2147483647)
    throw new SheetDeltaError("INVALID_OPTIONS", "Invalid session timeout.");
  return timeout;
}

function previewLimit(value: number | undefined) {
  const limit = value ?? defaultPreviewRows;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxPreviewRows)
    throw new SheetDeltaError(
      "INVALID_OPTIONS",
      `previewRows must be between 1 and ${maxPreviewRows}.`,
    );
  return limit;
}

function sessionError(error: unknown) {
  return error instanceof SheetDeltaError
    ? error.toJSON()
    : {
        code: "WORKER_FAILED",
        message: error instanceof Error ? error.message : String(error),
        context: {},
      };
}

function compactState(result: ImportResult, limit: number): ImportSessionState {
  const invalid = new Set(result.invalidRows);
  return {
    status: result.status,
    valid: result.valid,
    summary: { ...result.summary },
    mappings: result.mappings.map((mapping) => ({
      ...mapping,
      candidates: [...mapping.candidates],
    })),
    issues: result.issues.map((issue) => {
      const sourceColumn = issue.source?.sourceColumn;
      const value =
        issue.row && sourceColumn
          ? result.original.rows[issue.row - 1]?.[sourceColumn]
          : undefined;
      return { ...issue, ...(value === undefined ? {} : { sourceValue: value }) };
    }),
    changeCount: result.changes.length,
    preview: result.processedRows.slice(0, limit).map((processed, index) => ({
      row: index + 1,
      source: { ...result.rowSources[index] },
      original: { ...result.original.rows[index] },
      processed: { ...processed },
      valid: !invalid.has(index + 1),
    })),
  };
}

/** Open one persistent worker. Cancel/timeout closes the entire session. */
export function createImportSession(
  createWorker: () => Worker,
  input: Blob | string | ArrayBuffer | Uint8Array,
  options: ImportSessionOpenOptions,
): Promise<ImportSession> {
  if (!options || typeof options !== "object" || Array.isArray(options))
    return Promise.reject(
      new SheetDeltaError("INVALID_OPTIONS", "Session options must be an object."),
    );
  if (!['csv', 'excel'].includes(options.format))
    return Promise.reject(new SheetDeltaError("INVALID_OPTIONS", "Invalid session format."));
  if (options.signal?.aborted)
    return Promise.reject(new SheetDeltaError("ABORTED", "Import session cancelled."));
  let limit: number;
  let timeout: number;
  try {
    limit = previewLimit(options.previewRows);
    timeout = timeoutValue(options.timeoutMs);
  } catch (error) {
    return Promise.reject(error);
  }
  return new Promise((resolve, reject) => {
    let worker: Worker | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const cleanup = () => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", cancel);
    };
    const fail = (error: unknown) => {
      if (finished) return;
      finished = true;
      cleanup();
      try { worker?.terminate(); } catch { /* Cleanup must not mask the failure. */ }
      reject(error);
    };
    const emit = (value: ImportSessionProgress) => {
      if (finished) return;
      try {
        options.onProgress?.(value);
      } catch (error) {
        fail(error ?? new SheetDeltaError("WORKER_FAILED", "Progress callback failed."));
      }
    };
    const cancel = () => fail(new SheetDeltaError("ABORTED", "Import session cancelled."));
    const failed = () => fail(new SheetDeltaError("WORKER_FAILED", "Session worker could not load or communicate."));
    const opened = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.protocol !== protocol) return;
      if (data.type === "progress") emit(data.progress);
      else if (data.type === "error")
        fail(new SheetDeltaError(data.error.code as ErrorCode, data.error.message, data.error.context));
      else if (data.type === "opened") {
        if (finished) return;
        finished = true;
        cleanup();
        worker!.removeEventListener("message", opened);
        worker!.removeEventListener("error", failed);
        worker!.removeEventListener("messageerror", failed);
        resolve(createClient(worker!, data.inspection));
      }
    };
    try {
      const { signal, timeoutMs, onProgress, previewRows, ...runtime } = options;
      const saved = structuredClone({ ...runtime, previewRows: limit });
      worker = createWorker();
      worker.addEventListener("message", opened);
      worker.addEventListener("error", failed);
      worker.addEventListener("messageerror", failed);
      signal?.addEventListener("abort", cancel, { once: true });
      if (signal?.aborted) return cancel();
      timer = setTimeout(
        () => fail(new SheetDeltaError("WORKER_TIMEOUT", "Import session deadline exceeded.")),
        timeout,
      );
      emit({ phase: "read", processed: 0, total: 1 });
      if (finished) return;
      const bytes =
        typeof Blob !== "undefined" && input instanceof Blob
          ? input.arrayBuffer()
          : typeof input === "string"
            ? Promise.resolve(input)
            : input instanceof ArrayBuffer
              ? Promise.resolve(input.slice(0))
              : input instanceof Uint8Array
                ? Promise.resolve(new Uint8Array(input).buffer)
                : Promise.reject(new SheetDeltaError("INVALID_DATA", "Expected file bytes or CSV text."));
      bytes.then(
        (value) => {
          if (finished) return;
          emit({ phase: "read", processed: 1, total: 1 });
          if (finished) return;
          try {
            worker!.postMessage(
              { protocol, type: "open", input: value, options: saved },
              value instanceof ArrayBuffer ? [value] : [],
            );
          } catch (error) {
            fail(new SheetDeltaError("WORKER_FAILED", "Cannot send file to session worker.", {}, { cause: error }));
          }
        },
        fail,
      );
    } catch (error) {
      fail(error);
    }
  });
}

function createClient(worker: Worker, inspection: ImportSessionInspection): ImportSession {
  let closed = false;
  let sequence = 0;
  let pending = false;
  const close = () => {
    if (closed) return;
    closed = true;
    try { worker.terminate(); } catch { /* Closing stays idempotent for malformed worker wrappers. */ }
  };
  const command = <T>(
    kind: string,
    value: Record<string, unknown>,
    options: ImportSessionCommandOptions = {},
  ) => {
    if (closed)
      return Promise.reject(new SheetDeltaError("SESSION_CLOSED", "Import session is closed."));
    if (pending)
      return Promise.reject(new SheetDeltaError("SESSION_BUSY", "Import session is already running a command."));
    if (options.signal?.aborted) {
      close();
      return Promise.reject(new SheetDeltaError("ABORTED", "Import session cancelled."));
    }
    let timeout: number;
    try {
      timeout = timeoutValue(options.timeoutMs);
    } catch (error) {
      return Promise.reject(error);
    }
    pending = true;
    const id = ++sequence;
    return new Promise<T>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>;
      const cleanup = () => {
        clearTimeout(timer);
        options.signal?.removeEventListener("abort", cancel);
        worker.removeEventListener("message", message);
        worker.removeEventListener("error", failed);
        worker.removeEventListener("messageerror", failed);
        pending = false;
      };
      const terminal = (error: unknown) => {
        cleanup();
        close();
        reject(error);
      };
      const cancel = () => terminal(new SheetDeltaError("ABORTED", "Import session cancelled."));
      const failed = () => terminal(new SheetDeltaError("WORKER_FAILED", "Session worker could not communicate."));
      const message = (event: MessageEvent) => {
        const data = event.data;
        if (!data || data.protocol !== protocol || data.id !== id) return;
        if (data.type === "progress") {
          try {
            options.onProgress?.(data.progress);
          } catch (error) {
            terminal(error ?? new SheetDeltaError("WORKER_FAILED", "Progress callback failed."));
          }
        }
        else if (data.type === "error") {
          cleanup();
          reject(new SheetDeltaError(data.error.code as ErrorCode, data.error.message, data.error.context));
        } else if (data.type === "result") {
          cleanup();
          resolve(data.value);
        }
      };
      worker.addEventListener("message", message);
      worker.addEventListener("error", failed);
      worker.addEventListener("messageerror", failed);
      options.signal?.addEventListener("abort", cancel, { once: true });
      timer = setTimeout(
        () => terminal(new SheetDeltaError("WORKER_TIMEOUT", "Import session deadline exceeded.")),
        timeout,
      );
      try {
        worker.postMessage({ protocol, type: "command", id, kind, ...structuredClone(value) });
      } catch (error) {
        terminal(new SheetDeltaError(
          "WORKER_FAILED",
          `Cannot send session command${error instanceof Error ? `: ${error.message}` : "."}`,
          {},
          { cause: error },
        ));
      }
    });
  };
  return {
    inspection,
    get closed() {
      return closed;
    },
    preview: (sheet, options = {}) => {
      const { offset = 0, limit = defaultPreviewRows, ...task } = options;
      return command("preview", { sheet, offset, limit }, task);
    },
    prepare: (sheet, schema, options = {}) => {
      const { signal, timeoutMs, onProgress, ...runtime } = options;
      return command("prepare", { sheet, schema, runtime }, { signal, timeoutMs, onProgress });
    },
    repair: (edits, options = {}) => {
      const { signal, timeoutMs, onProgress, ...runtime } = options;
      return command("repair", { edits, runtime }, { signal, timeoutMs, onProgress });
    },
    result: (options) => command("result", {}, options),
    report: (options) => command("report", {}, options),
    close,
  };
}

/** Install the persistent-session protocol in an application-owned module worker. */
export function installImportSessionWorker(
  scope: SessionWorkerScope,
  rules: Pick<ImportSchema, "rowRules" | "tableRules" | "batchRules"> = {},
): () => void {
  const retainedScope = scope as SessionWorkerScope & {
    __sheetdeltaSessionTables?: Map<string, TableData>;
  };
  let tables: TableData[] = [];
  let tableByName = new Map<string, TableData>();
  let current: ImportResult | undefined;
  let schema: ImportSchema | undefined;
  let runtime: PortableOptions = {};
  let statePreviewRows = defaultPreviewRows;
  let format: "csv" | "excel" = "csv";
  let fileName: string | undefined;
  const send = (type: string, data: Record<string, unknown>, transfer: Transferable[] = []) =>
    scope.postMessage({ protocol, type, ...data }, transfer);
  const progress = (id: number | undefined, value: ImportSessionProgress) =>
    send("progress", { ...(id === undefined ? {} : { id }), progress: value });
  const listener = async (event: MessageEvent) => {
    const message = event.data;
    if (!message || message.protocol !== protocol) return;
    if (message.type === "open") {
      try {
        const options = message.options as ImportSessionOpenOptions;
        statePreviewRows = previewLimit(options.previewRows);
        format = options.format;
        fileName = options.fileName;
        progress(undefined, { phase: "parse", processed: 0, total: 1 });
        if (format === "csv") {
          const csvOptions = { ...(options.csv ?? {}), headerRow: options.headerRow, name: "Data" };
          tables = [
            typeof message.input === "string"
              ? readCsv(message.input, csvOptions)
              : readCsvBytes(message.input, csvOptions),
          ];
        } else {
          if (typeof message.input === "string")
            throw new SheetDeltaError("INVALID_DATA", "Excel sessions require file bytes.");
          tables = await readExcel(message.input, {
            ...(options.excel ?? {}),
            headerRow: options.headerRow,
          });
        }
        tableByName = new Map(tables.map((table) => [table.name, table]));
        // Some WebKit workers release event-listener closure state after an async module import.
        // Retaining the map on the worker global keeps the session stable for later commands.
        retainedScope.__sheetdeltaSessionTables = tableByName;
        const inspection: ImportSessionInspection = {
          format,
          sheets: tables.map((table) => ({
            name: table.name,
            headers: [...table.headers],
            rowCount: table.rows.length,
            preview: table.rows.slice(0, statePreviewRows).map((row) => ({ ...row })),
            rowNumbers: table.rowNumbers.slice(0, statePreviewRows),
          })),
        };
        send("opened", { inspection });
      } catch (error) {
        send("error", { error: sessionError(error) });
      }
      return;
    }
    if (message.type !== "command" || !Number.isSafeInteger(message.id)) return;
    const id = message.id as number;
    try {
      if (message.kind === "preview") {
        const retainedTables = retainedScope.__sheetdeltaSessionTables ?? tableByName;
        const table = retainedTables.get(message.sheet);
        if (!table) throw new SheetDeltaError("SHEET_NOT_FOUND", `Worksheet not found: ${message.sheet}. Available: ${[...retainedTables.keys()].join(", ")}`);
        const offset = message.offset ?? 0;
        const limit = previewLimit(message.limit);
        if (!Number.isSafeInteger(offset) || offset < 0 || offset > table.rows.length)
          throw new SheetDeltaError("INVALID_OPTIONS", "Preview offset is outside the worksheet.");
        return send("result", {
          id,
          value: {
            sheet: table.name,
            offset,
            total: table.rows.length,
            headers: [...table.headers],
            rows: table.rows.slice(offset, offset + limit).map((row) => ({ ...row })),
            rowNumbers: table.rowNumbers.slice(offset, offset + limit),
          },
        });
      }
      if (message.kind === "prepare") {
        const retainedTables = retainedScope.__sheetdeltaSessionTables ?? tableByName;
        const table = retainedTables.get(message.sheet);
        if (!table) throw new SheetDeltaError("SHEET_NOT_FOUND", `Worksheet not found: ${message.sheet}. Available: ${[...retainedTables.keys()].join(", ")}`);
        const preparedSchema: ImportSchema = { ...message.schema, ...rules };
        schema = preparedSchema;
        runtime = message.runtime ?? {};
        current = await prepareImport(table, preparedSchema, {
          ...runtime,
          format,
          ...(fileName === undefined ? {} : { fileName }),
          onProgress: (value) => value.phase !== "complete" && progress(id, value),
        });
        return send("result", { id, value: compactState(current, statePreviewRows) });
      }
      if (!current || !schema)
        throw new SheetDeltaError("INVALID_OPTIONS", "Prepare a worksheet before this command.");
      if (message.kind === "repair") {
        runtime = { ...runtime, ...(message.runtime ?? {}) };
        const activeResult = current;
        const activeSchema = schema;
        current = await repairImport(activeResult, message.edits, activeSchema, {
          ...runtime,
          onProgress: (value) => value.phase !== "complete" && progress(id, value),
        });
        return send("result", { id, value: compactState(current, statePreviewRows) });
      }
      if (message.kind === "result") return send("result", { id, value: current });
      if (message.kind === "report") {
        progress(id, { phase: "report", processed: 0, total: 1 });
        const { exportImportReport } = await import("./import-report.js");
        const report = await exportImportReport(current);
        progress(id, { phase: "report", processed: 1, total: 1 });
        return send("result", { id, value: report }, [report.buffer as ArrayBuffer]);
      }
      throw new SheetDeltaError("INVALID_OPTIONS", "Unknown session command.");
    } catch (error) {
      send("error", { id, error: sessionError(error) });
    }
  };
  scope.addEventListener("message", listener);
  return () => {
    scope.removeEventListener("message", listener);
  };
}
