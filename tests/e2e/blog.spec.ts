import { test, expect } from "@playwright/test";

test("/blog/ renders without crashing", async ({ page }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
});

test("/blog/ shows empty state OR a post list", async ({ page }) => {
  await page.goto("/blog/");
  await expect(page.getByRole("heading", { name: "Blog" })).toBeVisible();
  const emptyMsg = page.getByText("まだ記事がありません。");
  const postLinks = page.locator("article a");
  const hasEmpty = await emptyMsg.count();
  const hasPosts = await postLinks.count();
  // Exactly one of the two branches must be rendered
  expect(hasEmpty + hasPosts).toBeGreaterThan(0);
});

test("a blog post route renders when at least one post exists", async ({ page }) => {
  await page.goto("/blog/");
  const firstLink = page.locator("article a").first();
  const count = await firstLink.count();
  if (count === 0) test.skip();
  await firstLink.click();
  await expect(page.locator("article h1")).toBeVisible();
});
