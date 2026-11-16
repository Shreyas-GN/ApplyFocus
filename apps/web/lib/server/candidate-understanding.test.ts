import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_VERSION,
  candidateCapabilityProfileSchema,
  computeCandidateCapabilityProfile,
} from './candidate-understanding';
import type { ProfileDto } from '@/lib/types';

function baseProfile(
  overrides: Partial<Omit<ProfileDto, 'intelligence' | 'completionPercent'>> = {}
): Omit<ProfileDto, 'intelligence' | 'completionPercent'> {
  return {
    fullName: null,
    email: null,
    authEmail: null,
    phone: null,
    location: null,
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    headline: null,
    summary: null,
    careerStage: null,
    yearsOfExperience: null,
    employmentStatus: null,
    preferredTitles: [],
    preferredExperienceLevel: null,
    preferredLocations: [],
    workMode: null,
    employmentTypes: [],
    expectedSalaryMin: null,
    expectedSalaryMax: null,
    preferredIndustries: [],
    excludedCompanies: [],
    desiredRoles: [],
    adjacentRoles: [],
    excludedRoles: [],
    intelligenceMetadata: {},
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    updatedAt: '2026-11-16T00:00:00.000Z',
    ...overrides,
  };
}

const opts = {
  processingTrigger: 'manual' as const,
  sourceResumeId: null,
};

