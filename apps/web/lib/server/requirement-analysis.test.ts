import { describe, expect, it } from 'vitest';
import { computeRequirementAnalysis } from './job-matching';
import type { ProfileDto } from '@/lib/types';

function makeProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    fullName: 'Test Candidate',
    phone: null,
    location: 'Remote',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    headline: 'Backend Engineer',
    summary: 'Python backend developer.',
    yearsOfExperience: 4,
    employmentStatus: 'actively_looking',
    preferredTitles: ['Backend Engineer'],
    preferredLocations: ['Remote'],
    workMode: 'remote',
    employmentTypes: ['full_time'],
    expectedSalaryMin: null,
    expectedSalaryMax: null,
    preferredIndustries: [],
    excludedCompanies: [],
    completionPercent: 85,
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Test A: Direct match ─────────────────────────────────────────────────────

describe('computeRequirementAnalysis — direct match', () => {
  it('marks skills as demonstrated when they appear directly in confirmed profile', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'Python', category: null, source: 'user', confidence: null },
        { id: '2', name: 'FastAPI', category: null, source: 'user', confidence: null },
        { id: '3', name: 'PostgreSQL', category: null, source: 'user', confidence: null },
      ],
    });

    const analysis = computeRequirementAnalysis(
      profile,
      ['Python', 'FastAPI', 'PostgreSQL'],
      []
    );

    const pythonItem = analysis.items.find((i) => i.requirement === 'Python');
    const fastapiItem = analysis.items.find((i) => i.requirement === 'FastAPI');

    expect(pythonItem?.assessment).toBe('demonstrated');
    expect(fastapiItem?.assessment).toBe('demonstrated');
    expect(analysis.demonstratedCount).toBe(3);
    expect(analysis.notEstablishedCount).toBe(0);
  });

  it('marks skills as demonstrated when they appear in confirmed experience technologies', () => {
    const profile = makeProfile({
      skills: [],
      experience: [
        {
          id: 'exp-1',
          company: 'Acme Corp',
          title: 'Software Engineer',
          location: null,
          startDate: '2022-01',
          endDate: null,
          isCurrent: true,
          description: 'Backend development',
          technologies: ['Python', 'FastAPI', 'PostgreSQL'],
          responsibilities: [],
          achievements: [],
          source: 'user',
          confidence: null,
        },
      ],
    });

    const analysis = computeRequirementAnalysis(profile, ['Python', 'PostgreSQL'], []);

    const pythonItem = analysis.items.find((i) => i.requirement === 'Python');
    expect(pythonItem?.assessment).toBe('demonstrated');
    expect(pythonItem?.evidenceSource).toBe('Software Engineer at Acme Corp');
    expect(analysis.demonstratedCount).toBe(2);
  });
});

// ─── Test B: Transferable match (FastAPI → Django) ───────────────────────────

describe('computeRequirementAnalysis — transferable match', () => {
  it('classifies Django as transferable when candidate has FastAPI/Python experience', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'Python', category: null, source: 'user', confidence: null },
        { id: '2', name: 'FastAPI', category: null, source: 'user', confidence: null },
        { id: '3', name: 'PostgreSQL', category: null, source: 'user', confidence: null },
      ],
    });

    const analysis = computeRequirementAnalysis(
      profile,
      ['Python', 'Django', 'PostgreSQL'],
      []
    );

    const djangoItem = analysis.items.find((i) => i.requirement === 'Django');
    expect(djangoItem?.assessment).toBe('transferable');
    expect(djangoItem?.evidence).toContain('FastAPI');
    // Must NOT claim direct Django experience
    expect(djangoItem?.assessment).not.toBe('demonstrated');
    expect(djangoItem?.evidence).not.toContain('Confirmed skill');
  });

  it('never fabricates direct evidence for a skill only reached via transferable mapping', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'Node.js', category: null, source: 'user', confidence: null },
        { id: '2', name: 'Express', category: null, source: 'user', confidence: null },
      ],
    });

    const analysis = computeRequirementAnalysis(profile, ['Django'], []);
    const djangoItem = analysis.items.find((i) => i.requirement === 'Django');

    // Node.js/Express → Django is transferable via TRANSFERABLE_SKILL_RULES (Node → FastAPI/Django)
    expect(djangoItem?.assessment).not.toBe('demonstrated');
    // The assessment should honestly reflect the relationship
    expect(['transferable', 'not_established']).toContain(djangoItem?.assessment);
  });

  it('treats AI-sourced skills as unconfirmed and excludes them from matching', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'Django', category: null, source: 'ai', confidence: 0.8 },
        { id: '2', name: 'Python', category: null, source: 'ai', confidence: 0.9 },
      ],
    });

    const analysis = computeRequirementAnalysis(profile, ['Django', 'Python'], []);
    const djangoItem = analysis.items.find((i) => i.requirement === 'Django');
    const pythonItem = analysis.items.find((i) => i.requirement === 'Python');

    // AI-sourced skills should not count as demonstrated
    expect(djangoItem?.assessment).toBe('not_established');
    expect(pythonItem?.assessment).toBe('not_established');
  });
});

