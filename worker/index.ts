// Cloudflare Worker entry. Handles /api/*; everything else is served by [assets].
// Full API (auth, sync) lands in Phase 1.

export interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export default {
  async fetch(req: Request, _env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (!url.pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, ts: Date.now() });
    }

    return json({ error: 'not found' }, 404);
  },
};
