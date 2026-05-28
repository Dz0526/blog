import { describe, it, expect } from "vitest";
import { mapOldUrl } from "../../src/lib/redirects";

describe("mapOldUrl", () => {
  it("maps /article/<slug> to /archive/article/<slug>", () => {
    expect(mapOldUrl("/article/first-aur-contributing")).toBe("/archive/article/first-aur-contributing");
  });
  it("maps /nippo/<date> to /archive/nippo/<date>", () => {
    expect(mapOldUrl("/nippo/2023-01-06")).toBe("/archive/nippo/2023-01-06");
  });
  it("returns null for unrelated paths", () => {
    expect(mapOldUrl("/blog/something")).toBeNull();
    expect(mapOldUrl("/archive/article/foo")).toBeNull();
    expect(mapOldUrl("/")).toBeNull();
  });
  it("handles trailing slash on old URLs", () => {
    expect(mapOldUrl("/article/foo/")).toBe("/archive/article/foo");
    expect(mapOldUrl("/nippo/2023-01-06/")).toBe("/archive/nippo/2023-01-06");
  });
});
