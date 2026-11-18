import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { AUTH_SCHEMA_STATEMENTS } from './schema-sql';

const REQUIRED_TABLES = ['users', 'sessions', 'auth_tokens', 'rate_limits'];

let ready: Promise<void> | undefined;

async function run(): Promise<void> {
  const rows = await db.execute<{ name: string }>(sql`
    SELECT table_name AS name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('users','sessions','auth_tokens','rate_limits')
  `);
  if (REQUIRED_TABLES.every((t) => rows.some((r) => r.name === t))) return;

  console.warn('[auth] Auth tables missing; creating them (idempotent bootstrap).');
  for (const statement of AUTH_SCHEMA_STATEMENTS) {
    await db.execute(sql.raw(statement));
  }
}

/**
 * Makes sure the auth tables exist. Cheap (one catalog query) once per server
 * instance; a failure is not cached, so the next request retries.
 */
export function ensureAuthSchema(): Promise<void> {
  ready ??= run().catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
}
