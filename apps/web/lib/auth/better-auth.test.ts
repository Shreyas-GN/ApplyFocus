import { describe, expect, it } from 'vitest';
import { auth } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';

describe('Better Auth Configuration & Handlers', () => {
  it('initializes the server-side Better Auth instance correctly', () => {
    expect(auth).toBeDefined();
    expect(auth.handler).toBeTypeOf('function');
    expect(auth.api).toBeDefined();
    expect(auth.api.getSession).toBeTypeOf('function');
    expect(auth.api.signInEmail).toBeTypeOf('function');
    expect(auth.api.signUpEmail).toBeTypeOf('function');
    expect(auth.api.signOut).toBeTypeOf('function');
  });

  it('initializes the client-side Better Auth instance correctly', () => {
    expect(authClient).toBeDefined();
    expect(authClient.signIn).toBeDefined();
    expect(authClient.signUp).toBeDefined();
    expect(authClient.signOut).toBeDefined();
    expect(authClient.useSession).toBeTypeOf('function');
  });

  it('exposes the HTTP route handler for Next.js App Router', async () => {
    const routeHandler = await import('@/app/api/auth/[...all]/route');
    expect(routeHandler.GET).toBeTypeOf('function');
    expect(routeHandler.POST).toBeTypeOf('function');
  });
});

