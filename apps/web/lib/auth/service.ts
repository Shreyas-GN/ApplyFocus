import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { authTokens, users } from '@/lib/db/schema';
import {
  EMAIL_VERIFICATION_TTL_SECONDS,
  PASSWORD_RESET_TTL_SECONDS,
} from './constants';
import { ensureAuthSchema } from './bootstrap';
import { generateCsrfToken } from './csrf';
import { sendPasswordResetEmail, sendVerificationEmail } from './email';
import { hashPassword, verifyDummyPassword, verifyPassword } from './password';
import { clear, enforce, hit, peek } from './rate-limit';
import { dbErrorCode, HttpError } from './request';
import {
  createSession,
  deleteAllSessions,
  type SessionUser,
} from './session';
import { generateRawToken, hashToken } from './tokens';

const HOUR = 3600;
const FIVE_MIN = 300;

type TokenPurpose = 'password_reset' | 'email_verification';

export interface AuthResult {
  user: SessionUser;
  csrfToken: string;
  sessionToken: string;
}

function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    email: row.email,
    emailVerified: row.emailVerifiedAt !== null,
    name: null,
  };
}

async function startSession(row: typeof users.$inferSelect): Promise<AuthResult> {
  const sessionToken = await createSession(row.id);
  return {
    user: toSessionUser(row),
    csrfToken: await generateCsrfToken(sessionToken),
    sessionToken,
  };
}

/** Replaces any outstanding token of this purpose and returns the raw one. */
async function issueToken(
  userId: string,
  purpose: TokenPurpose,
  ttlSeconds: number
): Promise<string> {
  const raw = generateRawToken();
  await db.transaction(async (tx) => {
    await tx
      .delete(authTokens)
      .where(and(eq(authTokens.userId, userId), eq(authTokens.purpose, purpose)));
    await tx.insert(authTokens).values({
      id: hashToken(raw),
      userId,
      purpose,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    });
  });
  return raw;
}

/** Atomically consumes a token; returns its user id, or null if unusable. */
async function consumeToken(
  raw: string,
  purpose: TokenPurpose
): Promise<string | null> {
  const [row] = await db
    .delete(authTokens)
    .where(and(eq(authTokens.id, hashToken(raw)), eq(authTokens.purpose, purpose)))
    .returning();
  if (!row || row.expiresAt.getTime() <= Date.now()) return null;
  return row.userId;
}

async function sendVerification(row: typeof users.$inferSelect): Promise<void> {
  const token = await issueToken(
    row.id,
    'email_verification',
    EMAIL_VERIFICATION_TTL_SECONDS
  );
  await sendVerificationEmail(row.email, token);
}

export interface SignUpResult {
  /** False when the account exists but the confirmation email could not be sent. */
  emailSent: boolean;
}

export async function signUp(
  email: string,
  password: string,
  ip: string
): Promise<SignUpResult> {
  await ensureAuthSchema();
  await enforce(
    `signup:ip:${ip}`,
    5,
    HOUR,
    'Too many sign-up attempts. Please try again later.'
  );

  const passwordHash = await hashPassword(password);
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  let target: typeof users.$inferSelect;
  if (existing) {
    if (existing.emailVerifiedAt) {
      throw new HttpError(
        409,
        'An account with this email already exists. Try logging in.'
      );
    }
    // Unverified: the owner never proved control of this address, so a retry
    // (e.g. after a failed confirmation email) replaces the password and
    // re-sends the link instead of leaving the signup stuck.
    const [updated] = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, existing.id))
      .returning();
    target = updated ?? existing;
  } else {
    try {
      const [created] = await db
        .insert(users)
        .values({ email, passwordHash })
        .returning();
      if (!created) throw new Error('User insert returned no row.');
      target = created;
    } catch (error) {
      if (dbErrorCode(error) === '23505') {
        throw new HttpError(
          409,
          'An account with this email already exists. Try logging in.'
        );
      }
      throw error;
    }
  }

  try {
    await sendVerification(target);
    return { emailSent: true };
  } catch (error) {
    // The account is saved; the user can re-send from the next screen.
    console.error(
      '[auth:signup] Account created but the confirmation email failed. ' +
        'Check RESEND_API_KEY / EMAIL_FROM and that the Resend domain is verified:',
      error
    );
    return { emailSent: false };
  }
}

