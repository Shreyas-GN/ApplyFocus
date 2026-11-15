/**
 * Seed the job_boards table with the 10 configured ATS sources.
 * Idempotent — uses ON CONFLICT DO NOTHING.
 *
 * Run from apps/web/:
 *   node --experimental-strip-types scripts/seed-boards.ts
 *
 * Requires DATABASE_MIGRATION_URL or DATABASE_URL in the environment.
 */
import postgres from 'postgres';

const url = process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Set DATABASE_MIGRATION_URL or DATABASE_URL before running.');
  process.exit(1);
}

const sql = postgres(url, { max: 1, ssl: 'require' });

const boards = [
  { companyName: 'Vercel',    provider: 'greenhouse', slug: 'vercel',    enabled: true  },
  { companyName: 'Anthropic', provider: 'greenhouse', slug: 'anthropic', enabled: true  },
  { companyName: 'Stripe',    provider: 'greenhouse', slug: 'stripe',    enabled: true  },
  { companyName: 'Figma',     provider: 'greenhouse', slug: 'figma',     enabled: true  },
  { companyName: 'Brex',      provider: 'greenhouse', slug: 'brex',      enabled: false },
  { companyName: 'Linear',    provider: 'lever',      slug: 'linear',    enabled: false },
  { companyName: 'Notion',    provider: 'greenhouse', slug: 'notion',    enabled: false },
  { companyName: 'Plaid',     provider: 'greenhouse', slug: 'plaid',     enabled: false },
  { companyName: 'Ramp',      provider: 'greenhouse', slug: 'ramp',      enabled: false },
  { companyName: 'Retool',    provider: 'greenhouse', slug: 'retool',    enabled: false },
];

await sql`
  INSERT INTO job_boards (company_name, provider, slug, enabled)
  SELECT * FROM ${sql(boards.map((b) => [b.companyName, b.provider, b.slug, b.enabled]))}
    AS t(company_name, provider, slug, enabled::boolean)
  ON CONFLICT (provider, slug) DO NOTHING
`;

const rows = await sql`
  SELECT company_name, enabled FROM job_boards ORDER BY enabled DESC, company_name
`;

const enabledRows  = rows.filter((r) => r.enabled);
const disabledRows = rows.filter((r) => !r.enabled);

console.log(`\nSeeded job_boards — ${rows.length} total`);
console.log(`  Enabled  (${enabledRows.length}): ${enabledRows.map((r) => r.company_name).join(', ')}`);
console.log(`  Disabled (${disabledRows.length}): ${disabledRows.map((r) => r.company_name).join(', ')}`);

await sql.end();
