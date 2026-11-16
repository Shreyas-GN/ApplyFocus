import { defineConfig } from 'drizzle-kit';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Parse .env.local manually so dotenv dep is not required
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

// DATABASE_MIGRATION_URL must be the direct (non-pooled) Neon connection string
// for Drizzle Kit to work correctly with DDL migrations.
// DATABASE_URL is the pooled connection used by the Next.js runtime.
const migrationUrl =
  process.env.DATABASE_MIGRATION_URL || process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error(
    'DATABASE_MIGRATION_URL or DATABASE_URL must be set to run migrations'
  );
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
});

