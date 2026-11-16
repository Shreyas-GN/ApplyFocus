import { describe, expect, it, vi } from 'vitest';
import type { ProfileDto } from '@/lib/types';
import {
  buildApplicationStrategy,
  applicationStrategyContentSchema,
} from './strategy';
import type { ClaudeMessagesClient } from './tailoring';

const SAMPLE_PROFILE: ProfileDto = {
  fullName: 'Ada Lovelace',
  phone: null,
  location: 'Remote',
  linkedinUrl: null,
  githubUrl: null,
  portfolioUrl: null,
  headline: 'Senior Full-Stack Engineer',
  summary: 'Built TypeScript and Postgres systems for developer platforms.',
  yearsOfExperience: 6,
  employmentStatus: 'actively_looking',
  preferredTitles: ['Senior Software Engineer'],
  preferredLocations: ['Remote'],
  workMode: 'remote',
  employmentTypes: ['full_time'],
  expectedSalaryMin: null,
  expectedSalaryMax: null,
  preferredIndustries: [],
  excludedCompanies: [],
  completionPercent: 90,
  updatedAt: '2026-11-11T00:00:00.000Z',
  experience: [
    {
      id: 'exp-1',
      company: 'Analytical Engines',
      title: 'Staff Engineer',
      location: 'Remote',
      startDate: '2021-01',
      endDate: null,
      isCurrent: true,
      description: 'Led Next.js and PostgreSQL API architecture.',
      responsibilities: ['Designed API layer', 'Led team of 5 engineers'],
      achievements: ['Reduced latency by 40%', 'Shipped 3 major features'],
      technologies: ['TypeScript', 'Next.js', 'PostgreSQL', 'React'],
      confidence: 1,
      source: 'user',
    },
    {
      id: 'exp-2',
      company: 'Old Corp',
      title: 'Software Engineer',
      location: 'London',
      startDate: '2018-06',
      endDate: '2020-12',
      isCurrent: false,
      description: 'Built internal tools with React and Node.js.',
      responsibilities: [],
      achievements: [],
      technologies: ['React', 'Node.js', 'JavaScript'],
      confidence: 1,
      source: 'user',
    },
    {
      id: 'exp-ai',
      company: 'Ghost Company',
      title: 'AI-Extracted Role',
      location: null,
      startDate: null,
      endDate: null,
      isCurrent: false,
      description: null,
      source: 'ai',
      confidence: 0.4,
    },
  ],
  education: [
    {
      id: 'edu-1',
      institution: 'University of London',
      degree: 'BSc',
      fieldOfStudy: 'Mathematics',
      startDate: null,
      endDate: null,
      description: null,
      confidence: 1,
      source: 'user',
    },
  ],
  skills: [
    { id: 'sk-1', name: 'TypeScript', category: 'Languages', confidence: 1, source: 'user' },
    { id: 'sk-2', name: 'PostgreSQL', category: 'Databases', confidence: 1, source: 'user' },
    { id: 'sk-3', name: 'React', category: 'Frameworks', confidence: 1, source: 'user' },
    { id: 'sk-ai', name: 'Rust', category: 'Languages', confidence: 0.5, source: 'ai' },
  ],
  projects: [
    {
      id: 'proj-1',
      name: 'QueryKit',
      description: 'Open-source TypeScript query builder for PostgreSQL.',
      role: 'Creator',
      technologies: ['TypeScript', 'PostgreSQL'],
      contributions: ['Designed API', 'Published on npm'],
      url: null,
      githubUrl: null,
      liveUrl: null,
      startDate: '2023-01',
      endDate: null,
      source: 'user',
      confidence: 1,
    },
  ],
  certifications: [],
};

const STRONG_MATCH_JOB = {
  id: 'job-1',
  company: 'Vercel',
  title: 'Senior Software Engineer',
  location: 'Remote',
  workMode: 'remote',
  employmentType: 'full_time',
  description:
    'Build Next.js infrastructure, TypeScript APIs, and PostgreSQL-backed services. Experience with React required. Nice to have: Kubernetes.',
  skills: ['TypeScript', 'Next.js', 'PostgreSQL', 'React', 'Kubernetes'],
  source: 'greenhouse',
};

const WEAK_MATCH_JOB = {
  id: 'job-2',
  company: 'DataCo',
  title: 'Senior Data Scientist',
  location: 'New York',
  workMode: 'onsite',
  employmentType: 'full_time',
  description: 'Build ML models using Python, PyTorch, and Spark. PhD required.',
  skills: ['Python', 'PyTorch', 'Spark', 'Machine Learning'],
  source: 'greenhouse',
};

function makeMockClient(responseData: object): ClaudeMessagesClient {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: JSON.stringify(responseData) }],
      }),
    },
  };
}

