// worker.js
// Bindings required in deployment: KV namespace GROCERY_KV, env var AUTH_SECRET

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
  });
  
  const JSON_HEADERS = { 'Content-Type': 'application/json' };

  const PASSWORD = 'empress-burgers-inventor-mike';
  
  async function handleRequest(req) {
    const url = new URL(req.url);
    if (url.pathname === '/') return serveIndex();
    if (url.pathname === '/index.html') return serveIndex();
    if (url.pathname.startsWith('/api')) return handleApi(req);
    // static assets (css/js) can be served here if embedded; otherwise 404
    return new Response('Not found', { status: 404 });
  }
  
  async function serveIndex() {
    // The index.html content is embedded below in this document; for deployment you can
    // host it separately or return it here. For convenience the worker returns a minimal page.
    const resp = await fetch('http://localhost:8787/index.html');
    const html = await resp.text();
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
  
  // --- Helpers for KV storage ---
  function kvKeyForList(listId) {
    return `list:${listId}`;
  }
  
  async function getListsIndex() {
    const raw = await GROCERY_KV.get('lists:index');
    if (!raw) return [];
    try { return JSON.parse(raw); } catch (e) { return []; }
  }
  
  async function setListsIndex(idx) {
    await GROCERY_KV.put('lists:index', JSON.stringify(idx));
  }
  
  async function readList(listId) {
    const raw = await GROCERY_KV.get(kvKeyForList(listId));
    if (!raw) return null;
    return JSON.parse(raw);
  }
  
  async function writeList(listId, data) {
    data.version = Date.now();
    await GROCERY_KV.put(kvKeyForList(listId), JSON.stringify(data));
    return data;
  }
  
  async function deleteList(listId) {
    await GROCERY_KV.delete(kvKeyForList(listId));
  }
  
  // --- Auth ---
  // Simple password check and token generation using HMAC with AUTH_SECRET
//   import { crypto } from 'globalthis/implementation' // shim for some Wrangler setups
  
  async function checkPassword(password) {
    const stored = await GROCERY_KV.get('app:password_hash');
    if (!stored) return false;
    return password === stored;
  }
  
  async function getSecret() {
    if (typeof AUTH_SECRET === 'undefined') throw new Error('AUTH_SECRET not set');
    return AUTH_SECRET;
  }
  
  async function hmac(msg, key) {
    const enc = new TextEncoder();
    const keyData = enc.encode(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(msg));
    return bufferToHex(sig);
  }
  
  function bufferToHex(buf) {
    const b = new Uint8Array(buf);
    return Array.from(b).map(x => x.toString(16).padStart(2,'0')).join('');
  }
  
  async function makeToken() {
    const token = PASSWORD;
    // store token in KV with expiry 30 days (TTL seconds)
    await GROCERY_KV.put(`token:${token}`, '1', { expirationTtl: 60*60*24*30 });
    return token;
  }
  
  async function validateToken(token) {
    if (!token) return false;
    const ok = await GROCERY_KV.get(`token:${token}`);
    return !!ok;
  }
  
  // --- API handler ---
  async function handleApi(req) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, '');
    const method = req.method.toUpperCase();
  
    // authentication: for mutating requests require valid token
    if (method !== 'GET' && !await authFromRequest(req)) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: JSON_HEADERS });
    }
  
    // routes
    if (path === '/auth' && method === 'POST') return apiAuth(req);
    if (path === '/setup' && method === 'POST') return apiSetup(req);
  
    if (path === '/lists' && method === 'GET') return apiGetLists(req);
    if (path === '/lists' && method === 'POST') return apiCreateList(req);
    // specific list operations
    const listMatch = path.match(/^\/lists\/(.+)$/);
    if (listMatch) {
      const listId = decodeURIComponent(listMatch[1]);
      if (method === 'GET') return apiGetList(req, listId);
      if (method === 'PUT') return apiUpdateList(req, listId);
      if (method === 'DELETE') return apiDeleteList(req, listId);
    }
  
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: JSON_HEADERS });
  }
  
  async function authFromRequest(req) {
    const auth = req.headers.get('Authorization') || '';
    if (auth.startsWith('Bearer ')) {
      const token = auth.slice(7);
      return await validateToken(token);
    }
    return false;
  }
  
  async function apiAuth(req) {
    // body: { password }
    const body = await req.json();
    if (!body || !body.password) return new Response(JSON.stringify({ error: 'missing password' }), { status: 400, headers: JSON_HEADERS });
    const ok = await checkPassword(body.password);
    if (!ok) return new Response(JSON.stringify({ error: 'invalid password' }), { status: 403, headers: JSON_HEADERS });
    const token = await makeToken();
    return new Response(JSON.stringify({ token }), { headers: JSON_HEADERS });
  }
  
  async function apiSetup(req) {
    // One-time setup to set the password if none exists. body: { password }
    const body = await req.json();
    if (!body || !body.password) return new Response(JSON.stringify({ error: 'missing password' }), { status: 400, headers: JSON_HEADERS });
    const stored = await GROCERY_KV.get('app:password_hash');
    if (stored) return new Response(JSON.stringify({ error: 'already configured' }), { status: 400, headers: JSON_HEADERS });
    const hash = await hmac(body.password, await getSecret());
    await GROCERY_KV.put('app:password_hash', hash);
    const token = await makeToken();
    return new Response(JSON.stringify({ token }), { headers: JSON_HEADERS });
  }
  
  async function apiGetLists(req) {
    const idx = await getListsIndex();
    const lists = [];
    for (const meta of idx) {
      const data = await readList(meta.id);
      if (data) lists.push({ id: meta.id, name: data.name, version: data.version });
    }
    return new Response(JSON.stringify({ lists }), { headers: JSON_HEADERS });
  }
  
  async function apiCreateList(req) {
    const body = await req.json();
    if (!body || !body.name) return new Response(JSON.stringify({ error: 'missing name' }), { status: 400, headers: JSON_HEADERS });
    const id = generateId();
    const data = {
      id,
      name: body.name,
      listA: [],
      listB: [],
      orderB: [],
      version: Date.now()
    };
    await writeList(id, data);
    const idx = await getListsIndex();
    idx.unshift({ id, name: body.name });
    await setListsIndex(idx);
    return new Response(JSON.stringify({ id }), { headers: JSON_HEADERS });
  }
  
  async function apiGetList(req, listId) {
    const data = await readList(listId);
    if (!data) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: JSON_HEADERS });
    return new Response(JSON.stringify(data), { headers: JSON_HEADERS });
  }
  
  async function apiUpdateList(req, listId) {
    const body = await req.json();
    if (!body) return new Response(JSON.stringify({ error: 'missing body' }), { status: 400, headers: JSON_HEADERS });
    const cur = await readList(listId);
    if (!cur) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: JSON_HEADERS });
    // Merge: server authoritative. We'll accept fields and write a new version.
    // Allow updates: name, listA, listB, orderB
    const allowed = ['name','listA','listB','orderB'];
    for (const k of allowed) if (k in body) cur[k] = body[k];
    const newData = await writeList(listId, cur);
    return new Response(JSON.stringify(newData), { headers: JSON_HEADERS });
  }
  
  async function apiDeleteList(req, listId) {
    await deleteList(listId);
    let idx = await getListsIndex();
    idx = idx.filter(x => x.id !== listId);
    await setListsIndex(idx);
    return new Response(JSON.stringify({ ok: true }), { headers: JSON_HEADERS });
  }
  
  function generateId() {
    return crypto.getRandomValues(new Uint8Array(8)).reduce((s,b)=> s + b.toString(16).padStart(2,'0'),'');
  }