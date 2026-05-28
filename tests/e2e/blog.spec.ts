import { test, expect } from "@playwright/test";

test("/blog/ renders without crashing", async ({ page }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
});

test("/blog/ shows empty state when no published posts exist", async ({ page }) => {
  await page.goto("/blog/");
  const firstLink = page.locator("article a").first();
  const count = await firstLink.count();
  if (count === 0) {
    // No published posts — verify the empty-state message is shown
    await expect(page.getByText("まだ記事がありません。")).toBeVisible();
  }
});

test("a blog post route renders when at least one post exists", async ({ page }) => {
  await page.goto("/blog/");
  const firstLink = page.locator("article a").first();
  const count = await firstLink.count();
  if (count === 0) test.skip();
  await firstLink.click();
  await expect(page.locator("article h1")).toBeVisible();
});
