// Cloudflare Worker entry. Handles /api/*; everything else is served by [assets].
// See docs/specs.md §6–§8.

import type { AuthResponse, SyncRequest } from '../shared/types';
import { isAuthed, issueToken, getPasswordHash, setPassword, verifyPassword } from './auth';
import { runSync, SyncError } from './sync';

export interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

async function handleSetup(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ password?: string }>(req);
  const password = body?.password?.trim();
  if (!password || password.length < 4) {
    return json({ error: 'password must be at least 4 characters' }, 400);
  }
  if (await getPasswordHash(env)) {
    return json({ error: 'already configured' }, 409);
  }
  await setPassword(env, password);
  const token = await issueToken(env);
  return json({ token } satisfies AuthResponse);
}

async function handleAuth(req: Request, env: Env): Promise<Response> {
  const body = await readJson<{ password?: string }>(req);
  const password = body?.password ?? '';
  if (!(await getPasswordHash(env))) {
    return json({ error: 'not configured' }, 409);
  }
  if (!(await verifyPassword(env, password))) {
    return json({ error: 'invalid password' }, 403);
  }
  const token = await issueToken(env);
  return json({ token } satisfies AuthResponse);
}

async function handleSync(req: Request, env: Env): Promise<Response> {
  if (!(await isAuthed(req, env))) return json({ error: 'unauthorized' }, 401);
  const body = await readJson<SyncRequest>(req);
  if (!body || typeof body !== 'object') return json({ error: 'bad request' }, 400);
  try {
    const result = await runSync(env, body);
    return json(result);
  } catch (err) {
    if (err instanceof SyncError) return json({ error: err.message }, 400);
    throw err;
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const { pathname } = url;

    if (!pathname.startsWith('/api/')) {
      return new Response('Not found', { status: 404 });
    }

    try {
      if (pathname === '/api/health') {
        return json({ ok: true, ts: Date.now(), configured: Boolean(await getPasswordHash(env)) });
      }
      if (pathname === '/api/setup' && req.method === 'POST') {
        return await handleSetup(req, env);
      }
      if (pathname === '/api/auth' && req.method === 'POST') {
        return await handleAuth(req, env);
      }
      if (pathname === '/api/sync' && req.method === 'POST') {
        return await handleSync(req, env);
      }
      return json({ error: 'not found' }, 404);
    } catch (err) {
      console.error('worker error', err);
      return json({ error: 'internal error' }, 500);
    }
  },
};
