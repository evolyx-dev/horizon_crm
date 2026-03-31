import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.FRAPPE_URL || "http://localhost:8000";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "../reports/html" }],
    [
      "allure-playwright",
      {
        outputFolder: "./allure-results",
        suiteTitle: "Horizon CRM E2E",
        environmentInfo: {
          BASE_URL,
          NODE_VERSION: process.version,
        },
      },
    ],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "on",
    video: "on",
    ignoreHTTPSErrors: true,
  },

  projects: [
    { name: "setup", testMatch: /global-setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /10-multi-tenant/,
      dependencies: ["setup"],
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"] },
      testIgnore: /10-multi-tenant/,
      dependencies: ["setup"],
    },
    {
      name: "multi-tenant",
      testMatch: /10-multi-tenant\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "teardown",
      testMatch: /global-teardown\.ts/,
      dependencies: ["chromium", "mobile", "multi-tenant"],
    },
  ],
});
