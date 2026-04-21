import { defineConfig, devices } from "@playwright/test";
import "dotenv/config";

/**
 * SPMAMS end-to-end test configuration.
 *
 * Defaults to running against the local Vite dev server at http://localhost:5173.
 * Override with BASE_URL=https://... to run against a deployed environment.
 *
 * Playwright automatically spawns the dev server via `webServer` unless
 * BASE_URL is provided (in which case we assume the target is already up).
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:5173";
const useLocalDevServer = !process.env.BASE_URL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // lifecycle tests depend on DB state created by earlier steps
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // serial to avoid race conditions on shared backend data
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    viewport: { width: 1440, height: 900 },
  },

  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],

  webServer: useLocalDevServer
    ? {
        command: "npm run dev",
        cwd: "../frontend",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
      }
    : undefined,
});
