import { NextResponse } from 'next/server';
import { z } from 'zod';
import { RateLimitError } from './rate-limit';

/** Trusted client IP: the edge-set header first, then the proxy chain. */
export function getClientIp(request: Request): string {
  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return 'unknown';
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, 'Invalid request body.');
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, result.error.issues[0]?.message ?? 'Invalid request.');
  }
  return result.data;
}

/** Postgres error code, including through Drizzle's error wrapper. */
export function dbErrorCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let i = 0; i < 4 && current; i++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string') return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/** A short, non-sensitive code so a failure can be identified from the UI. */
export function classifyError(error: unknown): string {
  const pg = dbErrorCode(error);
  const message = String((error as { message?: unknown })?.message ?? '');
  const causeMessage = String(
    ((error as { cause?: { message?: unknown } })?.cause)?.message ?? ''
  );
  const text = `${message} ${causeMessage}`;
  if (/AUTH_SECRET/.test(text)) return 'CONFIG_AUTH_SECRET';
  if (pg === '42P01' || /relation ".*" does not exist/.test(text)) return 'DB_SCHEMA_MISSING';
  if (pg === '42501') return 'DB_PERMISSION';
  if (pg === '28P01' || pg === '28000') return 'DB_AUTH_FAILED';
  if (
    pg === '3D000' ||
    pg === 'ECONNREFUSED' ||
    pg === 'ENOTFOUND' ||
    pg === 'ETIMEDOUT' ||
    pg === 'CONNECT_TIMEOUT' ||
    pg === 'CONNECTION_CLOSED' ||
    pg === 'CONNECTION_ENDED' ||
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|CONNECT_TIMEOUT|password authentication|\bSSL\b/.test(text)
  ) {
    return 'DB_CONNECTION';
  }
  if (/argon2|ERR_DLOPEN_FAILED|MODULE_NOT_FOUND/i.test(text)) return 'PASSWORD_HASHER';
  return 'UNKNOWN';
}

/** Maps thrown errors to the `{ detail }` shape the api-client expects. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ detail: error.message }, { status: error.status });
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json({ detail: error.message }, { status: 429 });
  }
  if (dbErrorCode(error) === '42P01') {
    console.error(
      '[auth] Auth tables are missing in this database. Run `pnpm db:migrate` ' +
        '(migration 0010_auth_tables) against the production DATABASE_URL.',
      error
    );
  } else {
    console.error('[auth] Unhandled route error:', error);
  }
  const code = classifyError(error);
  return NextResponse.json(
    { detail: `Something went wrong. (Error code: ${code})`, code },
    { status: 500 }
  );
}
