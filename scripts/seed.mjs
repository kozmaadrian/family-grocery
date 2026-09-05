// Seed the local dev database with example stores, aisles, products and a
// starter shopping list. Idempotent — stable ids, so re-running just upserts.
//
//   npm run dev                       # in another terminal (API on :8787)
//   node scripts/seed.mjs [--fresh] [password] [apiBase]
//
// --fresh first tombstones every existing row (clean slate), then seeds.
// Defaults: password "grocery123", apiBase http://localhost:8787

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const rest = args.filter((a) => a !== '--fresh');
const PASSWORD = rest[0] || 'grocery123';
const API = (rest[1] || 'http://localhost:8787').replace(/\/$/, '');

// Filled in at send time — must be after any --fresh tombstones so LWW keeps the seed.
let stamp = Date.now();
const row = (o) => ({ deleted: 0, ...o, updated_at: stamp });

// --- stores + aisles (aisles in walking order via `position`) ---
const stores = [
  row({ id: 'store_lidl', name: 'Lidl' }),
  row({ id: 'store_costco', name: 'Costco' }),
];

const areas = [
  row({ id: 'area_lidl_produce', store_id: 'store_lidl', name: 'Produce', position: 1 }),
  row({ id: 'area_lidl_bakery', store_id: 'store_lidl', name: 'Bakery', position: 2 }),
  row({ id: 'area_lidl_dairy', store_id: 'store_lidl', name: 'Dairy', position: 3 }),
  row({ id: 'area_lidl_frozen', store_id: 'store_lidl', name: 'Frozen', position: 4 }),
  row({ id: 'area_lidl_checkout', store_id: 'store_lidl', name: 'Checkout', position: 5 }),
  row({ id: 'area_costco_entry', store_id: 'store_costco', name: 'Entrance', position: 1 }),
  row({ id: 'area_costco_dry', store_id: 'store_costco', name: 'Dry goods', position: 2 }),
  row({ id: 'area_costco_fridge', store_id: 'store_costco', name: 'Fridge wall', position: 3 }),
];

// --- products ---
const P = (id, name, extra = {}) =>
  row({ id, name, default_qty: null, note: null, ...extra });
const products = [
  P('prod_milk', 'Milk', { default_qty: '2' }),
  P('prod_eggs', 'Eggs'),
  P('prod_bread', 'Bread'),
  P('prod_apples', 'Apples', { default_qty: '6' }),
  P('prod_bananas', 'Bananas'),
  P('prod_tomatoes', 'Tomatoes'),
  P('prod_butter', 'Butter'),
  P('prod_yoghurt', 'Yoghurt', { note: 'the plain one' }),
  P('prod_peas', 'Frozen peas'),
  P('prod_coffee', 'Coffee beans'),
  P('prod_oil', 'Olive oil'),
  P('prod_candles', 'Birthday candles'),
];

// --- placements: which product is bought where, in which aisle ---
const place = (product_id, store_id, area_id, position) =>
  row({ id: `${product_id}:${store_id}`, product_id, store_id, area_id, position });
const placements = [
  place('prod_apples', 'store_lidl', 'area_lidl_produce', 1),
  place('prod_bananas', 'store_lidl', 'area_lidl_produce', 2),
  place('prod_tomatoes', 'store_lidl', 'area_lidl_produce', 3),
  place('prod_bread', 'store_lidl', 'area_lidl_bakery', 1),
  place('prod_milk', 'store_lidl', 'area_lidl_dairy', 1),
  place('prod_eggs', 'store_lidl', 'area_lidl_dairy', 2),
  place('prod_butter', 'store_lidl', 'area_lidl_dairy', 3),
  place('prod_yoghurt', 'store_lidl', 'area_lidl_dairy', 4),
  place('prod_peas', 'store_lidl', 'area_lidl_frozen', 1),
  place('prod_oil', 'store_lidl', null, 1), // unsorted
  // Costco carries the bulk staples, different layout
  place('prod_coffee', 'store_costco', 'area_costco_dry', 1),
  place('prod_oil', 'store_costco', 'area_costco_dry', 2),
  place('prod_milk', 'store_costco', 'area_costco_fridge', 1),
  place('prod_eggs', 'store_costco', 'area_costco_fridge', 2),
];

// --- a starter shopping list (need id === product id) ---
const need = (product_id, status = 'needed') =>
  row({ id: product_id, product_id, qty: null, note: null, status });
const needs = [
  need('prod_milk'),
  need('prod_bread'),
  need('prod_apples'),
  need('prod_yoghurt'),
  need('prod_coffee'),
  need('prod_candles'), // not sold at either store — shows under "Not sold here"
];

async function main() {
  // ensure a password exists, then get a token
  let res = await fetch(`${API}/api/setup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: PASSWORD }),
  });
  if (res.status === 409) {
    res = await fetch(`${API}/api/auth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: PASSWORD }),
    });
  }
  if (!res.ok) {
    console.error(`auth failed (${res.status}):`, await res.text());
    console.error('Is `npm run dev` running? Is the password right?');
    process.exit(1);
  }
  const { token } = await res.json();
  const auth = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  if (FRESH) {
    const cur = await fetch(`${API}/api/sync`, {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ cursor: 0, changes: {} }),
    }).then((r) => r.json());
    const kill = {};
    for (const [table, rows] of Object.entries(cur.changes ?? {})) {
      kill[table] = rows
        .filter((r) => !r.deleted)
        .map((r) => ({ ...r, deleted: 1, updated_at: stamp }));
    }
    const total = Object.values(kill).reduce((n, r) => n + r.length, 0);
    if (total) {
      const killed = await fetch(`${API}/api/sync`, {
        method: 'POST',
        headers: auth,
        body: JSON.stringify({ cursor: 0, changes: kill }),
      }).then((r) => r.json());
      // seed rows must be newer than the server-stamped tombstones
      stamp = (killed.cursor ?? Date.now()) + 1;
      console.log(`--fresh: cleared ${total} existing rows.`);
    }
  }

  const restamp = (rows) => rows.map((r) => ({ ...r, updated_at: stamp }));
  const sync = await fetch(`${API}/api/sync`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      cursor: 0,
      changes: {
        stores: restamp(stores),
        areas: restamp(areas),
        products: restamp(products),
        placements: restamp(placements),
        needs: restamp(needs),
      },
    }),
  });
  if (!sync.ok) {
    console.error(`sync failed (${sync.status}):`, await sync.text());
    process.exit(1);
  }
  console.log(
    `Seeded: ${stores.length} stores, ${areas.length} aisles, ${products.length} products, ` +
      `${placements.length} placements, ${needs.length} on the list.`,
  );
  console.log('Reload the app (or Settings → Sync now) to see it.');
}

main();
