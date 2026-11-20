import { describe, expect, it } from 'vitest';
import type { JobRequirement, ProfileDto } from '@/lib/types';
import {
  jobRequirementsExtractionSchema,
  jobRequirementSchema,
} from '@applypilot/validators';
import {
  calculateRequirementMatchResult,
  matchRequirementAgainstCandidate,
} from '@/lib/requirement-matching';
import {
  computeTextHash,
  extractJobRequirementsDeterministic,
} from './requirement-extraction';

function makeMockProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    fullName: 'Alex Developer',
    headline: 'Senior Full Stack Engineer',
    summary: 'Experienced engineer specializing in React, Node.js, and distributed backend systems.',
    yearsOfExperience: 6,
    phone: null,
    location: 'Bengaluru, India',
    githubUrl: 'https://github.com/alexdeveloper',
    linkedinUrl: null,
    portfolioUrl: null,
    skills: [
      {
        id: 'sk-1',
        name: 'TypeScript',
        category: 'LANGUAGE',
        proficiency: 'expert',
        yearsOfExperience: 5,
        evidence: 'Primary language across 3 years at Stripe',
        evidenceCategory: 'USER_CONFIRMED',
        evidenceSentence: 'Led architecture of TypeScript microservices at Stripe.',
        connectedExperience: 'Stripe',
        connectedProject: null,
        source: 'user',
        confidence: 0.95,
      },
      {
        id: 'sk-2',
        name: 'React',
        category: 'FRAMEWORK',
        proficiency: 'expert',
        yearsOfExperience: 5,
        evidence: 'Built dashboard UI',
        evidenceCategory: 'AI_EXTRACTED',
        evidenceSentence: 'Spearheaded frontend migration to React 19, improving page load by 40%.',
        connectedExperience: 'Stripe',
        connectedProject: null,
        source: 'ai',
        confidence: 0.9,
      },
      {
        id: 'sk-3',
        name: 'PostgreSQL',
        category: 'DATABASE',
        proficiency: 'advanced',
        yearsOfExperience: 4,
        evidence: 'Database schema design and performance tuning',
        evidenceCategory: 'USER_CONFIRMED',
        evidenceSentence: 'Designed relational schemas and optimized PostgreSQL queries.',
        connectedExperience: 'Stripe',
        connectedProject: null,
        source: 'user',
        confidence: 0.9,
      },
      {
        id: 'sk-4',
        name: 'Kubernetes',
        category: 'CLOUD_INFRASTRUCTURE',
        proficiency: 'intermediate',
        yearsOfExperience: 1,
        evidence: null,
        evidenceCategory: 'AI_SUGGESTED',
        evidenceSentence: null,
        connectedExperience: null,
        connectedProject: null,
        source: 'ai',
        confidence: 0.4,
      },
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'Stripe',
        title: 'Senior Software Engineer',
        location: 'Bengaluru, India',
        startDate: '2021-01-01T00:00:00.000Z',
        endDate: null,
        isCurrent: true,
        description: 'Led core billing systems and web platform infrastructure.',
        responsibilities: [
          'Led a team of 4 engineers and mentored junior developers',
          'Collaborated cross-functionally with product and design partners',
        ],
        achievements: [
          'Improved payment processing latency by 35% across 2M daily transactions',
        ],
        technologies: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
        evidenceSentences: [
          'Led architecture of TypeScript microservices at Stripe.',
          'Spearheaded frontend migration to React 19, improving page load by 40%.',
        ],
        source: 'user',
        confidence: 0.95,
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'National Institute of Technology',
        degree: 'Bachelor of Technology',
        fieldOfStudy: 'Computer Science and Engineering',
        startDate: '2016-08-01T00:00:00.000Z',
        endDate: '2020-05-30T00:00:00.000Z',
        graduationYear: 2020,
        grade: 'First Class with Distinction',
        description: 'Focused on algorithms, distributed computing, and software systems.',
        source: 'user',
        confidence: 0.98,
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Distributed Task Queue',
        description: 'A fault-tolerant distributed job queue in Go and Redis.',
        technologies: ['Go', 'Redis', 'Docker'],
        contributions: ['Architected worker pool and retry mechanisms'],
        measurableOutcomes: [
          'Handled 50,000 tasks/sec with under 5ms p99 latency',
        ],
        skillsDemonstrated: ['Go', 'Redis', 'System Architecture'],
        url: null,
        githubUrl: null,
        liveUrl: null,
        startDate: null,
        endDate: null,
        source: 'user',
        confidence: 0.95,
      },
    ],
    certifications: [],
    preferredTitles: ['Senior Software Engineer', 'Staff Engineer'],
    preferredLocations: ['Bengaluru', 'Remote'],
    workMode: 'remote',
    employmentStatus: 'employed',
    employmentTypes: ['full_time'],
    expectedSalaryMin: null,
    expectedSalaryMax: null,
    preferredIndustries: [],
    excludedCompanies: [],
    completionPercent: 85,
    updatedAt: '2026-11-20T00:00:00.000Z',
    ...overrides,
  };
}

