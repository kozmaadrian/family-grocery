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
