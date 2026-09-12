import { SheetDeltaError, type ErrorCode } from "./errors.js";
import type {
  ImportTemplate,
  ImportResult,
  ImportProgress,
  TemplateImportOptions,
  ImportSchema,
  ImportOptions,
  ImportCellEdit,
} from "./import.js";

export interface WorkerImportProgress {
  phase: "read" | "parse" | "report" | ImportProgress["phase"];
  processed: number;
  total: number;
}
export interface WorkerImportResult {
  result: ImportResult;
  report?: Uint8Array;
}
export interface WorkerImportOptions
  extends Omit<
    TemplateImportOptions,
    "signal" | "onProgress" | "rowRules" | "tableRules" | "batchRules"
  > {
  signal?: AbortSignal;
  onProgress?: (progress: WorkerImportProgress) => void;
  /** Whole task deadline, including Blob reading. Default: 120 seconds. */
  timeoutMs?: number;
  /** Include an editable original-data error report. Default: false. */
  report?: boolean;
}
/** One isolated worker per task. Cancel/timeout terminates it, including synchronous XLSX parsing. */
export function runImportWorker(
  createWorker: () => Worker,
  input: Blob | string | ArrayBuffer | Uint8Array,
  template: ImportTemplate,
  options: WorkerImportOptions = {},
): Promise<WorkerImportResult> {
  return executeWorker(
    createWorker,
    input,
    () => ({ kind: "import", template }),
    options,
    true,
  );
}
export type WorkerTaskOptions = Pick<
  WorkerImportOptions,
  "signal" | "onProgress" | "timeoutMs"
>;
export interface WorkerRepairOptions extends Omit<ImportOptions, "onProgress"> {
  onProgress?: (progress: WorkerImportProgress) => void;
  timeoutMs?: number;
  report?: boolean;
}
/** Repair source cells in a dedicated worker; register business callbacks with installImportWorker. */
export function runRepairWorker(
  createWorker: () => Worker,
  previous: ImportResult,
  edits: readonly ImportCellEdit[],
  schema: Omit<ImportSchema, "rowRules" | "tableRules" | "batchRules">,
  options: WorkerRepairOptions = {},
): Promise<WorkerImportResult> {
  return executeWorker(
    createWorker,
    null,
    () => ({
      kind: "repair",
      previous: {
        original: previous.original,
        rowSources: previous.rowSources,
      },
      edits,
      schema,
    }),
    options,
    false,
  );
}
/** Generate a report on demand in a dedicated worker; only report inputs cross the thread boundary. */
export function runReportWorker(
  createWorker: () => Worker,
  result: ImportResult,
  options: WorkerTaskOptions = {},
): Promise<Uint8Array> {
  return executeWorker(
    createWorker,
    null,
    () => ({
      kind: "report",
      previous: {
        original: result.original,
        issues: result.issues,
        status: result.status,
        summary: result.summary,
      },
    }),
    options,
    false,
  );
}
function executeWorker<T>(
  createWorker: () => Worker,
  input: Blob | string | ArrayBuffer | Uint8Array | null,
  task: () => Record<string, unknown>,
  options: WorkerImportOptions | WorkerRepairOptions,
  readInput: boolean,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let worker: Worker | undefined,
      timer: ReturnType<typeof setTimeout> | undefined,
      finished = false;
    const finish = (error?: unknown, value?: T) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        options?.signal?.removeEventListener("abort", cancel);
      } catch {
        /* Invalid caller options must still reject. */
      }
      if (worker) {
        try {
          worker.removeEventListener("message", message);
          worker.removeEventListener("error", failed);
          worker.removeEventListener("messageerror", failed);
          worker.terminate();
        } catch {
          /* Cleanup must not mask the task outcome. */
        }
      }
      if (error !== undefined) reject(error);
      else resolve(value!);
    };
    const cancel = () =>
      finish(new SheetDeltaError("ABORTED", "Worker import cancelled."));
    const failed = () =>
      finish(
        new SheetDeltaError(
          "WORKER_FAILED",
          "Worker could not load or communicate.",
        ),
      );
    const progress = (value: WorkerImportProgress) => {
      if (!finished) {
        try {
          options.onProgress?.(value);
        } catch (error) {
          finish(
            error ??
              new SheetDeltaError("WORKER_FAILED", "Progress callback failed."),
          );
        }
      }
    };
    const message = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.protocol !== "sheetdelta-import-v1") return;
      if (data.type === "progress") progress(data.progress);
      else if (data.type === "result") finish(undefined, data.value);
      else if (data.type === "error")
        finish(
          new SheetDeltaError(
            data.error.code as ErrorCode,
            data.error.message,
            data.error.context,
          ),
        );
    };
    try {
      if (!options || typeof options !== "object" || Array.isArray(options))
        throw new SheetDeltaError(
          "INVALID_OPTIONS",
          "Worker options must be an object.",
        );
      const timeout = options.timeoutMs ?? 120000;
      if (
        !Number.isSafeInteger(timeout) ||
        timeout < 1 ||
        timeout > 2147483647 ||
        (options.report !== undefined && typeof options.report !== "boolean")
      )
        throw new SheetDeltaError(
          "INVALID_OPTIONS",
          "Invalid worker timeout or report option.",
        );
      if (
        options.onProgress !== undefined &&
        typeof options.onProgress !== "function"
      )
        throw new SheetDeltaError(
          "INVALID_OPTIONS",
          "onProgress must be callable.",
        );
      if (options.signal?.aborted) {
        cancel();
        return;
      }
      const { signal, onProgress, timeoutMs, report, ...runtime } = options;
      if (
        ["rowRules", "tableRules", "batchRules"].some((key) => key in runtime)
      )
        throw new SheetDeltaError(
          "INVALID_OPTIONS",
          "Register business callbacks inside the worker module.",
        );
      // Snapshot configuration before reading a Blob, so caller mutations cannot change an in-flight task.
      const saved = structuredClone({
        ...task(),
        runtime,
        report: report ?? false,
      });
      worker = createWorker();
      worker.addEventListener("message", message);
      worker.addEventListener("error", failed);
      worker.addEventListener("messageerror", failed);
      signal?.addEventListener("abort", cancel, { once: true });
      if (signal?.aborted) {
        cancel();
        return;
      }
      timer = setTimeout(
        () =>
          finish(
            new SheetDeltaError(
              "WORKER_TIMEOUT",
              "Worker import deadline exceeded.",
            ),
          ),
        timeout,
      );
      if (readInput) progress({ phase: "read", processed: 0, total: 1 });
      if (finished) return;
      const bytes = !readInput
        ? Promise.resolve(null)
        : typeof Blob !== "undefined" && input instanceof Blob
          ? input.arrayBuffer()
          : typeof input === "string"
            ? Promise.resolve(input)
            : input instanceof ArrayBuffer
              ? Promise.resolve(input.slice(0))
              : input instanceof Uint8Array
                ? Promise.resolve(new Uint8Array(input).buffer)
                : Promise.reject(
                    new SheetDeltaError(
                      "INVALID_DATA",
                      "Expected a File/Blob, CSV string or file bytes.",
                    ),
                  );
      bytes.then(
        (value) => {
          if (finished) return;
          if (readInput) progress({ phase: "read", processed: 1, total: 1 });
          if (finished) return;
          try {
            worker!.postMessage(
              {
                protocol: "sheetdelta-import-v1",
                type: "run",
                input: value,
                ...saved,
              },
              value instanceof ArrayBuffer ? [value] : [],
            );
          } catch (error) {
            finish(
              new SheetDeltaError(
                "WORKER_FAILED",
                "Cannot send import data to worker.",
                {},
                { cause: error },
              ),
            );
          }
        },
        (error) =>
          finish(
            error ??
              new SheetDeltaError("WORKER_FAILED", "File reading failed."),
          ),
      );
    } catch (error) {
      finish(
        error ?? new SheetDeltaError("WORKER_FAILED", "Worker setup failed."),
      );
    }
  });
}

