/**
 * ONE-SHOT MIGRATION SCRIPT — 2026-05-27 dz99.me EmDash rewrite
 *
 * This script was run once to import the legacy _posts/ (7 files) and _nippo/
 * (221 files) markdown sources into the EmDash archivedarticle and archivednippo
 * D1 collections. The source files have since been deleted from the repo (Phase 12
 * cleanup). All migrated content is live in D1/Cloudflare.
 *
 * DO NOT re-run this script unless you are rebuilding D1 from scratch (disaster
 * recovery after a D1 reset). For future content, use the MCP server or the
 * EmDash admin UI at /_emdash/admin — see docs/migration-runbook.md §1 for MCP
 * setup and PAT minting.
 *
 * Kept here as a historical record and D1 re-seed disaster-recovery script.
 *
 * ---
 *
 * Content migration script: imports legacy _posts/ and _nippo/ markdown files
 * into EmDash's archivedarticle and archivednippo collections.
 *
 * Approach:
 *   - portableText conversion: emdash/client's built-in markdownToPortableText (Option 3)
 *     The EmDashClient automatically converts markdown strings to portableText blocks
 *     via convertDataForWrite when fields have type "portableText".
 *   - Importer: EmDashClient JS API (Path B) with devBypass auth
 */

import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { EmDashClient, markdownToPortableText } from "emdash/client";
import type { PortableTextBlock } from "emdash/client";

// Re-export for tests
export { markdownToPortableText };

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ParsedDoc {
  title: string;
  date: string;
  body: string;
}

export interface ImportResult {
  kind: "article" | "nippo";
  slug: string;
  ok: boolean;
  reason?: string;
}

/** Importer interface: body is passed as markdown string.
 *  EmDashClientImporter lets the EmDashClient convert it to portableText blocks
 *  automatically (field type "portableText" + string value → converted on write).
 */
export interface Importer {
  upsertArchivedArticle(input: {
    title: string;
    slug: string;
    date: string;
    body: string; // markdown
  }): Promise<void>;
  upsertArchivedNippo(input: {
    title: string;
    slug: string;
    date: string;
    body: string; // markdown
  }): Promise<void>;
}

// ─────────────────────────────────────────────
// Parser
// ─────────────────────────────────────────────

export function parseFrontmatter(input: string): ParsedDoc {
  const { data, content } = matter(input);
  if (typeof data.title !== "string") throw new Error("frontmatter missing 'title'");
  // date may be a Date object (gray-matter parses ISO dates)
  const rawDate = data.date;
  let date: string;
  if (rawDate instanceof Date) {
    date = rawDate.toISOString().slice(0, 10);
  } else if (typeof rawDate === "string") {
    date = rawDate;
  } else {
    throw new Error("frontmatter missing 'date'");
  }
  return { title: data.title, date, body: content };
}

// ─────────────────────────────────────────────
// EmDash Client Importer (Path B)
// ─────────────────────────────────────────────

export class EmDashClientImporter implements Importer {
  private client: EmDashClient;

  constructor(baseUrl = "http://localhost:4321") {
    this.client = new EmDashClient({ baseUrl, devBypass: true });
  }

  async upsertArchivedArticle(input: {
    title: string;
    slug: string;
    date: string;
    body: string;
  }): Promise<void> {
    await this.upsert("archivedarticle", input.slug, {
      title: input.title,
      date: input.date,
      body: input.body,
      origin: `https://dz99.me/article/${input.slug}`,
    });
  }

  async upsertArchivedNippo(input: {
    title: string;
    slug: string;
    date: string;
    body: string;
  }): Promise<void> {
    await this.upsert("archivednippo", input.slug, {
      title: input.title,
      date: input.date,
      body: input.body,
      origin: `https://dz99.me/nippo/${input.slug}`,
    });
  }

  private async upsert(
    collection: string,
    slug: string,
    data: Record<string, unknown>
  ): Promise<void> {
    // Try to find existing item by slug (handles published/draft/scheduled states)
    let existingId: string | null = null;
    let existingRev: string | undefined;
    try {
      const existing = await this.client.get(collection, slug);
      existingId = existing.id;
      existingRev = existing._rev;
    } catch {
      // Not found in active states — might be trashed
    }

    if (existingId) {
      await this.client.update(collection, existingId, { data, _rev: existingRev });
      // Publish if not already published
      try {
        await this.client.publish(collection, existingId);
      } catch {
        // already published — ignore
      }
    } else {
      try {
        // EmDash API only accepts "draft" as status on create; publish separately.
        // The client converts markdown body strings to portableText blocks automatically.
        const item = await this.client.create(collection, { data, slug });
        await this.client.publish(collection, item.id);
      } catch (createErr) {
        const err = createErr as { code?: string; message?: string };
        // Slug may conflict because item was soft-deleted (trashed).
        // Restore it, then update with new data.
        if (err?.message?.includes("already exists")) {
          // Restore the trashed item first
          await this.client.restore(collection, slug);
          const restored = await this.client.get(collection, slug);
          await this.client.update(collection, restored.id, { data, _rev: restored._rev });
          try {
            await this.client.publish(collection, restored.id);
          } catch {
            // ignore — might already be published after restore
          }
        } else {
          throw createErr;
        }
      }
    }
  }
}

