// Seed the local dev database with example stores, aisles, products and a
// starter shopping list. Idempotent — stable ids, so re-running just upserts.
//
//   npm run dev                       # in another terminal (API on :8787)
//   node scripts/seed.mjs [--fresh] [password] [apiBase] [setupKey]
//
// --fresh first tombstones every existing row (clean slate), then seeds.
// Defaults: password "dev-seed-password" (local/dev only — never reuse a real
// family password here, this file is committed to git), apiBase http://localhost:8787
// setupKey is only needed if the instance has a SETUP_KEY secret set (see README).

const args = process.argv.slice(2);
const FRESH = args.includes('--fresh');
const rest = args.filter((a) => a !== '--fresh');
const PASSWORD = rest[0] || 'dev-seed-password';
const API = (rest[1] || 'http://localhost:8787').replace(/\/$/, '');
const SETUP_KEY = rest[2];

// Filled in at send time — must be after any --fresh tombstones so LWW keeps the seed.
let stamp = Date.now();
const row = (o) => ({ deleted: 0, ...o, updated_at: stamp });

// --- stores + aisles (aisles in walking order via `position`) ---
const stores = [
  row({ id: 'store_lidl', name: 'Lidl' }),
  row({ id: 'store_hieber', name: 'Hieber' }),
  row({ id: 'store_coop', name: 'Coop' }),
];

const AISLES = {
  store_lidl: ['Produce', 'Bakery', 'Meat & Fish', 'Dairy & Eggs', 'Frozen', 'Pantry', 'Beverages', 'Household'],
  store_hieber: ['Produce', 'Bakery', 'Meat & Deli', 'Dairy', 'Frozen', 'Beverages', 'Household'],
  store_coop: ['Produce', 'Bakery', 'Meat & Fish', 'Dairy & Eggs', 'Frozen', 'Pantry', 'Beverages', 'Health & Household'],
};
const areaId = (store_id, aisle) => `area_${store_id.slice(6)}_${aisle.toLowerCase().replace(/[^a-z]+/g, '_')}`;
const areas = Object.entries(AISLES).flatMap(([store_id, aisles]) =>
  aisles.map((name, i) => row({ id: areaId(store_id, name), store_id, name, position: i + 1 })),
);

// --- products (a spread of every variant: qty only / note only / both / neither) ---
const P = (id, name, extra = {}) =>
  row({ id, name, default_qty: null, note: null, ...extra });
const products = [
  P('prod_milk', 'Milk', { default_qty: '2 L', note: 'semi-skimmed' }),
  P('prod_eggs', 'Eggs', { default_qty: '12' }),
  P('prod_yoghurt', 'Greek yoghurt', { default_qty: '4', note: 'plain, big pots' }),
  P('prod_butter', 'Butter', { note: 'unsalted' }),
  P('prod_cream_cheese', 'Cream cheese', { default_qty: '200 g' }),
  P('prod_sliced_cheese', 'Sliced cheese', { note: 'for sandwiches' }),
  P('prod_sourdough', 'Sourdough loaf', { note: 'from the bakery counter' }),
  P('prod_croissants', 'Croissants', { default_qty: '6' }),
  P('prod_rye_bread', 'Rye bread', { note: 'dark, seeded' }),
  P('prod_bananas', 'Bananas', { default_qty: '1 bunch' }),
  P('prod_avocados', 'Avocados', { default_qty: '4', note: 'ripe, not hard' }),
  P('prod_spinach', 'Baby spinach'),
  P('prod_tomatoes', 'Cherry tomatoes', { default_qty: '2 punnets' }),
  P('prod_onions', 'Red onions', { default_qty: '1 kg' }),
  P('prod_garlic', 'Garlic'),
  P('prod_lemons', 'Lemons', { default_qty: '4' }),
  P('prod_chicken', 'Chicken breast', { default_qty: '1 kg', note: 'free-range' }),
  P('prod_salmon', 'Salmon fillets', { default_qty: '2', note: 'skin-on' }),
  P('prod_beef', 'Minced beef', { default_qty: '500 g' }),
  P('prod_bacon', 'Bacon', { note: 'smoked' }),
  P('prod_peas', 'Frozen peas'),
  P('prod_icecream', 'Vanilla ice cream', { default_qty: '1 tub' }),
  P('prod_pizza', 'Frozen pizza', { default_qty: '2', note: 'margherita' }),
  P('prod_rice', 'Basmati rice', { default_qty: '5 kg bag' }),
  P('prod_spaghetti', 'Spaghetti', { default_qty: '500 g' }),
  P('prod_oil', 'Olive oil', { default_qty: '1 L' }),
  P('prod_coffee', 'Coffee beans', { note: 'dark roast' }),
  P('prod_oj', 'Orange juice', { default_qty: '1 L' }),
  P('prod_water', 'Sparkling water', { default_qty: '6-pack' }),
  P('prod_dishsoap', 'Dish soap'),
  P('prod_papertowels', 'Paper towels', { default_qty: '6-pack' }),
  P('prod_detergent', 'Laundry detergent', { default_qty: '1', note: 'sensitive skin' }),
  P('prod_toiletpaper', 'Toilet paper', { default_qty: '1 pack' }),
  P('prod_ibuprofen', 'Ibuprofen', { default_qty: '1 box' }),
  P('prod_toothpaste', 'Toothpaste'),
  P('prod_candles', 'Birthday candles'), // not sold anywhere
];