export interface ImportWorkerScope {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent) => void,
  ): void;
  removeEventListener(
    type: "message",
    listener: (event: MessageEvent) => void,
  ): void;
  postMessage(message: unknown, transfer?: Transferable[]): void;
}
/** Install in an application-owned module worker. Callbacks remain in that worker, never serialized. */
export function installImportWorker(
  scope: ImportWorkerScope,
  rules: Pick<
    TemplateImportOptions,
    "rowRules" | "tableRules" | "batchRules"
  > = {},
): () => void {
  let started = false;
  const send = (
    type: string,
    data: Record<string, unknown>,
    transfer: Transferable[] = [],
  ) =>
    scope.postMessage(
      { protocol: "sheetdelta-import-v1", type, ...data },
      transfer,
    );
  const listener = async (event: MessageEvent) => {
    const task = event.data;
    if (
      started ||
      !task ||
      task.protocol !== "sheetdelta-import-v1" ||
      task.type !== "run"
    )
      return;
    started = true;
    try {
      if (task.kind === "report") {
        send("progress", {
          progress: { phase: "report", processed: 0, total: 1 },
        });
        const { exportImportReport } = await import("./import-report.js");
        const report = await exportImportReport(task.previous);
        send("progress", {
          progress: { phase: "complete", processed: 1, total: 1 },
        });
        send("result", { value: report }, [report.buffer as ArrayBuffer]);
        return;
      }
      const { importWithTemplate, repairImport } = await import("./import.js");
      const runtime = {
        ...task.runtime,
        ...rules,
        onProgress: (progress: ImportProgress) => {
          if (progress.phase !== "complete") send("progress", { progress });
        },
      };
      let result: ImportResult;
      if (task.kind === "repair") {
        const { onProgress, ...repairOptions } = runtime;
        result = await repairImport(
          task.previous,
          task.edits,
          { ...task.schema, ...rules },
          { ...repairOptions, onProgress },
        );
      } else {
        if (task.kind !== undefined && task.kind !== "import")
          throw new SheetDeltaError("INVALID_OPTIONS", "Unknown worker task.");
        send("progress", {
          progress: { phase: "parse", processed: 0, total: 1 },
        });
        result = await importWithTemplate(task.input, task.template, runtime);
      }
      let report: Uint8Array | undefined;
      if (task.report) {
        send("progress", {
          progress: { phase: "report", processed: 0, total: 1 },
        });
        const { exportImportReport } = await import("./import-report.js");
        report = await exportImportReport(result);
      }
      send("progress", {
        progress: {
          phase: "complete",
          processed: result.summary.total,
          total: result.summary.total,
        },
      });
      send(
        "result",
        { value: { result, ...(report ? { report } : {}) } },
        report ? [report.buffer as ArrayBuffer] : [],
      );
    } catch (error) {
      send("error", {
        error:
          error instanceof SheetDeltaError
            ? error.toJSON()
            : {
                code: "WORKER_FAILED",
                message: error instanceof Error ? error.message : String(error),
                context: {},
              },
      });
    }
  };
  scope.addEventListener("message", listener);
  return () => scope.removeEventListener("message", listener);
}
