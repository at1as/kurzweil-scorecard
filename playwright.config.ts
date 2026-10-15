import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  outputDir: "work/test-results",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4100",
    ...devices["Desktop Chrome"],
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview",
    url: "http://127.0.0.1:4100",
    env: { PORT: "4100" },
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
