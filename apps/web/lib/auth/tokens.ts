import { createHash, randomBytes } from 'node:crypto';

/** 256-bit random token, hex encoded. This is what the client holds. */
export function generateRawToken(): string {
  return randomBytes(32).toString('hex');
}

/** What the database stores. A leaked row cannot be replayed as a cookie/link. */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}
