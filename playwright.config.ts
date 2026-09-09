import { defineConfig } from '@playwright/test';
export default defineConfig({
  projects: [{ name: 'chromium' }, { name: 'firefox-import', testMatch: /import\.spec\.ts/, use: { browserName: 'firefox', launchOptions: {} } }, { name: 'webkit-import', testMatch: /import\.spec\.ts/, use: { browserName: 'webkit', launchOptions: {} } }],
  testDir: './tests/e2e', timeout: 30_000, fullyParallel: false, workers: 1,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5178', launchOptions: { executablePath: process.env.CHROME_PATH || (process.platform === 'darwin' && !process.env.CI ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined) }, trace: 'retain-on-failure' },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'npm run dev', url: 'http://127.0.0.1:5178', reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
