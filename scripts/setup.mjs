// Interactive first-time setup for a NEW owner deploying this app to their
// OWN Cloudflare account. Walks through: D1 database, AUTH_SECRET, migrations,
// build + deploy, then setting the password (with an optional example catalog
// so there's something to look at right away). Safe to re-run — every step
// asks before doing anything, and skips what's already configured.
//
//   node scripts/setup.mjs            # production instance
//   node scripts/setup.mjs --env demo # the [env.demo] instance (see README)
//
// wrangler.toml is git-ignored and per-owner (see wrangler.toml.example) —
// this script creates your own local copy on first run and fills in your
// real database id in place once it creates the database, so nothing you
// edit here ever shows up as a change to commit. It never reads or stores
// your real secrets, either — AUTH_SECRET / SETUP_KEY are generated locally
// and piped straight into `wrangler secret put`, then discarded from this
// process except for a one-time printout so you can save them yourself.

import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const ENV = process.argv.includes('--env')
  ? process.argv[process.argv.indexOf('--env') + 1]
  : null;
if (process.argv.includes('--env') && ENV !== 'demo') {
  console.error('Only --env demo is supported (matches [env.demo] in wrangler.toml).');
  process.exit(1);
}

const TOML_PATH = new URL('../wrangler.toml', import.meta.url);
const DB_NAME = ENV === 'demo' ? 'family-grocery-demo' : 'family-grocery';
const WRANGLER_ENV_FLAGS = ENV === 'demo' ? ['--env', 'demo'] : [];

const rl = createInterface({ input: process.stdin, output: process.stdout });
async function ask(question, { defaultNo = true } = {}) {
  const hint = defaultNo ? '[y/N]' : '[Y/n]';
  const answer = (await rl.question(`${question} ${hint} `)).trim().toLowerCase();
  if (!answer) return !defaultNo;
  return answer === 'y' || answer === 'yes';
}

function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'], ...opts });
}

function step(n, title) {
  console.log(`\n── Step ${n}: ${title} ──`);
}

// --- Step 0: confirm wrangler is logged in ---------------------------------
step(0, 'Cloudflare login');
try {
  const who = run('npx', ['wrangler', 'whoami']);
  console.log(who.trim());
} catch {
  console.error('\nNot logged in (or wrangler failed). Run this first:\n');
  console.error('  npx wrangler login\n');
  process.exit(1);
}

// --- Step 1: local config files (git-ignored — never committed, never shared) ---
step(1, 'Local config files');
if (!existsSync('wrangler.toml')) {
  copyFileSync('wrangler.toml.example', 'wrangler.toml');
  console.log('Created wrangler.toml from wrangler.toml.example.');
} else {
  console.log('wrangler.toml already exists — leaving it alone.');
}
if (!existsSync('.dev.vars')) {
  if (await ask('Create .dev.vars from .dev.vars.example for local development?', { defaultNo: false })) {
    copyFileSync('.dev.vars.example', '.dev.vars');
    console.log('Wrote .dev.vars (git-ignored — never committed).');
  }
} else {
  console.log('.dev.vars already exists — leaving it alone.');
}

// --- Step 2: create (or reuse) the D1 database ------------------------------
step(2, `D1 database (${DB_NAME})`);
let toml = readFileSync(TOML_PATH, 'utf8');

// Isolate just this env's [[d1_databases]] block so we don't touch the other
// environment's placeholder/id while editing.
const blockRe =
  ENV === 'demo'
    ? /\[\[env\.demo\.d1_databases\]\][\s\S]*?database_id\s*=\s*"([^"]*)"/
    : /\[\[d1_databases\]\][\s\S]*?database_id\s*=\s*"([^"]*)"/;
const existing = toml.match(blockRe)?.[1];
const looksReal = existing && !/PASTE_.*_HERE/.test(existing) && existing.length > 10;

if (looksReal) {
  console.log(`wrangler.toml already has a database_id for this env (${existing}).`);
  if (!(await ask('Create a NEW database and overwrite it anyway?'))) {
    console.log('Keeping the existing database_id.');
  } else {
    await createAndWriteDbId();
  }
} else {
  if (await ask(`Create the D1 database "${DB_NAME}" on your Cloudflare account now?`, { defaultNo: false })) {
    await createAndWriteDbId();
  } else {
    console.log('Skipped — paste a database_id into wrangler.toml yourself before deploying.');
  }
}

