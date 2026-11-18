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

/** Maps thrown errors to the `{ detail }` shape the api-client expects. */
export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ detail: error.message }, { status: error.status });
  }
  if (error instanceof RateLimitError) {
    return NextResponse.json({ detail: error.message }, { status: 429 });
  }
  console.error('Auth route error:', error);
  return NextResponse.json({ detail: 'Something went wrong.' }, { status: 500 });
}
