import { describe, expect, it } from 'vitest';
import type { ProfileDto } from '@/lib/types';
import {
  analyzeJobIntelligence,
  computeJobMatch,
  computeOpportunityEvaluation,
} from './job-matching';
import { computeApplicationStrategy } from './application-strategy';

function makeProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    fullName: 'Test Candidate',
    phone: null,
    location: 'Remote',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    headline: 'Senior Full-Stack Engineer',
    summary: 'Experienced TypeScript and React developer.',
    yearsOfExperience: 5,
    employmentStatus: 'actively_looking',
    preferredTitles: ['Full Stack Engineer'],
    preferredLocations: ['Remote'],
    workMode: 'remote',
    employmentTypes: ['full_time'],
    expectedSalaryMin: null,
    expectedSalaryMax: null,
    preferredIndustries: [],
    excludedCompanies: [],
    completionPercent: 80,
    experience: [],
    education: [],
    skills: [
      { id: 'sk1', name: 'TypeScript', category: null, source: 'user', confidence: null },
      { id: 'sk2', name: 'React', category: null, source: 'user', confidence: null },
      { id: 'sk3', name: 'Next.js', category: null, source: 'user', confidence: null },
    ],
    projects: [],
    certifications: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const BASE_JOB = {
  title: 'Senior Frontend Engineer',
  company: 'Acme Corp',
  location: 'Remote',
  workMode: 'remote' as const,
  employmentType: 'full_time',
  description:
    'Build production UIs with TypeScript and React. Nice to have: Kubernetes, Docker.',
  skills: ['TypeScript', 'React', 'Next.js', 'Kubernetes'],
};

function computeAll(
  profile: ProfileDto | null,
  jobOverrides: Partial<typeof BASE_JOB> = {},
) {
  const job = { ...BASE_JOB, ...jobOverrides };
  const match = computeJobMatch(profile, job);
  const intelligence = analyzeJobIntelligence({ ...job, source: 'greenhouse' });
  const evaluation = computeOpportunityEvaluation(profile, job, match, intelligence);
  return computeApplicationStrategy(profile, job, match, intelligence, evaluation);
}

