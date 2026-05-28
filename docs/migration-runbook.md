# Migration Runbook — dz99.me EmDash rewrite

## 1. MCP client setup (Claude Desktop / Claude Code / Cursor)

Once the site is deployed (Phase 11), the MCP endpoint is available at:
- **Local dev**: `http://localhost:4321/_emdash/api/mcp`
- **Production**: `https://dz99.me/_emdash/api/mcp`

### Authentication

EmDash MCP auth uses **Personal Access Tokens (PATs)** stored in the D1 database — NOT a static environment variable. A bare random token (e.g. from `openssl rand -hex 32`) is always rejected. Tokens must have the `ec_pat_` prefix and be registered in the database.

There is no `MCP_TOKEN` Wrangler secret to configure. The token lives in D1.

#### Minting a PAT (production)

1. Log in to `https://dz99.me/_emdash/admin` with your passkey.
2. Navigate to **Settings → API Tokens → Create Token**.
3. Set a name (e.g. `claude-desktop-mcp`) and select scopes:
   - `content:read`, `content:write`
   - `media:read`, `media:write`
   - `schema:read`
   - `taxonomies:manage`, `menus:manage`
   - `settings:read`
4. Copy the shown `ec_pat_*` token immediately — it cannot be retrieved again.

#### Minting a PAT (local dev, scripted)

```bash
# Step 1: create a dev admin session
curl -c /tmp/emdash-dev.cookies http://localhost:4321/_emdash/api/auth/dev-bypass

# Step 2: create the PAT (shown once — save it)
curl -X POST http://localhost:4321/_emdash/api/admin/api-tokens \
  -b /tmp/emdash-dev.cookies \
  -H "X-EmDash-Request: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "mcp-dev",
    "scopes": [
      "content:read","content:write",
      "media:read","media:write",
      "schema:read","schema:write",
      "taxonomies:manage","menus:manage",
      "settings:read","settings:manage"
    ]
  }'
# Copy ec_pat_* from data.token in the response
```

### OAuth flow (alternative — for MCP clients that support OAuth 2.0 device flow)

EmDash also supports OAuth 2.0 authorization code and device flows. The protected-resource metadata is at:

```
GET /.well-known/oauth-protected-resource
```

Response announces `authorization_servers: ["<origin>/_emdash"]`. Use the device flow via:
- `POST /_emdash/api/oauth/device/code` — initiate
- `POST /_emdash/api/oauth/device/token` — poll for token

MCP clients that walk the OAuth flow automatically (e.g. future versions of Claude Desktop with OAuth support) can use this path instead of a pre-minted PAT.

### Required HTTP headers

When calling the MCP endpoint directly (not via an MCP client library):
```
Authorization: Bearer ec_pat_<your-token>
Content-Type: application/json
Accept: application/json, text/event-stream
```

Omitting `Accept: application/json, text/event-stream` returns HTTP 406.

### Claude Desktop config