describe('computeCandidateCapabilityProfile', () => {
  it('returns empty capabilities for an empty profile', () => {
    const result = computeCandidateCapabilityProfile(baseProfile(), opts);
    expect(result.totalCapabilities).toBe(0);
    expect(result.capabilities).toEqual([]);
    expect(result.gaps).toEqual([]);
    expect(result.contradictions).toEqual([]);
    expect(result.evidenceCoveragePercent).toBe(0);
    expect(result.assessmentVersion).toBe(ASSESSMENT_VERSION);
  });

  it('classifies a confirmed skill with matching work technology as directly_demonstrated', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'TypeScript', category: 'Languages', source: 'user', confidence: null },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['TypeScript', 'React'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const cap = result.capabilities.find((c) => c.normalizedName === 'typescript');
    expect(cap).toBeDefined();
    expect(cap!.evidenceClass).toBe('directly_demonstrated');
    expect(cap!.confirmedByUser).toBe(true);
    expect(cap!.evidenceStrength).toBe(0.75);
    expect(cap!.evidence.some((e) => e.type === 'work_technology')).toBe(true);
  });

  it('upgrades to achievement_backed when achievement text mentions the skill', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'Python', category: 'Languages', source: 'user', confidence: null },
        ],
        experience: [
          {
            id: 'e1',
            company: 'DataCo',
            title: 'Data Engineer',
            location: null,
            startDate: '2021-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['Python', 'SQL'],
            achievements: ['Built Python ETL pipeline reducing processing time by 63%'],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const cap = result.capabilities.find((c) => c.normalizedName === 'python');
    expect(cap!.evidenceClass).toBe('achievement_backed');
    expect(cap!.evidenceStrength).toBe(0.9);
    expect(cap!.evidence.some((e) => e.type === 'work_achievement')).toBe(true);
    const achievementEvidence = cap!.evidence.find((e) => e.type === 'work_achievement')!;
    expect(achievementEvidence.excerpt?.toLowerCase()).toContain('python');
  });

  it('classifies a confirmed skill with no work/project evidence as self_reported', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'SQL', category: 'Databases', proficiency: 'proficient', source: 'user', confidence: null },
        ],
      }),
      opts
    );

    const cap = result.capabilities[0];
    expect(cap.evidenceClass).toBe('self_reported');
    expect(cap.evidenceStrength).toBe(0.45);
    expect(cap.confirmedByUser).toBe(true);
  });

  it('classifies an AI-extracted skill with no corroboration as ai_extracted', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'Go', category: null, source: 'ai', confidence: 0.4 },
        ],
      }),
      opts
    );

    const cap = result.capabilities[0];
    expect(cap.evidenceClass).toBe('ai_extracted');
    expect(cap.confirmedByUser).toBe(false);
    expect(cap.evidenceStrength).toBeCloseTo(0.24, 2); // 0.4 * 0.6
  });

  it('upgrades AI-extracted skill to directly_demonstrated when confirmed work corroborates it', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'Rust', category: null, source: 'ai', confidence: 0.75 },
        ],
        experience: [
          {
            id: 'e1',
            company: 'SystemsCo',
            title: 'Systems Engineer',
            location: null,
            startDate: '2023-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['Rust', 'C++'],
            achievements: [],
            source: 'user', // confirmed
            confidence: null,
          },
        ],
      }),
      opts
    );

    const cap = result.capabilities.find((c) => c.normalizedName === 'rust');
    expect(cap!.evidenceClass).toBe('directly_demonstrated');
    expect(cap!.evidenceStrength).toBe(0.75);
  });

  it('does not use AI-extracted work experience as corroborating evidence', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'TypeScript', category: null, source: 'user', confidence: null },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['TypeScript'],
            achievements: [],
            source: 'ai', // AI-extracted, should NOT be used as evidence
            confidence: 0.8,
          },
        ],
      }),
      opts
    );

    const cap = result.capabilities[0];
    // Work experience is AI-extracted → not used as evidence → self_reported
    expect(cap.evidenceClass).toBe('self_reported');
    expect(cap.evidence.some((e) => e.type === 'work_technology')).toBe(false);
  });

  it('classifies skill with proficiency + years as self_reported with 0.55 strength', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          {
            id: 's1',
            name: 'React',
            category: 'Frontend',
            proficiency: 'expert',
            yearsOfExperience: 4,
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const cap = result.capabilities[0];
    expect(cap.evidenceClass).toBe('self_reported');
    expect(cap.evidenceStrength).toBe(0.55);
  });

  it('detects gap when work technology is not listed as a skill', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'TypeScript', category: null, source: 'user', confidence: null },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['TypeScript', 'Kubernetes'], // Kubernetes not in skills
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const kubernetesGap = result.gaps.find(
      (g) => g.technologyName === 'Kubernetes'
    );
    expect(kubernetesGap).toBeDefined();
    expect(kubernetesGap!.type).toBe('work_technology_undeclared');
    expect(kubernetesGap!.sourceLabel).toBe('Acme (Engineer)');
  });

  it('does not create a gap when confirmed work tech exactly matches a skill', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'TypeScript', category: null, source: 'user', confidence: null },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['TypeScript'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    expect(result.gaps).toHaveLength(0);
  });

  it('detects gap from project technology', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [],
        projects: [
          {
            id: 'p1',
            name: 'PortfolioSite',
            description: null,
            url: null,
            startDate: null,
            endDate: null,
            technologies: ['Svelte'],
            contributions: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const gap = result.gaps.find((g) => g.technologyName === 'Svelte');
    expect(gap).toBeDefined();
    expect(gap!.type).toBe('project_technology_undeclared');
  });

  it('deduplicates gaps across multiple sources for the same technology', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [],
        experience: [
          {
            id: 'e1',
            company: 'A',
            title: 'Eng',
            location: null,
            startDate: null,
            endDate: null,
            isCurrent: false,
            description: null,
            technologies: ['Docker'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
          {
            id: 'e2',
            company: 'B',
            title: 'Eng',
            location: null,
            startDate: null,
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['Docker'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const dockerGaps = result.gaps.filter((g) => g.technologyName === 'Docker');
    expect(dockerGaps).toHaveLength(1);
  });

  it('detects contradiction for AI skill with confidence < 0.5 and no corroboration', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'Haskell', category: null, source: 'ai', confidence: 0.25 },
        ],
      }),
      opts
    );

    const contradiction = result.contradictions.find(
      (c) => c.type === 'ai_low_confidence_no_corroboration'
    );
    expect(contradiction).toBeDefined();
    expect(contradiction!.capabilityName).toBe('Haskell');
    expect(contradiction!.severity).toBe('high'); // 0.25 < 0.3
  });

  it('detects experience_duration_exceeds_career contradiction', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          {
            id: 's1',
            name: 'React',
            category: null,
            proficiency: 'expert',
            yearsOfExperience: 15, // impossible
            source: 'user',
            confidence: null,
          },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2022-01-01', // ~3 years ago
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['React'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const contradiction = result.contradictions.find(
      (c) => c.type === 'experience_duration_exceeds_career'
    );
    expect(contradiction).toBeDefined();
    expect(contradiction!.capabilityName).toBe('React');
  });

  it('does not flag contradictions for valid skill years within career span', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          {
            id: 's1',
            name: 'React',
            category: null,
            yearsOfExperience: 2,
            source: 'user',
            confidence: null,
          },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2021-01-01', // ~5 years
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['React'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    expect(
      result.contradictions.filter((c) => c.type === 'experience_duration_exceeds_career')
    ).toHaveLength(0);
  });

  it('reports missing info when confirmed work experience has no technologies', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2021-01-01',
            endDate: null,
            isCurrent: true,
            description: 'Built things',
            technologies: [], // empty
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    const missing = result.missingInformation.find(
      (m) => m.type === 'work_experience_no_technologies'
    );
    expect(missing).toBeDefined();
    expect(missing!.affectedCount).toBe(1);
  });

  it('reports missing info for skills with no proficiency, evidence, or years', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'Go', category: null, source: 'user', confidence: null },
          { id: 's2', name: 'Rust', category: null, source: 'user', confidence: null },
        ],
      }),
      opts
    );

    const missing = result.missingInformation.find(
      (m) => m.type === 'skill_no_proficiency_or_evidence'
    );
    expect(missing).toBeDefined();
    expect(missing!.affectedCount).toBe(2);
  });

  it('computes evidenceCoveragePercent correctly', () => {
    // 2 directly_demonstrated (TypeScript, Python), 1 self_reported (SQL)
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'TypeScript', category: null, source: 'user', confidence: null },
          { id: 's2', name: 'Python', category: null, source: 'user', confidence: null },
          { id: 's3', name: 'SQL', category: null, source: 'user', confidence: null },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Engineer',
            location: null,
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['TypeScript', 'Python'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    expect(result.directlyDemonstratedCount).toBe(2);
    expect(result.selfReportedOnlyCount).toBe(1);
    expect(result.evidenceCoveragePercent).toBe(67); // 2/3 = 66.6 → 67
  });

  it('sorts capabilities by evidence strength descending', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          { id: 's1', name: 'SQL', category: null, source: 'user', confidence: null },
          { id: 's2', name: 'TypeScript', category: null, source: 'user', confidence: null },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Eng',
            location: null,
            startDate: '2022-01-01',
            endDate: null,
            isCurrent: true,
            description: null,
            technologies: ['TypeScript'],
            achievements: [],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    expect(result.capabilities[0].normalizedName).toBe('typescript');
    expect(result.capabilities[1].normalizedName).toBe('sql');
    expect(result.capabilities[0].evidenceStrength).toBeGreaterThan(
      result.capabilities[1].evidenceStrength
    );
  });

  it('records processingTrigger in the output', () => {
    const result = computeCandidateCapabilityProfile(baseProfile(), {
      processingTrigger: 'resume_confirmed',
      sourceResumeId: 'resume-abc',
    });
    expect(result.processingTrigger).toBe('resume_confirmed');
    expect(result.sourceResumeId).toBe('resume-abc');
  });

  it('output passes Zod schema validation', () => {
    const result = computeCandidateCapabilityProfile(
      baseProfile({
        skills: [
          {
            id: 's1',
            name: 'TypeScript',
            category: 'Languages',
            proficiency: 'expert',
            yearsOfExperience: 3,
            source: 'user',
            confidence: null,
          },
        ],
        experience: [
          {
            id: 'e1',
            company: 'Acme',
            title: 'Senior Engineer',
            location: 'Remote',
            startDate: '2021-01-01',
            endDate: null,
            isCurrent: true,
            description: 'Full-stack development',
            technologies: ['TypeScript', 'React'],
            achievements: ['Improved TypeScript coverage to 100%'],
            source: 'user',
            confidence: null,
          },
        ],
      }),
      opts
    );

    expect(() => candidateCapabilityProfileSchema.parse(result)).not.toThrow();
  });
});
