// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { verifyTurnstileToken } from './turnstile';

describe('verifyTurnstileToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns true if TURNSTILE_SECRET_KEY is unset and not in production', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'development');
    const result = await verifyTurnstileToken(undefined);
    expect(result).toBe(true);
  });

  it('returns false if token is missing and secret key is set in production', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '0x4AAAAAAtestkey');
    vi.stubEnv('NODE_ENV', 'production');
    const result = await verifyTurnstileToken(undefined);
    expect(result).toBe(false);
  });

  it('returns true for Cloudflare dummy test token', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '0x4AAAAAAtestkey');
    vi.stubEnv('NODE_ENV', 'production');
    const result = await verifyTurnstileToken('XXXX.DUMMY.TOKEN.XXXX');
    expect(result).toBe(true);
  });

  it('verifies token against Cloudflare siteverify endpoint', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '0x4AAAAAAtestkey');
    vi.stubEnv('NODE_ENV', 'production');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await verifyTurnstileToken('valid-token-123', '1.2.3.4');
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
      })
    );

    vi.unstubAllGlobals();
  });

  it('returns false when Cloudflare siteverify returns success: false', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '0x4AAAAAAtestkey');
    vi.stubEnv('NODE_ENV', 'production');

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const result = await verifyTurnstileToken('invalid-token', '1.2.3.4');
    expect(result).toBe(false);

    vi.unstubAllGlobals();
  });
});
