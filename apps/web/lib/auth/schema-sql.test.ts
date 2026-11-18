// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AUTH_SCHEMA_STATEMENTS } from './schema-sql';

describe('auth schema SQL', () => {
  it('matches drizzle/0010_auth_tables.sql statement for statement', () => {
    const file = readFileSync(
      path.resolve(__dirname, '../../drizzle/0010_auth_tables.sql'),
      'utf8'
    );
    const fromFile = file
      .split('--> statement-breakpoint')
      .map((s) => s.trim().replace(/;$/, ''));
    expect(fromFile).toEqual(AUTH_SCHEMA_STATEMENTS.map((s) => s.trim()));
  });

  it('is idempotent (no bare CREATE TABLE / CREATE INDEX)', () => {
    for (const s of AUTH_SCHEMA_STATEMENTS) {
      expect(s).not.toMatch(/CREATE (UNIQUE )?(TABLE|INDEX)(?! IF NOT EXISTS)/);
    }
  });
});