> **Note:** Once Cloudflare Access is configured (Phase 11, see [section 2.3](#23-updated-claude-desktop--cursor-config)), the config below must be extended with CF-Access headers. Section 2.3 is the canonical production config. Use the snippet below only for local dev (no Cloudflare Access in front of `localhost`).

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) and add:

```json
{
  "mcpServers": {
    "dz99-emdash-dev": {
      "url": "http://localhost:4321/_emdash/api/mcp",
      "headers": {
        "Authorization": "Bearer ec_pat_<your-dev-token>",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

(Replace `ec_pat_<your-dev-token>` with the dev PAT. For production, use the config in section 2.3.)

### Verification

Once configured:
1. Open Claude Desktop / Cursor; verify `dz99-emdash` appears in the MCP server list.
2. Ask Claude: "Use the dz99-emdash MCP to list available collections." — should return collections including `profile`, `blogpost`, `archivedarticle`, `archivednippo`, `posts`, `pages`.
3. Ask Claude: "Create a draft BlogPost titled 'Test post' with body 'Hello world'." — should succeed; verify in `/_emdash/admin`.

(This verification happens after Phase 11 cutover; until then, only the local dev endpoint is reachable.)

---

## 2. Cloudflare Access policies for `/_emdash/admin` and `/_emdash/api/mcp`

Cloudflare Access provides a defense-in-depth layer in front of EmDash's own auth. Configure two Access applications via the Cloudflare Zero Trust dashboard (`https://one.dash.cloudflare.com → Access → Applications`).

### 2.1 App: EmDash admin UI

**Settings:**
- Application type: **Self-hosted**
- Application name: `dz99.me admin`
- Application domain: `dz99.me`
- Application path: `/_emdash/admin*`
- Session duration: `24 hours`

**Identity provider:**
- Add **Google OAuth** as an IdP (Cloudflare Zero Trust → Settings → Authentication → Add new) if not already present.

**Policies:**
1. Primary: **Allow**
   - Include: Emails: `shining.sun0526@gmail.com` (or whichever Google account you sign in with)
2. Backup (optional but recommended): **Allow**
   - Include: Emails: `<backup-email@example.com>`
   - Document where to find this backup email so future-self doesn't get locked out.

After saving, visit `https://dz99.me/_emdash/admin` — Cloudflare Access should intercept and present Google sign-in BEFORE EmDash's own passkey flow.

### 2.2 App: MCP endpoint

**Settings:**
- Application type: **Self-hosted**
- Application name: `dz99.me MCP`
- Application domain: `dz99.me`
- Application path: `/_emdash/api/mcp*`
- Session duration: `24 hours` (clients re-auth daily)

**Identity provider:**
- Use **Service Tokens** (Cloudflare Zero Trust → Access → Service Auth → Service Tokens → Create Service Token).
- Issue ONE service token; record the Client ID and Client Secret securely (they're only shown once). Name it e.g. `claude-cursor-mcp`.

**Policies:**
1. **Allow** — Include → Service Auth → select the `claude-cursor-mcp` service token.

**MCP client headers** — both layers of auth must be present:
- `CF-Access-Client-Id: <issued-cf-id>` (Cloudflare Access outer gate)
- `CF-Access-Client-Secret: <issued-cf-secret>` (Cloudflare Access outer gate)
- `Authorization: Bearer ec_pat_<…>` (EmDash inner gate — minted post-deploy in admin UI)
- `Accept: application/json, text/event-stream` (MCP protocol requirement)
- `Content-Type: application/json` (for POST)

### 2.3 Updated Claude Desktop / Cursor config

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) and add:

```json
{
  "mcpServers": {
    "dz99-emdash": {
      "url": "https://dz99.me/_emdash/api/mcp",
      "headers": {
        "CF-Access-Client-Id": "<cf-client-id>",
        "CF-Access-Client-Secret": "<cf-client-secret>",
        "Authorization": "Bearer ec_pat_<token>",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

(Keep secrets in a password manager. Never commit `claude_desktop_config.json` with real secrets to a public repo.)

### 2.4 Recovery from lock-out

If Google OAuth fails or the primary email is unreachable, you can disable the Access app via the Cloudflare API (requires API token saved in a password manager separately):

```bash
curl -X DELETE \
  -H "Authorization: Bearer <CF_API_TOKEN>" \
  "https://api.cloudflare.com/client/v4/accounts/<account-id>/access/apps/<app-id>"
```

(Document your `<account-id>` and the two app IDs in your password manager once they're created.)

---

## 3. Workers deploy + DNS migration

### 3.1 Cloudflare resource provisioning (one-time)

**Prerequisites:**
- `wrangler login` completed (interactive — user must do this themselves; can't be scripted).

**Create D1 and R2 resources:**

```bash
pnpm exec wrangler d1 create dz99-blog
# Returns a database_id like "abc-123-…". Copy it.

pnpm exec wrangler r2 bucket create dz99-blog-media
# No ID returned — bucket name is "dz99-blog-media".
```

> **KV:** The current `wrangler.jsonc` scaffold does not declare a `kv_namespaces` binding, so skip `wrangler kv namespace create` unless you add a KV binding later.

**Update `wrangler.jsonc`** — replace the placeholder names/IDs with the real ones:

```jsonc
{
  // ... existing config ...
  "name": "dz99-blog",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "dz99-blog",
      "database_id": "<paste-d1-id-from-create-output>"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA",
      "bucket_name": "dz99-blog-media"
    }
  ]
}
```

> **Binding names (`DB`, `MEDIA`, `LOADER`) must not be renamed** — they are referenced in `worker-configuration.d.ts` and the EmDash runtime.

**Seed the remote D1 database (schema + content):**

EmDash's `emdash seed` CLI operates only on a local SQLite file. To populate the remote Cloudflare D1 database, export the local DB to SQL and import it:

```bash
# Step 1: export the fully-migrated local database
pnpm exec wrangler d1 export dz99-blog --local --output=local-export.sql
# This exports the *local* .wrangler/ D1 file.
# If the local DB hasn't been seeded yet, run the seed first:
#   pnpm exec emdash seed seed/seed.json --on-conflict update

# Step 2: push the export to the remote (production) D1
pnpm exec wrangler d1 execute dz99-blog --remote --file=local-export.sql
```

> **Alternative (re-run migration against remote):** The `tools/migrate-to-emdash.ts` script uses `EmDashClient` with dev-bypass auth against `localhost:4321`. It does NOT support a `--remote` flag. The local-export → remote-import path above is the correct approach.

**Deploy to Workers:**

```bash
pnpm run deploy
# Equivalent to: astro build && wrangler deploy
```

Expected output: `Deployed to https://<worker-name>.<account>.workers.dev`.

**Smoke-test the preview URL:**

```bash
BASE_URL=https://<worker-name>.<account>.workers.dev pnpm test:e2e
```

(`playwright.config.ts` reads `process.env.BASE_URL` for the base URL.)

---

### 3.2 Cloudflare DNS pre-config (BEFORE NS cutover)

