# Family Grocery

Mobile-first, offline-capable shopping app for a family. Vue 3 + Vite frontend,
Cloudflare Worker + D1 backend. See [docs/specs.md](docs/specs.md) for the full
design and the phased implementation roadmap.

## Develop

```bash
npm install
cp .dev.vars.example .dev.vars   # then edit AUTH_SECRET
npm run db:migrate:local          # apply D1 migrations to the local database
npm run dev                       # Vite on :5173, wrangler (API + D1) on :8787
```

Open http://localhost:5173. Vite proxies `/api/*` to the Worker.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Both dev servers (web + api) together |
| `npm run build` | Type-check and build the SPA to `dist/` |
| `npm run typecheck` | Type-check only |
| `npm run db:migrate:local` | Apply migrations to the local D1 database |
| `npm run deploy` | Build and deploy the Worker + assets |

## Layout

```
index.html            Vite entry
src/                   Vue app (screens, components, stores, router, styles)
shared/                Types shared between client and Worker
worker/                Cloudflare Worker (API: /api/*)
migrations/            D1 SQL migrations
dist/                  Build output (git-ignored)
docs/specs.md          Specification + roadmap
```

## Deploy (first time)

```bash
npx wrangler login
npx wrangler d1 create family-grocery      # paste database_id into wrangler.toml
npm run db:migrate:remote
npx wrangler secret put AUTH_SECRET
npm run deploy
```

Then call `POST /api/setup` once with the family password.
