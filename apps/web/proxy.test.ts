// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeAll, describe, expect, it } from 'vitest';
import { generateCsrfToken } from './lib/auth/csrf';
import { proxy } from './proxy';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-that-is-at-least-32-characters-long';
});

function req(
  path: string,
  init: { method?: string; cookie?: string; csrf?: string; origin?: string } = {}
) {
  const headers = new Headers({ host: 'app.test' });
  if (init.cookie) headers.set('cookie', `session_id=${init.cookie}`);
  if (init.csrf) headers.set('x-csrf-token', init.csrf);
  if (init.origin) headers.set('origin', init.origin);
  return new NextRequest(`http://app.test${path}`, {
    method: init.method ?? 'GET',
    headers,
  });
}

describe('proxy', () => {
  it('redirects page requests without a session cookie to /login', async () => {
    const res = await proxy(req('/dashboard'));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get('location')!).pathname).toBe('/login');
  });

  it('lets page requests with a cookie through', async () => {
    const res = await proxy(req('/dashboard', { cookie: 'abc' }));
    expect(res.headers.get('location')).toBeNull();
  });

  it('does not CSRF-check safe API methods', async () => {
    const res = await proxy(req('/api/profile', { cookie: 'abc' }));
    expect(res.status).toBe(200);
  });

  it('rejects cookie-authenticated mutations without a CSRF token', async () => {
    const res = await proxy(req('/api/profile', { method: 'PATCH', cookie: 'abc' }));
    expect(res.status).toBe(403);
  });

  it('rejects a wrong CSRF token', async () => {
    const res = await proxy(
      req('/api/profile', { method: 'POST', cookie: 'abc', csrf: 'nope' })
    );
    expect(res.status).toBe(403);
  });

  it('accepts a valid CSRF token', async () => {
    const csrf = await generateCsrfToken('abc');
    const res = await proxy(
      req('/api/profile', { method: 'POST', cookie: 'abc', csrf })
    );
    expect(res.status).toBe(200);
  });

  it('rejects cross-origin mutations even with a valid token', async () => {
    const csrf = await generateCsrfToken('abc');
    const res = await proxy(
      req('/api/profile', {
        method: 'POST',
        cookie: 'abc',
        csrf,
        origin: 'https://evil.test',
      })
    );
    expect(res.status).toBe(403);
  });

  it.each([
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/ext/applications',
    '/api/cron/ingest-jobs',
  ])('exempts %s from CSRF', async (path) => {
    const res = await proxy(req(path, { method: 'POST', cookie: 'abc' }));
    expect(res.status).toBe(200);
  });

  it('requires CSRF for logout', async () => {
    const res = await proxy(req('/api/auth/logout', { method: 'POST', cookie: 'abc' }));
    expect(res.status).toBe(403);
  });

  it('passes cookie-less mutations on to the route (which answers 401)', async () => {
    const res = await proxy(req('/api/profile', { method: 'POST' }));
    expect(res.status).toBe(200);
  });
});