// ─── Test C: Missing requirements ────────────────────────────────────────────

describe('computeRequirementAnalysis — missing requirements', () => {
  it('marks Kubernetes and cloud infra as not_established when candidate has no evidence', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'Python', category: null, source: 'user', confidence: null },
      ],
    });

    const analysis = computeRequirementAnalysis(
      profile,
      ['Python', 'Kubernetes', 'AWS'],
      []
    );

    const k8sItem = analysis.items.find((i) => i.requirement === 'Kubernetes');
    expect(k8sItem?.assessment).toBe('not_established');
    expect(k8sItem?.evidence).toBe('Not documented in your profile');
    expect(k8sItem?.explanation).toContain('Kubernetes');

    const awsItem = analysis.items.find((i) => i.requirement === 'AWS');
    // AWS might be transferable if candidate has cloud-adjacent skills, otherwise not_established
    expect(['not_established', 'transferable']).toContain(awsItem?.assessment);
  });

  it('distinguishes preferred requirements from mandatory in the output', () => {
    const profile = makeProfile({
      skills: [{ id: '1', name: 'Python', category: null, source: 'user', confidence: null }],
    });

    const analysis = computeRequirementAnalysis(profile, ['Python'], ['Kubernetes']);
    const pythonItem = analysis.items.find((i) => i.requirement === 'Python');
    const k8sItem = analysis.items.find((i) => i.requirement === 'Kubernetes');

    expect(pythonItem?.importance).toBe('mandatory');
    expect(k8sItem?.importance).toBe('preferred');
  });

  it('returns correct summary counts', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'Python', category: null, source: 'user', confidence: null },
        { id: '2', name: 'FastAPI', category: null, source: 'user', confidence: null },
      ],
    });

    const analysis = computeRequirementAnalysis(
      profile,
      ['Python', 'FastAPI', 'Django', 'Kubernetes'],
      []
    );

    expect(analysis.items).toHaveLength(4);
    expect(analysis.demonstratedCount).toBeGreaterThanOrEqual(2); // Python + FastAPI
    expect(analysis.demonstratedCount + analysis.transferableCount + analysis.notEstablishedCount).toBe(4);
  });

  it('handles null profile gracefully by returning not_established for everything', () => {
    const analysis = computeRequirementAnalysis(null, ['Python', 'React'], ['Docker']);
    expect(analysis.items).toHaveLength(3);
    expect(analysis.notEstablishedCount).toBe(3);
    expect(analysis.demonstratedCount).toBe(0);
  });
});

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('computeRequirementAnalysis — edge cases', () => {
  it('returns empty analysis when no requirements are provided', () => {
    const profile = makeProfile({
      skills: [{ id: '1', name: 'Python', category: null, source: 'user', confidence: null }],
    });
    const analysis = computeRequirementAnalysis(profile, [], []);
    expect(analysis.items).toHaveLength(0);
    expect(analysis.demonstratedCount).toBe(0);
  });

  it('handles project-based evidence correctly', () => {
    const profile = makeProfile({
      skills: [],
      projects: [
        {
          id: 'proj-1',
          name: 'API Service',
          description: 'REST API backend',
          technologies: ['TypeScript', 'Node.js', 'PostgreSQL'],
          contributions: [],
          url: null,
          startDate: null,
          endDate: null,
          source: 'user',
          confidence: null,
        },
      ],
    });

    const analysis = computeRequirementAnalysis(profile, ['TypeScript', 'Node.js'], []);
    const tsItem = analysis.items.find((i) => i.requirement === 'TypeScript');

    expect(tsItem?.assessment).toBe('demonstrated');
    expect(tsItem?.evidenceSource).toBe('API Service');
  });
});
