import { test, expect } from "@playwright/test";
test("home renders something", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/EmDash|Blog|dz99/i);
});
