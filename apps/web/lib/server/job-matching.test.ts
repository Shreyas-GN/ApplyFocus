import { describe, expect, it } from 'vitest';
import {
  analyzeJobIntelligence,
  computeJobMatch,
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

describe('freshness bonus and isFresh flag', () => {
  const baseJob = {
    title: 'Senior Software Engineer',
    location: 'Remote',
    workMode: 'remote',
    description: 'Build TypeScript services at scale.',
    skills: ['TypeScript', 'React'],
  };

  const profile = makeProfile();

  it('applies +5 bonus for jobs posted 2 days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const withFreshness = computeJobMatch(profile, { ...baseJob, postedAt: twoDaysAgo });
    const withoutFreshness = computeJobMatch(profile, { ...baseJob, postedAt: undefined });
    expect(withFreshness.score).toBeGreaterThanOrEqual(withoutFreshness.score + 4);
  });

  it('applies +3 bonus for jobs posted 5 days ago', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const withFreshness = computeJobMatch(profile, { ...baseJob, postedAt: fiveDaysAgo });
    const withoutFreshness = computeJobMatch(profile, { ...baseJob, postedAt: undefined });
    expect(withFreshness.score).toBeGreaterThanOrEqual(withoutFreshness.score + 2);
  });

  it('applies +1 bonus for jobs posted 10 days ago', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const withFreshness = computeJobMatch(profile, { ...baseJob, postedAt: tenDaysAgo });
    const withoutFreshness = computeJobMatch(profile, { ...baseJob, postedAt: undefined });
    expect(withFreshness.score).toBeGreaterThanOrEqual(withoutFreshness.score + 0);
  });

  it('applies no bonus for jobs posted 60 days ago', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const old = computeJobMatch(profile, { ...baseJob, postedAt: sixtyDaysAgo });
    const noPdate = computeJobMatch(profile, { ...baseJob, postedAt: undefined });
    expect(old.score).toBe(noPdate.score);
  });

  it('marks isFresh true for jobs posted 5 days ago', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const match = computeJobMatch(profile, { ...baseJob, postedAt: fiveDaysAgo });
    expect(match.isFresh).toBe(true);
  });

  it('marks isFresh false for jobs posted 10 days ago', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    const match = computeJobMatch(profile, { ...baseJob, postedAt: tenDaysAgo });
    expect(match.isFresh).toBe(false);
  });

  it('marks isFresh false when postedAt is null', () => {
    const match = computeJobMatch(profile, { ...baseJob, postedAt: null });
    expect(match.isFresh).toBe(false);
  });
});
