// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, sessions, authTokens } from '@/lib/db/schema';
import { signUp, logIn } from './service';
import { createSession, resolveSessionToken, deleteSession } from './session';
import { generateCsrfToken, verifyCsrfToken } from './csrf';
import { hashToken } from './tokens';

const isNeonConfigured =
  Boolean(process.env.RUN_NEON_INTEGRATION === 'true') &&
  Boolean(process.env.DATABASE_URL?.includes('neon.tech')) &&
  Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);

describe.skipIf(!isNeonConfigured)('Neon Auth Integration Flow', () => {
  const testEmail = `neon_auth_${Date.now()}@example.com`;
  const testPassword = 'Password123!Secure';
  let createdUserId: string;
  let sessionToken: string;
  let csrfToken: string;

  beforeAll(async () => {
    expect(process.env.DATABASE_URL).toContain('neon.tech');
    expect(process.env.AUTH_SECRET).toBeDefined();
    expect(process.env.AUTH_SECRET!.length).toBeGreaterThanOrEqual(32);
  });

  afterAll(async () => {
    if (createdUserId) {
      await db.delete(users).where(eq(users.id, createdUserId));
    }
  });

  it('1. Signs up new user against Neon database', async () => {
    const result = await signUp(testEmail, testPassword, '127.0.0.1');
    expect(result.emailSent).toBe(true);

    // Verify row in Neon users table
    const [userRow] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);
    expect(userRow).toBeDefined();
    if (!userRow) throw new Error('userRow not found');
    expect(userRow.email).toBe(testEmail);
    expect(userRow.emailVerifiedAt).toBeNull();
    createdUserId = userRow.id;

    // Verify token in Neon auth_tokens table
    const tokens = await db
      .select()
      .from(authTokens)
      .where(eq(authTokens.userId, userRow.id));
    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0]!.purpose).toBe('email_verification');
  });

  it('2. Prevents login for unverified user against Neon database', async () => {
    await expect(logIn(testEmail, testPassword, '127.0.0.1')).rejects.toThrow(
      /confirm your email/i
    );
  });

  it('3. Verifies email in Neon and performs login', async () => {
    // Mark verified in Neon DB
    await db
      .update(users)
      .set({ emailVerifiedAt: new Date() })
      .where(eq(users.id, createdUserId));

    const authResult = await logIn(testEmail, testPassword, '127.0.0.1');
    expect(authResult.user.id).toBe(createdUserId);
    expect(authResult.user.email).toBe(testEmail);
    expect(authResult.user.emailVerified).toBe(true);
    expect(authResult.sessionToken).toBeDefined();
    expect(authResult.csrfToken).toBeDefined();

    sessionToken = authResult.sessionToken;
    csrfToken = authResult.csrfToken;

    // Verify session row exists in Neon sessions table
    const [sessionRow] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, hashToken(sessionToken)))
      .limit(1);
    expect(sessionRow).toBeDefined();
    if (!sessionRow) throw new Error('sessionRow not found');
    expect(sessionRow.userId).toBe(createdUserId);
    expect(sessionRow.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('4. Resolves session (powers /api/auth/me) and validates CSRF from Neon', async () => {
    const sessionUser = await resolveSessionToken(sessionToken);
    expect(sessionUser).not.toBeNull();
    expect(sessionUser!.id).toBe(createdUserId);
    expect(sessionUser!.email).toBe(testEmail);
    expect(sessionUser!.emailVerified).toBe(true);

    // Validate CSRF token derived from session token
    const isCsrfValid = await verifyCsrfToken(sessionToken, csrfToken);
    expect(isCsrfValid).toBe(true);

    const isWrongCsrfValid = await verifyCsrfToken(sessionToken, 'wrong-token');
    expect(isWrongCsrfValid).toBe(false);
  });

  it('5. Deletes session (powers /api/auth/logout) and verifies removal from Neon', async () => {
    await deleteSession(sessionToken);

    // Verify session row is gone from Neon sessions table
    const [sessionRow] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, hashToken(sessionToken)))
      .limit(1);
    expect(sessionRow).toBeUndefined();

    // Verify resolving the session token now returns null
    const sessionUser = await resolveSessionToken(sessionToken);
    expect(sessionUser).toBeNull();
  });
});
