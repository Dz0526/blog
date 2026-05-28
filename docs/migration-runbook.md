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

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) and add:

```json
{
  "mcpServers": {
    "dz99-emdash": {
      "url": "https://dz99.me/_emdash/api/mcp",
      "headers": {
        "Authorization": "Bearer <ec_pat_your-token-here>"
      }
    }
  }
}
```

(Replace `<ec_pat_your-token-here>` with the actual PAT. Restart Claude Desktop after editing.)

For local dev, use `http://localhost:4321/_emdash/api/mcp` and the dev PAT.

### Verification

Once configured:
1. Open Claude Desktop / Cursor; verify `dz99-emdash` appears in the MCP server list.
2. Ask Claude: "Use the dz99-emdash MCP to list available collections." — should return collections including `profile`, `blogpost`, `archivedarticle`, `archivednippo`, `posts`, `pages`.
3. Ask Claude: "Create a draft BlogPost titled 'Test post' with body 'Hello world'." — should succeed; verify in `/_emdash/admin`.

(This verification happens after Phase 11 cutover; until then, only the local dev endpoint is reachable.)

---

## 2. DNS migration steps

(To be filled in Phase 11.)

---

## 3. Cutover verification checklist

(To be filled in Phase 11.)
