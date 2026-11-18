// Edge-safe (Web Crypto only): used by middleware and route handlers alike.
// The CSRF token is derived statelessly from the raw session cookie:
//   csrf = HMAC-SHA256(AUTH_SECRET, rawSessionToken)
// so there is nothing to store and it dies with the session.

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET must be set and at least 32 characters long (generate one with `openssl rand -base64 32`).'
    );
  }
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generateCsrfToken(rawSessionToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(rawSessionToken)
  );
  return toHex(signature);
}

/** Constant-time string comparison (Web Crypto has no timingSafeEqual). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyCsrfToken(
  rawSessionToken: string,
  presented: string | null | undefined
): Promise<boolean> {
  if (!presented) return false;
  const expected = await generateCsrfToken(rawSessionToken);
  return safeEqual(presented, expected);
}
