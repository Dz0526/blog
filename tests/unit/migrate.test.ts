import { describe, it, expect } from "vitest";
import { parseFrontmatter, markdownToPortableText } from "../../tools/migrate-to-emdash";

describe("parseFrontmatter", () => {
  it("extracts title and date from a typical _posts file", () => {
    const md = `---\ntitle: 'first AUR contributing'\ndate: '2022-04-22'\n---\n\nbody here`;
    const parsed = parseFrontmatter(md);
    expect(parsed.title).toBe("first AUR contributing");
    expect(parsed.date).toBe("2022-04-22");
    expect(parsed.body.trim()).toBe("body here");
  });

  it("extracts from a typical _nippo file", () => {
    const md = `---\ntitle: 'kami'\ndate: '2023-01-10'\n---\n# やったこと\n- foo`;
    const parsed = parseFrontmatter(md);
    expect(parsed.title).toBe("kami");
    expect(parsed.date).toBe("2023-01-10");
    expect(parsed.body).toContain("# やったこと");
  });
});

describe("markdownToPortableText", () => {
  it("converts a paragraph", () => {
    const blocks = markdownToPortableText("Hello world");
    expect(blocks.length).toBeGreaterThanOrEqual(1);
    const block = blocks[0] as { _type: string; style?: string; children?: { text?: string }[] };
    expect(block._type).toBe("block");
    const text = block.children?.map((c) => c.text ?? "").join("") ?? "";
    expect(text).toContain("Hello world");
  });

  it("converts headings (h1, h2)", () => {
    const blocks = markdownToPortableText("# Heading One\n\n## Heading Two");
    const styles = blocks
      .filter((b): b is { _type: string; style: string } => b._type === "block")
      .map((b) => b.style);
    expect(styles).toContain("h1");
    expect(styles).toContain("h2");
  });

  it("converts unordered lists", () => {
    const blocks = markdownToPortableText("- item a\n- item b");
    const listBlocks = blocks.filter((b) => (b as { listItem?: string }).listItem === "bullet");
    expect(listBlocks.length).toBeGreaterThanOrEqual(1);
  });

  it("converts ordered lists", () => {
    const blocks = markdownToPortableText("1. first\n2. second");
    const listBlocks = blocks.filter((b) => (b as { listItem?: string }).listItem === "number");
    expect(listBlocks.length).toBeGreaterThanOrEqual(1);
  });

  it("converts inline bold", () => {
    const blocks = markdownToPortableText("Text with **bold** here");
    const block = blocks[0] as { children?: { marks?: string[] }[] };
    const hasBold = block.children?.some((c) => c.marks?.includes("strong")) ?? false;
    expect(hasBold).toBe(true);
  });

  it("converts inline italic", () => {
    const blocks = markdownToPortableText("Text with _italic_ here");
    const block = blocks[0] as { children?: { marks?: string[] }[] };
    const hasItalic = block.children?.some((c) => c.marks?.includes("em")) ?? false;
    expect(hasItalic).toBe(true);
  });

  it("converts links", () => {
    const blocks = markdownToPortableText("[click here](https://example.com)");
    const block = blocks[0] as { markDefs?: { _type: string; href?: string }[]; children?: { marks?: string[] }[] };
    const hasLink = block.markDefs?.some((m) => m._type === "link" && m.href?.includes("example.com")) ?? false;
    expect(hasLink).toBe(true);
  });

  it("converts code blocks", () => {
    const blocks = markdownToPortableText("```\nconst x = 1;\n```");
    // Code blocks may be represented as a block with style 'code' or _type 'code'
    const hasCode = blocks.some(
      (b) => (b as { _type: string; style?: string })._type === "code" ||
             (b as { _type: string; style?: string }).style === "code" ||
             (b as { _type: string; language?: string }).language !== undefined
    );
    expect(hasCode).toBe(true);
  });
});