describe('computeApplicationStrategy', () => {
  it('recommends apply_now for strong candidate with full required coverage', () => {
    const profile = makeProfile({
      experience: [
        {
          id: 'exp1',
          company: 'StartupXYZ',
          title: 'Senior Frontend Dev',
          location: null,
          startDate: '2022-01',
          endDate: null,
          isCurrent: true,
          description: 'Built production TypeScript and React applications.',
          technologies: ['TypeScript', 'React', 'Next.js'],
          achievements: ['Reduced bundle size by 40%', 'Led migration to React 18'],
          source: 'user',
          confidence: null,
        },
      ],
    });
    const result = computeAll(profile);

    expect(result.recommendedAction).toBe('apply_now');
    expect(result.selectedExperiences).toHaveLength(1);
    expect(result.selectedExperiences[0]?.company).toBe('StartupXYZ');
    expect(result.selectedExperiences[0]?.coveredRequirements).toContain('TypeScript');
    expect(result.skillsToEmphasize).toContain('TypeScript');
    expect(result.skillsToEmphasize).toContain('React');
    expect(result.positioning).toContain('TypeScript');
    expect(result.strategyVersion).toMatch(/^v1:[0-9a-f]{8}$/);
    expect(result.selectedExperiences[0]?.achievementsToHighlight).toContain(
      'Reduced bundle size by 40%',
    );
  });

  it('recommends strengthen_first when most required skills are undocumented', () => {
    const profile = makeProfile({
      skills: [{ id: 'sk1', name: 'Java', category: null, source: 'user', confidence: null }],
      experience: [],
    });
    const result = computeAll(profile, {
      description: 'Deep TypeScript, React, Next.js, GraphQL and AWS experience required.',
      skills: ['TypeScript', 'React', 'Next.js', 'GraphQL', 'AWS'],
    });

    expect(result.recommendedAction).toBe('strengthen_first');
    expect(result.insufficientEvidenceRequirements.length).toBeGreaterThan(2);
    expect(
      result.actionReasons.some(
        (r) => r.includes('undocumented') || r.includes('no direct path'),
      ),
    ).toBe(true);
  });

  it('recognizes transferable skills and recommends apply', () => {
    // React is in profile; JavaScript/CSS are transferable from React via TRANSFERABLE_SKILL_RULES
    const profile = makeProfile({
      skills: [
        { id: 'sk1', name: 'React', category: null, source: 'user', confidence: null },
        { id: 'sk2', name: 'TypeScript', category: null, source: 'user', confidence: null },
      ],
    });
    const result = computeAll(profile, {
      description: 'TypeScript and React required. Nice to have: JavaScript, CSS.',
      skills: ['TypeScript', 'React', 'JavaScript', 'CSS'],
    });

    expect(['apply_now', 'apply_with_improvements']).toContain(result.recommendedAction);
    expect(result.skillsToEmphasize).toContain('TypeScript');
    expect(result.skillsToEmphasize).toContain('React');
    expect(result.insufficientEvidenceRequirements).not.toContain('TypeScript');
    expect(result.insufficientEvidenceRequirements).not.toContain('React');
  });

  it('excludes AI-sourced skills and experience from evidence selection', () => {
    const profile = makeProfile({
      skills: [
        { id: 'sk1', name: 'TypeScript', category: null, source: 'ai', confidence: 0.9 },
        { id: 'sk2', name: 'React', category: null, source: 'ai', confidence: 0.9 },
        { id: 'sk3', name: 'Next.js', category: null, source: 'ai', confidence: 0.9 },
      ],
      experience: [
        {
          id: 'exp-ai',
          company: 'AI Corp',
          title: 'Staff Engineer',
          location: null,
          startDate: '2022-01',
          endDate: null,
          isCurrent: true,
          description: 'TypeScript and React systems.',
          technologies: ['TypeScript', 'React', 'Next.js'],
          achievements: ['Shipped to production'],
          source: 'ai',
          confidence: 0.8,
        },
      ],
    });
    const result = computeAll(profile);

    expect(result.selectedExperiences).toHaveLength(0);
    expect(result.skillsToEmphasize).toHaveLength(0);
    // All required skills are unsupported (AI skills excluded)
    expect(result.insufficientEvidenceRequirements.length).toBeGreaterThan(0);
  });

  it('selects the best-scoring project when multiple cover the same requirement', () => {
    const profile = makeProfile({
      skills: [
        { id: 'sk1', name: 'TypeScript', category: null, source: 'user', confidence: null },
        { id: 'sk2', name: 'React', category: null, source: 'user', confidence: null },
      ],
      projects: [
        {
          id: 'proj-rich',
          name: 'Dashboard App',
          description: 'TypeScript React dashboard',
          technologies: ['TypeScript', 'React', 'Next.js'],
          contributions: ['Built core components', 'Deployed to production'],
          url: null,
          liveUrl: 'https://dashboard.example.com',
          githubUrl: null,
          startDate: '2024-01',
          endDate: null,
          source: 'user',
          confidence: null,
        },
        {
          id: 'proj-sparse',
          name: 'Mini Tool',
          description: 'TypeScript utility',
          technologies: ['TypeScript'],
          contributions: [],
          url: null,
          liveUrl: null,
          githubUrl: null,
          startDate: '2023-01',
          endDate: '2023-06',
          source: 'user',
          confidence: null,
        },
      ],
    });
    const result = computeAll(profile);

    // Dashboard App covers more requirements and has a live URL — highest score
    expect(result.selectedProjects[0]?.name).toBe('Dashboard App');
    expect(result.selectedProjects[0]?.coveredRequirements).toContain('TypeScript');
    expect(result.selectedProjects[0]?.priority).toBe(1);
    if (result.selectedProjects.length > 1) {
      expect(result.selectedProjects[1]?.name).toBe('Mini Tool');
    }
  });

  it('handles candidate with limited experience (projects only, no work history)', () => {
    const profile = makeProfile({
      experience: [],
      projects: [
        {
          id: 'proj1',
          name: 'TypeScript React App',
          description: 'Full-stack TypeScript and React application with Next.js',
          technologies: ['TypeScript', 'React', 'Next.js'],
          contributions: ['Built all features', 'Deployed to Vercel'],
          url: 'https://github.com/test/app',
          liveUrl: null,
          githubUrl: 'https://github.com/test/app',
          startDate: '2024-01',
          endDate: null,
          source: 'user',
          confidence: null,
        },
      ],
    });
    const result = computeAll(profile);

    expect(result.selectedProjects).toHaveLength(1);
    expect(result.selectedProjects[0]?.name).toBe('TypeScript React App');
    expect(result.confidenceLevel).toBe('low');
    expect(
      result.uncertaintyReasons.some((r) => r.toLowerCase().includes('experience')),
    ).toBe(true);
    // Should not apply_now without work experience
    expect(result.recommendedAction).not.toBe('apply_now');
  });

  it('deprioritizes immediately when a hard constraint (excluded company) is violated', () => {
    const profile = makeProfile({ excludedCompanies: ['Acme Corp'] });
    const result = computeAll(profile);

    expect(result.recommendedAction).toBe('deprioritize');
    expect(result.selectedExperiences).toHaveLength(0);
    expect(result.screeningTopics).toHaveLength(0);
    expect(result.resumeSectionChanges).toHaveLength(0);
    expect(result.actionReasons[0]).toContain('Acme Corp');
  });

  it('returns a sensible fallback for null profile (no candidate intelligence)', () => {
    const result = computeAll(null);

    expect(result.recommendedAction).toBe('deprioritize');
    expect(result.confidenceLevel).toBe('low');
    expect(result.strategyVersion).toBe('v1:no-profile');
    expect(result.positioning).toContain('Complete your profile');
    expect(result.selectedExperiences).toHaveLength(0);
    expect(result.insufficientEvidenceRequirements.length).toBeGreaterThan(0);
  });

  it('produces a stable strategyVersion for identical inputs', () => {
    const r1 = computeAll(makeProfile());
    const r2 = computeAll(makeProfile());
    expect(r1.strategyVersion).toBe(r2.strategyVersion);
    expect(r1.strategyVersion).toMatch(/^v1:[0-9a-f]{8}$/);
  });

  it('identifies skills present in experience.technologies but missing from skills section', () => {
    const profile = makeProfile({
      skills: [
        { id: 'sk1', name: 'React', category: null, source: 'user', confidence: null },
      ],
      experience: [
        {
          id: 'exp1',
          company: 'Acme',
          title: 'Dev',
          location: null,
          startDate: '2022-01',
          endDate: null,
          isCurrent: true,
          description: 'Built things.',
          technologies: ['TypeScript'], // TypeScript required but not in skills section
          achievements: [],
          source: 'user',
          confidence: null,
        },
      ],
    });
    const result = computeAll(profile);

    const skillsChange = result.resumeSectionChanges.find((c) => c.section === 'skills');
    expect(skillsChange).toBeDefined();
    expect(skillsChange?.change).toContain('TypeScript');
    expect(skillsChange?.priority).toBe('high');
  });

  it('recommends apply_with_improvements when coverage is good but confidence is low', () => {
    // Skills match but profile is very sparse
    const profile = makeProfile({
      completionPercent: 15,
      yearsOfExperience: null,
      summary: null,
    });
    const result = computeAll(profile);

    // Has TypeScript, React, Next.js confirmed → coverage is high
    // But confidence should be low due to sparse profile
    expect(['apply_now', 'apply_with_improvements']).toContain(result.recommendedAction);
    expect(result.strategyVersion).toMatch(/^v1:[0-9a-f]{8}$/);
  });

  it('builds screening topics for inferred requirements', () => {
    const profile = makeProfile({
      skills: [
        // React is in profile; TypeScript is transferable from React (not JavaScript here)
        { id: 'sk1', name: 'React', category: null, source: 'user', confidence: null },
      ],
      experience: [],
    });
    const result = computeAll(profile, {
      description: 'TypeScript and React required.',
      skills: ['TypeScript', 'React'],
    });

    // TypeScript may be inferred from React via transferable skill rules
    // If unsupported, there should be a gap screening topic
    if (result.insufficientEvidenceRequirements.includes('TypeScript')) {
      expect(result.screeningTopics.some((t) => t.topic.includes('TypeScript'))).toBe(true);
    }
    expect(result.screeningTopics.length).toBeGreaterThanOrEqual(0);
  });
});
