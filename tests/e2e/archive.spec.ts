import { test, expect } from "@playwright/test";

test("/archive/ renders both tabs", async ({ page }) => {
  await page.goto("/archive/");
  await expect(page.getByRole("heading", { name: "Archive" })).toBeVisible();
  await expect(page.getByText(/記事 \(/)).toBeVisible();
  await expect(page.getByText(/日報 \(/)).toBeVisible();
});

test("/archive/ tab counts are non-negative integers", async ({ page }) => {
  await page.goto("/archive/");

  // Extract the articles count from the label text e.g. "記事 (0)"
  const articlesLabel = await page.getByText(/記事 \(/).textContent();
  const nipposLabel = await page.getByText(/日報 \(/).textContent();

  const articlesMatch = articlesLabel?.match(/記事 \((\d+)\)/);
  const nipposMatch = nipposLabel?.match(/日報 \((\d+)\)/);

  expect(articlesMatch).not.toBeNull();
  expect(nipposMatch).not.toBeNull();

  const articlesCount = parseInt(articlesMatch![1], 10);
  const nipposCount = parseInt(nipposMatch![1], 10);

  // Counts are non-negative integers (0 pre-migration, populated post-migration)
  expect(articlesCount).toBeGreaterThanOrEqual(0);
  expect(nipposCount).toBeGreaterThanOrEqual(0);
});
