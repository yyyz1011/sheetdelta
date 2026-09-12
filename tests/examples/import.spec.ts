import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { readExcel, writeExcel } from "../../packages/core/src/excel";
for (const framework of ["react", "vue"])
  test(`${framework}: real worker import and report`, async ({ page }) => {
    await page.goto("./");
    const panel = page.locator(`#${framework}`);
    await panel
      .locator("input[type=file]")
      .setInputFiles("apps/import-examples/public/sample.csv");
    await panel.getByRole("button", { name: "Import", exact: true }).click();
    await expect(panel.getByRole("status")).toHaveText("1 accepted / 3 rows");
    const download = page.waitForEvent("download");
    await panel
      .getByRole("button", { name: "Download repair workbook" })
      .click();
    const path = await (await download).path();
    const tables = await readExcel(new Uint8Array(await readFile(path!)));
    expect(tables.map((t) => t.name)).toEqual(["Data", "Issues", "Summary"]);
    await panel.getByLabel("Format").selectOption("excel");
    await panel.locator("input[type=file]").setInputFiles({
      name: "repair.xlsx",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer: await readFile(path!),
    });
    await panel.getByRole("button", { name: "Import", exact: true }).click();
    await expect(panel.getByRole("status")).toHaveText("1 accepted / 3 rows");
    tables[0].rows[1].qty = 3;
    tables[0].rows[2].active = "Yes";
    const repaired = await writeExcel([{ name: "Data", rows: tables[0].rows }]);
    await panel
      .locator("input[type=file]")
      .setInputFiles({
        name: "fixed.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: Buffer.from(repaired),
      });
    await panel.getByRole("button", { name: "Import", exact: true }).click();
    await expect(panel.getByRole("status")).toHaveText("3 accepted / 3 rows");
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (framework === "react")
      await page.screenshot({
        path: `artifacts/import-${test.info().project.name}.png`,
        fullPage: true,
      });
  });

test("hard cancellation and timeout stop busy workers", async ({ page }) => {
  const { build } = await import("esbuild");
  const built = await build({
    stdin: {
      contents:
        "export {runImportWorker,runRepairWorker,runReportWorker} from 'sheetdelta-core/worker'",
      resolveDir: process.cwd(),
    },
    bundle: true,
    format: "esm",
    write: false,
  });
  await page.route("**/worker-client.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: built.outputFiles[0].text,
    }),
  );
  await page.route("**/busy-worker.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "postMessage({ready:true}); while(true) {}",
    }),
  );
  await page.goto("./");
  const codes = await page.evaluate(async () => {
    const { runImportWorker, runRepairWorker, runReportWorker } = await import(
      /* @vite-ignore */ "/worker-client.js"
    );
    const template = {
      version: 1,
      id: "test",
      revision: 1,
      format: "csv",
      fields: [{ key: "sku" }],
    };
    const controller = new AbortController();
    const create = () => {
      const w = new Worker("/busy-worker.js");
      w.addEventListener("message", () => controller.abort(), { once: true });
      return w;
    };
    const errors = [];
    try {
      await runImportWorker(create, "sku\n001", template, {
        signal: controller.signal,
      });
    } catch (e: any) {
      errors.push(e.code);
    }
    try {
      await runImportWorker(
        () => new Worker("/busy-worker.js"),
        "sku\n001",
        template,
        { timeoutMs: 100 },
      );
    } catch (e: any) {
      errors.push(e.code);
    }
    const previous = {
      original: {
        name: "Data",
        headers: ["sku"],
        rows: [{ sku: "001" }],
        rowNumbers: [2],
      },
      rowSources: [],
      issues: [],
      summary: { total: 1, accepted: 1, errors: 0, warnings: 0 },
      status: "ready",
    };
    for (const kind of ["repair", "report"]) {
      const c = new AbortController();
      const factory = () => {
        const w = new Worker("/busy-worker.js");
        w.addEventListener("message", () => c.abort(), { once: true });
        return w;
      };
      try {
        if (kind === "repair")
          await runRepairWorker(
            factory,
            previous,
            [],
            { fields: [{ key: "sku" }] },
            { signal: c.signal },
          );
        else await runReportWorker(factory, previous, { signal: c.signal });
      } catch (e: any) {
        errors.push(e.code);
      }
    }
    return errors;
  });
  expect(codes).toEqual(["ABORTED", "WORKER_TIMEOUT", "ABORTED", "ABORTED"]);
  await expect(
    page.getByRole("heading", { name: "Check the file. Keep the good rows." }),
  ).toBeVisible();
});