export async function logIn(
  email: string,
  password: string,
  ip: string
): Promise<AuthResult> {
  await ensureAuthSchema();
  const ipKey = `login:ip:${ip}`;
  const emailKey = `login:email:${email}`;

  if ((await peek(ipKey, FIVE_MIN)) >= 20) {
    throw new HttpError(429, 'Too many failed login attempts from this network.');
  }
  if ((await peek(emailKey, FIVE_MIN)) >= 5) {
    throw new HttpError(429, 'Too many failed login attempts. Please try again later.');
  }

  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const valid = row
    ? await verifyPassword(row.passwordHash, password)
    : (await verifyDummyPassword(password), false);

  if (!row || !valid) {
    await Promise.all([hit(ipKey, FIVE_MIN), hit(emailKey, FIVE_MIN)]);
    throw new HttpError(401, 'Invalid email or password.');
  }

  await clear(emailKey);

  if (!row.emailVerifiedAt) {
    // Correct password but unverified: send a fresh link (throttled).
    try {
      await enforce(`verify:email:${email}`, 5, HOUR, 'Too many emails requested.');
      await sendVerification(row);
    } catch (error) {
      console.error('Could not resend verification email:', error);
    }
    throw new HttpError(
      403,
      'Please confirm your email first. We just sent you a new confirmation link.'
    );
  }

  return startSession(row);
}

export async function verifyEmail(token: string): Promise<AuthResult> {
  await ensureAuthSchema();
  const userId = await consumeToken(token, 'email_verification');
  if (!userId) {
    throw new HttpError(400, 'This verification link is invalid or has expired.');
  }
  const [row] = await db
    .update(users)
    .set({ emailVerifiedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  if (!row) {
    throw new HttpError(400, 'This verification link is invalid or has expired.');
  }
  return startSession(row);
}

export async function resendVerification(email: string, ip: string): Promise<void> {
  await ensureAuthSchema();
  await enforce(`verify:ip:${ip}`, 10, HOUR, 'Too many requests. Try again later.');
  await enforce(`verify:email:${email}`, 5, HOUR, 'Too many requests. Try again later.');

  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (row && !row.emailVerifiedAt) {
    await sendVerification(row);
  }
  // Same outcome whether or not the account exists.
}

export async function requestPasswordReset(email: string, ip: string): Promise<void> {
  await ensureAuthSchema();
  await enforce(`forgot:ip:${ip}`, 10, HOUR, 'Too many requests. Try again later.');
  await enforce(`forgot:email:${email}`, 5, HOUR, 'Too many requests. Try again later.');

  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!row) return; // identical response either way — no enumeration signal

  const token = await issueToken(row.id, 'password_reset', PASSWORD_RESET_TTL_SECONDS);
  await sendPasswordResetEmail(row.email, token);
}

export async function resetPassword(
  token: string,
  newPassword: string,
  ip: string
): Promise<void> {
  await ensureAuthSchema();
  await enforce(`reset:ip:${ip}`, 10, HOUR, 'Too many attempts. Try again later.');

  const userId = await consumeToken(token, 'password_reset');
  if (!userId) {
    throw new HttpError(400, 'This reset link is invalid or has expired.');
  }

  const passwordHash = await hashPassword(newPassword);
  await db.transaction(async (tx) => {
    // Clicking an emailed link proves control of the address.
    const [current] = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    await tx
      .update(users)
      .set({ passwordHash, emailVerifiedAt: current?.emailVerifiedAt ?? new Date() })
      .where(eq(users.id, userId));
  });
  // End every session so a possible attacker is signed out everywhere.
  await deleteAllSessions(userId);
}
