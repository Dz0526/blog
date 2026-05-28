import { test, expect } from "@playwright/test";

const samples = [
  { from: "/article/first-aur-contributing", to: "/archive/article/first-aur-contributing" },
  { from: "/nippo/2023-01-06", to: "/archive/nippo/2023-01-06" },
];

for (const { from, to } of samples) {
  test(`${from} → ${to}`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status()).toBe(301);
    expect(res.headers().location).toBe(to);
  });
}

test("destination of /article/* 301 actually renders", async ({ page }) => {
  await page.goto("/archive/article/first-aur-contributing");
  await expect(page.locator("h1")).toBeVisible();
});

test("destination of /nippo/* 301 actually renders", async ({ page }) => {
  await page.goto("/archive/nippo/2023-01-06");
  await expect(page.locator("h1")).toBeVisible();
});

test("/sitemap.xml returns XML with the home URL", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/xml/);
  const body = await res.text();
  expect(body).toContain("https://dz99.me/");
});
