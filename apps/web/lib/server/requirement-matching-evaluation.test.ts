import { describe, expect, it } from 'vitest';
import type { JobRequirement, ProfileDto } from '@/lib/types';
import {
  calculateRequirementMatchResult,
  matchRequirementAgainstCandidate,
} from '@/lib/requirement-matching';
import { extractJobRequirementsDeterministic } from './requirement-extraction';
import { buildApplicationStrategy } from './strategy';

function makeBaseProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
  return {
    fullName: 'Test Candidate',
    headline: 'Software Engineer',
    summary: 'General software developer profile.',
    yearsOfExperience: 0,
    phone: null,
    location: 'Bengaluru, India',
    githubUrl: null,
    linkedinUrl: null,
    portfolioUrl: null,
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    preferredTitles: ['Software Engineer'],
    preferredLocations: ['Bengaluru', 'Remote'],
    workMode: 'remote',
    employmentStatus: 'actively_looking',
    employmentTypes: ['full_time'],
    expectedSalaryMin: null,
    expectedSalaryMax: null,
    preferredIndustries: [],
    excludedCompanies: [],
    completionPercent: 80,
    updatedAt: '2026-11-20T00:00:00.000Z',
    ...overrides,
  };
}

describe('Phase 3 Production Evaluation: 10 Realistic Scenarios', () => {
  // Scenario 1: Fresher with academic projects
  it('Scenario 1: Evaluates a fresher with academic projects without confusing academic work with employment', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 0,
      education: [
        {
          id: 'edu-acad-1',
          institution: 'State University of Technology',
          degree: 'Bachelor of Technology',
          fieldOfStudy: 'Computer Science and Engineering',
          startDate: '2020-08-01T00:00:00.000Z',
          endDate: '2024-05-30T00:00:00.000Z',
          graduationYear: 2024,
          grade: '8.8 GPA',
          description: 'Undergraduate thesis on distributed consensus in Python.',
          source: 'user',
          confidence: 0.95,
        },
      ],
      projects: [
        {
          id: 'proj-acad-1',
          name: 'Academic Compiler Implementation',
          description: 'Implemented a subset of C language compiler in Python and C++.',
          technologies: ['Python', 'C++'],
          contributions: ['Built lexical analyzer and AST parser'],
          measurableOutcomes: ['Compiled 100% of benchmark test programs successfully'],
          skillsDemonstrated: ['Python', 'Compilers'],
          url: null,
          githubUrl: 'https://github.com/fresher/compiler',
          liveUrl: null,
          startDate: '2023-09-01T00:00:00.000Z',
          endDate: '2024-04-15T00:00:00.000Z',
          source: 'user',
          confidence: 0.9,
        },
      ],
      skills: [
        {
          id: 'sk-fresher-py',
          name: 'Python',
          category: 'LANGUAGE',
          proficiency: 'intermediate',
          yearsOfExperience: 1,
          evidence: 'Academic projects and thesis',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Implemented a compiler subset in Python.',
          connectedExperience: null,
          connectedProject: 'Academic Compiler Implementation',
          source: 'user',
          confidence: 0.85,
        },
      ],
    });

    const job = {
      title: 'Junior Python Developer',
      description: `
        Seeking a Python developer for backend data processing.
        Requirements:
        - Bachelor's degree in Computer Science or related field.
        - Must have hands-on experience with Python.
        - Minimum 2 years of professional software engineering experience.
      `,
      skills: ['Python'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    // Degree is direct match
    const eduMatch = result.matches.find((m) => m.requirement.category === 'EDUCATION');
    expect(eduMatch?.status).toBe('DIRECT_MATCH');

    // Python is direct match backed by project
    const pyMatch = result.matches.find((m) => m.requirement.normalizedSkill === 'Python');
    expect(pyMatch?.status).toBe('DIRECT_MATCH');
    expect(pyMatch?.sourceProject).toBe('Academic Compiler Implementation');

    // Experience requirement recognizes lack of employment tenure, avoiding false claim
    const expMatch = result.matches.find((m) => m.requirement.category === 'EXPERIENCE');
    expect(expMatch?.status).toBe('PARTIAL_MATCH');
    expect(expMatch?.rationale).toContain('personal project experience');

    // Gap analysis clearly flags qualification gap without recommending resume fabrication
    const expGap = result.gaps.find((g) => g.classification === 'EXPERIENCE_GAP');
    expect(expGap).toBeDefined();
    expect(expGap?.actionableImprovement).toContain('without misrepresenting personal projects as professional employment');
  });

  // Scenario 2: Fresher with strong personal projects
  it('Scenario 2: Rewards demonstrable personal project outcomes while distinguishing from employment', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 0,
      projects: [
        {
          id: 'proj-adv-1',
          name: 'Distributed Event Bus',
          description: 'High-throughput event streaming engine in Go and Docker.',
          technologies: ['Go', 'Docker', 'Redis'],
          contributions: ['Engineered raft consensus and storage layer'],
          measurableOutcomes: ['Sustained 40,000 requests/sec with under 8ms latency'],
          skillsDemonstrated: ['Go', 'Docker', 'Distributed Systems'],
          url: null,
          githubUrl: 'https://github.com/coder/event-bus',
          liveUrl: null,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: null,
          source: 'user',
          confidence: 0.95,
        },
      ],
      skills: [
        {
          id: 'sk-go',
          name: 'Go',
          category: 'LANGUAGE',
          proficiency: 'advanced',
          yearsOfExperience: 1,
          evidence: 'Built Distributed Event Bus',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Engineered high-throughput event streaming engine in Go.',
          connectedExperience: null,
          connectedProject: 'Distributed Event Bus',
          source: 'user',
          confidence: 0.9,
        },
      ],
    });

    const job = {
      title: 'Backend Engineer (Go)',
      description: `
        Looking for a backend engineer.
        Requirements:
        - Must have experience with Go and Docker.
        - Minimum 2 years of professional backend experience.
      `,
      skills: ['Go', 'Docker'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    // Both Go and Docker are matched directly via project demonstration
    const goMatch = result.matches.find((m) => m.requirement.normalizedSkill === 'Go');
    const dockerMatch = result.matches.find((m) => m.requirement.normalizedSkill === 'Docker');

    expect(goMatch?.status).toBe('DIRECT_MATCH');
    expect(dockerMatch?.status).toBe('DIRECT_MATCH');
    expect(dockerMatch?.sourceProject).toBe('Distributed Event Bus');

    // Experience gap correctly surfaces the professional employment requirement
    const expGap = result.gaps.find((g) => g.classification === 'EXPERIENCE_GAP');
    expect(expGap).toBeDefined();
    expect(result.scoringBreakdown?.positiveFactors.some((f) => f.includes('Distributed Event Bus'))).toBe(true);
  });

  // Scenario 3: Candidate with relevant professional experience
  it('Scenario 3: Confirms high alignment for senior professional with verified employment evidence', () => {
    const profile = makeBaseProfile({
      headline: 'Senior Full Stack Engineer',
      yearsOfExperience: 5,
      skills: [
        {
          id: 'sk-exp-ts',
          name: 'TypeScript',
          category: 'LANGUAGE',
          proficiency: 'expert',
          yearsOfExperience: 5,
          evidence: 'Primary language across 4 years at Stripe',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Led architecture of TypeScript services.',
          connectedExperience: 'Stripe',
          connectedProject: null,
          source: 'user',
          confidence: 0.95,
        },
        {
          id: 'sk-exp-pg',
          name: 'PostgreSQL',
          category: 'DATABASE',
          proficiency: 'expert',
          yearsOfExperience: 4,
          evidence: 'Optimized billing database schemas',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Tuned PostgreSQL queries handling 2M daily operations.',
          connectedExperience: 'Stripe',
          connectedProject: null,
          source: 'user',
          confidence: 0.95,
        },
      ],
      experience: [
        {
          id: 'exp-stripe',
          company: 'Stripe',
          title: 'Senior Software Engineer',
          location: 'San Francisco, CA',
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: null,
          isCurrent: true,
          description: 'Led billing and infrastructure platform.',
          responsibilities: ['Architected distributed services and mentored 6 engineers'],
          achievements: ['Reduced p99 billing latency by 45%'],
          technologies: ['TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
          evidenceSentences: ['Tuned PostgreSQL queries handling 2M daily operations.'],
          source: 'user',
          confidence: 0.98,
        },
      ],
    });

    const job = {
      title: 'Senior Software Engineer',
      description: `
        Requirements:
        - Must have 4+ years of professional software engineering experience.
        - Minimum 3 years of hands-on experience with TypeScript and PostgreSQL.
      `,
      skills: ['TypeScript', 'PostgreSQL'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    expect(result.mustHaveCoverage).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.criticalGapsCount).toBe(0);
    expect(result.scoringBreakdown?.scoreCapApplied).toBe(false);
  });

  // Scenario 4: Candidate with transferable skills but no direct experience
  it('Scenario 4: Awards related match credit via transferable skills without direct match inflation', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 4,
      skills: [
        {
          id: 'sk-trans-pg',
          name: 'PostgreSQL',
          category: 'DATABASE',
          proficiency: 'expert',
          yearsOfExperience: 4,
          evidence: 'Relational database schema modeling and tuning',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Managed relational schemas in PostgreSQL.',
          connectedExperience: 'Tech Corp',
          connectedProject: null,
          source: 'user',
          confidence: 0.9,
        },
      ],
      experience: [
        {
          id: 'exp-corp',
          company: 'Tech Corp',
          title: 'Software Engineer',
          location: 'Remote',
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          isCurrent: false,
          description: 'Built relational backend services.',
          responsibilities: ['Developed database schemas'],
          achievements: [],
          technologies: ['PostgreSQL'],
          source: 'user',
          confidence: 0.9,
        },
      ],
    });

    // Job requires Drizzle ORM (candidate has PostgreSQL, which transfers to Drizzle)
    const job = {
      title: 'Backend Engineer',
      description: `
        Backend engineering opportunity.
        Requirements:
        - Required: Experience with Drizzle ORM for data persistence.
      `,
      skills: ['Drizzle'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    const drizzleMatch = result.matches.find((m) => m.requirement.normalizedSkill.includes('Drizzle'));
    expect(drizzleMatch?.status).toBe('RELATED_MATCH');
    expect(drizzleMatch?.candidateSkill).toBe('PostgreSQL');
    expect(drizzleMatch?.confidence).toBeLessThan(0.85); // Not awarded 0.95 direct confidence
    expect(result.transferableContribution).toBeGreaterThan(0);
  });

  // Scenario 5: Candidate with many listed skills but little supporting evidence
  it('Scenario 5: Prevents unsupported listed skills from inflating verified fit', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 1,
      // 10 skills listed as plain tags without evidence sentences or connected experiences
      skills: [
        'TypeScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker',
        'Kubernetes', 'GraphQL', 'MongoDB', 'Redis'
      ].map((name, i) => ({
        id: `sk-unsupported-${i}`,
        name,
        category: 'TECHNICAL',
        proficiency: 'beginner',
        yearsOfExperience: null,
        evidence: null,
        evidenceCategory: 'USER_CONFIRMED' as const,
        evidenceSentence: null,
        connectedExperience: null,
        connectedProject: null,
        source: 'user' as const,
        confidence: 0.6,
      })),
    });

    const job = {
      title: 'Full Stack Engineer',
      description: `
        Requirements:
        - Must have 3+ years experience with React and TypeScript.
        - Experience with AWS and Docker.
      `,
      skills: ['React', 'TypeScript', 'AWS', 'Docker'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    // Evidence strength reflects the absence of verbatim citations
    expect(result.evidenceStrength).toBeLessThan(50);
  });

  // Scenario 6: Candidate with relevant experience but incomplete resume information
  it('Scenario 6: Accurately identifies EVIDENCE_GAP when candidate has employment but lacks bullet proof', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 3,
      // Candidate lists skill as unconfirmed suggestion or missing citation
      skills: [
        {
          id: 'sk-incomp-node',
          name: 'Node.js',
          category: 'BACKEND',
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
          id: 'exp-vague',
          company: 'Acme Software',
          title: 'Software Developer',
          location: 'Pune',
          startDate: '2021-01-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          isCurrent: false,
          description: 'Worked on web applications.', // Vague description lacking tech mentions
          responsibilities: ['Built features for clients'],
          achievements: [],
          technologies: [],
          source: 'user',
          confidence: 0.8,
        },
      ],
    });

    const job = {
      title: 'Node.js Developer',
      description: `
        Required: Production experience with Node.js backend services.
      `,
      skills: ['Node.js'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    const nodeMatch = result.matches.find((m) => m.requirement.normalizedSkill === 'Node.js');
    expect(nodeMatch?.status).toBe('UNVERIFIED');

    const evidenceGap = result.gaps.find((g) => g.gapType === 'EVIDENCE_GAP');
    expect(evidenceGap).toBeDefined();
    expect(evidenceGap?.actionableImprovement).toContain('evidence gap');
  });

  // Scenario 7: Candidate who satisfies technical requirements but misses mandatory experience
  it('Scenario 7: Caps score when candidate satisfies tech skills but misses mandatory seniority experience', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 1, // Only 1 year experience
      skills: [
        {
          id: 'sk-expert-react',
          name: 'React',
          category: 'FRAMEWORK',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Built production UIs in React.',
          source: 'user',
          confidence: 0.95,
        },
        {
          id: 'sk-expert-ts',
          name: 'TypeScript',
          category: 'LANGUAGE',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Wrote TypeScript applications.',
          source: 'user',
          confidence: 0.95,
        },
      ],
      experience: [
        {
          id: 'exp-jr',
          company: 'Startup',
          title: 'Junior Developer',
          location: 'Remote',
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: null,
          isCurrent: true,
          description: 'Junior frontend development.',
          technologies: ['React', 'TypeScript'],
          source: 'user',
          confidence: 0.9,
        },
      ],
    });

    // 7+ years Staff role
    const job = {
      title: 'Staff Frontend Engineer',
      description: `
        Staff role requiring:
        - Minimum 7+ years of professional software engineering experience.
        - Must have React and TypeScript mastery.
      `,
      skills: ['React', 'TypeScript'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    // Mandatory requirement capping must trigger
    expect(result.scoringBreakdown?.scoreCapApplied).toBe(true);
    expect(result.overallScore).toBeLessThanOrEqual(65);
    expect(result.criticalGapsCount).toBeGreaterThan(0);
  });

  // Scenario 8: Candidate who satisfies most requirements but lacks a preferred skill
  it('Scenario 8: Rewards high score without score cap when only a PREFERRED skill is missing', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 4,
      skills: [
        {
          id: 'sk-ts-8',
          name: 'TypeScript',
          category: 'LANGUAGE',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Production TypeScript backend systems.',
          source: 'user',
          confidence: 0.95,
        },
        {
          id: 'sk-pg-8',
          name: 'PostgreSQL',
          category: 'DATABASE',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Relational database query optimization.',
          source: 'user',
          confidence: 0.95,
        },
      ],
      experience: [
        {
          id: 'exp-8',
          company: 'Acme',
          title: 'Software Engineer',
          location: 'Remote',
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: null,
          isCurrent: true,
          description: 'Full stack development with TypeScript and PostgreSQL.',
          technologies: ['TypeScript', 'PostgreSQL'],
          source: 'user',
          confidence: 0.95,
        },
      ],
    });

    const job = {
      title: 'Full Stack Engineer',
      description: `
        Required:
        - Must have 3+ years software engineering experience.
        - Must have TypeScript and PostgreSQL.
        Nice to have:
        - Experience with GraphQL is preferred.
      `,
      skills: ['TypeScript', 'PostgreSQL', 'GraphQL'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    // Must-have coverage is 100%
    expect(result.mustHaveCoverage).toBe(100);
    expect(result.scoringBreakdown?.scoreCapApplied).toBe(false);
    expect(result.overallScore).toBeGreaterThanOrEqual(70);

    // Missing GraphQL is classified as SKILL_GAP, NOT CRITICAL_GAP
    const gqlGap = result.gaps.find((g) => g.requirementName.includes('GraphQL'));
    expect(gqlGap?.classification).toBe('SKILL_GAP');
  });

  // Scenario 9: Candidate with completely unrelated skills
  it('Scenario 9: Does not award match credit for unrelated skills', () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 3,
      skills: [
        {
          id: 'sk-r',
          name: 'R Language',
          category: 'DATA_SCIENCE',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Statistical modeling in R.',
          source: 'user',
          confidence: 0.9,
        },
        {
          id: 'sk-stata',
          name: 'Stata',
          category: 'ECONOMETRICS',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Econometric analysis.',
          source: 'user',
          confidence: 0.9,
        },
      ],
    });

    const job = {
      title: 'Senior Frontend Engineer',
      description: `
        Requirements:
        - Must have React and TypeScript.
        - Experience with modern CSS and Tailwind.
      `,
      skills: ['React', 'TypeScript', 'Tailwind'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    expect(result.overallScore).toBeLessThan(35);
    expect(result.missingRequirements.length).toBeGreaterThanOrEqual(3);
  });

  // Scenario 10: Candidate with an unverified AI-suggested skill
  it('Scenario 10: Prevents unverified AI-suggested skills from receiving direct match credit', () => {
    const profile = makeBaseProfile({
      skills: [
        {
          id: 'sk-ai-k8s',
          name: 'Kubernetes',
          category: 'CLOUD',
          evidenceCategory: 'AI_SUGGESTED',
          evidenceSentence: null,
          connectedExperience: null,
          connectedProject: null,
          source: 'ai',
          confidence: 0.35,
        },
      ],
    });

    const job = {
      title: 'DevOps Engineer',
      description: `
        Must have hands-on experience managing production Kubernetes clusters.
      `,
      skills: ['Kubernetes'],
    };

    const requirements = extractJobRequirementsDeterministic(job);
    const result = calculateRequirementMatchResult(requirements, profile);

    const k8sMatch = result.matches.find((m) => m.requirement.normalizedSkill === 'Kubernetes');
    expect(k8sMatch?.status).toBe('UNVERIFIED');
    expect(result.strongestMatches.some((m) => m.requirement.normalizedSkill === 'Kubernetes')).toBe(false);
  });

  // Pipeline Integration Test: Application Strategy consistency
  it('Pipeline integration: Application strategy recommendation aligns with requirement match outcome', async () => {
    const profile = makeBaseProfile({
      yearsOfExperience: 5,
      skills: [
        {
          id: 'sk-ts-strat',
          name: 'TypeScript',
          category: 'LANGUAGE',
          evidenceCategory: 'USER_CONFIRMED',
          evidenceSentence: 'Led TypeScript microservices architecture.',
          source: 'user',
          confidence: 0.95,
        },
      ],
      experience: [
        {
          id: 'exp-strat',
          company: 'Stripe',
          title: 'Senior Engineer',
          location: 'San Francisco, CA',
          startDate: '2020-01-01T00:00:00.000Z',
          endDate: null,
          isCurrent: true,
          description: 'Led platform engineering.',
          responsibilities: ['Mentored engineers'],
          achievements: [],
          technologies: ['TypeScript'],
          source: 'user',
          confidence: 0.95,
        },
      ],
    });

    const job = {
      id: 'job-strat-test',
      company: 'Tech Corp',
      title: 'Senior TypeScript Engineer',
      location: 'Remote',
      workMode: 'remote',
      employmentType: 'full_time',
      description: `
        Senior TypeScript Engineer.
        Required:
        - 4+ years software engineering experience.
        - Deep proficiency in TypeScript.
      `,
      skills: ['TypeScript'],
      source: 'greenhouse',
    };

    const strategy = await buildApplicationStrategy(profile, job);

    expect(strategy.recommendation).toBe('strong_opportunity');
    expect(strategy.positioning).toContain('TypeScript');
    expect(strategy.skillsToEmphasize).toContain('TypeScript');
  });
});
