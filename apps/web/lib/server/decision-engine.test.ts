import { describe, expect, it } from 'vitest';
import type {
  AtsAnalysisResult,
  JobRequirement,
  ProfileDto,
  RequirementMatchResult,
} from '@/lib/types';
import { evaluateDecisionIntelligence } from './decision-engine';

function createMockProfile(overrides?: Partial<ProfileDto>): ProfileDto {
  return {
    fullName: 'Alex Rivera',
    email: 'alex@example.com',
    authEmail: 'alex@example.com',
    phone: '+1 (555) 019-2831',
    location: 'San Francisco, CA',
    linkedinUrl: null,
    githubUrl: null,
    portfolioUrl: null,
    headline: 'Senior Full Stack Engineer',
    summary: 'Senior software engineer with 5 years building scalable distributed web applications.',
    careerStage: 'Senior',
    yearsOfExperience: 5,
    employmentStatus: 'actively_looking',
    preferredTitles: ['Senior Software Engineer'],
    preferredLocations: ['San Francisco, CA'],
    workMode: 'remote',
    employmentTypes: ['full_time'],
    expectedSalaryMin: 150000,
    expectedSalaryMax: 190000,
    preferredIndustries: [],
    excludedCompanies: [],
    completionPercent: 90,
    updatedAt: new Date().toISOString(),
    skills: [
      {
        id: 'sk-ts',
        name: 'TypeScript',
        category: 'Languages',
        source: 'user',
        confidence: 1,
        evidenceCategory: 'USER_CONFIRMED',
      },
      {
        id: 'sk-pg',
        name: 'PostgreSQL',
        category: 'Databases',
        source: 'user',
        confidence: 1,
        evidenceCategory: 'USER_CONFIRMED',
      },
      {
        id: 'sk-react',
        name: 'React',
        category: 'Frameworks',
        source: 'user',
        confidence: 1,
        evidenceCategory: 'USER_CONFIRMED',
      },
    ],
    experience: [
      {
        id: 'exp-1',
        company: 'Stripe',
        title: 'Senior Software Engineer',
        location: 'San Francisco, CA',
        startDate: '2021-05',
        endDate: null,
        isCurrent: true,
        description: 'Engineered high-scale distributed billing systems.',
        responsibilities: ['Architected billing services'],
        achievements: [
          'Architected billing API reducing p99 latency by 42%.',
          'Supported 2.5M daily financial transactions.',
        ],
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'React'],
        confidence: 1,
        source: 'user',
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'UC Berkeley',
        degree: 'B.S.',
        fieldOfStudy: 'Computer Science',
        startDate: '2015',
        endDate: '2019',
        description: null,
        source: 'user',
        confidence: 1,
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Realtime Broker',
        description: 'Open-source distributed messaging engine built in TypeScript and Redis.',
        technologies: ['TypeScript', 'Redis', 'Docker'],
        contributions: ['Designed Raft consensus protocol handling 50k ops/sec'],
        measurableOutcomes: ['50k ops/sec throughput benchmarked'],
        url: 'https://github.com/alex/broker',
        startDate: null,
        endDate: null,
        source: 'user',
        confidence: 1,
      },
    ],
    certifications: [],
    ...overrides,
  };
}

function createMockMatchResult(overrides?: Partial<RequirementMatchResult>): RequirementMatchResult {
  const defaultMatches: import('@/lib/types').RequirementMatch[] = [
    {
      requirement: {
        id: 'req-1',
        name: 'TypeScript',
        normalizedSkill: 'TypeScript',
        category: 'TECHNICAL',
        importance: 'MUST_HAVE',
        isHardConstraint: true,
        evidenceSentence: 'Must have 3+ years TypeScript experience.',
      },
      status: 'DIRECT_MATCH',
      confidence: 0.95,
      rationale: 'Direct evidence confirmed in experience.',
      sourceExperience: 'Stripe — Senior Software Engineer',
    },
    {
      requirement: {
        id: 'req-2',
        name: 'PostgreSQL',
        normalizedSkill: 'PostgreSQL',
        category: 'TECHNICAL',
        importance: 'MUST_HAVE',
        isHardConstraint: true,
        evidenceSentence: 'Strong relational database design with PostgreSQL.',
      },
      status: 'DIRECT_MATCH',
      confidence: 0.95,
      rationale: 'Direct production experience at Stripe.',
      sourceExperience: 'Stripe — Senior Software Engineer',
    },
  ];

  return {
    overallScore: 88,
    mustHaveCoverage: 90,
    preferredCoverage: 80,
    experienceAlignment: 85,
    technicalAlignment: 90,
    evidenceStrength: 85,
    transferableContribution: 0,
    criticalGapsCount: 0,
    matches: defaultMatches,
    strongestMatches: defaultMatches,
    partialMatches: [],
    missingRequirements: [],
    unverifiedRequirements: [],
    gaps: [],
    ...overrides,
  };
}

