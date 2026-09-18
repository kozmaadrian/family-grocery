# Family Grocery

Mobile-first, offline-capable shopping app for a family. You keep a master list of
**products**, mark which you currently **need**, then shop one **store** at a time
following a checklist ordered to match your path through that store's aisles.

Vue 3 + Vite PWA · Cloudflare Worker + D1. Full design in [docs/specs.md](docs/specs.md).

## Develop

```bash
npm install
cp .dev.vars.example .dev.vars    # then edit AUTH_SECRET
npm run db:migrate:local          # create/upgrade the local D1 database
npm run dev                       # Vite on :5173, wrangler (API + D1) on :8787
```

Open http://localhost:5173 — Vite proxies `/api/*` to the Worker. On first load the
app asks you to choose a family password (calls `/api/setup`).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Both dev servers (web + api) together |
| `npm run build` | Type-check and build the PWA to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm test` | Worker + sync tests (Vitest, real Worker runtime + D1) |
| `npm run db:migrate:local` / `:remote` | Apply D1 migrations |
| `npm run deploy` | Build, then `wrangler deploy` |

## Layout

```
index.html            Vite entry (PWA meta, manifest link)
src/
  screens/            one component per screen (Shop, Products, Stores, Store, Login)
  components/          BottomSheet, ShopRow, QuickAddBar, sheets, TabBar, …
  stores/             Pinia: data (IndexedDB mirror), sync, auth, app, shop
  lib/                idb, repo, sync engine, domain mutations, shopping view, composables
  styles/tokens.css   design tokens (light/dark)
shared/types.ts       types shared between client and Worker
worker/               Cloudflare Worker — /api/{health,setup,auth,sync}
migrations/            D1 SQL migrations
scripts/              PWA icon generation; seed.mjs (demo data via /api/sync)
test/                 Vitest (@cloudflare/vitest-pool-workers)
```

## Bulk data

- **In-app:** Settings → Catalog → *Import* takes pasted JSON or a plain list of
  product names (one per line, optionally `name, qty, note`); *Export as JSON*
  copies the whole catalog and round-trips back through Import.
- **Dev seed:** with the servers running, `npm run seed -- --fresh` loads a demo
  catalog (`--fresh` wipes first).

## Deploy (first time)

```bash
npx wrangler login
npx wrangler d1 create family-grocery
#   → copy the printed database_id into wrangler.toml ([[d1_databases]].database_id)
npm run db:migrate:remote
npx wrangler secret put AUTH_SECRET       # a long random string
npm run deploy
```

Then open the deployed URL and set the family password when prompted (or
`curl -X POST https://<host>/api/setup -H 'content-type: application/json' -d '{"password":"…"}'`).

Each family member opens the URL once, enters the password, and can "Add to Home
Screen" from Settings. Devices sync automatically; everything works offline.

## Deploy a demo instance

A second, fully independent copy to share with friends — its own Worker, its own
D1 database, its own `AUTH_SECRET`. Nothing is shared with the family instance.
The `[env.demo]` block in [wrangler.toml](wrangler.toml) already holds the config;
you just create the database and fill in its id.

```bash
npx wrangler d1 create family-grocery-demo
#   → paste the printed database_id into wrangler.toml ([env.demo] d1_databases.database_id)
npm run db:migrate:demo
npx wrangler secret put AUTH_SECRET --env demo    # a different long random string
npm run deploy:demo                               # → family-grocery-demo.<subdomain>.workers.dev

# set the demo password AND load demo data in one shot:
node scripts/seed.mjs --fresh "demo-pick-something-shareable" \
  https://family-grocery-demo.<subdomain>.workers.dev
```

Redeploy the demo any time with `npm run deploy:demo` (same `dist/`, so the app
code is always whatever you last built). To reset the demo data, re-run the seed
command with `--fresh`.

Notes:

- Don't set `SETUP_KEY` on the demo unless you'll do the `/api/setup` call
  yourself — the seed script can't pass it. Without it, run the seed step
  immediately after deploy so you claim the password first.
- The demo Worker counts against the same account free-tier limits (100k
  req/day, 5M D1 reads/day) as the family instance; separate rate-limit
  namespaces (`2001` / `2002`) keep demo traffic from throttling the family app.

## Security & keeping costs at zero

The Worker rate-limits itself (per client IP, per Cloudflare data centre):
`/api/auth` + `/api/setup` to 10/min, every other `/api/*` route to 200/min —
over budget returns `429` before touching the database. Failed unlocks also pause
~0.5 s, request bodies over 512 KB are rejected, and `auth_log` records every
unlock attempt (Settings → Sessions → *Sign-in log*).

Two things are **account settings you must do in the Cloudflare dashboard** — the
code can't:

1. **Stay on the Workers Free plan**, or if you're on Workers Paid, set a
   **spending limit** (Workers & Pages → your Worker → Settings → Usage, or the
   account Billing page). On the free plan an attack causes at most ~a day of
   `429`s once you pass 100k requests — never a charge.
2. Optionally set a **`SETUP_KEY`** secret (`npx wrangler secret put SETUP_KEY`)
   *before* the first deploy. Then `/api/setup` also needs that key in the body,
   so nobody can grab the password in the seconds between deploy and your own
   setup call: `curl … -d '{"password":"…","key":"<SETUP_KEY>"}'`.

Rate-limit tuning lives in [wrangler.toml](wrangler.toml) (`[[ratelimits]]`).
