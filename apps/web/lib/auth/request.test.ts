// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { classifyError } from './request';

describe('classifyError', () => {
  it('identifies missing tables, including through a wrapped cause', () => {
    expect(classifyError({ code: '42P01' })).toBe('DB_SCHEMA_MISSING');
    expect(classifyError(new Error('Failed query', { cause: { code: '42P01' } }))).toBe(
      'DB_SCHEMA_MISSING'
    );
  });
  it('identifies connection and credential problems', () => {
    expect(classifyError({ code: 'ECONNREFUSED' })).toBe('DB_CONNECTION');
    expect(classifyError({ code: '28P01' })).toBe('DB_AUTH_FAILED');
  });
  it('identifies a missing AUTH_SECRET and unknown errors', () => {
    expect(
      classifyError(
        new Error(
          'AUTH_SECRET must be set and at least 32 characters long (generate one with `openssl rand -base64 32`).'
        )
      )
    ).toBe('CONFIG_AUTH_SECRET');
    expect(classifyError(new Error('boom'))).toBe('UNKNOWN');
  });
});