describe('Phase 3: Requirement-Level Matching Engine', () => {
  // Test 1: Requirement extraction schema validation
  it('validates extracted requirements against the Zod schema', () => {
    const rawExtraction = {
      requirements: [
        {
          id: 'tech-typescript',
          name: 'TypeScript Proficiency',
          normalizedSkill: 'TypeScript',
          category: 'TECHNICAL',
          importance: 'MUST_HAVE',
          minYears: 3,
          evidenceSentence: 'Must have at least 3 years of production TypeScript experience.',
        },
        {
          id: 'tech-graphql',
          name: 'GraphQL API Design',
          normalizedSkill: 'GraphQL',
          category: 'TECHNICAL',
          importance: 'PREFERRED',
          minYears: null,
          evidenceSentence: 'Experience with GraphQL APIs is preferred.',
        },
      ],
    };

    const parsed = jobRequirementsExtractionSchema.safeParse(rawExtraction);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.requirements).toHaveLength(2);
      expect(parsed.data?.requirements[0]?.importance).toBe('MUST_HAVE');
      expect(parsed.data?.requirements[1]?.importance).toBe('PREFERRED');
    }
  });

  // Test 2: Must-have and preferred classification in deterministic extraction
  it('extracts and classifies must-have vs preferred requirements from job description', () => {
    const job = {
      title: 'Senior Frontend Engineer',
      description: `
        We are seeking a Senior Frontend Engineer.
        Required Qualifications:
        - Must have 5+ years of software engineering experience.
        - Minimum 3 years of hands-on production experience with React and TypeScript.
        - Bachelor's degree in Computer Science or equivalent.
        Nice to have:
        - Experience with GraphQL is a plus.
        - Familiarity with Kubernetes and Docker is preferred.
      `,
      skills: ['React', 'TypeScript', 'GraphQL', 'Kubernetes'],
    };

    const extracted = extractJobRequirementsDeterministic(job);
    expect(extracted.length).toBeGreaterThanOrEqual(4);

    const tsReq = extracted.find((r) => r.normalizedSkill === 'TypeScript');
    const gqlReq = extracted.find((r) => r.normalizedSkill === 'GraphQL');

    expect(tsReq).toBeDefined();
    expect(tsReq?.importance).toBe('MUST_HAVE');

    expect(gqlReq).toBeDefined();
    expect(gqlReq?.importance).toBe('PREFERRED');
  });

  // Test 3: Direct requirement matching with provenance citations
  it('identifies direct matches with verified work experience provenance', () => {
    const profile = makeMockProfile();
    const requirement: JobRequirement = {
      id: 'tech-ts',
      name: 'TypeScript',
      normalizedSkill: 'TypeScript',
      category: 'TECHNICAL',
      importance: 'MUST_HAVE',
      minYears: 3,
      evidenceSentence: 'Must have at least 3 years of production TypeScript experience.',
    };

    const match = matchRequirementAgainstCandidate(requirement, profile);
    expect(match.status).toBe('DIRECT_MATCH');
    expect(match.candidateSkill).toBe('TypeScript');
    expect(match.sourceExperience).toBe('Stripe');
    expect(match.evidenceCategory).toBe('USER_CONFIRMED');
    expect(match.evidenceSentence).toContain('Led architecture of TypeScript microservices');
    expect(match.confidence).toBeGreaterThan(0.8);
  });

  // Test 4: Project evidence matching
  it('identifies direct matches backed by demonstrable project evidence', () => {
    const profile = makeMockProfile();
    const requirement: JobRequirement = {
      id: 'tech-redis',
      name: 'Redis',
      normalizedSkill: 'Redis',
      category: 'TECHNICAL',
      importance: 'MUST_HAVE',
      minYears: null,
      evidenceSentence: 'Must have experience with Redis caching and queues.',
    };

    const match = matchRequirementAgainstCandidate(requirement, profile);
    expect(match.status).toBe('DIRECT_MATCH');
    expect(match.sourceProject).toBe('Distributed Task Queue');
    expect(match.evidenceSentence).toContain('Handled 50,000 tasks/sec');
  });

  // Test 5: Related & transferable skill matching
  it('matches transferable skills with high-confidence reasoning', () => {
    const profile = makeMockProfile();
    // Candidate has PostgreSQL and React, but no explicit Prisma or Drizzle skill
    const requirement: JobRequirement = {
      id: 'tech-drizzle',
      name: 'Drizzle ORM',
      normalizedSkill: 'Drizzle',
      category: 'TECHNICAL',
      importance: 'PREFERRED',
      minYears: null,
      evidenceSentence: 'Experience with Drizzle ORM is a plus.',
    };

    const match = matchRequirementAgainstCandidate(requirement, profile);
    expect(match.status).toBe('RELATED_MATCH');
    expect(match.candidateSkill).toBe('PostgreSQL');
    expect(match.transferableReason?.toLowerCase()).toContain('relational');
  });

  // Test 6: AI suggestions never treated as proven experience (Unverified status)
  it('classifies AI suggestions without evidence as UNVERIFIED rather than full match', () => {
    const profile = makeMockProfile();
    // Kubernetes is in profile as AI_SUGGESTED without quotes
    const requirement: JobRequirement = {
      id: 'tech-k8s',
      name: 'Kubernetes',
      normalizedSkill: 'Kubernetes',
      category: 'TECHNICAL',
      importance: 'MUST_HAVE',
      minYears: 2,
      evidenceSentence: 'Required experience operating production Kubernetes clusters.',
    };

    const match = matchRequirementAgainstCandidate(requirement, profile);
    expect(match.status).toBe('UNVERIFIED');
    expect(match.evidenceCategory).toBe('AI_SUGGESTED');
    expect(match.rationale).toContain('lacks verifiable resume proof');
  });

  // Test 7: Missing requirements detection
  it('correctly marks requirements as MISSING when candidate lacks evidence', () => {
    const profile = makeMockProfile();
    const requirement: JobRequirement = {
      id: 'tech-rust',
      name: 'Rust Systems Programming',
      normalizedSkill: 'Rust',
      category: 'TECHNICAL',
      importance: 'MUST_HAVE',
      minYears: 3,
      evidenceSentence: 'Must have 3+ years writing low-level systems in Rust.',
    };

    const match = matchRequirementAgainstCandidate(requirement, profile);
    expect(match.status).toBe('MISSING');
    expect(match.confidence).toBe(0);
    expect(match.candidateSkill).toBeNull();
  });

  // Test 8: Deterministic scoring reproducibility and mandatory requirement capping
  it('produces identical scores for identical inputs and caps score when must-haves are missing', () => {
    const profile = makeMockProfile();

    const requirements: JobRequirement[] = [
      {
        id: 'req-ts',
        name: 'TypeScript',
        normalizedSkill: 'TypeScript',
        category: 'TECHNICAL',
        importance: 'MUST_HAVE',
        minYears: 3,
        evidenceSentence: 'Must have 3+ years TypeScript.',
      },
      {
        id: 'req-react',
        name: 'React',
        normalizedSkill: 'React',
        category: 'TECHNICAL',
        importance: 'MUST_HAVE',
        minYears: 3,
        evidenceSentence: 'Must have production React experience.',
      },
      {
        id: 'req-missing-must-have',
        name: 'Rust',
        normalizedSkill: 'Rust',
        category: 'TECHNICAL',
        importance: 'MUST_HAVE',
        minYears: 4,
        evidenceSentence: 'Core role requirement: 4+ years Rust.',
      },
      {
        id: 'req-pref-1',
        name: 'Go',
        normalizedSkill: 'Go',
        category: 'TECHNICAL',
        importance: 'PREFERRED',
        minYears: null,
        evidenceSentence: 'Go experience is a plus.',
      },
      {
        id: 'req-pref-2',
        name: 'Redis',
        normalizedSkill: 'Redis',
        category: 'TECHNICAL',
        importance: 'PREFERRED',
        minYears: null,
        evidenceSentence: 'Redis experience is a plus.',
      },
    ];

    const result1 = calculateRequirementMatchResult(requirements, profile);
    const result2 = calculateRequirementMatchResult(requirements, profile);

    // Exact determinism
    expect(result1.overallScore).toBe(result2.overallScore);
    expect(result1.mustHaveCoverage).toBe(result2.mustHaveCoverage);
    expect(result1.preferredCoverage).toBe(result2.preferredCoverage);

    // Mandatory requirement capping rule:
    // Missing a MUST_HAVE requirement (Rust) must cap the score <= 65
    expect(result1.overallScore).toBeLessThanOrEqual(65);
    expect(result1.criticalGapsCount).toBe(1);
    expect(result1.missingRequirements.some((m) => m.requirement.name === 'Rust')).toBe(true);
  });

  // Test 9: Actionable Gap Analysis classification
  it('classifies gaps into CRITICAL_GAP, EXPERIENCE_GAP, and provides actionable improvements', () => {
    const profile = makeMockProfile({ yearsOfExperience: 2 });

    const requirements: JobRequirement[] = [
      {
        id: 'req-must-missing',
        name: 'Distributed Systems Architecture',
        normalizedSkill: 'Distributed Systems',
        category: 'TECHNICAL',
        importance: 'MUST_HAVE',
        minYears: null,
        evidenceSentence: 'Must have hands-on experience designing distributed architectures.',
      },
      {
        id: 'req-exp-gap',
        name: '7+ Years Senior Engineering',
        normalizedSkill: 'Software Engineering Experience',
        category: 'EXPERIENCE',
        importance: 'MUST_HAVE',
        minYears: 7,
        evidenceSentence: 'Minimum 7+ years professional experience required.',
      },
    ];

    const result = calculateRequirementMatchResult(requirements, profile);
    expect(result.gaps).toHaveLength(2);

    const criticalGap = result.gaps.find((g) => g.classification === 'CRITICAL_GAP');
    const expGap = result.gaps.find((g) => g.classification === 'EXPERIENCE_GAP');

    expect(criticalGap).toBeDefined();
    expect(criticalGap?.actionableImprovement).toContain('add a bullet point');

    expect(expGap).toBeDefined();
    expect(expGap?.actionableImprovement).toContain('scope of ownership');
  });

  // Test 10: Cache key hashing consistency and invalidation
  it('computes consistent hashes and detects description changes for cache invalidation', () => {
    const text1 = 'We need a Senior TypeScript Engineer to build real-time financial dashboards.';
    const text2 = 'We need a Senior TypeScript Engineer to build real-time financial dashboards.';
    const text3 = 'We need a Senior TypeScript Engineer with AWS and GraphQL.';

    const hash1 = computeTextHash(text1);
    const hash2 = computeTextHash(text2);
    const hash3 = computeTextHash(text3);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  // Test 11: User profile data isolation
  it('computes distinct requirement match outputs for different candidate profiles', () => {
    const profileA = makeMockProfile({
      skills: [
        {
          id: 'sk-a',
          name: 'Python',
          category: 'LANGUAGE',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Python data pipelines',
          source: 'user',
          confidence: 0.9,
        },
      ],
      experience: [],
      projects: [],
    });

    const profileB = makeMockProfile({
      skills: [
        {
          id: 'sk-b',
          name: 'Java',
          category: 'LANGUAGE',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Java enterprise services',
          source: 'user',
          confidence: 0.9,
        },
      ],
      experience: [],
      projects: [],
    });

    const requirement: JobRequirement = {
      id: 'req-python',
      name: 'Python',
      normalizedSkill: 'Python',
      category: 'TECHNICAL',
      importance: 'MUST_HAVE',
      minYears: null,
      evidenceSentence: 'Strong Python background required.',
    };

    const matchA = matchRequirementAgainstCandidate(requirement, profileA);
    const matchB = matchRequirementAgainstCandidate(requirement, profileB);

    expect(matchA.status).toBe('DIRECT_MATCH');
    expect(matchB.status).toBe('MISSING');
  });
});
