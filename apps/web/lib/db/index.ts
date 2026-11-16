import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

type DbGlobal = {
  conn: postgres.Sql | undefined;
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

const globalForDb = globalThis as unknown as DbGlobal;

function getDb() {
  if (globalForDb.db) return globalForDb.db;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  // Neon pooler (transaction pooler) for Next.js serverless runtime.
  // prepare: false is required — Neon's pooler does not support prepared statements.
  const conn =
    globalForDb.conn ??
    postgres(connectionString, {
      prepare: false,
      max: 10,
      idle_timeout: 20,
      max_lifetime: 60 * 10,
      connect_timeout: 15,
    });
  globalForDb.conn = conn;
  globalForDb.db = drizzle(conn, { schema });
  return globalForDb.db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export * from './schema';

