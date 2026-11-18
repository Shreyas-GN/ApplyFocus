import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

// Fixed-window counters in Postgres. One atomic upsert per hit; the window
// resets lazily when the first hit after it expires arrives.

interface CountRow extends Record<string, unknown> {
  count: number;
}

/** Increments the counter and returns the new count for the current window. */
export async function hit(key: string, windowSeconds: number): Promise<number> {
  const rows = await db.execute<CountRow>(sql`
    INSERT INTO rate_limits (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN now() ELSE rate_limits.window_start END
    RETURNING count
  `);
  return Number(rows[0]?.count ?? 1);
}

/** Current count without incrementing (0 when the window has expired). */
export async function peek(key: string, windowSeconds: number): Promise<number> {
  const rows = await db.execute<CountRow>(sql`
    SELECT count FROM rate_limits
    WHERE key = ${key}
      AND window_start >= now() - make_interval(secs => ${windowSeconds})
  `);
  return Number(rows[0]?.count ?? 0);
}

export async function clear(key: string): Promise<void> {
  await db.execute(sql`DELETE FROM rate_limits WHERE key = ${key}`);
}

/** Deletes counters whose window is long over. Called from the cron job. */
export async function purgeExpiredRateLimits(): Promise<void> {
  await db.execute(
    sql`DELETE FROM rate_limits WHERE window_start < now() - interval '1 day'`
  );
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/** Counts a hit and throws once the limit for the window is exceeded. */
export async function enforce(
  key: string,
  limit: number,
  windowSeconds: number,
  message: string
): Promise<void> {
  if ((await hit(key, windowSeconds)) > limit) {
    throw new RateLimitError(message);
  }
}
