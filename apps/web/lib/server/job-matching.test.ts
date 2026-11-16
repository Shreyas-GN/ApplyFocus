import { describe, expect, it } from 'vitest';
import {
  analyzeJobIntelligence,
  computeJobMatch,
  computeOpportunityEvaluation,
  extractJobSkills,
  inferWorkMode,
  stripHtml,
} from './job-matching';
import type { ProfileDto } from '@/lib/types';

function makeProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    fullName: 'Test Candidate',
    phone: null,
    location: 'Bengaluru',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    headline: 'Senior Frontend Engineer',
    summary: 'Experienced in React and TypeScript.',
    yearsOfExperience: 5,
    employmentStatus: 'actively_looking',
    preferredTitles: ['Frontend Engineer', 'Full Stack Engineer'],
    preferredLocations: ['Bengaluru', 'Remote'],
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
      { id: '1', name: 'TypeScript', category: null, source: 'user', confidence: null },
      { id: '2', name: 'React', category: null, source: 'user', confidence: null },
      { id: '3', name: 'Next.js', category: null, source: 'user', confidence: null },
    ],
    projects: [],
    certifications: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('job-matching utilities', () => {
  it('strips HTML tags cleanly', () => {
    expect(stripHtml('<p>Hello &amp; <strong>World</strong></p>')).toBe(
      'Hello & World'
    );
  });

  it('extracts known technical skills from job text', () => {
    const skills = extractJobSkills(
      'Senior React Engineer',
      'Looking for experience with TypeScript, PostgreSQL, and Next.js.'
    );
    expect(skills).toEqual(
      expect.arrayContaining(['React', 'TypeScript', 'PostgreSQL', 'Next.js'])
    );
  });

  it('infers work mode from title and location', () => {
    expect(inferWorkMode('Frontend Engineer (Remote)', 'US', '')).toBe('remote');
    expect(inferWorkMode('Backend Engineer', 'New York - Hybrid', '')).toBe(
      'hybrid'
    );
    expect(inferWorkMode('Systems Engineer', 'San Francisco, CA', '')).toBe(
      'onsite'
    );
  });

  it('computes a high score when skills, title, workMode, and seniority align', () => {
    const profile = makeProfile();
    const match = computeJobMatch(profile, {
      title: 'Senior Frontend Engineer',
      location: 'Remote',
      workMode: 'remote',
      description: 'Build apps with TypeScript, React, Next.js, and Supabase.',
      skills: ['TypeScript', 'React', 'Next.js', 'Supabase'],
    });

    expect(match.score).toBeGreaterThanOrEqual(85);
    expect(match.skillsScore).toBeGreaterThanOrEqual(70);
    expect(match.experienceScore).toBeGreaterThanOrEqual(80);
    expect(match.matchedSkills).toEqual(['TypeScript', 'React', 'Next.js']);
    expect(match.missingSkills).toEqual(['Supabase']);
    expect(match.reasons.length).toBeGreaterThan(0);
    expect(match.isAdjacentRole).toBe(false);
  });

  it('returns lower score and explains mismatch when skills & mode do not align', () => {
    const profile = makeProfile({ workMode: 'remote' });
    const match = computeJobMatch(profile, {
      title: 'Junior Embedded Firmware Engineer',
      location: 'Austin, TX',
      workMode: 'onsite',
      description: 'C++ and Linux kernel development.',
      skills: ['C++', 'Linux'],
    });

    expect(match.score).toBeLessThan(30);
    expect(match.matchedSkills).toEqual([]);
    expect(match.missingSkills).toEqual(['C++', 'Linux']);
    expect(match.gaps.length).toBeGreaterThan(0);
  });

  it('identifies transferable skills and flags adjacent roles outside conventional target titles', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'TypeScript', category: null, source: 'user', confidence: null },
        { id: '2', name: 'React', category: null, source: 'user', confidence: null },
        { id: '3', name: 'Vitest', category: null, source: 'user', confidence: null },
      ],
    });
    const match = computeJobMatch(profile, {
      title: 'Developer Advocate',
      location: 'Remote',
      workMode: 'remote',
      description:
        'Build sample apps with TypeScript, React, Playwright, and JavaScript tutorials for developers.',
      skills: ['TypeScript', 'React', 'Playwright', 'JavaScript'],
    });

    expect(match.isAdjacentRole).toBe(true);
    expect(match.adjacencyReason).toContain('TypeScript');
    expect(match.transferableSkills.some((t) => t.targetSkill === 'Playwright')).toBe(true);
  });

  it('analyzes job intelligence into responsibilities, required vs preferred skills, and seniority', () => {
    const intelligence = analyzeJobIntelligence({
      title: 'Senior Full Stack Engineer',
      company: 'Acme Corp',
      location: 'Remote',
      workMode: 'remote',
      employmentType: 'full_time',
      source: 'greenhouse',
      skills: ['TypeScript', 'React', 'PostgreSQL', 'Kubernetes'],
      description:
        'We are looking for a Senior Full Stack Engineer with 5+ years of experience. You will design resilient web applications and lead end-to-end feature delivery with TypeScript, React, and PostgreSQL. Nice to have: Kubernetes and cloud deployment experience.',
    });

    expect(intelligence.seniorityLevel).toBe('Senior');
    expect(intelligence.expectedExperienceYears).toBe('5+ years');
    expect(intelligence.requiredSkills).toEqual(
      expect.arrayContaining(['TypeScript', 'React', 'PostgreSQL'])
    );
    expect(intelligence.preferredSkills).toContain('Kubernetes');
    expect(intelligence.responsibilities.length).toBeGreaterThan(0);
  });

  it('never treats unverified AI-extracted skills as confirmed qualifications in scoring', () => {
    const profile = makeProfile({
      skills: [
        { id: '1', name: 'TypeScript', category: null, source: 'ai', confidence: 0.7 },
        { id: '2', name: 'React', category: null, source: 'ai', confidence: 0.6 },
      ],
    });
    const match = computeJobMatch(profile, {
      title: 'Senior Frontend Engineer',
      location: 'Remote',
      workMode: 'remote',
      description: 'TypeScript and React role.',
      skills: ['TypeScript', 'React'],
    });

    expect(match.matchedSkills).toEqual([]);
    expect(match.missingSkills).toEqual(['TypeScript', 'React']);
  });
});

