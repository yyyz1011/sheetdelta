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
    await panel
      .locator("input[type=file]")
      .setInputFiles({
        name: "repair.xlsx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        buffer: await readFile(path!),
      });
    await panel.getByRole("button", { name: "Import", exact: true }).click();
    await expect(panel.getByRole("status")).toHaveText("1 accepted / 3 rows");
    tables[0].rows[1].qty = 3;
    tables[0].rows[2].active = 'Yes';
    const repaired = await writeExcel([{name:'Data', rows:tables[0].rows}]);
    await panel.locator('input[type=file]').setInputFiles({name:'fixed.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:Buffer.from(repaired)});
    await panel.getByRole('button',{name:'Import',exact:true}).click();
    await expect(panel.getByRole('status')).toHaveText('3 accepted / 3 rows');
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
      contents: "export {runImportWorker} from 'sheetdelta-core/worker'",
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
    const { runImportWorker } = await import(
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
    return errors;
  });
  expect(codes).toEqual(["ABORTED", "WORKER_TIMEOUT"]);
  await expect(
    page.getByRole("heading", { name: "Check the file. Keep the good rows." }),
  ).toBeVisible();
});
