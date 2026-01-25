# bhvr Troubleshooting Guide

## Common Issues and Solutions

### CORS Errors

**Symptom:** CORS errors in browser console when making API calls

**Cause:** Not following single-origin pattern

**Solution:**
1. Ensure client uses relative paths: `fetch('/api/endpoint')` not `fetch('http://localhost:8787/api/endpoint')`
2. Verify Better-Auth `baseURL` is `/api/auth` (relative)
3. Check that both client and API are served from same domain in production

### Assets Not Loading

**Symptom:** 404 errors for static files, blank page

**Causes & Solutions:**

1. **Client not built:**
   - Run `bun run build:client` before deploy
   - Check that `client/dist` directory exists with files

2. **Wrong assets directory in wrangler.toml:**
   ```toml
   # Correct:
   assets = { directory = "./client/dist", binding = "ASSETS" }
   ```

3. **Vite output directory mismatch:**
   ```ts
   // In client/vite.config.ts - must match wrangler.toml
   build: {
     outDir: 'dist'
   }
   ```

### API Routes Not Working

**Symptom:** 404 on `/api/*` routes

**Solutions:**

1. **Check route mounting:**
   ```ts
   // server/src/index.ts
   app.route("/api", api);  // Must mount under /api
   ```

2. **Verify Hono is not serving static files:**
   - Remove any `serveStatic` middleware
   - Assets are handled by Cloudflare, not Hono

### D1 Database Issues

**Symptom:** "DB is undefined" or database query errors

**Solutions:**

1. **Check binding in wrangler.toml:**
   ```toml
   [[d1_databases]]
   binding = "DB"  # Must match your code
   database_name = "prod-db"
   database_id = "your-actual-id"
   ```

2. **Use --remote flag:**
   ```bash
   wrangler dev --remote  # Required for accurate D1 behavior
   ```

3. **Run migrations:**
   ```bash
   wrangler d1 migrations apply prod-db --remote
   ```

### Better-Auth Issues

**Symptom:** Auth not working, sessions not persisting

**Solutions:**

1. **Verify BETTER_AUTH_URL in wrangler.toml:**
   ```toml
   [vars]
   BETTER_AUTH_URL = "https://your-actual-domain.com"
   ```

2. **Check client configuration:**
   ```ts
   // Must use relative path
   createAuthClient({
     baseURL: "/api/auth"
   })
   ```

3. **Ensure auth routes are mounted:**
   ```ts
   app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
   ```

### Development Hot Reload Not Working

**Symptom:** Changes not reflected during development

**Solutions:**

1. **For backend changes:**
   - Wrangler dev has built-in HMR
   - Restart `bun run dev` if issues persist

2. **For frontend changes:**
   - Run separate Vite dev server: `cd client && bun vite`
   - Vite dev server proxies API calls to Worker

### Deployment Failures

**Symptom:** Deploy errors or runtime failures in production

**Solutions:**

1. **Build client before deploy:**
   ```bash
   bun run deploy  # Handles this automatically
   ```

2. **Check wrangler.toml configuration:**
   - Verify `main` points to correct entry file
   - Verify `assets.directory` is correct
   - Verify all bindings (D1, R2) have correct IDs

3. **Test with --remote flag first:**
   ```bash
   wrangler dev --remote  # Should work before deploying
   ```

### SPA Routing Issues

**Symptom:** Direct navigation to `/dashboard` returns 404, only `/` works

**Solution:**

Cloudflare Workers Assets handles SPA mode automatically. Ensure:

1. Your React app has proper routing (React Router, TanStack Router, etc.)
2. The `assets` binding is correctly configured
3. API routes don't conflict with frontend routes

If issues persist, verify the build output includes `index.html` in `client/dist/`

### TypeScript Type Errors

**Symptom:** Type errors for `Env` bindings

**Solution:**

Create proper types:

```ts
// server/src/types.ts
type Env = {
  DB: D1Database;
  ASSETS: Fetcher;
  BUCKET?: R2Bucket;
  BETTER_AUTH_URL: string;
};

// Use in Hono
const app = new Hono<{ Bindings: Env }>();
```
