# cahayabahari89 — Company Website

Stack: **SvelteKit 2 + Svelte 5 + Tailwind 4** (FE) + **Hono 4 + Zod** (BE, embedded) on **Cloudflare** (single Worker) + **D1 + R2**.

Mode: **Embed** — Hono lives inside SvelteKit (`src/hooks.server.ts` → `src/lib/server/hono.ts`), no separate `api.` subdomain. Same-origin `/api/*`, zero CORS, one `wrangler deploy`. Product katalog is **showcase only** (browse/search, no cart/payment).

## Layout

```
apps/web/                  # SvelteKit (adapter-cloudflare) + embedded Hono
  src/hooks.server.ts      # forwards /api/* to Hono
  src/lib/server/hono.ts   # Hono app: /api/health, /api/categories,
                           #   /api/products, /api/products/:slug,
                           #   POST /api/contact, POST /api/admin/products
  src/lib/server/db/       # Drizzle schema (categories, products, product_images, leads)
  src/routes/              # locale-prefixed URLs via reroute: /en + /id trees
                           # EN: /en, /en/products, /en/products/[slug], /en/contact
                           # ID: /id, /id/produk, /id/produk/[slug], /id/kontak
                           # (nav: Products + Contact only; /about and /services removed;
                           #  bare /katalog* 301-redirect to /id/produk*; bare URLs 301 to /id/…)
  src/lib/routes.ts        # locale slug map: parseLocalized / localize / switchLocale
  src/lib/locale.svelte.ts # EN/ID dictionary + store (URL is source of truth via layout data)
  wrangler.jsonc           # D1 binding DB, R2 binding IMAGES
  drizzle/                 # generated SQL migrations for D1
packages/shared/           # zod schemas shared FE/BE (productsQuery, contact, adminProduct)
```

## Quickstart

```bash
pnpm install
pnpm dev                         # single server: vite HMR + real local D1/R2 via platformProxy
pnpm --filter web check          # svelte-check (0 errors)
pnpm --filter web build          # production build (adapter-cloudflare)
```

## Local dev (merged into one)

`pnpm dev` (`vite dev` + `platformProxy: { persist: true }` in `svelte.config.js`)
serves UI hot-reload **and** the Hono API against the same local backend as
`wrangler dev` (shared `.wrangler/state`, `.dev.vars` secrets for both).
Use `wrangler dev` (after `pnpm build`) only for pre-deploy fidelity checks:
real workerd runtime, `_worker.js` bundling, redirects/asset behavior.

