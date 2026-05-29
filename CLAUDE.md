# dz99.me — EmDash + Cloudflare rewrite

Personal site for Dz0526 (ITO) at **dz99.me**. Built with Astro + EmDash 0.14.0 on Cloudflare Workers (D1 + R2). Combines a profile landing page with a blog and `/archive/*` routes for 228 pieces of legacy content imported from the old Next.js/Notion stack.

## Commands

```bash
pnpm dev                                # Astro dev server (localhost:4321)
pnpm build                              # Production build
pnpm test                               # Vitest unit tests
pnpm test:e2e                           # Playwright E2E tests (honors BASE_URL)
pnpm typecheck                          # astro check + tsc --noEmit
pnpm exec wrangler deploy               # Deploy to Cloudflare Workers
pnpm exec emdash types                  # Regenerate emdash-env.d.ts from schema
pnpm exec emdash seed --file seed/seed.json --on-conflict update
                                        # Seed / update local D1 from seed.json
pnpm migrate                            # One-shot legacy import (see tools/migrate-to-emdash.ts)
```

The admin UI is at `http://localhost:4321/_emdash/admin` locally and `https://dz99.me/_emdash/admin` in production.

## Architecture

Astro runs in SSR mode (`output: "server"`) via the `@astrojs/cloudflare` adapter. There are no static routes for CMS content — every page handler runs in the Worker at request time.

Content types are defined in `seed/seed.json`: collections (`profile`, `blogpost`, `archivedarticle`, `archivednippo`, `posts`, `pages`), taxonomies, menus, and widgets. EmDash stores all content in a Cloudflare D1 SQLite database at runtime. TypeScript types for all collections are auto-generated into `emdash-env.d.ts` by `pnpm exec emdash types` (and by the dev server on startup). **Never hand-edit `emdash-env.d.ts`.**

All data access goes through `src/lib/content.ts`. This module handles snake_case ↔ camelCase translation (EmDash field names use snake_case; TypeScript interfaces use camelCase), URL safety via `ALLOWED_URL_PROTOCOLS` (`/^(https?:|mailto:)/i`), and exports the primary query helpers: `getEmDashEntry` / `getEmDashCollection` wrappers for each collection (`getProfile`, `listBlogPosts`, `getBlogPostBySlug`, `listArchivedArticles`, `getArchivedArticleBySlug`, `listArchivedNippos`, `getArchivedNippoByDate`). PortableText body fields are rendered in Astro pages using `<PortableText>` from `"emdash/ui"`.

For reference: `docs/emdash-discovery.md` is the authoritative doc for EmDash API conventions discovered during setup (versions, field types, slug rules, etc.). `docs/superpowers/specs/2026-05-27-emdash-blog-rewrite-design.md` is the full design spec for this rewrite.

## Key Files

| File | Purpose |
|---|---|
| `astro.config.mjs` | Astro + EmDash integration, D1/R2 bindings, fonts |
| `wrangler.jsonc` | Cloudflare Workers config (Worker name, D1 id, R2 bucket, bindings) |
| `seed/seed.json` | Schema definition + seed content — source of truth for collections and site settings |
| `emdash-env.d.ts` | Auto-generated TypeScript types (do not edit by hand) |
| `src/lib/content.ts` | Data layer — all CMS queries go here |
| `src/pages/` | Astro pages, all server-rendered |
| `tools/migrate-to-emdash.ts` | One-shot legacy import script (historical; kept for D1 disaster recovery) |
| `docs/migration-runbook.md` | Deploy, DNS cutover, MCP setup, post-cutover checklist |
| `docs/emdash-discovery.md` | EmDash API conventions — start here when unsure about an API |

## Conventions

- **Pin EmDash deps exactly** — no `^` or `~` on `emdash`, `@emdash-cms/*`. Patch upgrades can contain breaking schema changes.
- **Snake_case field slugs** — EmDash's schema validator requires snake_case for field names in `seed.json`.
- **`slug` is reserved** — do not declare a field named `slug` in any collection; it is managed by EmDash.
- **Sandbox / Marketplace / Worker Loader are disabled** — they require the Cloudflare Workers Paid plan ($5/mo). The binding is present but features will not work on the free plan. Re-enable only after upgrading.
- **URL safety** — all URL-shaped values read from the CMS (contact links, cover images) must pass through `ALLOWED_URL_PROTOCOLS` before being emitted to HTML.
- **Tests** — Vitest for unit tests (run with `pnpm test`). Playwright for E2E (run with `pnpm test:e2e`). `pnpm test:e2e` reads `process.env.BASE_URL` — set it to a deployed preview URL to test against production.

## Things to Avoid

- **Do not hand-edit `emdash-env.d.ts`** — regenerated automatically; manual edits are overwritten on next `pnpm exec emdash types` or dev server start.
- **Do not bypass `src/lib/content.ts`** — pages must not call `getEmDashEntry` / `getEmDashCollection` directly; go through the wrappers in `content.ts` to keep URL safety and mapping in one place.
- **Do not store new MCP tokens as Wrangler env vars** — EmDash PATs live in D1. Mint them via `/_emdash/admin` → Settings → API Tokens (passkey login required). See `docs/migration-runbook.md` §1 for the full MCP setup flow.
- **Do not re-add the Notion sync workflow** — the old Notion → markdown → GitHub PR pipeline has been removed and the content is now in D1.
- **Do not auto-upgrade EmDash** — pin the version and test schema compatibility before upgrading. Run `pnpm exec emdash types` after any upgrade and confirm `emdash-env.d.ts` still compiles.
- **Do not use `getStaticPaths()` for CMS content** — all content pages are SSR only.
