import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  parseWorkdayBoardUrl,
  extractWorkdayPostingId,
  ingestWorkdayBoardDirect,
  parseCompensationString,
} from './workday-adapter';

describe('workday-adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseWorkdayBoardUrl', () => {
    it('parses standard Workday career URLs with locale', () => {
      const parsed = parseWorkdayBoardUrl(
        'https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite'
      );
      expect(parsed).toEqual({
        host: 'nvidia.wd5.myworkdayjobs.com',
        companySlug: 'nvidia',
        siteId: 'NVIDIAExternalCareerSite',
      });
    });

    it('parses Workday URLs without locale segment', () => {
      const parsed = parseWorkdayBoardUrl(
        'https://salesforce.wd1.myworkdayjobs.com/External_Career_Site'
      );
      expect(parsed).toEqual({
        host: 'salesforce.wd1.myworkdayjobs.com',
        companySlug: 'salesforce',
        siteId: 'External_Career_Site',
      });
    });

    it('returns null for non-Workday URLs', () => {
      expect(parseWorkdayBoardUrl('https://boards.greenhouse.io/stripe')).toBeNull();
      expect(parseWorkdayBoardUrl('not-a-url')).toBeNull();
    });
  });

  describe('extractWorkdayPostingId', () => {
    it('extracts requisition ID after last underscore', () => {
      const id = extractWorkdayPostingId(
        '/job/USA-CA-Santa-Clara/Senior-System-Software-Engineer_JR1985432'
      );
      expect(id).toBe('JR1985432');
    });

    it('handles paths with query parameters', () => {
      const id = extractWorkdayPostingId(
        '/job/Munich/Lead-Architect_R-998877?source=LinkedIn'
      );
      expect(id).toBe('R-998877');
    });

    it('falls back to full segment when no underscore is present', () => {
      const id = extractWorkdayPostingId('/job/Location/12345');
      expect(id).toBe('12345');
    });
  });

  describe('parseCompensationString (M-04)', () => {
    it('parses standard USD annual range', () => {
      const comp = parseCompensationString('$140,000 - $210,000 USD per year');
      expect(comp).toEqual({
        salaryMin: 140000,
        salaryMax: 210000,
        salaryCurrency: 'USD',
      });
    });

    it('parses EUR and GBP currencies correctly', () => {
      const eur = parseCompensationString('€85,000 - €115,000 EUR');
      expect(eur).toEqual({
        salaryMin: 85000,
        salaryMax: 115000,
        salaryCurrency: 'EUR',
      });

      const gbp = parseCompensationString('£70,000 to £95,000');
      expect(gbp).toEqual({
        salaryMin: 70000,
        salaryMax: 95000,
        salaryCurrency: 'GBP',
      });
    });

    it('annualizes hourly rates correctly', () => {
      const hourly = parseCompensationString('$65.00 - $85.00 / hour');
      // 65 * 2080 = 135200; 85 * 2080 = 176800
      expect(hourly).toEqual({
        salaryMin: 135200,
        salaryMax: 176800,
        salaryCurrency: 'USD',
      });
    });

    it('returns nulls when no numbers or unstructured text is provided (never invents)', () => {
      expect(parseCompensationString('Competitive package based on experience')).toEqual({
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
      });
      expect(parseCompensationString(null)).toEqual({
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
      });
      expect(parseCompensationString('')).toEqual({
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: null,
      });
    });
  });

  describe('ingestWorkdayBoardDirect', () => {
    it('ingests and normalizes postings with compensation (M-04)', async () => {
      const mockListResponse = {
        total: 1,
        jobPostings: [
          {
            title: 'Staff AI Infrastructure Engineer',
            externalPath: '/job/Santa-Clara/Staff-AI-Engineer_JR12345',
            locationsText: 'Santa Clara, CA',
            postedOn: 'Posted 2 Days Ago',
            bulletFields: ['JR12345', 'Full time'],
          },
        ],
      };

      const mockDetailResponse = {
        jobPostingInfo: {
          id: 'JR12345',
          title: 'Staff AI Infrastructure Engineer',
          jobDescription: '<p>Join our team building large-scale Kubernetes clusters with PyTorch and CUDA.</p>',
          location: 'Santa Clara, CA',
          timeType: 'Full time',
          startDate: '2026-11-01',
          compensation: '$180,000 - $245,000 USD per year',
        },
      };

      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/jobs')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockListResponse,
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockDetailResponse,
        });
      });

      const rows = await ingestWorkdayBoardDirect({
        host: 'nvidia.wd5.myworkdayjobs.com',
        companySlug: 'nvidia',
        siteId: 'NVIDIAExternalCareerSite',
        companyName: 'NVIDIA',
        maxJobs: 5,
      });

      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.company).toBe('NVIDIA');
      expect(row.title).toBe('Staff AI Infrastructure Engineer');
      expect(row.source).toBe('workday');
      expect(row.sourcePlatform).toBe('Workday ATS');
      expect(row.externalId).toBe('nvidia:JR12345');
      expect(row.fingerprint).toBeDefined();
      expect(row.fingerprint).toHaveLength(64);
      expect(row.salaryMin).toBe(180000);
      expect(row.salaryMax).toBe(245000);
      expect(row.salaryCurrency).toBe('USD');
      expect(row.description).toContain('Kubernetes');
      expect(row.skills).toContain('Kubernetes');
      expect(row.skills).toContain('PyTorch');
      expect(row.workMode).toBeDefined();
      expect(row.status).toBe('active');
    });

    it('halts gracefully after bounded retry when rate limited (HTTP 429)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: new Headers({ 'retry-after': '1' }),
        json: async () => ({ message: 'Too Many Requests' }),
      });

      const rows = await ingestWorkdayBoardDirect({
        host: 'target.wd1.myworkdayjobs.com',
        companySlug: 'target',
        siteId: 'TargetCareers',
        companyName: 'Target',
        maxJobs: 10,
      });

      expect(rows).toEqual([]);
    });

    it('handles network failure on list endpoint gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection timeout'));

      const rows = await ingestWorkdayBoardDirect({
        host: 'cisco.wd1.myworkdayjobs.com',
        companySlug: 'cisco',
        siteId: 'CiscoCareers',
        companyName: 'Cisco',
      });

      expect(rows).toEqual([]);
    });
  });
});