for (const framework of ["react", "vue"])
  test(`${framework}: lazy reports, cached downloads and click-to-repair`, async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (r) => requests.push(r.url()));
    await page.goto("./");
    const panel = page.locator("#" + framework);
    await panel
      .locator("input[type=file]")
      .setInputFiles("apps/import-examples/public/sample.csv");
    await panel.getByRole("button", { name: "Import", exact: true }).click();
    await expect(panel.getByRole("status")).toHaveText("1 accepted / 3 rows");
    expect(requests.some((r) => /import-report-/.test(r))).toBe(false);
    await panel.getByRole("button", { name: "Edit row 3 · qty" }).click();
    await expect(panel.getByLabel("Data row")).toHaveValue("2");
    await expect(panel.getByLabel("Replacement value")).toHaveValue("-3");
    await expect(panel.getByLabel("Replacement value")).toBeFocused();
    await panel.getByLabel("Replacement value").fill("3");
    await panel.getByRole("button", { name: "Apply and revalidate" }).click();
    await expect(panel.getByRole("status")).toHaveText("2 accepted / 3 rows");
    expect(requests.some((r) => /import-report-/.test(r))).toBe(false);
    const download = page.waitForEvent("download");
    await panel
      .getByRole("button", { name: "Download repair workbook" })
      .click();
    const downloaded = await download;
    const tables = await readExcel(
      new Uint8Array(await readFile((await downloaded.path())!)),
    );
    expect(String(tables[0].rows[1].qty)).toBe("3");
    const reports = requests.filter((r) => /import-report-/.test(r)).length;
    expect(reports).toBeGreaterThan(0);
    const again = page.waitForEvent("download");
    await panel
      .getByRole("button", { name: "Download repair workbook" })
      .click();
    await again;
    expect(requests.filter((r) => /import-report-/.test(r))).toHaveLength(
      reports,
    );
    await panel.getByRole("button", { name: "Edit row 4 · active" }).click();
    await panel.getByLabel("Replacement value").fill("Yes");
    await panel.getByRole("button", { name: "Apply and revalidate" }).click();
    await expect(panel.getByRole("status")).toHaveText("3 accepted / 3 rows");
    const refreshed = page.waitForEvent("download");
    await panel
      .getByRole("button", { name: "Download repair workbook" })
      .click();
    const freshTables = await readExcel(
      new Uint8Array(await readFile((await (await refreshed).path())!)),
    );
    expect(freshTables[0].rows[2].active).toBe("Yes");
  });
for (const framework of ['react', 'vue']) test(`${framework}: cancel report, retain result and retry`, async ({page}) => {
 await page.goto('./'); const panel=page.locator('#'+framework);const downloads:unknown[]=[];page.on('download',d=>downloads.push(d));
 await panel.locator('input[type=file]').setInputFiles('apps/import-examples/public/sample.csv');
 await panel.getByRole('button',{name:'Import',exact:true}).click();await expect(panel.getByRole('status')).toHaveText('1 accepted / 3 rows');
 await page.route('**/assets/import.worker-*.js',route=>route.fulfill({contentType:'text/javascript',body:`onmessage=()=>{postMessage({protocol:'sheetdelta-import-v1',type:'progress',progress:{phase:'report',processed:0,total:1}});while(true){}}`}));
 await panel.getByRole('button',{name:'Download repair workbook'}).click();await expect(panel.getByRole('status')).toHaveText('report');
 await panel.getByRole('button',{name:'Cancel',exact:true}).click();await expect(panel.getByRole('status')).toContainText('cancelled');
 expect(downloads).toHaveLength(0);await expect(panel.getByRole('button',{name:'Edit row 3 · qty'})).toBeEnabled();
 await page.unrouteAll();const download=page.waitForEvent('download');await panel.getByRole('button',{name:'Download repair workbook'}).click();await download;expect(downloads).toHaveLength(1);
});
