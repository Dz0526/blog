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

## 3. DNS migration steps

(To be filled in Phase 11.)

---

## 4. Cutover verification checklist

(To be filled in Phase 11.)
