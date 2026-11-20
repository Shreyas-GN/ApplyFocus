import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getPlatformBadgeConfig, formatSalary } from '@/lib/job-ui';
import { CURATED_COMPANY_REGISTRY, getRegistryByTier, getRegistryByCountry } from './curated-registry';
import { ingestAshbyBoard } from './ashby-ingestor';
import { queryJSearchJobs } from './jsearch-provider';
import { queryGoogleJobsViaSerper } from './serper-jobs-provider';
import { queryAdzunaJobs } from './adzuna-provider';

describe('Job UI & Platform Badges', () => {
  it('correctly identifies and formats Naukri, Indeed, and LinkedIn badges', () => {
    const naukri = getPlatformBadgeConfig('via Naukri.com');
    expect(naukri.label).toBe('Naukri.com');
    expect(naukri.badgeClass).toContain('sky');
    expect(naukri.isExternalBoard).toBe(true);

    const indeed = getPlatformBadgeConfig('Indeed');
    expect(indeed.label).toBe('Indeed');
    expect(indeed.badgeClass).toContain('indigo');
    expect(indeed.isExternalBoard).toBe(true);

    const linkedin = getPlatformBadgeConfig('via LinkedIn');
    expect(linkedin.label).toBe('LinkedIn');
    expect(linkedin.badgeClass).toContain('blue');
    expect(linkedin.isExternalBoard).toBe(true);

    const ashby = getPlatformBadgeConfig('Ashby');
    expect(ashby.label).toBe('Ashby ATS');
    expect(ashby.badgeClass).toContain('purple');
    expect(ashby.isExternalBoard).toBe(false);
  });

  it('correctly formats salaries in INR Lakhs and USD thousands', () => {
    expect(formatSalary(2000000, 3200000, 'INR')).toBe('₹20L - ₹32L');
    expect(formatSalary(150000, 200000, 'USD')).toBe('$150k - $200k');
    expect(formatSalary(null, null, null)).toBe(null);
  });
});

describe('Curated Company Registry', () => {
  it('includes high-value India tech unicorns and global tech leaders', () => {
    const companies = CURATED_COMPANY_REGISTRY.map((c) => c.slug);
    // India Unicorns
    expect(companies).toContain('razorpay');
    expect(companies).toContain('swiggy');
    expect(companies).toContain('zomato');
    expect(companies).toContain('cred');
    expect(companies).toContain('phonepe');
    expect(companies).toContain('zepto');

    // Global Leaders
    expect(companies).toContain('stripe');
    expect(companies).toContain('openai');
    expect(companies).toContain('anthropic');
    expect(companies).toContain('vercel');
    expect(companies).toContain('supabase');
  });

  it('filters by tier and country correctly', () => {
    const indiaTech = getRegistryByCountry('india');
    expect(indiaTech.some((c) => c.slug === 'razorpay')).toBe(true);

    const tier1 = getRegistryByTier('tier_1_global');
    expect(tier1.some((c) => c.slug === 'stripe')).toBe(true);
  });
});

describe('Ashby Ingestor', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ingests and normalizes live Ashby postings', async () => {
    const mockAshbyResponse = {
      jobs: [
        {
          id: 'job-123',
          title: 'Senior Backend Engineer (Go / Rust)',
          department: 'Core Infrastructure',
          location: 'Bangalore, India',
          isRemote: true,
          employmentType: 'FullTime',
          jobUrl: 'https://jobs.ashbyhq.com/example/job-123',
          descriptionPlain: 'We are seeking an engineer to build high-scale APIs with Go, Kafka, and PostgreSQL.',
          compensation: {
            minAmount: 2500000,
            maxAmount: 3800000,
            currencyCode: 'INR',
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAshbyResponse,
    });

    const rows = await ingestAshbyBoard('example', 'Example Tech');
    expect(rows).toHaveLength(1);
    expect(rows[0]?.title).toBe('Senior Backend Engineer (Go / Rust)');
    expect(rows[0]?.company).toBe('Example Tech');
    expect(rows[0]?.source).toBe('ashby');
    expect(rows[0]?.sourcePlatform).toBe('Ashby');
    expect(rows[0]?.workMode).toBe('remote');
    expect(rows[0]?.salaryMin).toBe(2500000);
    expect(rows[0]?.salaryMax).toBe(3800000);
    expect(rows[0]?.salaryCurrency).toBe('INR');
    expect(rows[0]?.skills).toContain('Go');
    expect(rows[0]?.skills).toContain('Rust');
    expect(rows[0]?.skills).toContain('PostgreSQL');
  });
});

describe('Aggregator Providers Graceful Fallback', () => {
  it('returns empty array when API keys are not present', async () => {
    const jsearch = await queryJSearchJobs({ query: 'React' });
    expect(jsearch).toEqual([]);

    const serper = await queryGoogleJobsViaSerper({ query: 'React' });
    expect(serper).toEqual([]);

    const adzuna = await queryAdzunaJobs({ query: 'React' });
    expect(adzuna).toEqual([]);
  });
});

describe('Curated Registry SmartRecruiters Verification (M-02)', () => {
  it('includes verified active SmartRecruiters companies', () => {
    const slugs = CURATED_COMPANY_REGISTRY.map((c) => c.slug);
    expect(slugs).toContain('smartrecruiters');
    expect(slugs).toContain('redbull');
    expect(slugs).toContain('colliers');
    // Verifies invalid/zero-yield slugs were removed
    expect(slugs).not.toContain('square');
    expect(slugs).not.toContain('visa');
  });
});
