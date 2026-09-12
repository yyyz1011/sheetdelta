import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { readExcel, writeExcel } from "../../packages/core/src/excel";

for (const framework of ["react", "vue"]) {
  test(`${framework}: persistent session, batch repair and deferred delivery`, async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("./");
    const panel = page.locator(`#${framework}`);
    await panel.locator("input[type=file]").setInputFiles("apps/import-examples/public/sample.csv");
    await panel.getByRole("button", { name: "Open file" }).click();
    await expect(panel.getByRole("status")).toContainText("3 rows inspected");
    await expect(panel.getByRole("columnheader", { name: "sku" })).toBeVisible();
    await panel.getByRole("button", { name: "Validate mapping" }).click();
    await expect(panel.getByRole("status")).toHaveText("1 accepted / 3 rows");
    expect(requests.some((url) => /import-report-/.test(url))).toBe(false);

    await panel.locator(".issues li").filter({ hasText: "qty" }).getByRole("button", { name: "Queue fix" }).click();
    await expect(panel.getByLabel("Replacement value")).toBeFocused();
    await panel.getByLabel("Replacement value").fill("3");
    await panel.getByRole("button", { name: "Add to batch" }).click();
    await panel.locator(".issues li").filter({ hasText: "active" }).getByRole("button", { name: "Queue fix" }).click();
    await panel.getByLabel("Replacement value").fill("Yes");
    await panel.getByRole("button", { name: "Add to batch" }).click();
    await expect(panel.locator(".queue")).toContainText("row 2 / qty");
    await expect(panel.locator(".queue")).toContainText("row 3 / active");
    await panel.getByRole("button", { name: "Apply 2 changes" }).click();
    await expect(panel.getByRole("status")).toHaveText("3 accepted / 3 rows");

    await panel.getByRole("button", { name: "Collect accepted rows" }).click();
    await expect(panel.getByText("3 rows ready")).toBeVisible();
    const download = page.waitForEvent("download");
    await panel.getByRole("button", { name: "Download repair workbook" }).click();
    const downloaded = await download;
    const tables = await readExcel(new Uint8Array(await readFile((await downloaded.path())!)));
    expect(tables.map((table) => table.name)).toEqual(["Data", "Issues", "Summary"]);
    expect(String(tables[0].rows[1].qty)).toBe("3");
    expect(tables[0].rows[2].active).toBe("Yes");
    expect(requests.some((url) => /import-report-/.test(url))).toBe(true);
  });
}

test("Excel sheet selection and explicit unfamiliar-header mapping", async ({ page }) => {
  const workbook = await writeExcel([
    { name: "Read me", rows: [{ note: "Choose Inventory" }] },
    {
      name: "Inventory",
      rows: [
        { "Product ID": "A-1", Stock: 2, Enabled: "Yes" },
        { "Product ID": "A-2", Stock: 4, Enabled: "No" },
      ],
    },
  ]);
  await page.goto("./");
  const panel = page.locator("#react");
  await panel.getByLabel("Format").selectOption("excel");
  await panel.locator("input[type=file]").setInputFiles({
    name: "unknown-columns.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer: Buffer.from(workbook),
  });
  await panel.getByRole("button", { name: "Open file" }).click();
  await expect(panel.getByRole("status")).toContainText("2 sheet");
  await panel.getByLabel("Worksheet").selectOption("Inventory");
  await expect(panel.getByRole("columnheader", { name: "Product ID" })).toBeVisible();
  await panel.getByLabel("SKU source").selectOption("Product ID");
  await panel.getByLabel("Quantity source").selectOption("Stock");
  await panel.getByLabel("Active source").selectOption("Enabled");
  await panel.getByRole("button", { name: "Validate mapping" }).click();
  await expect(panel.getByRole("status")).toHaveText("2 accepted / 2 rows");
});

test("session cancellation terminates a busy worker and keeps the page responsive", async ({ page }) => {
  const { build } = await import("esbuild");
  const built = await build({
    stdin: {
      contents: "export {createImportSession} from 'sheetdelta-core/session'",
      resolveDir: process.cwd(),
    },
    bundle: true,
    format: "esm",
    write: false,
  });
  await page.route("**/session-client.js", (route) => route.fulfill({ contentType: "text/javascript", body: built.outputFiles[0].text }));
  await page.route("**/busy-session.js", (route) => route.fulfill({ contentType: "text/javascript", body: "onmessage=()=>{postMessage({ready:true});while(true){}}" }));
  await page.goto("./");
  const code = await page.evaluate(async () => {
    const { createImportSession } = await import(/* @vite-ignore */ "/session-client.js");
    const controller = new AbortController();
    const create = () => {
      const worker = new Worker("/busy-session.js");
      worker.addEventListener("message", () => controller.abort(), { once: true });
      return worker;
    };
    try {
      await createImportSession(create, "sku\nA-1", { format: "csv", signal: controller.signal });
    } catch (error: any) {
      return error.code;
    }
  });
  expect(code).toBe("ABORTED");
  await expect(page.getByRole("heading", { name: /Turn unfamiliar sheets/ })).toBeVisible();
});

test("mobile layout has no viewport overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
