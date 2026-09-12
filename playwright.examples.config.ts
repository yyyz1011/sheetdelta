import { defineConfig } from "@playwright/test";
export default defineConfig({
  outputDir: "artifacts/examples-test-results",
  testDir: "./tests/examples",
  workers: 1,
  timeout: 30000,
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  use: { baseURL: "http://127.0.0.1:5181/examples/" },
  webServer: {
    command:
      "npm exec -w @sheetdelta/import-examples -- vite preview --host 127.0.0.1 --port 5181",
    url: "http://127.0.0.1:5181/examples/",
    reuseExistingServer: false,
  },
});
