import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ingestSmartRecruitersBoardDirect } from './smartrecruiters-adapter';

describe('smartrecruiters-adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('ingests and normalizes postings with details and compensation', async () => {
    const mockList = {
      totalFound: 1,
      content: [
        {
          id: 'sr-1001',
          name: 'Principal Distributed Systems Engineer',
          releasedDate: '2026-11-12T08:00:00.000Z',
          location: {
            city: 'San Francisco',
            region: 'CA',
            country: 'us',
            remote: true,
          },
          typeOfEmployment: { id: 'full_time', label: 'Full-time' },
        },
      ],
    };

    const mockDetail = {
      id: 'sr-1001',
      name: 'Principal Distributed Systems Engineer',
      jobAd: {
        sections: {
          jobDescription: {
            title: 'Job Description',
            text: '<p>Architect distributed databases and high-throughput pipelines using Go and Apache Kafka.</p>',
          },
          qualifications: {
            title: 'Qualifications',
            text: '<p>8+ years experience with Kubernetes, Go, PostgreSQL.</p>',
          },
        },
      },
      compensation: {
        min: 195000,
        max: 260000,
        currency: 'USD',
      },
    };

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/postings?')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockList,
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockDetail,
      });
    });

    const rows = await ingestSmartRecruitersBoardDirect({
      companySlug: 'redbull',
      companyName: 'Red Bull',
      maxJobs: 5,
    });

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.company).toBe('Red Bull');
    expect(row.title).toBe('Principal Distributed Systems Engineer');
    expect(row.source).toBe('smartrecruiters');
    expect(row.sourcePlatform).toBe('SmartRecruiters ATS');
    expect(row.externalId).toBe('redbull:sr-1001');
    expect(row.fingerprint).toBeDefined();
    expect(row.fingerprint).toHaveLength(64);
    expect(row.location).toBe('San Francisco, CA, US');
    expect(row.workMode).toBe('remote');
    expect(row.salaryMin).toBe(195000);
    expect(row.salaryMax).toBe(260000);
    expect(row.salaryCurrency).toBe('USD');
    expect(row.description).toContain('Apache Kafka');
    expect(row.skills).toContain('Go');
    expect(row.skills).toContain('PostgreSQL');
    expect(row.skills).toContain('Kubernetes');
    expect(row.status).toBe('active');
  });

  it('handles rate limiting (HTTP 429) gracefully without throwing', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ message: 'Rate limit exceeded' }),
    });

    const rows = await ingestSmartRecruitersBoardDirect({
      companySlug: 'visa',
      companyName: 'Visa',
    });

    expect(rows).toEqual([]);
  });

  it('handles network failure gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const rows = await ingestSmartRecruitersBoardDirect({
      companySlug: 'bosch',
      companyName: 'Bosch',
    });

    expect(rows).toEqual([]);
  });
});

