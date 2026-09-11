import { it, expect } from "vitest";
import {
  importFile,
  repairImport,
  mapImportHeaders,
  prepareImport,
} from "../packages/core/src/import";
const schema = {
  fields: [
    { key: "id", aliases: ["SKU"], rule: { unique: true } },
    { key: "qty", clean: { type: "number" as const }, rule: { min: 0 } },
  ],
};
it("repairs source cells without mutating the earlier result and preserves positions", async () => {
  const previous = await importFile("SKU,qty\n001,-2\n002,3", schema, {
    format: "csv",
    fileName: "stock.csv",
    mode: "valid-rows",
  });
  const before = structuredClone(previous);
  const next = await repairImport(
    previous,
    [{ row: 1, column: "qty", value: "2" }],
    schema,
    { mode: "valid-rows" },
  );
  expect(next.rows).toEqual([
    { id: "001", qty: 2 },
    { id: "002", qty: 3 },
  ]);
  expect(previous).toEqual(before);
  expect(next.rowSources).toEqual(previous.rowSources);
  expect(next.original.rows[0].qty).toBe("2");
});
it("rechecks all rows for uniqueness, including newly invalid neighbours", async () => {
  const previous = await importFile("SKU,qty\n001,2\n002,3", schema, {
    format: "csv",
  });
  const next = await repairImport(
    previous,
    [{ row: 2, column: "SKU", value: "001" }],
    schema,
    { mode: "valid-rows" },
  );
  expect(next.invalidRows).toEqual([1, 2]);
  expect(next.summary.accepted).toBe(0);
});
it("rejects ambiguous edits and bad coordinates atomically", async () => {
  const previous = await importFile("SKU,qty\n001,-2", schema, {
    format: "csv",
  });
  for (const edits of [
    [{ row: 0, column: "qty", value: 2 }],
    [{ row: 1, column: "id", value: "x" }],
    [{ row: 1, column: "qty", value: NaN }],
    [
      { row: 1, column: "qty", value: 2 },
      { row: 1, column: "qty", value: 3 },
    ],
  ])
    await expect(repairImport(previous, edits, schema)).rejects.toThrow();
  expect(previous.original.rows[0].qty).toBe("-2");
});
it("allows remapping a structurally invalid import without file parsing", async () => {
  const previous = await importFile(
    "SKU,qty\n001,2",
    { fields: [{ key: "missing", requiredColumn: true }] },
    { format: "csv" },
  );
  const next = await repairImport(previous, [], schema);
  expect(next.valid).toBe(true);
  expect(next.rows[0].id).toBe("001");
});
it("cancels before repair and still enforces table business rules", async () => {
  const previous = await importFile("SKU,qty\n001,2", schema, {
      format: "csv",
    }),
    c = new AbortController();
  c.abort();
  await expect(
    repairImport(previous, [], schema, { signal: c.signal }),
  ).rejects.toMatchObject({ code: "ABORTED" });
  const next = await repairImport(previous, [], {
    ...schema,
    tableRules: [
      {
        id: "block",
        validate: () => [
          { code: "blocked", message: "blocked", severity: "error" as const },
        ],
      },
    ],
  });
  expect(next.rows).toEqual([]);
});
it("indexed header matching preserves source order, ambiguity and unknown columns", () => {
  const result = mapImportHeaders(
    ["Z", " SKU ", "sku", "Unused"],
    [
      { key: "id", aliases: ["sku", "z"] },
      { key: "other", source: "Unused" },
    ],
  );
  expect(result.mappings[0].candidates).toEqual(["Z", " SKU ", "sku"]);
  expect(result.issues[0].code).toBe("ambiguous-column");
  expect(result.unknownColumns).toEqual([]);
});
it("skipping empty business phases preserves cooperative cancellation", async () => {
  const c = new AbortController();
  await expect(
    prepareImport(
      {
        name: "Data",
        headers: ["id"],
        rows: [{ id: "1" }, { id: "2" }],
        rowNumbers: [2, 3],
      },
      { fields: [{ key: "id" }] },
      {
        batchSize: 1,
        signal: c.signal,
        onProgress: (e) => {
          if (e.phase === "clean") c.abort();
        },
      },
    ),
  ).rejects.toMatchObject({ code: "ABORTED" });
});
it("cached source locations handle wide worksheet columns", async () => {
  const headers = Array.from({ length: 28 }, (_, i) => "c" + i);
  const table = {
    name: "Data",
    headers,
    rows: [Object.fromEntries(headers.map((h) => [h, " 1 "]))],
    rowNumbers: [7],
  };
  const result = await prepareImport(
    table,
    { fields: headers.map((key) => ({ key, clean: { trim: true } })) },
    { format: "excel" },
  );
  expect(result.changes[27].source.cell).toBe("AB7");
});
it('edits prototype-like source headers as own data properties',async()=>{
 const table={name:'Data',headers:['__proto__'],rows:[Object.fromEntries([['__proto__','old']])],rowNumbers:[2]};
 const schema={fields:[{key:'value',source:'__proto__'}]};
 const previous=await prepareImport(table,schema);
 const next=await repairImport(previous,[{row:1,column:'__proto__',value:'new'}],schema);
 expect(next.rows[0].value).toBe('new');expect(Object.getPrototypeOf(next.original.rows[0])).toBe(Object.prototype);expect(previous.rows[0].value).toBe('old');
});
