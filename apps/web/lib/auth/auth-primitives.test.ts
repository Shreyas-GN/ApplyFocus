// @vitest-environment node
import { beforeAll, describe, expect, it } from 'vitest';
import { generateCsrfToken, safeEqual, verifyCsrfToken } from './csrf';
import { hashPassword, verifyPassword } from './password';
import { generateRawToken, hashToken } from './tokens';

beforeAll(() => {
  process.env.AUTH_SECRET = 'test-secret-that-is-at-least-32-characters-long';
});

describe('tokens', () => {
  it('generates 256-bit hex tokens that are unique', () => {
    const a = generateRawToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(generateRawToken()).not.toBe(a);
  });

  it('hashes deterministically and never returns the raw token', () => {
    const raw = generateRawToken();
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(raw)).not.toBe(raw);
  });
});

describe('password hashing', () => {
  it('uses argon2id and verifies only the right password', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'correct horse battery')).toBe(true);
    expect(await verifyPassword(hash, 'wrong password')).toBe(false);
  });

  it('returns false for a malformed hash instead of throwing', async () => {
    expect(await verifyPassword('not-a-hash', 'x')).toBe(false);
  });
});

describe('csrf', () => {
  it('is deterministic per session token and differs across sessions', async () => {
    const a = await generateCsrfToken('session-a');
    expect(await generateCsrfToken('session-a')).toBe(a);
    expect(await generateCsrfToken('session-b')).not.toBe(a);
  });

  it('accepts the matching token and rejects missing or wrong ones', async () => {
    const token = await generateCsrfToken('session-a');
    expect(await verifyCsrfToken('session-a', token)).toBe(true);
    expect(await verifyCsrfToken('session-a', null)).toBe(false);
    expect(await verifyCsrfToken('session-a', 'deadbeef')).toBe(false);
    expect(await verifyCsrfToken('session-b', token)).toBe(false);
  });

  it('safeEqual compares correctly', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});