function createMockAtsResult(overrides?: Partial<AtsAnalysisResult>): AtsAnalysisResult {
  return {
    overallReadiness: 88,
    readinessLabel: 'Optimal ATS Readiness',
    dimensions: {
      parsingReadiness: 90,
      structureQuality: 88,
      terminologyAlignment: 85,
      evidenceCommunication: 85,
      formattingCompatibility: 95,
    },
    findings: [],
    recommendations: [],
    alignmentItems: [],
    metrics: {
      totalSectionsIdentified: 5,
      detectedSections: ['Contact Information', 'Work Experience', 'Education', 'Skills'],
      missingSections: [],
      totalWords: 450,
      bulletCount: 12,
      quantifiedBulletCount: 6,
      directKeywordsMatched: 4,
      missingKeywordsCount: 0,
    },
    keywordStuffingDetected: false,
    keywordStuffingPenalty: 0,
    limitations: [],
    ...overrides,
  };
}

const mockJob = {
  id: 'job-101',
  title: 'Senior Backend Engineer',
  company: 'Fintech Corp',
  description:
    'Fintech Corp is seeking a Senior Backend Engineer to build resilient distributed payment gateways. Requires 3+ years TypeScript, Node.js, and PostgreSQL.',
  location: 'San Francisco, CA',
  workMode: 'remote',
  salaryMin: 160000,
  salaryMax: 195000,
  postedAt: new Date(),
  sourcePlatform: 'greenhouse',
};

