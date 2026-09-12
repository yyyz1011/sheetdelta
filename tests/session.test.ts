import { describe, expect, it, vi } from "vitest";
import { writeExcel } from "../packages/core/src/excel";
import {
  createImportSession,
  installImportSessionWorker,
} from "../packages/core/src/session";

class LoopbackWorker extends EventTarget {
  private workerListener?: (event: MessageEvent) => void;
  terminate = vi.fn();
  readonly scope = {
    addEventListener: (_type: "message", listener: (event: MessageEvent) => void) => {
      this.workerListener = listener;
    },
    removeEventListener: (_type: "message", listener: (event: MessageEvent) => void) => {
      if (this.workerListener === listener) this.workerListener = undefined;
    },
    postMessage: (message: unknown) =>
      queueMicrotask(() =>
        this.dispatchEvent(new MessageEvent("message", { data: message })),
      ),
  };
  postMessage(message: unknown) {
    queueMicrotask(() => this.workerListener?.(new MessageEvent("message", { data: message })));
  }
}

const createLoopback = (rules = {}) => {
  const worker = new LoopbackWorker();
  installImportSessionWorker(worker.scope, rules);
  return { worker, factory: () => worker as unknown as Worker };
};

const fields = [
  { key: "sku", source: "Product ID", requiredColumn: true, rule: { required: true, unique: true } },
  { key: "qty", source: "Stock", requiredColumn: true, clean: { type: "number" as const }, rule: { min: 0 } },
];

describe("persistent import sessions", () => {
  it("inspects, maps, repairs and returns full data without reparsing", async () => {
    const bytes = await writeExcel([
      { name: "Notes", rows: [{ note: "ignore" }] },
      {
        name: "Inventory",
        rows: [
          { "Product ID": "A-1", Stock: "-2", Extra: "x" },
          { "Product ID": "A-2", Stock: "3", Extra: "y" },
        ],
      },
    ]);
    const original = [...bytes];
    const { worker, factory } = createLoopback();
    const session = await createImportSession(factory, bytes, {
      format: "excel",
      previewRows: 1,
      fileName: "supplier.xlsx",
    });

    expect(bytes).toEqual(new Uint8Array(original));
    expect(session.inspection.sheets.map((sheet) => sheet.name)).toEqual([
      "Notes",
      "Inventory",
    ]);
    expect(session.inspection.sheets[1]).toMatchObject({
      rowCount: 2,
      headers: ["Product ID", "Stock", "Extra"],
      preview: [{ "Product ID": "A-1", Stock: "-2", Extra: "x" }],
    });

    const secondPage = await session.preview("Inventory", { offset: 1, limit: 1 });
    expect(secondPage.rows[0].Stock).toBe("3");
    const state = await session.prepare("Inventory", { fields }, { mode: "valid-rows" });
    expect(state.summary).toEqual({ total: 2, accepted: 1, errors: 1, warnings: 0 });
    expect(state.issues[0]).toMatchObject({ row: 1, column: "qty", sourceValue: "-2" });
    expect(state.preview[0]).toMatchObject({ row: 1, valid: false, processed: { sku: "A-1", qty: -2 } });
    expect(state).not.toHaveProperty("rows");

    const repaired = await session.repair([{ row: 1, column: "Stock", value: "2" }]);
    expect(repaired.summary.accepted).toBe(2);
    const result = await session.result();
    expect(result.rows.map((row) => row.qty)).toEqual([2, 3]);
    const report = await session.report();
    expect(report).toBeInstanceOf(Uint8Array);
    expect(report.length).toBeGreaterThan(100);

    session.close();
    session.close();
    expect(session.closed).toBe(true);
    expect(worker.terminate).toHaveBeenCalledOnce();
    await expect(session.result()).rejects.toMatchObject({ code: "SESSION_CLOSED" });
  });

  it("keeps worker-local callbacks and blocks concurrent commands", async () => {
    const { factory } = createLoopback({
      rowRules: [
        {
          id: "review",
          validate: () => [{ code: "review", severity: "warning" as const, message: "Review row" }],
        },
      ],
    });
    const session = await createImportSession(factory, "Product ID,Stock\nA-1,2", {
      format: "csv",
    });
    const first = session.prepare("Data", { fields }, { mode: "valid-rows" });
    await expect(session.preview("Data")).rejects.toMatchObject({ code: "SESSION_BUSY" });
    expect((await first).summary.warnings).toBe(1);
    session.close();
  });

  it("terminates the session on cancellation", async () => {
    const { worker, factory } = createLoopback();
    const session = await createImportSession(factory, "Product ID,Stock\nA-1,2", {
      format: "csv",
    });
    const controller = new AbortController();
    controller.abort();
    await expect(session.preview("Data", { signal: controller.signal })).rejects.toMatchObject({ code: "ABORTED" });
    expect(session.closed).toBe(true);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("cleans up setup and command progress callback failures", async () => {
    const first = createLoopback();
    await expect(
      createImportSession(first.factory, "sku\nA-1", {
        format: "csv",
        onProgress: () => { throw new Error("setup progress failed"); },
      }),
    ).rejects.toThrow("setup progress failed");
    expect(first.worker.terminate).toHaveBeenCalledOnce();

    const second = createLoopback();
    const session = await createImportSession(second.factory, "sku\nA-1", { format: "csv" });
    await expect(
      session.prepare("Data", { fields: [{ key: "sku" }] }, {
        onProgress: () => { throw new Error("command progress failed"); },
      }),
    ).rejects.toThrow("command progress failed");
    expect(session.closed).toBe(true);
    expect(second.worker.terminate).toHaveBeenCalledOnce();
  });

  it("rejects callbacks crossing the worker boundary", async () => {
    const { factory } = createLoopback();
    const session = await createImportSession(factory, "sku\nA-1", { format: "csv" });
    await expect(
      session.prepare("Data", {
        fields: [{ key: "sku" }],
        rowRules: [{ id: "bad", validate: () => [] }],
      } as never),
    ).rejects.toMatchObject({ code: "WORKER_FAILED" });
    expect(session.closed).toBe(true);
  });
});
