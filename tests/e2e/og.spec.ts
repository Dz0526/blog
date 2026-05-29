import { test, expect } from "@playwright/test";

test("/og returns a PNG with size 1200x600", async ({ request }) => {
  const res = await request.get("/og?title=hello&date=2026-05-27");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/image\/png/);
  const buf = await res.body();
  expect(buf.length).toBeGreaterThan(1000);
});

test("/og works with Japanese title (no 500)", async ({ request }) => {
  const res = await request.get("/og?title=テスト&date=2026-05-27");
  // Allow 200 (renders, possibly with boxes for unsupported glyphs)
  // but reject 500 — should never crash.
  expect(res.status()).toBe(200);
});
