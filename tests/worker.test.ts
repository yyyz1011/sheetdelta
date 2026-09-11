import { describe, it, expect, vi } from "vitest";
import {
  runImportWorker,
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
    const dispose = installImportWorker(scope, {rowRules:[{id:'note',validate:()=>[{code:'note',severity:'warning',column:'sku',message:'Worker-local rule'}]}]});
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
