import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// No credentials are ever hard-coded. The placeholder only lets `next build`
// import this module without DATABASE_URL (the client connects lazily);
// real queries need DATABASE_URL to be set.
const connectionString =
  process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres';

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const conn =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    fetch_types: false,
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    connect_timeout: 15,
  });
globalForDb.conn = conn;

export const db = drizzle(conn, { schema });
export * from './schema';