async function createAndWriteDbId() {
  let out;
  try {
    out = run('npx', ['wrangler', 'd1', 'create', DB_NAME]);
    console.log(out);
  } catch {
    console.error('Could not create the D1 database (maybe it already exists on your account?).');
    console.error('Run `npx wrangler d1 list` to find its id, then paste it into wrangler.toml.');
    return;
  }
  const id = out.match(/database_id\s*=\s*"([^"]+)"/)?.[1];
  if (!id) {
    console.error('Created the database, but could not read its id from wrangler output.');
    console.error('Copy the database_id shown above into wrangler.toml yourself.');
    return;
  }
  toml = toml.replace(blockRe, (whole) => whole.replace(/database_id\s*=\s*"[^"]*"/, `database_id = "${id}"`));
  writeFileSync(TOML_PATH, toml);
  console.log(`wrangler.toml updated with database_id = "${id}".`);
}

// --- Step 3: apply migrations ------------------------------------------------
step(3, 'Database schema (migrations)');
if (await ask(`Apply migrations to ${DB_NAME} on Cloudflare now?`, { defaultNo: false })) {
  try {
    run('npx', ['wrangler', 'd1', 'migrations', 'apply', DB_NAME, '--remote', ...WRANGLER_ENV_FLAGS], {
      stdio: 'inherit',
    });
  } catch {
    console.error('Migrations failed — fix the error above, then re-run this script.');
    process.exit(1);
  }
}

// --- Step 4: AUTH_SECRET ------------------------------------------------------
step(4, 'AUTH_SECRET (signs every password hash — required)');
if (await ask('Generate and set a new AUTH_SECRET now?', { defaultNo: false })) {
  console.log(
    'Warning: if a password was already set for this instance, changing AUTH_SECRET\n' +
      'invalidates it (the stored hash was signed with the old secret). Only do this\n' +
      'on a brand-new instance, or be ready to reset the password after (see README).',
  );
  if (await ask('Continue?')) {
    const secret = randomBytes(32).toString('hex');
    run('npx', ['wrangler', 'secret', 'put', 'AUTH_SECRET', ...WRANGLER_ENV_FLAGS], { input: secret });
    console.log('AUTH_SECRET set. (Not stored anywhere by this script.)');
  }
}

// --- Step 5: SETUP_KEY (optional) --------------------------------------------
step(5, 'SETUP_KEY (optional — locks /api/setup until you provide this key)');
let setupKey = null;
if (await ask('Set a SETUP_KEY so nobody else can claim the family password after deploy?')) {
  setupKey = randomBytes(16).toString('hex');
  run('npx', ['wrangler', 'secret', 'put', 'SETUP_KEY', ...WRANGLER_ENV_FLAGS], { input: setupKey });
  console.log(`SETUP_KEY set. SAVE THIS — you need it for the /api/setup call below:\n\n  ${setupKey}\n`);
}

// --- Step 6: build + deploy ---------------------------------------------------
step(6, 'Build & deploy');
let url = null;
if (await ask('Build and deploy the app to Cloudflare now?', { defaultNo: false })) {
  run('npm', ['run', 'build'], { stdio: 'inherit' });
  let out;
  try {
    out = run('npx', ['wrangler', 'deploy', ...WRANGLER_ENV_FLAGS], { stdio: ['pipe', 'pipe', 'inherit'] });
    console.log(out);
  } catch {
    console.error('Deploy failed — see the error above.');
    process.exit(1);
  }
  url = out.match(/https:\/\/[^\s]+\.workers\.dev\S*/)?.[0] ?? null;
  console.log('\nDeployed.' + (url ? ` URL: ${url}` : ''));
}

// --- Step 7: set the password (and, optionally, example content) -----------
step(7, 'Set the password');
if (!url) {
  console.log('Skipped deploy, so there\'s no URL yet — re-run this script once you have one.');
} else {
  let password = '';
  while (password.length < 8) {
    password = (
      await rl.question('Choose the password everyone will use to open the app (8+ characters): ')
    ).trim();
    if (password.length < 8) console.log('Too short — try again.');
  }

  const withExample = await ask(
    'Load a couple of example stores and products, so there\'s something to look at right away?',
    { defaultNo: false },
  );

  if (withExample) {
    const seedArgs = setupKey ? [password, url, setupKey] : [password, url];
    run('node', ['scripts/seed.mjs', ...seedArgs], { stdio: 'inherit' });
  } else {
    const body = JSON.stringify({ password, ...(setupKey ? { key: setupKey } : {}) });
    const res = await fetch(`${url}/api/setup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    });
    if (res.ok) {
      console.log('Password set. The app starts empty — add your own stores and products.');
    } else {
      console.error(`Could not set the password automatically (HTTP ${res.status}).`);
      console.error(`Open ${url} instead — the app asks for a password on first load.`);
    }
  }
}

console.log(`\nAll done. Open ${url ?? 'your deployed URL'} — each family member signs in once`);
console.log('and can add it to their phone\'s Home Screen from Settings.');

rl.close();
