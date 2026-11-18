import { createNeonAuth } from '@neondatabase/auth/next/server';

type NeonAuthInstance = ReturnType<typeof createNeonAuth>;

let instance: NeonAuthInstance | undefined;

/**
 * Lazily creates the Neon Auth server instance.
 *
 * Creation is deferred until first use so that `next build` (which imports
 * route modules without runtime secrets) does not fail when the Neon Auth
 * environment variables are absent. Any real request that needs auth will
 * still fail loudly with a clear message if they are missing.
 */
export function getAuth(): NeonAuthInstance {
  if (instance) return instance;

  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;

  if (!baseUrl) {
    throw new Error('NEON_AUTH_BASE_URL is not set (Neon Console → Auth).');
  }
  if (!secret || secret.length < 32) {
    throw new Error(
      'NEON_AUTH_COOKIE_SECRET must be set and at least 32 characters long (generate one with `openssl rand -base64 32`).'
    );
  }

  instance = createNeonAuth({
    baseUrl,
    cookies: { secret },
  });
  return instance;
}
