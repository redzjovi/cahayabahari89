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
pnpm --filter web dev            # vite dev (Hono reachable at /api/* via hooks)
pnpm --filter web check          # svelte-check (0 errors)
pnpm --filter web build          # production build (adapter-cloudflare)
```

First-time setup already done: `pnpm approve-builds --all` (esbuild/workerd postinstall).

## API (embedded, same origin)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | liveness |
| GET | `/api/categories` | list categories |
| GET | `/api/products?q=&cat=&page=&limit=` | showcase list, paginated (default 12, max 50) |
| GET | `/api/products/:slug` | detail + images + category |
| POST | `/api/contact` `{name,email,message}` | stores lead in D1 `leads` |
| POST | `/api/admin/products` | `Authorization: Bearer <ADMIN_TOKEN>`, creates product |

Seed example (local dev server running):

```bash
curl -X POST localhost:5173/api/admin/products \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer dev-token' \
  -d '{"slug":"jangkar-5kg","name":"Jangkar 5kg","price":250000,"status":"active"}'
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
pnpm exec wrangler secret put ADMIN_TOKEN   # (from apps/web) real token, replaces dev-token
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
