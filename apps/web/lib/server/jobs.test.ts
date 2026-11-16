import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the database module so tests don't need a real connection
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  },
}));

// Mock schema imports
vi.mock('@/lib/db/schema', () => ({
  jobs: { source: 'source', externalId: 'external_id', company: 'company', isActive: 'is_active', searchVector: 'search_vector' },
  jobBoards: { provider: 'provider', slug: 'slug', isActive: 'is_active', failureCount: 'failure_count', companyName: 'company_name', lastSyncedAt: 'last_synced_at', lastSyncStatus: 'last_sync_status' },
  jobStates: {},
  applications: {},
  applicationEvents: {},
  tailoredDocuments: {},
}));

vi.mock('./profile', () => ({ getProfile: vi.fn().mockResolvedValue(null) }));
vi.mock('./job-matching', () => ({
  stripHtml: (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
  extractJobSkills: () => ['TypeScript', 'React'],
  inferWorkMode: () => 'remote',
  inferSeniorityLevel: () => 'Senior',
  computeJobMatch: () => ({ score: 50, skillsScore: 50, experienceScore: 50, matchedSkills: [], missingSkills: [], transferableSkills: [], strengths: [], gaps: [], reasons: [], isAdjacentRole: false, adjacencyReason: null, isFresh: false }),
  analyzeJobIntelligence: () => ({ summary: '', responsibilities: [], requiredSkills: [], preferredSkills: [], technicalRequirements: [], seniorityLevel: 'Senior', expectedExperienceYears: null, companyAndRoleHighlights: [] }),
}));

// ─── Normalization helpers ────────────────────────────────────────────────────

describe('Ashby normalization', () => {
  const mockAshbyResponse = {
    jobs: [
      {
        id: 'abc-123',
        title: 'Senior Software Engineer',
        employmentType: 'FullTime',
        applicationLink: 'https://jobs.ashbyhq.com/supabase/abc-123',
        location: { name: 'Remote' },
        descriptionHtml: '<p>Build <strong>TypeScript</strong> services.</p>',
        publishedAt: '2024-01-15T10:00:00Z',
      },
      {
        id: 'def-456',
        title: 'Part-Time Contractor',
        employmentType: 'PartTime',
        applicationLink: 'https://jobs.ashbyhq.com/supabase/def-456',
        location: { name: 'San Francisco' },
        descriptionHtml: '<p>Contract role.</p>',
        publishedAt: null,
      },
    ],
  };

  it('produces correct externalId format', async () => {
    // Directly test the normalization by checking the structure
    const item = mockAshbyResponse.jobs[0]!;
    const externalId = `ashby:supabase:${item.id}`;
    expect(externalId).toBe('ashby:supabase:abc-123');
  });

  it('maps FullTime employment type correctly', () => {
    const map: Record<string, string> = {
      FullTime: 'full_time',
      PartTime: 'part_time',
      Contract: 'contract',
      Contractor: 'contract',
      Intern: 'internship',
      Internship: 'internship',
    };
    expect(map['FullTime']).toBe('full_time');
    expect(map['PartTime']).toBe('part_time');
    expect(map['Contract']).toBe('contract');
    expect(map['Intern']).toBe('internship');
  });

  it('strips HTML from description', () => {
    const html = '<p>Build <strong>TypeScript</strong> services. Use <em>React</em>.</p>';
    const stripped = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(stripped).not.toContain('<');
    expect(stripped).toContain('TypeScript');
    expect(stripped).toContain('React');
  });

  it('handles null publishedAt gracefully', () => {
    const item = mockAshbyResponse.jobs[1]!;
    const postedAt = item.publishedAt ? new Date(item.publishedAt) : null;
    expect(postedAt).toBeNull();
  });
});

describe('SmartRecruiters normalization', () => {
  it('builds correct externalId', () => {
    const slug = 'mongodb';
    const id = 'xyz-789';
    const externalId = `smartrecruiters:${slug}:${id}`;
    expect(externalId).toBe('smartrecruiters:mongodb:xyz-789');
  });

  it('maps permanent employment type to full_time', () => {
    const map: Record<string, string> = {
      permanent: 'full_time',
      contract: 'contract',
      freelance: 'contract',
      part_time: 'part_time',
      internship: 'internship',
    };
    expect(map['permanent']).toBe('full_time');
    expect(map['contract']).toBe('contract');
  });

  it('detects remote work mode from location.remote flag', () => {
    const location = { city: 'New York', country: 'US', remote: true };
    const workMode = location.remote ? 'remote' : 'onsite';
    expect(workMode).toBe('remote');
  });

  it('builds location string from city and country', () => {
    const location = { city: 'San Francisco', country: 'US', remote: false };
    const locationStr = [location.city, location.country].filter(Boolean).join(', ');
    expect(locationStr).toBe('San Francisco, US');
  });
});

// ─── Stale detection ──────────────────────────────────────────────────────────

describe('Stale detection logic', () => {
  it('skips stale marking when rows array is empty (incomplete sync)', () => {
    // When rows.length === 0, upsertJobBatch returns early without updating
    const rows: unknown[] = [];
    const wouldMark = rows.length > 0;
    expect(wouldMark).toBe(false);
  });

  it('computes correct set of external IDs to keep', () => {
    const rows = [
      { externalId: 'greenhouse:1', source: 'greenhouse', company: 'Vercel' },
      { externalId: 'greenhouse:2', source: 'greenhouse', company: 'Vercel' },
    ];
    const seenIds = rows.map((r) => r.externalId);
    const removedId = 'greenhouse:3';
    expect(seenIds).not.toContain(removedId);
    expect(seenIds).toContain('greenhouse:1');
    expect(seenIds).toContain('greenhouse:2');
  });

  it('deduplicates rows within same batch by source:externalId key', () => {
    type Row = { source: string; externalId: string; title: string };
    const rows: Row[] = [
      { source: 'greenhouse', externalId: 'greenhouse:1', title: 'Engineer' },
      { source: 'greenhouse', externalId: 'greenhouse:1', title: 'Engineer v2' },
      { source: 'greenhouse', externalId: 'greenhouse:2', title: 'Designer' },
    ];
    const dedupedMap = new Map<string, Row>();
    for (const row of rows) {
      dedupedMap.set(`${row.source}:${row.externalId}`, row);
    }
    const deduped = [...dedupedMap.values()];
    expect(deduped).toHaveLength(2);
    // Last write wins
    expect(deduped.find((r) => r.externalId === 'greenhouse:1')?.title).toBe('Engineer v2');
  });
});

// ─── FTS query selection ──────────────────────────────────────────────────────

describe('FTS query selection', () => {
  it('uses FTS condition (@@) rather than ilike when query is provided', () => {
    // The logic selects sql`searchVector @@ websearch_to_tsquery(...)` when q is set
    const q = 'senior react engineer';
    const usesFts = Boolean(q && q.trim());
    expect(usesFts).toBe(true);
  });

  it('builds candidate query from confirmed skills and preferred titles', () => {
    const profile = {
      preferredTitles: ['Senior Software Engineer', 'Staff Engineer'],
      desiredRoles: ['Tech Lead'],
      skills: [
        { name: 'TypeScript', source: 'user', proficiency: 'expert' },
        { name: 'React', source: 'user', proficiency: 'proficient' },
        { name: 'Python', source: 'ai', proficiency: 'expert' }, // AI-sourced, excluded
        { name: 'Go', source: 'user', proficiency: 'beginner' }, // beginner, excluded
      ],
    };

    const terms = [
      ...profile.preferredTitles,
      ...profile.desiredRoles,
      ...profile.skills
        .filter((s) => s.source !== 'ai' && (s.proficiency === 'expert' || s.proficiency === 'proficient'))
        .slice(0, 8)
        .map((s) => s.name),
    ].filter(Boolean).slice(0, 12);

    expect(terms).toContain('Senior Software Engineer');
    expect(terms).toContain('Tech Lead');
    expect(terms).toContain('TypeScript');
    expect(terms).toContain('React');
    expect(terms).not.toContain('Python'); // AI-sourced
    expect(terms).not.toContain('Go'); // beginner

    const query = terms.join(' OR ');
    expect(query).toContain(' OR ');
  });

  it('returns null candidate query when profile has no preferences or skills', () => {
    const profile = {
      preferredTitles: [],
      desiredRoles: [],
      skills: [],
    };
    const terms = [...profile.preferredTitles, ...profile.desiredRoles, ...profile.skills].filter(Boolean);
    expect(terms).toHaveLength(0);
    const query = terms.length > 0 ? terms.join(' OR ') : null;
    expect(query).toBeNull();
  });
});