Gotcha: secret-*only* bindings must NOT have empty placeholders in
`wrangler.jsonc` `vars` — empty values shadow `.dev.vars` locally and silently
disable features (hit us with `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrap).

First-time setup already done: `pnpm approve-builds --all` (esbuild/workerd postinstall).

## API (embedded, same origin)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/categories` | list categories |
| GET | `/api/products?q=&cat=&page=&limit=` | showcase list, paginated (default 12, max 50) |
| GET | `/api/products/:slug` | detail + images + category |
| POST | `/api/contact` `{name,email,company?,volume?,message}` | stores lead in D1 `leads` |
| POST | `/api/auth/login` `{email,password}` | → `{token, user}` session (7-day TTL) |
| POST | `/api/auth/logout` | revokes session token |
| GET | `/api/auth/me` | session user + roles + permissions |
| POST | `/api/admin/products` | Bearer session, needs `products.write` |
| GET | `/api/admin/leads` | Bearer session, needs `leads.read` |
| POST | `/api/admin/images` | multipart `slug` + `files[]` (jpeg/png/webp/avif, ≤5 MB each), needs `images.write` |
| DELETE | `/api/admin/images/:id` | removes R2 object + row, needs `images.write` |

## RBAC (users, roles, permissions)

Tables: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `sessions`.
Passwords: PBKDF2-SHA256 via WebCrypto. Sessions: opaque Bearer tokens (SHA-256 stored, 7-day expiry).
Seeded roles — `admin` (all 8 permissions), `staff` (products.*/categories.*/images.write/leads.read),
`viewer` (products.read, categories.read).

First admin (bootstrap — runs automatically when `users` is empty):

```bash
# local: apps/web/.dev.vars (gitignored) — prod: wrangler secret put
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="choose-a-strong-password"
```

Admin UI (bilingual, token-gated, no login = redirect to login):
`/en|/id/admin/login` → sign in → `/admin/users` (create, suspend/reactivate,
role assignment, password reset) and `/admin/roles` (create/rename/delete with
assignment guard, permission matrix, permission CRUD). Client token lives in
`localStorage`; API enforced server-side regardless.

Then (local dev server running — multipart needs an `Origin` header via curl):

```bash
TOKEN=$(curl -s -X POST localhost:8787/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@example.com","password":"choose-a-strong-password"}' | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")
curl localhost:8787/api/auth/me -H "authorization: Bearer $TOKEN"
curl -X POST localhost:8787/api/admin/products \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"slug":"salmon-test","name":"Salmon Test","price":100000,"status":"draft"}'
```

## Product images (R2 + custom domain)

Detail pages show a main image + thumbnail strip from `product_images` rows. Each row's
`url` is built as `${IMAGES_URL}/${r2_key}` — empty `IMAGES_URL` (default) renders placeholders.

1. Attach a domain to Cloudflare, then R2 bucket `cahayabahari89-images` → Settings →
   Custom Domain (e.g. `https://images.yourdomain.com`) + allow public access.
2. Set the secret (prod) or `.dev.vars` (local): `IMAGES_URL=https://images.yourdomain.com`
   (`pnpm --filter web exec wrangler secret put IMAGES_URL`).
3. Upload (local dev server or prod URL, session token — curl multipart needs `Origin`):

```bash
curl -X POST localhost:8787/api/admin/images \
  -H 'Origin: http://localhost:8787' \
  -H "authorization: Bearer $TOKEN" \
  -F slug=fillet-salmon-premium \
  -F 'files[]=@./salmon-1.jpg' \
  -F 'files[]=@./salmon-2.jpg'
# → [{id, r2Key, url, ...}] — gallery shows them in `sort` order
curl -X DELETE localhost:8787/api/admin/images/3 \
  -H 'Origin: http://localhost:8787' \
  -H "authorization: Bearer $TOKEN"
```

## D1 / R2 (Cloudflare)

Local: `wrangler dev` serves D1 locally (migrations in `apps/web/drizzle/`).

Create remote resources once:

```bash
cd apps/web
pnpm exec wrangler d1 create cahayabahari89-db        # paste database_id into wrangler.jsonc
pnpm exec wrangler r2 bucket create cahayabahari89-images
pnpm exec wrangler d1 migrations apply cahayabahari89-db --remote
```

Deploy (single Worker via Pages/Workers + `adapter-cloudflare` output `.svelte-kit/cloudflare`):

```bash
pnpm --filter web build
pnpm --filter web exec wrangler deploy
pnpm exec wrangler secret put ADMIN_EMAIL       # (from apps/web) bootstrap admin email
pnpm exec wrangler secret put ADMIN_PASSWORD    # (from apps/web) bootstrap admin password
```

Costs (2026): Cloudflare Pages Free (500 builds, unlimited bandwidth) + Workers Free
(100k req/day) → Paid `$5/mo` for 10M req. No VM needed (unlike Elysia-on-Fly).

## Katalog v2 notes

- Tables `categories/products/product_images` are created now, filled later. `parentId` FK is
  app-level (avoids TS circular-inference error with drizzle self-reference).
- Prices stored as integer cents; format with `toLocaleString('id-ID')` in Svelte.
- Images: store object key in `product_images.r2_key`, serve via R2 public/custom domain.
- To extract a standalone API later (Split mode): move `src/lib/server/hono.ts` to
  `apps/api`, add `hono/client` (`hc`) in SvelteKit — Hono code unchanged.

## Scripts (root)

```bash
pnpm dev    # run web dev
pnpm build  # build web
pnpm check  # typecheck web
```