1. In the Cloudflare dashboard: **Add a Site** → enter `dz99.me`. Pick the free plan. Wait for the automatic DNS scan to complete.
2. Cloudflare imports records via WHOIS/DNS scan. **Manually verify** every existing record from お名前.com is present in Cloudflare DNS. Open both panels side-by-side:
   - `MX` — AWS SES / WorkMail inbound
   - `TXT` SPF: `v=spf1 include:amazonses.com ~all` (and any others)
   - `TXT` DMARC
   - `CNAME` × 3 for SES DKIM (selectors look like `<random>._domainkey.dz99.me`)
   - Any other `A` / `CNAME` for active subdomains
3. Note both Cloudflare-assigned nameservers (e.g. `xyz1.ns.cloudflare.com`, `xyz2.ns.cloudflare.com`) shown in the zone overview — you'll need them in §3.3.
4. **Workers Custom Domain:** Workers → your worker → Triggers → Custom Domains → add `dz99.me` AND `www.dz99.me`.
5. **www → apex redirect:** Cloudflare dashboard → Bulk Redirects → create a rule: `https://www.dz99.me/*` → `https://dz99.me/$1` (301, preserve path).

> **Critical:** Do NOT change nameservers yet. Verify the records list manually by exporting from お名前.com's DNS panel and comparing side-by-side with Cloudflare.

---

### 3.3 Nameserver cutover

1. お名前.com control panel: domain `dz99.me` → **ネームサーバ設定変更** → set to the two Cloudflare-assigned nameservers from step 3.2 item 3.
2. Save.
3. Wait for propagation (typically 1–2 hours).
4. Monitor from two resolvers:

```bash
dig +short NS dz99.me @8.8.8.8
dig +short NS dz99.me @1.1.1.1
```

Continue until both return Cloudflare nameservers.

5. **Send a test email** from an outside Gmail account to your AWS-hosted mailbox. Confirm receipt within 5 minutes. If it bounces, Cloudflare DNS is missing MX/SPF/DKIM records — recheck §3.2 step 2.

---

## 4. Cutover verification checklist

Run each check after nameserver propagation completes. Each should pass:

- [ ] `https://dz99.me/` returns 200, shows Hero (Dz0526 / ITO) + About + Latest Posts + Contact.
- [ ] `https://dz99.me/blog/` returns 200, shows "まだ記事がありません。" (or post list if any published).
- [ ] `https://dz99.me/archive/` returns 200, shows tabs with "記事 (7)" and "日報 (221)".
- [ ] `https://dz99.me/article/first-aur-contributing` returns 301 to `https://dz99.me/archive/article/first-aur-contributing`; destination returns 200.
- [ ] `https://dz99.me/nippo/2023-01-06` returns 301 to `https://dz99.me/archive/nippo/2023-01-06`; destination returns 200.
- [ ] `https://dz99.me/og?title=Hello&date=2026-05-28` returns a 1200×600 PNG.
- [ ] `https://dz99.me/sitemap.xml` returns XML containing site URLs.
- [ ] `https://dz99.me/robots.txt` returns text containing `Disallow: /_emdash/`.
- [ ] `https://dz99.me/_emdash/admin` hits Cloudflare Access → Google OAuth → EmDash passkey (see §2.1).
- [ ] The following curl returns HTTP 200 with JSON capabilities:

```bash
curl -X POST https://dz99.me/_emdash/api/mcp \
  -H "CF-Access-Client-Id: <cf-client-id>" \
  -H "CF-Access-Client-Secret: <cf-client-secret>" \
  -H "Authorization: Bearer ec_pat_<token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0"}}}'
```

- [ ] Inbound test mail from Gmail → AWS mailbox arrives within 5 minutes.
- [ ] (Optional) Open Claude Desktop, verify `dz99-emdash` MCP server is listed; ask it to list collections.

---

### 4.1 Post-cutover: mint EmDash PAT for MCP

(Cannot be done until first admin login post-deploy. The PAT lives in D1 — there is no static env var to configure in Wrangler.)

1. Visit `https://dz99.me/_emdash/admin`. Walk through Cloudflare Access (Google OAuth) → EmDash passkey setup (first-time registration).
2. In the admin UI: **Settings → API Tokens → Create Token**.
3. Set a name (e.g. `claude-desktop-mcp`) and select scopes: `content:read`, `content:write`, `media:read`, `media:write`, `schema:read`, `taxonomies:manage`, `menus:manage`, `settings:read`.
4. Copy the `ec_pat_*` token immediately — it is shown only once. Store in your password manager.
5. Configure Claude Desktop / Cursor with this token per §2.3 of this runbook. The MCP endpoint also requires the `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers from the service token minted in §2.2.

---

### 4.2 Merge to main

After 4 hours of clean operation:

```bash
cd /Users/daiki99/projects/develop/dz99/blog
git fetch
git checkout main
git merge --no-ff rewrite/emdash -m "feat: EmDash rewrite — switch dz99.me to Cloudflare"
git push origin main
```

---

### 4.3 48-hour soak

Monitor for 48 hours:

- Cloudflare Workers dashboard: error rate < 1%, request count nominal.
- Inbound email working (send 1 test email per day).
- Spot-check `/blog/`, `/archive/`, a few archived URLs.

**Rollback procedure** (if issues arise within 48 hours): In お名前.com, restore the previous nameservers. Cloudflare records remain intact; the site reverts in 1–2 hours.
