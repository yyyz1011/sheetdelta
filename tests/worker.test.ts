import { describe, it, expect, vi } from "vitest";
import {
  runImportWorker,
  runRepairWorker,
  runReportWorker,
  installImportWorker,
} from "../packages/core/src/worker";
const template = {
  version: 1 as const,
  id: "test",
  revision: 1,
  format: "csv" as const,
  fields: [{ key: "sku" }],
};
class FakeWorker extends EventTarget {
  terminate = vi.fn();
  postMessage = vi.fn();
  emit(type: string, data?: unknown) {
    this.dispatchEvent(
      type === "message" ? new MessageEvent(type, { data }) : new Event(type),
    );
  }
}
const asWorker = (w: FakeWorker) => w as unknown as Worker;
describe("dedicated import worker lifecycle", () => {
  it("does not start when cancelled before setup", async () => {
    const c = new AbortController();
    c.abort();
    const factory = vi.fn();
    await expect(
      runImportWorker(factory, "sku\n001", template, { signal: c.signal }),
    ).rejects.toMatchObject({ code: "ABORTED" });
    expect(factory).not.toHaveBeenCalled();
  });
  it("detects cancellation inside the factory", async () => {
    const c = new AbortController(),
      w = new FakeWorker();
    await expect(
      runImportWorker(
        () => {
          c.abort();
          return asWorker(w);
        },
        "",
        template,
        { signal: c.signal },
      ),
    ).rejects.toMatchObject({ code: "ABORTED" });
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("terminates on deadline", async () => {
    const w = new FakeWorker();
    await expect(
      runImportWorker(() => asWorker(w), "", template, { timeoutMs: 10 }),
    ).rejects.toMatchObject({ code: "WORKER_TIMEOUT" });
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("aborts while reading and ignores late file completion", async () => {
    let release!: (b: ArrayBuffer) => void;
    const blob = new Blob(["sku"]);
    vi.spyOn(blob, "arrayBuffer").mockImplementation(
      () => new Promise((r) => (release = r)),
    );
    const c = new AbortController(),
      w = new FakeWorker();
    const promise = runImportWorker(() => asWorker(w), blob, template, {
      signal: c.signal,
    });
    c.abort();
    release(new ArrayBuffer(2));
    await expect(promise).rejects.toMatchObject({ code: "ABORTED" });
    expect(w.postMessage).not.toHaveBeenCalled();
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("preserves caller bytes and template snapshot", async () => {
    const w = new FakeWorker(),
      bytes = new Uint8Array([1, 2]),
      t = structuredClone(template);
    const p = runImportWorker(() => asWorker(w), bytes, t);
    t.id = "changed";
    await Promise.resolve();
    const [message, transfer] = w.postMessage.mock.calls[0];
    expect(message.template.id).toBe("test");
    expect(message.input).not.toBe(bytes.buffer);
    structuredClone(message, { transfer });
    expect([...bytes]).toEqual([1, 2]);
    w.emit("message", {
      protocol: "sheetdelta-import-v1",
      type: "result",
      value: { result: { rows: [] } },
    });
    await expect(p).resolves.toMatchObject({ result: { rows: [] } });
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("cleans up progress failures including thrown undefined", async () => {
    const w = new FakeWorker();
    await expect(
      runImportWorker(() => asWorker(w), "", template, {
        onProgress: () => {
          throw undefined;
        },
      }),
    ).rejects.toMatchObject({ code: "WORKER_FAILED" });
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("rejects script failure and ignores late messages", async () => {
    const w = new FakeWorker();
    const p = runImportWorker(() => asWorker(w), "", template);
    w.emit("error");
    w.emit("message", {
      protocol: "sheetdelta-import-v1",
      type: "result",
      value: {},
    });
    await expect(p).rejects.toMatchObject({ code: "WORKER_FAILED" });
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("requires business callbacks in the worker", async () => {
    await expect(
      runImportWorker(vi.fn(), "", template, { rowRules: [] } as never),
    ).rejects.toMatchObject({ code: "INVALID_OPTIONS" });
  });
  it("installer executes real import and report", async () => {
    let listener: any;
    const messages: any[] = [];
    const scope = {
      addEventListener: (_: string, fn: any) => (listener = fn),
      removeEventListener: vi.fn(),
      postMessage: (value: any) => messages.push(value),
    };
    const dispose = installImportWorker(scope, {
      rowRules: [
        {
          id: "note",
          validate: () => [
            {
              code: "note",
              severity: "warning",
              column: "sku",
              message: "Worker-local rule",
            },
          ],
        },
      ],
    });
    await listener({
      data: {
        protocol: "sheetdelta-import-v1",
        type: "run",
        input: "sku\n001",
        template,
        runtime: {},
        report: true,
      },
    });
    const result = messages.find((x) => x.type === "result");
    expect(result.value.result.rows[0].sku).toBe("001");
    expect(result.value.report).toBeInstanceOf(Uint8Array);
    expect(result.value.result.summary.warnings).toBe(1);
    expect(messages.at(-2).progress.phase).toBe("complete");
    dispose();
    expect(scope.removeEventListener).toHaveBeenCalledOnce();
  });
});

describe("repair and on-demand report workers", () => {
  const previous = {
    original: {
      name: "Data",
      headers: ["sku"],
      rows: [{ sku: "001" }],
      rowNumbers: [2],
    },
    rowSources: [{ sheet: "Data", positionKind: "csv-record", sourceRow: 2 }],
    rows: [{ sku: "001" }],
    processedRows: [{ sku: "001" }],
    changes: [],
    issues: [],
    summary: { total: 1, accepted: 1, errors: 0, warnings: 0 },
    status: "ready",
  } as any;
  it("repair transfers only source data and snapshots edits", async () => {
    const w = new FakeWorker(),
      edits = [{ row: 1, column: "sku", value: "002" }];
    const p = runRepairWorker(() => asWorker(w), previous, edits, {
      fields: [{ key: "sku" }],
    });
    edits[0].value = "changed";
    await Promise.resolve();
    const message = w.postMessage.mock.calls[0][0];
    expect(Object.keys(message.previous).sort()).toEqual([
      "original",
      "rowSources",
    ]);
    expect(message.edits[0].value).toBe("002");
    expect(message.report).toBe(false);
    w.emit("message", {
      protocol: "sheetdelta-import-v1",
      type: "result",
      value: { result: previous },
    });
    await p;
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  it("report transfers only report inputs and returns owned bytes", async () => {
    const w = new FakeWorker(),
      p = runReportWorker(() => asWorker(w), previous);
    await Promise.resolve();
    expect(Object.keys(w.postMessage.mock.calls[0][0].previous).sort()).toEqual(
      ["issues", "original", "status", "summary"],
    );
    const bytes = new Uint8Array([1, 2]);
    w.emit("message", {
      protocol: "sheetdelta-import-v1",
      type: "result",
      value: bytes,
    });
    expect(await p).toBe(bytes);
    expect(w.terminate).toHaveBeenCalledOnce();
  });
  for (const kind of ["repair", "report"])
    it(`${kind} supports pre-abort and deadline`, async () => {
      const c = new AbortController();
      c.abort();
      const factory = vi.fn();
      const invoke = (f: () => Worker, o: any) =>
        kind === "repair"
          ? runRepairWorker(f, previous, [], { fields: [{ key: "sku" }] }, o)
          : runReportWorker(f, previous, o);
      await expect(invoke(factory, { signal: c.signal })).rejects.toMatchObject(
        { code: "ABORTED" },
      );
      expect(factory).not.toHaveBeenCalled();
      const w = new FakeWorker();
      await expect(
        invoke(() => asWorker(w), { timeoutMs: 5 }),
      ).rejects.toMatchObject({ code: "WORKER_TIMEOUT" });
      expect(w.terminate).toHaveBeenCalledOnce();
    });
  it("repair installs worker-local rules and skips report work by default", async () => {
    let listener: any;
    const messages: any[] = [];
    installImportWorker(
      {
        addEventListener: (_, f) => (listener = f),
        removeEventListener() {},
        postMessage: (m) => messages.push(m),
      },
      {
        rowRules: [
          {
            id: "note",
            validate: () => [
              { code: "note", severity: "warning", message: "Worker rule" },
            ],
          },
        ],
      },
    );
    await listener({
      data: {
        protocol: "sheetdelta-import-v1",
        type: "run",
        kind: "repair",
        previous,
        edits: [{ row: 1, column: "sku", value: "002" }],
        schema: { fields: [{ key: "sku" }] },
        runtime: {},
      },
    });
    const value = messages.at(-1).value;
    expect(value.result.rows[0].sku).toBe("002");
    expect(value.result.summary.warnings).toBe(1);
    expect(value.report).toBeUndefined();
    expect(messages.some((m) => m.progress?.phase === "report")).toBe(false);
    expect(previous.original.rows[0].sku).toBe("001");
  });
  it("report handler returns an XLSX without revalidation", async () => {
    let listener: any;
    const messages: any[] = [];
    const validate = vi.fn(() => []);
    installImportWorker(
      {
        addEventListener: (_, f) => (listener = f),
        removeEventListener() {},
        postMessage: (m) => messages.push(m),
      },
      { rowRules: [{ id: "must-not-run", validate }] },
    );
    await listener({
      data: {
        protocol: "sheetdelta-import-v1",
        type: "run",
        kind: "report",
        previous,
      },
    });
    expect(messages.at(-1).value).toBeInstanceOf(Uint8Array);
    expect(messages.at(-1).value[0]).toBe(80);
    expect(validate).not.toHaveBeenCalled();
  });
  it("repair validation errors are transported with their original codes", async () => {
    let listener: any;
    const messages: any[] = [];
    installImportWorker({
      addEventListener: (_, f) => (listener = f),
      removeEventListener() {},
      postMessage: (m) => messages.push(m),
    });
    await listener({
      data: {
        protocol: "sheetdelta-import-v1",
        type: "run",
        kind: "repair",
        previous,
        edits: [{ row: 0, column: "sku", value: "002" }],
        schema: { fields: [{ key: "sku" }] },
        runtime: {},
      },
    });
    expect(messages.at(-1).error.code).toBe("INVALID_OPTIONS");
  });
});
