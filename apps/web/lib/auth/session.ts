import { eq, lt } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { sessions, users } from '@/lib/db/schema';
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from './constants';
import { generateCsrfToken } from './csrf';
import { generateRawToken, hashToken } from './tokens';

export interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

export interface ResolvedSession {
  user: SessionUser;
  csrfToken: string;
}

/** Creates a session row and returns the raw token for the cookie. */
export async function createSession(userId: string): Promise<string> {
  const raw = generateRawToken();
  await db.insert(sessions).values({
    id: hashToken(raw),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1000),
  });
  return raw;
}

export async function setSessionCookie(raw: string): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionCookie(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

/** Looks up a raw token. Expired sessions are deleted on sight. */
export async function resolveSessionToken(
  raw: string
): Promise<SessionUser | null> {
  const id = hashToken(raw);
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      userId: users.id,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);

  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  return {
    id: row.userId,
    email: row.email,
    emailVerified: row.emailVerifiedAt !== null,
    name: null,
  };
}

/**
 * Returns the signed-in user for the current request, or null when there is
 * no valid session.
 */
export async function getUser(): Promise<SessionUser | null> {
  try {
    const raw = await readSessionCookie();
    if (!raw) return null;
    return await resolveSessionToken(raw);
  } catch (error) {
    console.error('Failed to resolve session:', error);
    return null;
  }
}

export async function getSession(): Promise<ResolvedSession | null> {
  const raw = await readSessionCookie();
  if (!raw) return null;
  const user = await resolveSessionToken(raw);
  if (!user) return null;
  return { user, csrfToken: await generateCsrfToken(raw) };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function deleteSession(raw: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(raw)));
}

export async function deleteAllSessions(userId: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function purgeExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