// --- placements: which product is bought where, in which aisle ---
// position auto-increments per (store, aisle), in the order placements are listed below.
const areaPos = {};
const place = (product_id, store_id, aisle) => {
  const area_id = areaId(store_id, aisle);
  const key = `${store_id}:${area_id}`;
  areaPos[key] = (areaPos[key] || 0) + 1;
  return row({ id: `${product_id}:${store_id}`, product_id, store_id, area_id, position: areaPos[key] });
};
const placements = [
  place('prod_milk', 'store_lidl', 'Dairy & Eggs'),
  place('prod_milk', 'store_hieber', 'Dairy'),
  place('prod_milk', 'store_coop', 'Dairy & Eggs'),
  place('prod_eggs', 'store_lidl', 'Dairy & Eggs'),
  place('prod_eggs', 'store_hieber', 'Dairy'),
  place('prod_eggs', 'store_coop', 'Dairy & Eggs'),
  place('prod_yoghurt', 'store_lidl', 'Dairy & Eggs'),
  place('prod_yoghurt', 'store_coop', 'Dairy & Eggs'),
  place('prod_butter', 'store_lidl', 'Dairy & Eggs'),
  place('prod_butter', 'store_hieber', 'Dairy'),
  place('prod_cream_cheese', 'store_hieber', 'Dairy'),
  place('prod_sliced_cheese', 'store_lidl', 'Dairy & Eggs'),
  place('prod_sliced_cheese', 'store_coop', 'Dairy & Eggs'),
  place('prod_sourdough', 'store_lidl', 'Bakery'),
  place('prod_sourdough', 'store_hieber', 'Bakery'),
  place('prod_sourdough', 'store_coop', 'Bakery'),
  place('prod_croissants', 'store_hieber', 'Bakery'),
  place('prod_croissants', 'store_coop', 'Bakery'),
  place('prod_rye_bread', 'store_hieber', 'Bakery'),
  place('prod_bananas', 'store_lidl', 'Produce'),
  place('prod_bananas', 'store_hieber', 'Produce'),
  place('prod_bananas', 'store_coop', 'Produce'),
  place('prod_avocados', 'store_lidl', 'Produce'),
  place('prod_avocados', 'store_coop', 'Produce'),
  place('prod_spinach', 'store_lidl', 'Produce'),
  place('prod_spinach', 'store_hieber', 'Produce'),
  place('prod_tomatoes', 'store_lidl', 'Produce'),
  place('prod_onions', 'store_hieber', 'Produce'),
  place('prod_onions', 'store_coop', 'Produce'),
  place('prod_garlic', 'store_coop', 'Produce'),
  place('prod_lemons', 'store_lidl', 'Produce'),
  place('prod_lemons', 'store_coop', 'Produce'),
  place('prod_chicken', 'store_lidl', 'Meat & Fish'),
  place('prod_chicken', 'store_hieber', 'Meat & Deli'),
  place('prod_chicken', 'store_coop', 'Meat & Fish'),
  place('prod_salmon', 'store_coop', 'Meat & Fish'),
  place('prod_beef', 'store_lidl', 'Meat & Fish'),
  place('prod_beef', 'store_hieber', 'Meat & Deli'),
  place('prod_bacon', 'store_hieber', 'Meat & Deli'),
  place('prod_peas', 'store_lidl', 'Frozen'),
  place('prod_peas', 'store_coop', 'Frozen'),
  place('prod_icecream', 'store_lidl', 'Frozen'),
  place('prod_icecream', 'store_hieber', 'Frozen'),
  place('prod_pizza', 'store_hieber', 'Frozen'),
  place('prod_pizza', 'store_coop', 'Frozen'),
  place('prod_rice', 'store_lidl', 'Pantry'),
  place('prod_rice', 'store_coop', 'Pantry'),
  place('prod_spaghetti', 'store_lidl', 'Pantry'),
  place('prod_spaghetti', 'store_hieber', 'Household'), // odd-one-out layout, on purpose
  place('prod_oil', 'store_lidl', 'Pantry'),
  place('prod_oil', 'store_coop', 'Pantry'),
  place('prod_coffee', 'store_hieber', 'Beverages'),
  place('prod_coffee', 'store_coop', 'Pantry'),
  place('prod_oj', 'store_lidl', 'Beverages'),
  place('prod_oj', 'store_hieber', 'Beverages'),
  place('prod_oj', 'store_coop', 'Beverages'),
  place('prod_water', 'store_lidl', 'Beverages'),
  place('prod_water', 'store_coop', 'Beverages'),
  place('prod_dishsoap', 'store_lidl', 'Household'),
  place('prod_dishsoap', 'store_hieber', 'Household'),
  place('prod_dishsoap', 'store_coop', 'Health & Household'),
  place('prod_papertowels', 'store_hieber', 'Household'),
  place('prod_papertowels', 'store_coop', 'Health & Household'),
  place('prod_detergent', 'store_lidl', 'Household'),
  place('prod_toiletpaper', 'store_lidl', 'Household'),
  place('prod_toiletpaper', 'store_hieber', 'Household'),
  place('prod_toiletpaper', 'store_coop', 'Health & Household'),
  place('prod_ibuprofen', 'store_coop', 'Health & Household'),
  place('prod_toothpaste', 'store_coop', 'Health & Household'),
  place('prod_toothpaste', 'store_lidl', 'Household'),
];