describe('Phase 5 Decision Intelligence: 15 Realistic Scenarios', () => {
  // Scenario 1: Strong candidate fit with strong resume readiness
  it('Scenario 1: Evaluates strong candidate fit with strong resume readiness as STRONG_OPPORTUNITY', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult();
    const ats = createMockAtsResult();

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
      atsAnalysis: ats,
    });

    expect(result.recommendationTier).toBe('STRONG_OPPORTUNITY');
    expect(result.priorityTier).toBe('HIGH_PRIORITY');
    expect(result.applicationReadiness).toBe('READY_TO_APPLY');
    expect(result.strongestExperiences.length).toBeGreaterThan(0);
    expect(result.actionPlan.length).toBeGreaterThan(0);
  });

  // Scenario 2: Strong candidate fit with poor ATS readiness
  it('Scenario 2: Distinguishes high qualification from poor resume communication (READY_AFTER_IMPROVEMENTS)', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult({ overallScore: 85, mustHaveCoverage: 90 });
    const ats = createMockAtsResult({
      overallReadiness: 35,
      readinessLabel: 'Low ATS Readiness',
      findings: [
        {
          id: 'crit-contact',
          category: 'PARSING',
          severity: 'CRITICAL',
          title: 'Unreadable Phone Number Format',
          description: 'Phone sequence could not be extracted.',
          impact: 'Recruiters cannot reach candidate.',
          recommendation: 'Format phone correctly.',
          evidence: null,
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
      atsAnalysis: ats,
    });

    // Qualified to pursue, but NOT ready to apply due to resume presentation blocker
    expect(result.recommendationTier).toBe('STRONG_OPPORTUNITY');
    expect(result.applicationReadiness).toBe('READY_AFTER_IMPROVEMENTS');
    expect(result.actionPlan.some((a) => a.actionTitle.includes('Fix resume parsing hazard'))).toBe(true);
  });

  // Scenario 3: Weak qualification fit with excellent ATS readiness
  it('Scenario 3: Prevents high ATS score from overriding weak candidate qualifications (LOW_PRIORITY)', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult({
      overallScore: 30,
      mustHaveCoverage: 25,
      criticalGapsCount: 3,
      matches: [
        {
          requirement: {
            id: 'req-k8s',
            name: 'Kubernetes',
            normalizedSkill: 'Kubernetes',
            category: 'TECHNICAL',
            importance: 'MUST_HAVE',
            isHardConstraint: true,
            evidenceSentence: 'Must have 5+ years Kubernetes production cluster management.',
          },
          status: 'MISSING',
          confidence: 0,
          rationale: 'No Kubernetes evidence.',
        },
        {
          requirement: {
            id: 'req-go',
            name: 'Golang',
            normalizedSkill: 'Golang',
            category: 'TECHNICAL',
            importance: 'MUST_HAVE',
            isHardConstraint: true,
            evidenceSentence: 'Must have Golang systems programming experience.',
          },
          status: 'MISSING',
          confidence: 0,
          rationale: 'No Golang evidence.',
        },
      ],
    });
    const ats = createMockAtsResult({ overallReadiness: 95 });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
      atsAnalysis: ats,
    });

    expect(result.recommendationTier).toBe('LOW_PRIORITY');
    expect(result.applicationReadiness).toBe('NOT_RECOMMENDED');
  });

  // Scenario 4: Candidate with strong project evidence but little professional experience
  it('Scenario 4: Strictly preserves boundary between personal projects and professional employment', () => {
    const profile = createMockProfile({
      experience: [], // No professional employment
      yearsOfExperience: 0,
    });
    const match = createMockMatchResult({
      overallScore: 65,
      mustHaveCoverage: 70,
      matches: [
        {
          requirement: {
            id: 'req-exp',
            name: 'Professional Experience',
            normalizedSkill: 'Professional Experience',
            category: 'EXPERIENCE',
            importance: 'MUST_HAVE',
            isHardConstraint: true,
            minYears: 4,
            evidenceSentence: 'Minimum 4 years of professional software engineering experience.',
          },
          status: 'PARTIAL_MATCH',
          confidence: 0.5,
          rationale: 'Candidate possesses working project code, but 0 years of documented corporate employment.',
          sourceProject: 'Realtime Broker',
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
    });

    expect(result.strongestExperiences.length).toBe(0);
    expect(result.bestProjects.length).toBeGreaterThan(0);
    expect(result.bestProjects[0]?.name).toBe('Realtime Broker');
    expect(result.positioning.claimsToAvoid).toContain(
      'Do not claim personal or academic projects as years of professional employment.'
    );
  });

  // Scenario 5: Candidate with unverified AI-suggested skills
  it('Scenario 5: Excludes unverified AI profile suggestions from verified qualification ranking', () => {
    const profile = createMockProfile({
      skills: [
        {
          id: 'sk-ai-rust',
          name: 'Rust',
          category: 'Languages',
          source: 'ai', // Unverified AI suggestion
          confidence: 0.6,
          evidenceCategory: 'AI_SUGGESTED',
        },
      ],
    });
    const match = createMockMatchResult({
      matches: [
        {
          requirement: {
            id: 'req-rust',
            name: 'Rust',
            normalizedSkill: 'Rust',
            category: 'TECHNICAL',
            importance: 'MUST_HAVE',
            isHardConstraint: true,
            evidenceSentence: 'Required Rust systems programming.',
          },
          status: 'MISSING',
          confidence: 0,
          rationale: 'Only unverified AI suggestion exists.',
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
    });

    // Unverified skill must not be counted as a skill to emphasize
    expect(result.skillsToEmphasize).not.toContain('Rust');
  });

  // Scenario 6: Candidate who misses a critical mandatory qualification
  it('Scenario 6: Flags critical mandatory qualification gaps and downgrades recommendation tier', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult({
      overallScore: 50,
      mustHaveCoverage: 50,
      matches: [
        {
          requirement: {
            id: 'req-sec',
            name: 'PCI-DSS Compliance',
            normalizedSkill: 'PCI-DSS',
            category: 'TECHNICAL',
            importance: 'MUST_HAVE',
            isHardConstraint: true,
            evidenceSentence: 'Must have direct experience with PCI-DSS compliance audits.',
          },
          status: 'MISSING',
          confidence: 0,
          rationale: 'No PCI compliance background.',
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
    });

    expect(result.recommendationTier).not.toBe('STRONG_OPPORTUNITY');
    expect(result.whyCaution.some((c) => c.includes('PCI-DSS'))).toBe(true);
  });

  // Scenario 7: Candidate who misses only preferred qualifications
  it('Scenario 7: Does not downgrade candidate to LOW_PRIORITY for missing optional/preferred skills', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult({
      overallScore: 82,
      mustHaveCoverage: 95,
      preferredCoverage: 20, // Low preferred coverage
      matches: [
        {
          requirement: {
            id: 'req-pref-elixir',
            name: 'Elixir',
            normalizedSkill: 'Elixir',
            category: 'TECHNICAL',
            importance: 'PREFERRED',
            isHardConstraint: false,
            evidenceSentence: 'Bonus: Experience with Elixir / Phoenix.',
          },
          status: 'MISSING',
          confidence: 0,
          rationale: 'No Elixir.',
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
    });

    expect(result.recommendationTier).toBe('STRONG_OPPORTUNITY');
  });

  // Scenario 8: Candidate with transferable skills and no direct experience
  it('Scenario 8: Identifies transferable capability and provides framing guidance without over-promising', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult({
      overallScore: 68,
      mustHaveCoverage: 75,
      matches: [
        {
          requirement: {
            id: 'req-mysql',
            name: 'MySQL',
            normalizedSkill: 'MySQL',
            category: 'TECHNICAL',
            importance: 'MUST_HAVE',
            isHardConstraint: false,
            evidenceSentence: 'Relational database proficiency in MySQL.',
          },
          status: 'RELATED_MATCH',
          confidence: 0.75,
          rationale: 'Demonstrated extensive relational experience in PostgreSQL.',
          candidateSkill: 'PostgreSQL',
          sourceExperience: 'PostgreSQL at Stripe',
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
    });

    const mysqlGap = result.categorizedGaps.find((g) => g.requirement === 'MySQL');
    expect(mysqlGap?.evidenceStrength).toBe('transferable');
    expect(mysqlGap?.actionGuidance).toContain('foundational competence');
  });

  // Scenario 9: Candidate with genuine skills missing from selected resume
  it('Scenario 9: Flags RESUME_COMMUNICATION_GAP when candidate has verified skills missing from resume', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult({
      matches: [
        {
          requirement: {
            id: 'req-pg',
            name: 'PostgreSQL',
            normalizedSkill: 'PostgreSQL',
            category: 'TECHNICAL',
            importance: 'MUST_HAVE',
            isHardConstraint: true,
            evidenceSentence: 'Required PostgreSQL.',
          },
          status: 'MISSING',
          confidence: 0,
          rationale: 'Not in resume text.',
        },
      ],
    });
    const ats = createMockAtsResult({
      alignmentItems: [
        {
          requirementId: 'req-pg',
          requirementName: 'PostgreSQL',
          normalizedSkill: 'PostgreSQL',
          category: 'TECHNICAL',
          importance: 'MUST_HAVE',
          status: 'EVIDENCE_EXISTS_TERMINOLOGY_MISSING',
          contextQuality: 'NONE',
          candidateEvidenceSummary: 'Demonstrated in profile',
          resumeExcerpt: null,
          keywordFound: false,
          rationale: 'Skill present in candidate profile but missing in resume text.',
          suggestedImprovement: 'Include PostgreSQL in resume experience bullets.',
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
      atsAnalysis: ats,
    });

    const pgGap = result.categorizedGaps.find((g) => g.requirement === 'PostgreSQL');
    expect(pgGap?.category).toBe('RESUME_COMMUNICATION_GAP');
    expect(result.actionPlan.some((a) => a.actionTitle.includes('Incorporate demonstrated terminology'))).toBe(true);
  });

  // Scenario 10: Candidate whose preferences conflict with the job
  it('Scenario 10: Marks opportunity as LOW_PRIORITY when an explicitly recorded constraint is violated', () => {
    const profile = createMockProfile({
      workMode: 'remote', // Strict Remote
      expectedSalaryMin: 220000, // High salary requirement
    });
    const onsiteJob = {
      ...mockJob,
      workMode: 'onsite',
      salaryMax: 180000,
    };
    const match = createMockMatchResult({ overallScore: 90, mustHaveCoverage: 95 });

    const result = evaluateDecisionIntelligence({
      profile,
      job: onsiteJob,
      requirementMatch: match,
    });

    expect(result.recommendationTier).toBe('LOW_PRIORITY');
    expect(result.constraintsEvaluation.some((c) => c.status === 'VIOLATED')).toBe(true);
  });

  // Scenario 11: Candidate with incomplete preference information
  it('Scenario 11: Explicitly marks unknown constraints as UNKNOWN instead of assuming satisfaction', () => {
    const profile = createMockProfile({
      expectedSalaryMin: null,
      preferredLocations: [],
    });
    const undisclosedJob = {
      ...mockJob,
      salaryMin: null,
      salaryMax: null,
    };
    const match = createMockMatchResult();

    const result = evaluateDecisionIntelligence({
      profile,
      job: undisclosedJob,
      requirementMatch: match,
    });

    // Unknown salary shouldn't trigger violation or false satisfaction
    const salaryCon = result.constraintsEvaluation.find((c) => c.name === 'Compensation Expectations');
    expect(salaryCon).toBeUndefined(); // User had no preference recorded
  });

  // Scenario 12: Job description with missing or ambiguous information
  it('Scenario 12: Flags low description completeness without penalizing candidate fit', () => {
    const profile = createMockProfile();
    const shortJob = {
      ...mockJob,
      description: 'Looking for a developer. We offer good vibes and fast growth.',
      salaryMin: null,
      salaryMax: null,
    };
    const match = createMockMatchResult();

    const result = evaluateDecisionIntelligence({
      profile,
      job: shortJob,
      requirementMatch: match,
    });

    expect(result.jobInformationQuality.descriptionCompletenessScore).toBeLessThan(60);
    expect(result.jobInformationQuality.missingEmployerDetails.length).toBeGreaterThan(0);
  });

  // Scenario 13: Candidate with an outdated or incomplete resume
  it('Scenario 13: Generates targeted action plan to update resume when document parsing fails', () => {
    const profile = createMockProfile();
    const match = createMockMatchResult();
    const ats = createMockAtsResult({
      overallReadiness: 30,
      findings: [
        {
          id: 'outdated-heading',
          category: 'STRUCTURE',
          severity: 'HIGH',
          title: 'Unconventional Section Headings',
          description: 'Creative titles prevent standard ATS indexing.',
          impact: 'Sections are dropped.',
          recommendation: 'Use Work Experience.',
          evidence: null,
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
      atsAnalysis: ats,
    });

    expect(result.applicationReadiness).toBe('READY_AFTER_IMPROVEMENTS');
    expect(result.actionPlan.some((a) => a.actionTitle.includes('resume parsing hazard'))).toBe(true);
  });

  // Scenario 14: Candidate with a strong profile but incomplete supporting evidence
  it('Scenario 14: Distinguishes bare skills from documented achievements (EVIDENCE_GAP)', () => {
    const profile = createMockProfile({
      skills: [
        {
          id: 'sk-graphql',
          name: 'GraphQL',
          category: 'APIs',
          source: 'user',
          confidence: 1,
          evidenceCategory: 'USER_CONFIRMED',
        },
      ],
      experience: [
        {
          id: 'exp-basic',
          company: 'Acme',
          title: 'Developer',
          location: null,
          startDate: null,
          endDate: null,
          isCurrent: false,
          description: 'General developer',
          technologies: [],
          achievements: [],
          confidence: 1,
          source: 'user',
        },
      ],
    });

    const match = createMockMatchResult({
      matches: [
        {
          requirement: {
            id: 'req-gql',
            name: 'GraphQL',
            normalizedSkill: 'GraphQL',
            category: 'TECHNICAL',
            importance: 'MUST_HAVE',
            isHardConstraint: true,
            evidenceSentence: 'Production experience designing GraphQL schemas.',
          },
          status: 'PARTIAL_MATCH',
          confidence: 0.6,
          rationale: 'Skill listed in profile, but no achievements or projects cite GraphQL.',
        },
      ],
    });

    const result = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: match,
    });

    const gqlGap = result.categorizedGaps.find((g) => g.requirement === 'GraphQL');
    expect(gqlGap?.category).toBe('EVIDENCE_GAP');
    expect(gqlGap?.actionGuidance).toContain('achievement or responsibility bullet');
  });

  // Scenario 15: Candidate with several suitable jobs requiring prioritization
  it('Scenario 15: Computes consistent opportunity prioritization tiers based on fit, constraints, and readiness', () => {
    const profile = createMockProfile();

    // High fit job
    const highFit = evaluateDecisionIntelligence({
      profile,
      job: mockJob,
      requirementMatch: createMockMatchResult({ overallScore: 90, mustHaveCoverage: 95 }),
      atsAnalysis: createMockAtsResult({ overallReadiness: 90 }),
    });

    // Moderate fit job
    const modFit = evaluateDecisionIntelligence({
      profile,
      job: { ...mockJob, postedAt: new Date(Date.now() - 60 * 24 * 3600 * 1000) }, // 60 days old
      requirementMatch: createMockMatchResult({ overallScore: 60, mustHaveCoverage: 65 }),
      atsAnalysis: createMockAtsResult({ overallReadiness: 60 }),
    });

    // Conflicting job
    const conflictFit = evaluateDecisionIntelligence({
      profile: { ...profile, workMode: 'remote' },
      job: { ...mockJob, workMode: 'onsite' },
      requirementMatch: createMockMatchResult({ overallScore: 85, mustHaveCoverage: 90 }),
    });

    expect(highFit.priorityTier).toBe('HIGH_PRIORITY');
    expect(modFit.priorityTier).toBe('MEDIUM_PRIORITY');
    expect(conflictFit.priorityTier).toBe('LOW_PRIORITY');
    expect(highFit.summaryMetrics.priorityScore).toBeGreaterThan(modFit.summaryMetrics.priorityScore);
  });
});