const VALID_AI_STRATEGY = {
  recommendation: 'strong_opportunity',
  recommendationReason:
    'Your TypeScript and PostgreSQL background directly matches Vercel requirements.',
  positioning: 'Senior full-stack engineer with TypeScript and PostgreSQL platform expertise.',
  whyPursue: ['Strong stack overlap with TypeScript, Next.js, PostgreSQL.'],
  strongestExperiences: [
    {
      id: 'exp-1',
      type: 'experience',
      name: 'Staff Engineer at Analytical Engines',
      relevanceReason: 'Led Next.js and PostgreSQL architecture matching the role.',
    },
  ],
  bestProjects: [
    {
      id: 'proj-1',
      type: 'project',
      name: 'QueryKit',
      relevanceReason: 'TypeScript/PostgreSQL project directly relevant to Vercel stack.',
    },
  ],
  topAchievements: ['Reduced latency by 40%'],
  skillsToEmphasize: ['TypeScript', 'PostgreSQL', 'React', 'Next.js'],
  evidenceGaps: [
    {
      requirement: 'Kubernetes',
      evidenceStrength: 'none',
      note: 'No documented evidence. Consider whether you have undocumented experience.',
    },
  ],
  resumeImprovements: ['Add Kubernetes exposure if any.'],
  screeningPrep: ['Prepare to discuss your work at Analytical Engines.'],
  potentialConcerns: ['Kubernetes not in confirmed profile.'],
  nextAction: 'Start tailoring your resume to emphasize TypeScript and PostgreSQL experience.',
};

describe('Application Strategy Intelligence', () => {
  it('generates strategy for a strong match job via AI client', async () => {
    const mockClient = makeMockClient(VALID_AI_STRATEGY);
    const result = await buildApplicationStrategy(SAMPLE_PROFILE, STRONG_MATCH_JOB, mockClient);

    expect(result.recommendation).toBe('strong_opportunity');
    expect(result.skillsToEmphasize).toContain('TypeScript');
    expect(result.skillsToEmphasize).toContain('PostgreSQL');
    expect(result.strongestExperiences[0]?.id).toBe('exp-1');
  });

  it('falls back to deterministic strategy when AI client fails', async () => {
    const failingClient: ClaudeMessagesClient = {
      messages: {
        create: vi.fn().mockRejectedValue(new Error('AI unavailable')),
      },
    };

    const result = await buildApplicationStrategy(SAMPLE_PROFILE, STRONG_MATCH_JOB, failingClient);

    expect(result.recommendation).toBeDefined();
    expect(['strong_opportunity', 'worth_pursuing', 'lower_priority']).toContain(
      result.recommendation
    );
    expect(result.recommendationReason).toBeTruthy();
    expect(result.nextAction).toBeTruthy();
  });

  it('produces lower_priority for a weak match with work mode mismatch', async () => {
    const failingClient: ClaudeMessagesClient = {
      messages: { create: vi.fn().mockRejectedValue(new Error('no ai')) },
    };

    const result = await buildApplicationStrategy(SAMPLE_PROFILE, WEAK_MATCH_JOB, failingClient);

    // Work mode is onsite vs remote preference, plus weak skill overlap — expect lower priority
    expect(result.recommendation).toBe('lower_priority');
  });

  it('never includes AI-sourced experience in evidence', async () => {
    const failingClient: ClaudeMessagesClient = {
      messages: { create: vi.fn().mockRejectedValue(new Error('no ai')) },
    };

    const result = await buildApplicationStrategy(SAMPLE_PROFILE, STRONG_MATCH_JOB, failingClient);

    const expIds = result.strongestExperiences.map((e) => e.id);
    expect(expIds).not.toContain('exp-ai');
  });

  it('identifies evidence gaps for missing skills', async () => {
    const failingClient: ClaudeMessagesClient = {
      messages: { create: vi.fn().mockRejectedValue(new Error('no ai')) },
    };

    const result = await buildApplicationStrategy(SAMPLE_PROFILE, STRONG_MATCH_JOB, failingClient);

    const kubernetesGap = result.evidenceGaps.find(
      (g) => g.requirement.toLowerCase() === 'kubernetes'
    );
    expect(kubernetesGap).toBeDefined();
    expect(kubernetesGap?.evidenceStrength).toBe('none');
  });

  it('validates AI response schema and rejects malformed output', async () => {
    const badClient = makeMockClient({ invalid: 'structure' });

    // Should fall back to deterministic strategy (not throw)
    const result = await buildApplicationStrategy(SAMPLE_PROFILE, STRONG_MATCH_JOB, badClient);
    expect(result.recommendation).toBeDefined();
    expect(result.nextAction).toBeTruthy();
  });

  it('validates approved strategy content via schema', () => {
    const result = applicationStrategyContentSchema.safeParse(VALID_AI_STRATEGY);
    expect(result.success).toBe(true);
  });

  it('rejects strategy content with invalid recommendation value', () => {
    const invalid = { ...VALID_AI_STRATEGY, recommendation: 'maybe' };
    const result = applicationStrategyContentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
