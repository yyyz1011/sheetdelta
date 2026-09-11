import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { cpus } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
const target = process.argv[2] || "packages/core/dist/import.js";
const { prepareImport, mapImportHeaders } = await import(
  pathToFileURL(resolve(target))
);
const median = (values) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
console.log(
  JSON.stringify({
    node: process.version,
    cpu: cpus()[0]?.model,
    platform: process.platform,
    arch: process.arch,
    module: target,
    runs: 5,
  }),
);
for (const count of [1000, 10000, 50000]) {
  const table = {
    name: "Data",
    headers: ["sku", "qty", "active", "group", "note"],
    rows: Array.from({ length: count }, (_, i) => ({
      sku: String(i).padStart(8, "0"),
      qty: String(i % 100),
      active: "Yes",
      group: "A",
      note: " ready ",
    })),
    rowNumbers: Array.from({ length: count }, (_, i) => i + 2),
  };
  const schema = {
    fields: [
      { key: "sku", rule: { required: true, unique: true } },
      { key: "qty", clean: { type: "number" }, rule: { min: 0 } },
      {
        key: "active",
        clean: { dictionary: { entries: [{ from: "Yes", to: true }] } },
      },
      { key: "group" },
      { key: "note", clean: { trim: true } },
    ],
  };
  await prepareImport(table, schema, { format: "excel" });
  const times = [];
  for (let i = 0; i < 5; i++) {
    globalThis.gc?.();
    const start = performance.now();
    const r = await prepareImport(table, schema, { format: "excel" });
    times.push(performance.now() - start);
    assert.equal(r.summary.accepted, count);
    assert.equal(r.changes.length, count * 3);
    assert.equal(r.rows[0].sku, "00000000");
    assert.equal(r.rows[0].active, true);
  }
  console.log(
    JSON.stringify({
      case: "prepare",
      rows: count,
      columns: 5,
      medianMs: +median(times).toFixed(2),
      samplesMs: times.map((x) => +x.toFixed(2)),
    }),
  );
}
const headers = Array.from({ length: 1000 }, (_, i) => "Column " + i),
  fields = headers.map((key) => ({ key }));
const times = [];
mapImportHeaders(headers, fields);
for (let i = 0; i < 5; i++) {
  const start = performance.now();
  assert.equal(mapImportHeaders(headers, fields).valid, true);
  times.push(performance.now() - start);
}
console.log(
  JSON.stringify({
    case: "headers",
    columns: 1000,
    medianMs: +median(times).toFixed(2),
    samplesMs: times.map((x) => +x.toFixed(2)),
  }),
);
