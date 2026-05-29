import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: process.env.BASE_URL || "http://localhost:4321" },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:4321",
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      },
});
