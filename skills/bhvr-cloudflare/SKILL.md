---
name: bhvr-cloudflare
description: Build full-stack apps on Cloudflare Workers with single-origin architecture (Bun, Hono, Vite, React). Use when setting up bhvr projects, reviewing code for architecture compliance, implementing features with zero CORS, troubleshooting D1/Better-Auth, or working with Cloudflare Workers Assets.
license: MIT
metadata:
  version: "1.1.0"
---

# bhvr Cloudflare

Build full-stack applications with a single-origin architecture on Cloudflare Workers. The bhvr stack (Bun, Hono, Vite, React) simplifies deployment by serving both the API and frontend from one Worker.

## Core Principles

**Single Origin Architecture**
- One Worker, one URL
- `app.com/api/*` → Hono Worker
- `app.com/*` → React Static Assets (Cloudflare CDN)

**Zero CORS**
- Client and server share an origin
- No complex preflight requests
- No authentication cookie issues

**Remote-First Development**
- Develop against real Cloudflare infrastructure
- Use `wrangler dev --remote` for accurate D1 and R2 behavior
- Avoid local emulation discrepancies

**Explicit Observability**
- Never ship bare `observability.enabled = true`
- Cloudflare Workers Logs can be enabled by default on new Workers, and unspecified sampling defaults to 100%
- Treat persistent logs as an opt-in cost decision, not a harmless default

**Physical Separation**
- Maintain `client` and `server` workspace separation
- Prevents AI hallucinations
- Fused at deploy time via `wrangler.toml`

## The Stack

| Component | Choice | Details |
|-----------|--------|---------|
| Deploy Target | Cloudflare Workers | Single Worker with Assets Binding |
| Routing | Cloudflare Assets | SPA mode with automatic `index.html` fallback |
| Database | Cloudflare D1 | Accessed via Kysely (query builder) |
| Auth | Better-Auth | Email OTP + Kysely Adapter |
| Frontend | React + Vite | Builds to `./client/dist` |
| Styling | Tailwind v4 | With shadcn/ui |

## Project Setup

### Initial Structure

Create this directory layout:

```
/
├── client/              # React + Vite
│   └── vite.config.ts
├── server/              # Hono Worker
│   └── src/index.ts
├── wrangler.toml        # Single Origin Config
└── package.json         # Build scripts
```

### Configuration Files

Copy these templates from `assets/`:

1. **wrangler.toml** - Single origin configuration
2. **package.json** - Build pipeline scripts
3. **vite.config.ts** - Client build configuration (place in `client/`)
4. **server-index.ts** - Hono API starter (place in `server/src/index.ts`)
5. **auth-client.ts** - Better-Auth client config (place in `client/src/lib/`)
6. **.cursorrules** - AI agent rules (place in root)

### Key Configuration Points

**wrangler.toml** must include:
```toml
assets = { directory = "./client/dist", binding = "ASSETS" }
```

**wrangler.toml** should also make observability explicit:
```toml
[observability]
enabled = false
```

If a project needs persisted production logs by default, use an explicit low-volume policy instead of a bare enable:
```toml
[observability]
enabled = true
head_sampling_rate = 1

[observability.logs]
enabled = true
head_sampling_rate = 0.02
persist = false
invocation_logs = false

[observability.traces]
enabled = false
```

**package.json** must build client before deploy:
```json
"scripts": {
  "dev": "bun run build:client && wrangler dev --remote",
  "build:client": "cd client && bun run build",
  "deploy": "bun run build:client && wrangler deploy"
}
```

**vite.config.ts** must output to `dist`:
```ts
build: {
  outDir: 'dist'  // Must match wrangler.toml assets directory
}
```

## Implementation Patterns

### API Routes (Hono)

Mount all API routes under `/api`:

```ts
import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();
const api = new Hono<{ Bindings: Env }>();

api.get("/hello", (c) => c.json({ message: "Hello" }));

app.route("/api", api);  // Critical: mount under /api
```

**Never use `serveStatic` middleware** - Cloudflare Assets handles static files.

### Client API Calls

Always use relative paths:

```ts
// Correct
fetch('/api/user')

// Wrong - breaks single origin
fetch('http://localhost:8787/api/user')
fetch('https://api.myapp.com/user')
```

### Better-Auth Integration

**Server:** Mount auth routes under `/api/auth`

```ts
import { createAuth } from "./auth";

const auth = createAuth(env);
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

**Client:** Use relative baseURL

```ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "/api/auth"  // Relative path for single origin
});
```

### Database Access (D1 + Kysely)

Configure D1 binding in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "prod-db"
database_id = "your-id-here"
```

Access in Hono routes:

```ts
api.get("/users", async (c) => {
  const db = c.env.DB;
  const users = await db.prepare("SELECT * FROM users").all();
  return c.json(users);
});
```

## Development Workflow

### Starting Development

```bash
bun run dev
```

This:
1. Builds the React app to `client/dist`
2. Starts `wrangler dev --remote`
3. Serves everything on `localhost:8787`

### Frontend Development with HMR

For fast frontend iteration:

```bash
cd client && bun vite
```

Runs Vite dev server on port 5173 with API proxy to Worker.

### Backend Development

Edit `server/src/index.ts` - Wrangler provides instant HMR.

## Deployment

Deploy to production:

```bash
bun run deploy
```

This automatically:
1. Builds the client (`client/dist`)
2. Uploads assets to Cloudflare
3. Deploys the Worker

**Critical:** Never deploy without building client first. The deploy script handles this.

## Architecture Review Checklist

When reviewing or auditing a bhvr project, verify:

### Configuration
- [ ] `wrangler.toml` has `assets = { directory = "./client/dist", binding = "ASSETS" }`
- [ ] `package.json` includes `build:client` in deploy script
- [ ] `vite.config.ts` outputs to `dist` directory
- [ ] D1 bindings are correctly configured

### Routing
- [ ] All API routes mounted under `/api`
- [ ] No `serveStatic` middleware in Hono code
- [ ] Client uses relative paths for API calls
- [ ] Better-Auth `baseURL` is `/api/auth`

### Development
- [ ] Dev script uses `wrangler dev --remote`
- [ ] Vite proxy configured for `/api` routes

### Deployment
- [ ] Deploy script builds client before deploying
- [ ] `BETTER_AUTH_URL` set to production domain
- [ ] Observability is explicit in Wrangler config, never left as a bare default
- [ ] Default production stance is `enabled = false` unless there is an active reason to keep sampled logs on
- [ ] If logs stay on, `invocation_logs` is disabled and sampling is explicitly capped

## Common Issues

For troubleshooting, see [references/troubleshooting.md](references/troubleshooting.md):

- CORS errors
- Assets not loading
- API routes 404
- D1 database issues
- Better-Auth problems
- HMR not working
- Deployment failures
- SPA routing issues

## Resources

### assets/
Template files for quick project setup:
- `wrangler.toml` - Single origin Worker configuration
- `package.json` - Build scripts and dependencies
- `vite.config.ts` - Vite build configuration
- `server-index.ts` - Hono API starter template
- `auth-client.ts` - Better-Auth client configuration
- `.cursorrules` - AI agent development rules

### references/
- `troubleshooting.md` - Common issues and solutions

## Additional Resources

[Using React with Cloudflare Workers](https://www.youtube.com/watch?v=1Akcw58eJMo) - Video walkthrough of the bhvr stack
