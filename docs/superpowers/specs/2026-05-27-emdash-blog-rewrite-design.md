# Design: EmDash-based Blog Rewrite (dz99.me)

- **Date:** 2026-05-27
- **Author:** Dz0526 (ITO)
- **Status:** Approved by user; ready for implementation planning
- **Spec type:** Full-rewrite redesign

---

## 1. Goals

1. Replace the current Next.js 13 + Vercel blog with a new site built on **EmDash CMS** (Cloudflare's Astro-based, MCP-native CMS, v0.1.0, released April 2026).
2. Combine a **personal-profile landing page** with a **fresh blog** under the same domain `dz99.me`.
3. Treat all existing content (`_posts/*.md`, `_nippo/*.md`) as **archived material** kept at `/archive/*` on the same domain, with **301 redirects from old URLs** to preserve SEO.
4. Author new blog posts via **MCP** (from Claude / Cursor) as the primary workflow; EmDash's admin UI is a fallback.
5. Retire the Notion → markdown sync pipeline entirely.

## 2. Non-Goals / Out of Scope

- Continuing the daily `nippo` workflow (all existing nippos are archived; no new ones).
- Keyword-search API over nippo content (`/api/keyword`). The current substring search is retired with the nippo workflow.
- Migrating the existing Notion database into EmDash. The markdown files in `_nippo/` are the source of truth for the archive.
- Skills / Projects / Timeline / Now sections on the profile page (the user explicitly chose a minimal 4-section profile).
- Multi-language support.
- Comment system, analytics dashboards, newsletter signup, or any third-party integration not listed in §6.

## 3. Constraints & Key Decisions

| # | Decision | Rationale |
|---|---|---|
| C1 | **Tech stack:** Astro + EmDash on Cloudflare Workers | User-selected (Approach A — EmDash all-in). Motivation: agent-native MCP. |
| C2 | **Hosting:** Cloudflare Workers (compute) + D1 (content) + R2 (media) | EmDash is designed for this combination. |
| C3 | **EmDash version pinning:** pin to a specific commit/tag of v0.1.0 | EmDash is beta; floating reference would invite breakage. |
| C4 | **DNS:** `dz99.me` nameservers point to Cloudflare; **registrar stays at お名前.com** | Required for Workers Custom Domains on apex; registrar transfer is unnecessary. |
| C5 | **Email continuity:** preserve existing AWS-based MX/TXT/CNAME records by re-creating them in Cloudflare DNS **before** NS cutover | Avoid mail outage during migration. |
| C6 | **Visual direction:** retain the current `#66cdaa → #66cdda` mint gradient and Hachi Maru Pop / sans-serif feel; no design refresh | User explicitly requested keeping the current look. |
| C7 | **Archive strategy:** ingest all existing markdown into EmDash content types (no separate static folder) | User chose Approach A; one system manages everything. |
| C8 | **Profile sections:** Hero, About/Bio, Latest Posts, Contact only (no Skills/Projects/Timeline/Now) | User-selected after card review. |
| C9 | **MCP authentication:** D1-stored EmDash PAT (`ec_pat_*`) minted after first admin login via `/_emdash/api/admin/api-tokens`. Cloudflare Access service token sits in front as defense-in-depth. Both required by MCP clients (`CF-Access-Client-Id` + `CF-Access-Client-Secret` headers AND `Authorization: Bearer ec_pat_...`). | EmDash 0.14.x does not support static env-var tokens for MCP; PAT model is its actual auth mechanism. Cloudflare Access remains useful as an outer gate to limit who can even reach the inner EmDash auth flow. |
| C10 | **Admin authentication:** Cloudflare Access in front of EmDash's built-in auth on `/admin/*` (Google OAuth identity provider) | Defense in depth; avoids reliance on beta CMS auth alone. |

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  External actors                                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Visitors │  │ Claude/Cursor│  │ Owner (admin UI)     │   │
│  └────┬─────┘  └──────┬───────┘  └──────────┬───────────┘   │
└───────┼───────────────┼─────────────────────┼───────────────┘
        │ HTTPS         │ HTTPS + Bearer      │ HTTPS + CF Access
        ▼               ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Edge                                            │
│   • DNS (dz99.me, NS-only migration)                        │
│   • Cloudflare Access (gates /admin, /mcp)                  │
│   • WAF / TLS                                               │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Cloudflare Workers — EmDash app (Astro)                    │
│   • Public site routes  (/, /blog/*, /archive/*)            │
│   • Admin UI            (/admin/*)                          │
│   • MCP server          (/mcp/*)                            │
│   • OG image generator  (/og)                               │
│   • Redirects           (/article/* → /archive/article/*)   │
│   • Plugin runtime      (capability-sandboxed)              │
└───────┬──────────────────────┬───────────────────┬──────────┘
        ▼                      ▼                   ▼
   ┌─────────┐            ┌─────────┐         ┌─────────┐
   │  D1     │            │  R2     │         │  KV     │
   │ (SQLite)│            │ (media) │         │(optional│
   │ content │            │ images  │         │ cache)  │
   └─────────┘            └─────────┘         └─────────┘
```

## 5. Content Model

Four content types are defined in EmDash. (Each type maps to an EmDash content definition file; exact syntax follows EmDash conventions — see EmDash docs for the chosen pinned version.)

### 5.1 `Profile` (singleton)
```
heroTitle:       string         # e.g. "Dz0526 / ITO"
heroSubtitle:    string         # one-liner
bio:             markdown       # About / Bio (a few paragraphs)
avatar:          image (R2)
contactLinks:    array<{ label, url, icon }>
```

### 5.2 `BlogPost`
```
title:           string
slug:            string  (unique; user-editable)
date:            date
excerpt:         string  (≤ 200 chars)
body:            markdown
tags:            string[]  (optional)
coverImage:      image (R2)  (optional)
published:       bool
```

### 5.3 `ArchivedArticle` (旧 `_posts/*.md` の移行先, 7 件)
```
title:           string
slug:            string  (must equal original filename slug)
date:            date
body:            markdown
origin:          literal "article"
```

### 5.4 `ArchivedNippo` (旧 `_nippo/*.md` の移行先, 221 件)
```
title:           string  (from frontmatter `title`; may be informal)
slug:            string  (must equal original date, e.g. "2023-09-12")
date:            date
body:            markdown
origin:          literal "nippo"
```

Separate types (rather than a unified `Post` with a `category` enum) are chosen so authoring UX in the admin and the schema can evolve independently — `BlogPost` will likely grow (tags, cover image, SEO meta) while the archive types are immutable.

## 6. URL & Routing

| Path | Purpose | Source | Auth |
|---|---|---|---|
| `/` | Home (Hero + About + Latest Posts + Contact) | `Profile` + latest N `BlogPost` | public |
| `/blog/` | Blog index (paginated) | `BlogPost[]` | public |
| `/blog/<slug>` | Individual post | `BlogPost` | public |
| `/archive/` | Archive index, two tabs (記事 / 日報), year-grouped | `ArchivedArticle[]` + `ArchivedNippo[]` | public |
| `/archive/article/<slug>` | Archived article | `ArchivedArticle` | public |
| `/archive/nippo/<date>` | Archived nippo | `ArchivedNippo` | public |
| `/og?title=...&date=...` | OG image (dynamic) | derived | public |
| `/sitemap.xml` | Sitemap | derived | public |
| `/robots.txt` | Indexing rules (`Disallow: /admin/`, `/mcp/`) | static | public |
| `/admin/*` | EmDash admin UI | — | Cloudflare Access |
| `/mcp/*` | MCP endpoint | — | Bearer token |

### 6.1 301 redirects (SEO preservation)
- `/article/<slug>` → `/archive/article/<slug>`
- `/nippo/<date>` → `/archive/nippo/<date>`

Implemented as Worker routing rules in the Astro/EmDash app. Validated by an automated test that crawls a list of all known old URLs and asserts each returns `301` to the expected new URL.

## 7. Theme / Visual Spec

### 7.1 Design tokens
```
--color-accent-100: #66cdaa
--color-accent-500: #7fffd4
--color-accent-gradient: linear-gradient(to right, #66cdaa 0%, #66cdda 100%)
--font-sans:    system-ui sans-serif stack
--font-display: "Hachi Maru Pop", cursive
```

### 7.2 Component-level guidance
- **Hero block** uses the accent gradient as a background, white card on top — matching the OG image visual identity.
- Headings render in the system sans by default; Hachi Maru Pop is reserved for emphasis (e.g., site title, hero, occasional accent) to preserve the "playful but readable" balance the current site has.
- No CSS framework (no Tailwind, no Chakra). Astro component-scoped `<style>` blocks + a single `tokens.css` for design tokens.
- Code blocks: keep `zenn-content-css` style (the visitor expectation set by the current site).

### 7.3 OG image
Reproduce the existing layout: green gradient background, white card with title (large), date (small), avatar circle, site name `dz99.me`. Migrate from `@vercel/og` to a Cloudflare-compatible library (`workers-og` is the leading candidate). Rendered at 1200×600.

## 8. Migration Plan

### 8.1 Phase ordering (no big-bang switch)
1. **Build new site locally** on a fresh branch, deploy to a Workers preview URL (`*.workers.dev`).
2. **Run content migration script** (see §8.2) populating D1.
3. **Smoke test** the preview: every old URL returns the expected `301`; every archived post renders; OG images render; admin loads; MCP endpoint responds to a token-auth handshake.
4. **DNS preparation** (see §8.3) — copy all existing DNS records into Cloudflare *before* changing NS.
5. **NS cutover** in お名前.com management console.
6. **Post-cutover verification**: mail flow (send a test from outside, receive on AWS-side mailbox), HTTPS site reachable, redirects active.
7. **Decommission Vercel** once a 7-day soak passes.

### 8.2 Content migration
A one-shot Node/TypeScript script (`tools/migrate-to-emdash.ts`) that:
1. Reads every file in `_posts/` and `_nippo/` (227 files total).
2. Parses frontmatter with `gray-matter`.
3. Inserts into EmDash via either:
   - EmDash's import API (preferred if available in v0.1.0), or
   - direct D1 inserts following EmDash's documented schema (fallback).
4. For `_posts/*.md`: creates `ArchivedArticle` records, `slug` = filename without `.md`.
5. For `_nippo/*.md`: creates `ArchivedNippo` records, `slug` = date string in filename.
6. Verifies count matches input (7 + 221 = 228) and exits non-zero on mismatch.

The script is idempotent: re-running on a fresh D1 yields the same result; running on a populated D1 is a no-op via `INSERT … ON CONFLICT DO NOTHING` (or EmDash equivalent).

### 8.3 DNS migration (お名前.com → Cloudflare NS)

**Pre-cutover (in Cloudflare dashboard):**
1. Add `dz99.me` as a zone to a Cloudflare account.
2. Cloudflare auto-imports records via WHOIS scan; **manually verify** that every record from お名前.com's DNS panel is present in Cloudflare. Particularly:
   - `MX` (AWS SES inbound / WorkMail)
   - `TXT` — SPF (`v=spf1 include:amazonses.com ~all` and any others)
   - `TXT` — DMARC
   - `CNAME` × 3 — SES DKIM (`<selector>._domainkey.dz99.me` → `<selector>.dkim.amazonses.com`)
   - any other `A` / `CNAME` records actively used
3. Set up Workers Custom Domains binding for `dz99.me` and `www.dz99.me`.

**Cutover:**
4. In お名前.com management console, set nameservers to the two assigned by Cloudflare (e.g. `xyz1.ns.cloudflare.com`, `xyz2.ns.cloudflare.com`).
5. Wait for propagation (typically 1–2 hours, up to 48 in extreme cases). Monitor with `dig` from multiple resolvers.

**Post-cutover:**
6. Send a test email from an outside account to confirm MX is intact.
7. Visit `https://dz99.me/` and validate TLS, redirects, and content.

### 8.4 Rollback
If the cutover causes problems within 48 hours, revert nameservers in お名前.com to the previous values. Cloudflare records remain intact; the rollback is one DNS change away.

## 9. Risk Mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| EmDash v0.1.0 has breaking changes between releases | High | Pin to a specific commit; do not auto-update. Subscribe to EmDash GitHub releases. |
| EmDash has critical bugs blocking authoring | Medium | Admin UI fallback if MCP breaks; direct D1 inspection as last resort. |
| AWS mail flow breaks during DNS cutover | Medium | All MX/SPF/DKIM/DMARC records are re-created in Cloudflare DNS *before* NS change; verified by inbound test mail post-cutover. |
| Old URL inbound links break | High if unhandled | 301 redirects covered by automated test on every deploy. |
| OG image rendering differs from current site | Medium | Visual regression check (manual screenshot diff) for at least 3 representative posts before cutover. |
| Workers cold-start / cost surprise | Low | Personal-traffic site; usage stays well below free-tier thresholds. Set Cloudflare billing alert at $5/month. |
| Cloudflare Access misconfiguration locks owner out of `/admin` | Low but painful | Configure a backup access method (e.g., secondary email in the Access policy) and document recovery in the repo. |

## 10. Acceptance Criteria

The rewrite is "done" when **all** of the following are true:

1. `https://dz99.me/` loads in under 1 s on a fast connection, showing Hero + About + Latest Posts + Contact.
2. Every URL in §6 returns the documented status code; admin and MCP enforce auth.
3. Every old URL of the form `/article/<slug>` (7 of them) returns `301` to its new `/archive/article/<slug>`, and the destination renders the original markdown content correctly.
4. Every old URL of the form `/nippo/<date>` (221 of them) returns `301` to its new `/archive/nippo/<date>`, and the destination renders.
5. OG images at `/og?title=...&date=...` render with the existing visual identity.
6. From a freshly configured Claude desktop / Cursor with the MCP token, a new `BlogPost` can be drafted, previewed, and published end-to-end.
7. After NS cutover, an inbound email to the owner's AWS-managed mailbox is received within 5 minutes.
8. The Notion sync workflow (`.github/workflows/notion.yml`), the `tools/notion.ts` / `tools/generate-nippo.ts` / `tools/generate-keyword.ts` scripts, and the `_keyword/keyword.json` file are removed from the repo.
9. The pinned EmDash version is recorded in `package.json` / `pnpm-lock.yaml` and in this design document.

## 11. Repository Layout (target)

```
/
├─ src/                       # Astro + EmDash app source
│  ├─ content/                # EmDash content type definitions
│  ├─ pages/
│  ├─ components/
│  ├─ layouts/
│  └─ styles/tokens.css
├─ public/
├─ tools/
│  └─ migrate-to-emdash.ts    # one-shot content migration
├─ docs/
│  └─ superpowers/specs/      # design docs (this file)
├─ wrangler.toml              # Cloudflare config
├─ astro.config.mjs
└─ package.json
```

The directories `_posts/`, `_nippo/`, `_keyword/`, the old `src/` (Next.js), and `tools/notion.ts` / `tools/generate-nippo.ts` / `tools/generate-keyword.ts` are removed once migration is verified.

## 12. Deferred to implementation planning

The following are intentionally not pinned in this design and will be resolved during the writing-plans phase, where the EmDash v0.1.0 source / docs are the authoritative reference:

- Exact content-type definition syntax (TypeScript schema files vs config).
- MCP server registration / tool surface naming.
- Wrangler binding names for D1, R2, KV.
- `www.dz99.me` vs apex canonicalization (default plan: apex canonical, `www` → 301 to apex).
- Pagination size on `/blog/` and `/archive/` (default plan: 10 / 30 respectively).
