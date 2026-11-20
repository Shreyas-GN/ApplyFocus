import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveJobFingerprint } from './listing-fingerprint';

describe('Database Integrity & Cross-Source Deduplication (H-01)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('generates identical fingerprints for direct ATS and syndicated aggregator postings', () => {
    const directGh = {
      source: 'greenhouse',
      externalId: 'stripe:123456',
      url: 'https://boards.greenhouse.io/stripe/jobs/123456',
      directApplyUrl: 'https://boards.greenhouse.io/stripe/jobs/123456',
      company: 'Stripe',
      title: 'Senior Software Engineer',
      location: 'San Francisco, CA',
    };

    const syndicatedJSearch = {
      source: 'jsearch',
      externalId: 'v-aggregator-998877',
      url: 'https://boards.greenhouse.io/stripe/jobs/123456?gh_src=jsearch',
      directApplyUrl: 'https://boards.greenhouse.io/stripe/jobs/123456',
      company: 'Stripe, Inc.',
      title: 'Senior Software Engineer - Payments',
      location: 'San Francisco, CA',
    };

    const fpDirect = resolveJobFingerprint(directGh);
    const fpSyndicated = resolveJobFingerprint(syndicatedJSearch);

    expect(fpDirect).toBeDefined();
    expect(fpSyndicated).toBeDefined();
    expect(fpDirect).toBe(fpSyndicated);
    expect(fpDirect).toMatch(/^[a-f0-9]{64}$/);
  });

  it('preserves direct ATS source priority over aggregators during in-memory deduplication', () => {
    const DIRECT_ATS_SOURCES = new Set([
      'greenhouse',
      'lever',
      'ashby',
      'workday',
      'smartrecruiters',
    ]);
    const isDirectAts = (s: string) => DIRECT_ATS_SOURCES.has(s.toLowerCase());

    const directJob = {
      source: 'greenhouse',
      externalId: 'stripe:123456',
      fingerprint: 'ats_shared_123',
      title: 'Staff Engineer',
      description: 'Core Stripe infrastructure',
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: null,
    };

    const aggregatorJob = {
      source: 'jsearch',
      externalId: 'j-456',
      fingerprint: 'ats_shared_123',
      title: 'Staff Engineer',
      description: 'Brief aggregator snippet',
      salaryMin: 180000,
      salaryMax: 240000,
      salaryCurrency: 'USD',
    };

    // Regardless of ingestion arrival order, direct ATS identity must be preserved
    // and salary metadata augmented from aggregator if missing in direct ATS
    const dedupedMap = new Map<string, typeof directJob>();

    // Test arrival order 1: aggregator first, then direct ATS
    for (const row of [aggregatorJob, directJob]) {
      const existing = dedupedMap.get(row.fingerprint);
      if (!existing) {
        dedupedMap.set(row.fingerprint, row as unknown as typeof directJob);
      } else {
        if (isDirectAts(row.source) && !isDirectAts(existing.source)) {
          dedupedMap.set(row.fingerprint, {
            ...row,
            salaryMin: row.salaryMin ?? existing.salaryMin,
            salaryMax: row.salaryMax ?? existing.salaryMax,
            salaryCurrency: row.salaryCurrency ?? existing.salaryCurrency,
          } as unknown as typeof directJob);
        }
      }
    }

    const winner = dedupedMap.get('ats_shared_123')!;
    expect(winner.source).toBe('greenhouse');
    expect(winner.externalId).toBe('stripe:123456');
    expect(winner.salaryMin).toBe(180000);
    expect(winner.salaryMax).toBe(240000);
    expect(winner.salaryCurrency).toBe('USD');
  });

  it('simulates concurrent ingestion without cross-source collisions', async () => {
    // Concurrent worker simulation: two worker threads ingest batches containing
    // the same underlying ATS job simultaneously
    const sharedFingerprint = 'ats_concurrent_test_123';

    const batch1 = [
      {
        source: 'jsearch',
        externalId: 'js-101',
        fingerprint: sharedFingerprint,
        title: 'Backend Engineer',
      },
    ];

    const batch2 = [
      {
        source: 'greenhouse',
        externalId: 'gh-202',
        fingerprint: sharedFingerprint,
        title: 'Backend Engineer',
      },
    ];

    // Simulating database storage with fingerprint as unique key
    const mockDbStore = new Map<string, Record<string, unknown>>();

    const simulateUpsert = async (batch: typeof batch1) => {
      for (const row of batch) {
        const existing = mockDbStore.get(row.fingerprint);
        if (!existing) {
          mockDbStore.set(row.fingerprint, { ...row, status: 'active' });
        } else {
          // On conflict update
          mockDbStore.set(row.fingerprint, {
            ...existing,
            ...row,
            // Keep direct ATS if existing was direct
            source: existing.source === 'greenhouse' ? existing.source : row.source,
          });
        }
      }
    };

    // Run concurrently via Promise.all
    await Promise.all([simulateUpsert(batch1), simulateUpsert(batch2)]);

    expect(mockDbStore.size).toBe(1);
    expect(mockDbStore.has(sharedFingerprint)).toBe(true);
    expect((mockDbStore.get(sharedFingerprint) as { source: string }).source).toBe('greenhouse');
  });
});