describe('computeOpportunityEvaluation', () => {
  const baseJob = {
    title: 'Senior Frontend Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    workMode: 'remote' as const,
    employmentType: 'full_time',
    description: 'Build UIs with TypeScript, React, Next.js. Nice to have: Kubernetes.',
    skills: ['TypeScript', 'React', 'Next.js', 'Kubernetes'],
  };

  function evaluate(profileOverrides: Partial<ProfileDto> = {}) {
    const profile = makeProfile(profileOverrides);
    const match = computeJobMatch(profile, baseJob);
    const intelligence = analyzeJobIntelligence({ ...baseJob, source: 'greenhouse' });
    return computeOpportunityEvaluation(profile, baseJob, match, intelligence);
  }

  it('recommends pursue when candidate covers most required skills', () => {
    const result = evaluate();
    expect(result.recommendedAction).toBe('pursue');
    expect(result.hardConstraintBlocked).toBe(false);
    expect(result.eligibilityAssessment).toContain('%');
  });

  it('recommends deprioritize when excluded company is matched', () => {
    const result = evaluate({ excludedCompanies: ['Acme Corp'] });
    expect(result.recommendedAction).toBe('deprioritize');
    expect(result.hardConstraintBlocked).toBe(true);
    expect(result.constraintChecks.some((c) => c.kind === 'excluded_company' && !c.satisfied)).toBe(true);
  });

  it('recommends deprioritize when excluded role matches job title', () => {
    const result = evaluate({ excludedRoles: ['Frontend'] });
    expect(result.recommendedAction).toBe('deprioritize');
    expect(result.hardConstraintBlocked).toBe(true);
    expect(result.constraintChecks.some((c) => c.kind === 'excluded_role' && !c.satisfied)).toBe(true);
  });

  it('marks skills as demonstrated when proficiency evidence is present', () => {
    const result = evaluate({
      skills: [
        {
          id: '1',
          name: 'TypeScript',
          category: null,
          source: 'user',
          confidence: null,
          proficiency: 'Expert',
        },
        { id: '2', name: 'React', category: null, source: 'user', confidence: null },
        { id: '3', name: 'Next.js', category: null, source: 'user', confidence: null },
      ],
    });
    const tsEval = result.requirementEvaluations.find((r) => r.requirement === 'TypeScript');
    expect(tsEval?.strength).toBe('demonstrated');
    expect(tsEval?.evidence).toContain('Expert');
    const reactEval = result.requirementEvaluations.find((r) => r.requirement === 'React');
    expect(reactEval?.strength).toBe('confirmed');
  });

  it('marks skills as inferred when found in experience technologies', () => {
    const result = evaluate({
      skills: [
        { id: '1', name: 'React', category: null, source: 'user', confidence: null },
        { id: '2', name: 'Next.js', category: null, source: 'user', confidence: null },
      ],
      experience: [
        {
          id: 'e1',
          company: 'StartupXYZ',
          title: 'Frontend Dev',
          location: null,
          startDate: '2021-01-01',
          endDate: null,
          isCurrent: true,
          description: 'Built products.',
          technologies: ['TypeScript'],
          achievements: [],
          source: 'user',
          confidence: null,
        },
      ],
    });
    const tsEval = result.requirementEvaluations.find((r) => r.requirement === 'TypeScript');
    expect(tsEval?.strength).toBe('inferred');
    expect(tsEval?.evidence).toContain('StartupXYZ');
  });

  it('marks skills as unsupported when not in profile and no transferable path exists', () => {
    // Profile only has React. TypeScript is transferable from React (via rule).
    // Next.js is NOT transferable from React alone — no rule maps React → Next.js.
    const result = evaluate({
      skills: [
        { id: '1', name: 'React', category: null, source: 'user', confidence: null },
      ],
      experience: [],
      projects: [],
    });
    const nextEval = result.requirementEvaluations.find((r) => r.requirement === 'Next.js');
    expect(nextEval?.strength).toBe('unsupported');
    expect(result.missingEvidence).toContain('Next.js');
  });

  it('never treats AI-extracted skills as confirmed evidence', () => {
    const result = evaluate({
      skills: [
        { id: '1', name: 'TypeScript', category: null, source: 'ai', confidence: 0.9 },
        { id: '2', name: 'React', category: null, source: 'ai', confidence: 0.9 },
        { id: '3', name: 'Next.js', category: null, source: 'ai', confidence: 0.9 },
      ],
    });
    const tsEval = result.requirementEvaluations.find((r) => r.requirement === 'TypeScript');
    expect(tsEval?.strength).toBe('unsupported');
  });

  it('produces a stable evaluationVersion for identical inputs', () => {
    const r1 = evaluate();
    const r2 = evaluate();
    expect(r1.evaluationVersion).toBe(r2.evaluationVersion);
    expect(r1.evaluationVersion).toMatch(/^v1:[0-9a-f]{8}$/);
  });

  it('reports low confidence when profile has no confirmed skills', () => {
    const result = evaluate({ skills: [], completionPercent: 10 });
    expect(result.confidenceLevel).toBe('low');
    expect(result.uncertaintyReasons.length).toBeGreaterThan(0);
  });

  it('returns a sensible result for null profile', () => {
    const job = baseJob;
    const match = computeJobMatch(null, job);
    const intelligence = analyzeJobIntelligence({ ...job, source: 'greenhouse' });
    const result = computeOpportunityEvaluation(null, job, match, intelligence);
    expect(result.recommendedAction).toBe('improve');
    expect(result.confidenceLevel).toBe('low');
    expect(result.evaluationVersion).toBe('v1:no-profile');
  });
});