// --- a starter shopping list ---
// need id === product id; qty / note here override the product defaults for this trip
const need = (product_id, over = {}) =>
  row({ id: product_id, product_id, qty: null, note: null, status: 'needed', ...over });
const needs = [
  need('prod_milk'),
  need('prod_eggs'),
  need('prod_sourdough'),
  need('prod_bananas'),
  need('prod_chicken'),
  need('prod_rice'),
  need('prod_coffee'),
  need('prod_toiletpaper'),
  need('prod_ibuprofen'),
  need('prod_candles'), // not sold anywhere — shows under "Not sold here"
];

async function post(path, body, headers = { 'content-type': 'application/json' }) {
  try {
    return await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  } catch {
    console.error(`\nCan't reach the API at ${API}.`);
    console.error('Start it first in another terminal:  npm run dev');
    console.error('(wait for "Ready on http://localhost:8787", then re-run this)\n');
    process.exit(1);
  }
}

async function main() {
  // ensure a password exists, then get a token
  let res = await post('/api/setup', { password: PASSWORD, ...(SETUP_KEY ? { key: SETUP_KEY } : {}) });
  if (res.status === 409) {
    res = await post('/api/auth', { password: PASSWORD });
  }
  if (!res.ok) {
    console.error(`auth failed (${res.status}):`, await res.text());
    console.error('Wrong password? Pass it as an argument:  npm run seed -- <password>');
    process.exit(1);
  }
  const { token } = await res.json();
  const auth = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  if (FRESH) {
    const cur = await (await post('/api/sync', { cursor: 0, changes: {} }, auth)).json();
    const kill = {};
    for (const [table, rows] of Object.entries(cur.changes ?? {})) {
      kill[table] = rows
        .filter((r) => !r.deleted)
        .map((r) => ({ ...r, deleted: 1, updated_at: stamp }));
    }
    const total = Object.values(kill).reduce((n, r) => n + r.length, 0);
    if (total) {
      const killed = await (await post('/api/sync', { cursor: 0, changes: kill }, auth)).json();
      // seed rows must be newer than the server-stamped tombstones
      stamp = (killed.cursor ?? Date.now()) + 1;
      console.log(`--fresh: cleared ${total} existing rows.`);
    }
  }

  const restamp = (rows) => rows.map((r) => ({ ...r, updated_at: stamp }));
  const sync = await post(
    '/api/sync',
    {
      cursor: 0,
      changes: {
        stores: restamp(stores),
        areas: restamp(areas),
        products: restamp(products),
        placements: restamp(placements),
        needs: restamp(needs),
      },
    },
    auth,
  );
  if (!sync.ok) {
    console.error(`sync failed (${sync.status}):`, await sync.text());
    process.exit(1);
  }
  console.log(
    `Seeded: ${stores.length} stores, ${areas.length} aisles, ${products.length} products, ` +
      `${placements.length} placements, ${needs.length} on the list.`,
  );
  console.log('Includes: multi-store items, qty-only, note-only, qty+note, and plain.');
  console.log('Reload the app (or Settings → Sync now) to see it.');
}

main();