// ─────────────────────────────────────────────
// CLI Importer fallback (Path A)
// ─────────────────────────────────────────────

export class CLIImporter implements Importer {
  private wranglerDb: string;

  constructor(wranglerDb: string) {
    this.wranglerDb = wranglerDb;
  }

  async upsertArchivedArticle(input: {
    title: string;
    slug: string;
    date: string;
    body: string;
  }): Promise<void> {
    this.upsertViaCliSeed("archivedarticle", input.slug, {
      title: input.title,
      date: input.date,
      body: markdownToPortableText(input.body),
      origin: `https://dz99.me/article/${input.slug}`,
    });
  }

  async upsertArchivedNippo(input: {
    title: string;
    slug: string;
    date: string;
    body: string;
  }): Promise<void> {
    this.upsertViaCliSeed("archivednippo", input.slug, {
      title: input.title,
      date: input.date,
      body: markdownToPortableText(input.body),
      origin: `https://dz99.me/nippo/${input.slug}`,
    });
  }

  private upsertViaCliSeed(
    collection: string,
    slug: string,
    data: Record<string, unknown>
  ): void {
    const seedContent = {
      collections: [{ slug: collection, items: [{ slug, data, status: "published" }] }],
    };
    const tmpFile = `/tmp/emdash-seed-${collection}-${slug}.json`;
    fs.writeFileSync(tmpFile, JSON.stringify(seedContent, null, 2));
    const result = spawnSync(
      "pnpm",
      ["exec", "emdash", "seed", "--file", tmpFile, "--on-conflict", "update", "--database", this.wranglerDb],
      { stdio: "inherit" }
    );
    fs.unlinkSync(tmpFile);
    if (result.status !== 0) {
      throw new Error(`emdash seed failed for ${collection}/${slug}`);
    }
  }
}

// ─────────────────────────────────────────────
// Import directory
// ─────────────────────────────────────────────

export async function importDir(
  dir: string,
  kind: "article" | "nippo",
  importer: Importer
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    let slugForError = file;
    try {
      const { title, date, body } = parseFrontmatter(raw);
      const slug = kind === "article" ? file.replace(/\.md$/, "") : date;
      slugForError = slug;
      if (kind === "article") {
        await importer.upsertArchivedArticle({ title, slug, date, body });
      } else {
        await importer.upsertArchivedNippo({ title, slug, date, body });
      }
      results.push({ kind, slug, ok: true });
    } catch (e) {
      results.push({ kind, slug: slugForError, ok: false, reason: (e as Error).message });
    }
  }
  return results;
}

// ─────────────────────────────────────────────
// CLI entrypoint
// ─────────────────────────────────────────────

async function main() {
  const articlesDir = process.env.ARTICLES_DIR ?? "_posts";
  const nipposDir = process.env.NIPPOS_DIR ?? "_nippo";
  const baseUrl = process.env.EMDASH_URL ?? "http://localhost:4321";

  const importer = new EmDashClientImporter(baseUrl);

  console.log(`Importing articles from ${articlesDir}...`);
  const articleResults = await importDir(articlesDir, "article", importer);

  console.log(`Importing nippos from ${nipposDir}...`);
  const nippoResults = await importDir(nipposDir, "nippo", importer);

  const okArticles = articleResults.filter((r) => r.ok).length;
  const okNippos = nippoResults.filter((r) => r.ok).length;
  const failed = [...articleResults, ...nippoResults].filter((r) => !r.ok);

  console.log(
    `Imported ${okArticles}/${articleResults.length} articles, ${okNippos}/${nippoResults.length} nippos.`
  );

  if (failed.length > 0) {
    console.error("Failures:");
    for (const f of failed) console.error(`  ${f.kind} ${f.slug}: ${f.reason}`);
    process.exit(1);
  }

  if (articleResults.length !== 7) {
    console.warn(`Expected 7 articles, found ${articleResults.length}`);
  }
  if (nippoResults.length !== 221) {
    console.warn(`Expected 221 nippos, found ${nippoResults.length}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
