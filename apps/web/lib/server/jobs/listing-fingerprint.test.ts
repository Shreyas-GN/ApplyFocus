import { describe, expect, it } from 'vitest';
import {
  computeAtsFingerprint,
  computeFallbackFingerprint,
  extractAtsTripleFromUrl,
  resolveJobFingerprint,
} from './listing-fingerprint';

describe('listing-fingerprint utility', () => {
  describe('computeAtsFingerprint', () => {
    it('produces deterministic output for the same triple', () => {
      const hash1 = computeAtsFingerprint({
        atsProvider: 'greenhouse',
        boardSlug: 'stripe',
        postingId: '6145321',
      });
      const hash2 = computeAtsFingerprint({
        atsProvider: 'greenhouse',
        boardSlug: 'stripe',
        postingId: '6145321',
      });
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string
    });

    it('normalizes casing and whitespace', () => {
      const hash1 = computeAtsFingerprint({
        atsProvider: 'greenhouse',
        boardSlug: 'Stripe ',
        postingId: ' 6145321',
      });
      const hash2 = computeAtsFingerprint({
        atsProvider: 'greenhouse',
        boardSlug: 'stripe',
        postingId: '6145321',
      });
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different posting IDs', () => {
      const hash1 = computeAtsFingerprint({
        atsProvider: 'greenhouse',
        boardSlug: 'stripe',
        postingId: '1001',
      });
      const hash2 = computeAtsFingerprint({
        atsProvider: 'greenhouse',
        boardSlug: 'stripe',
        postingId: '1002',
      });
      expect(hash1).not.toBe(hash2);
    });

    it('produces different hashes for different providers', () => {
      const hash1 = computeAtsFingerprint({
        atsProvider: 'greenhouse',
        boardSlug: 'stripe',
        postingId: '1001',
      });
      const hash2 = computeAtsFingerprint({
        atsProvider: 'lever',
        boardSlug: 'stripe',
        postingId: '1001',
      });
      expect(hash1).not.toBe(hash2);
    });

    it('throws when required fields are missing', () => {
      expect(() =>
        computeAtsFingerprint({
          atsProvider: 'greenhouse',
          boardSlug: '',
          postingId: '123',
        })
      ).toThrow();
    });
  });

  describe('computeFallbackFingerprint', () => {
    it('generates a stable hash from company, title, and location', () => {
      const hash1 = computeFallbackFingerprint({
        company: 'Acme Corp',
        title: 'Senior Software Engineer',
        location: 'San Francisco, CA',
      });
      const hash2 = computeFallbackFingerprint({
        company: 'acme corp',
        title: 'senior software engineer',
        location: 'san francisco, ca',
      });
      expect(hash1).toBe(hash2);
    });

    it('handles null or missing location gracefully', () => {
      const hash = computeFallbackFingerprint({
        company: 'Acme Corp',
        title: 'Senior Software Engineer',
        location: null,
      });
      expect(hash).toHaveLength(64);
    });
  });

  describe('extractAtsTripleFromUrl', () => {
    it('extracts Greenhouse standard URLs', () => {
      const triple = extractAtsTripleFromUrl(
        'https://boards.greenhouse.io/stripe/jobs/6145321?gh_jid=6145321'
      );
      expect(triple).toEqual({
        atsProvider: 'greenhouse',
        boardSlug: 'stripe',
        postingId: '6145321',
      });
    });

    it('extracts Greenhouse embed URLs with for/token params', () => {
      const triple = extractAtsTripleFromUrl(
        'https://boards.greenhouse.io/embed/job_app?for=anthropic&token=554433'
      );
      expect(triple).toEqual({
        atsProvider: 'greenhouse',
        boardSlug: 'anthropic',
        postingId: '554433',
      });
    });

    it('extracts Lever URLs', () => {
      const triple = extractAtsTripleFromUrl(
        'https://jobs.lever.co/netflix/9d0a2f42-45e0-4081-b51c-81b402830f57'
      );
      expect(triple).toEqual({
        atsProvider: 'lever',
        boardSlug: 'netflix',
        postingId: '9d0a2f42-45e0-4081-b51c-81b402830f57',
      });
    });

    it('extracts Ashby URLs', () => {
      const triple = extractAtsTripleFromUrl(
        'https://jobs.ashbyhq.com/openai/1a2b3c4d-5e6f-7a8b-9c0d'
      );
      expect(triple).toEqual({
        atsProvider: 'ashby',
        boardSlug: 'openai',
        postingId: '1a2b3c4d-5e6f-7a8b-9c0d',
      });
    });

    it('extracts Workday URLs', () => {
      const triple = extractAtsTripleFromUrl(
        'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite/job/USA-CA-Santa-Clara/Senior-System-Software-Engineer_JR1985432'
      );
      expect(triple).toEqual({
        atsProvider: 'workday',
        boardSlug: 'nvidia',
        postingId: 'JR1985432',
      });
    });

    it('extracts SmartRecruiters URLs', () => {
      const triple = extractAtsTripleFromUrl(
        'https://jobs.smartrecruiters.com/Square/743999988776655-staff-engineer'
      );
      expect(triple).toEqual({
        atsProvider: 'smartrecruiters',
        boardSlug: 'square',
        postingId: '743999988776655-staff-engineer',
      });
    });

    it('returns null for unparseable or unrecognized URLs', () => {
      expect(extractAtsTripleFromUrl('https://example.com/careers/123')).toBeNull();
      expect(extractAtsTripleFromUrl('invalid-url')).toBeNull();
    });
  });

  describe('resolveJobFingerprint', () => {
    it('resolves ATS fingerprint when URL is recognized', () => {
      const fp = resolveJobFingerprint({
        url: 'https://jobs.lever.co/spotify/abc-123',
        company: 'Spotify',
        title: 'Backend Engineer',
      });
      const expected = computeAtsFingerprint({
        atsProvider: 'lever',
        boardSlug: 'spotify',
        postingId: 'abc-123',
      });
      expect(fp).toBe(expected);
    });

    it('falls back to content hash when URL is not an ATS', () => {
      const fp = resolveJobFingerprint({
        url: 'https://mycompany.com/jobs/123',
        company: 'My Company',
        title: 'Frontend Engineer',
        location: 'Remote',
      });
      const expected = computeFallbackFingerprint({
        company: 'My Company',
        title: 'Frontend Engineer',
        location: 'Remote',
      });
      expect(fp).toBe(expected);
    });
  });
});

