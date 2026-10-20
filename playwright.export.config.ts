import { defineConfig } from "@playwright/test";
import deployment from "./config/public-site.json";
export default defineConfig({
  testDir: "tests/export-browser",
  workers: 1,
  timeout: 30000,
  outputDir: "work/export-test-results",
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4101",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run export:preview",
    url: `http://127.0.0.1:4101${deployment.basePath}/`,
    env: { PORT: "4101" },
    reuseExistingServer: false,
  },
});
