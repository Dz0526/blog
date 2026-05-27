import { test, expect } from "@playwright/test";

test("home shows hero, about, latest posts, contact", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByRole("heading", { name: "About" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Latest Posts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
});
