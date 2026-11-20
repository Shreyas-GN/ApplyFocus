import { describe, expect, it } from "vitest";
import { analyzeResumeAtsIntelligence } from "./ats-engine";
import type {
  JobRequirement,
  ProfileDto,
  RequirementMatchResult,
} from "@/lib/types";

function makeBaseProfile(overrides?: Partial<ProfileDto>): ProfileDto {
  return {
    fullName: "Alex Rivera",
    email: "alex.rivera@example.com",
    authEmail: "alex.rivera@example.com",
    phone: "+1 (555) 019-2831",
    location: "San Francisco, CA",
    linkedinUrl: "https://linkedin.com/in/alexrivera",
    githubUrl: "https://github.com/alexrivera",
    portfolioUrl: "https://alexrivera.dev",
    headline: "Senior Full Stack Engineer",
    summary: "Senior software engineer with 5 years building scalable web architectures and cloud services.",
    careerStage: "Senior",
    yearsOfExperience: 5,
    employmentStatus: "employed",
    preferredTitles: ["Senior Full Stack Engineer"],
    preferredLocations: ["San Francisco, CA"],
    workMode: "hybrid",
    employmentTypes: ["full-time"],
    expectedSalaryMin: 160000,
    expectedSalaryMax: 200000,
    preferredIndustries: ["Technology"],
    excludedCompanies: [],
    completionPercent: 90,
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Phase 4 ATS Intelligence Engine: 12 Realistic Scenarios", () => {
  // Scenario 1: Clean single-column resume with clear sections
  it("Scenario 1: Evaluates clean single-column resume with high readiness across all dimensions", () => {
    const cleanResumeText = `
Alex Rivera
alex.rivera@example.com | (555) 019-2831 | San Francisco, CA | github.com/alexrivera

Professional Summary
Senior full stack software engineer with 5+ years of experience architecting resilient distributed web applications.

Work Experience
Stripe — Senior Software Engineer
May 2021 – Present | San Francisco, CA
• Architected event-driven billing pipeline in TypeScript and Node.js, reducing p99 API latency by 42%.
• Engineered PostgreSQL query tuning and index strategies supporting 2.5M daily financial transactions.
• Mentored 5 junior and mid-level engineers in distributed system design and testing methodologies.

Acme Corp — Software Engineer
June 2019 – April 2021 | San Francisco, CA
• Developed full-stack features using React, Next.js, and TypeScript for customer billing portal.
• Automated CI/CD pipelines with GitHub Actions and Docker, reducing release deployment cycle from 45 to 8 minutes.

Technical Skills
Languages & Frameworks: TypeScript, JavaScript, Node.js, React, Next.js, Python
Databases & Cloud: PostgreSQL, Redis, AWS (ECS, S3, RDS), Docker

Education
University of California, Berkeley — B.S. in Computer Science
Graduated May 2019
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-ts",
        name: "TypeScript",
        normalizedSkill: "TypeScript",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 3,
        domain: "Frontend/Backend",
        evidenceSentence: "Must have TypeScript.",
      },
      {
        id: "req-pg",
        name: "PostgreSQL",
        normalizedSkill: "PostgreSQL",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 3,
        domain: "Databases",
        evidenceSentence: "Required PostgreSQL.",
      },
    ];

    const result = analyzeResumeAtsIntelligence({
      rawText: cleanResumeText,
      mimeType: "application/pdf",
      fileSizeBytes: 28000,
      jobRequirements: requirements,
    });

    expect(result.overallReadiness).toBeGreaterThanOrEqual(85);
    expect(result.readinessLabel).toBe("Optimal ATS Readiness");
    expect(result.dimensions.parsingReadiness).toBeGreaterThanOrEqual(90);
    expect(result.dimensions.structureQuality).toBeGreaterThanOrEqual(85);
    expect(result.dimensions.formattingCompatibility).toBeGreaterThanOrEqual(90);
    expect(result.keywordStuffingDetected).toBe(false);
  });

  // Scenario 2: Resume with missing contact information
  it("Scenario 2: Detects missing contact information and penalizes parsing readiness", () => {
    const textWithoutContact = `
Jane Doe
Professional Summary
Full stack developer with 3 years building web apps.

Work Experience
Startup Inc — Software Engineer
2021 - Present
• Built web applications with React and Node.js.

Education
BS in Computer Science
`;

    const result = analyzeResumeAtsIntelligence({
      rawText: textWithoutContact,
      mimeType: "application/pdf",
      fileSizeBytes: 20000,
    });

    expect(result.dimensions.parsingReadiness).toBeLessThan(80);
    const emailFinding = result.findings.find((f) => f.id === "parsing-missing-email");
    expect(emailFinding).toBeDefined();
    expect(emailFinding?.severity).toBe("CRITICAL");
    expect(result.recommendations.some((r) => r.title.includes("Email"))).toBe(true);
  });

  // Scenario 3: Resume with unclear section headings
  it("Scenario 3: Flags unconventional creative section headings with actionable standard recommendations", () => {
    const textWithCreativeHeadings = `
Alex Rivera
alex@example.com | (555) 019-2831
My Journey
Software engineer who loves solving hard problems.

Stuff I Built
• Built streaming service in Go.

Where I Worked
Google — Software Engineer
2020 - 2023
`;

    const result = analyzeResumeAtsIntelligence({
      rawText: textWithCreativeHeadings,
      mimeType: "application/pdf",
      fileSizeBytes: 22000,
    });

    const headingFinding = result.findings.find((f) => f.id.includes("ambiguous-heading"));
    expect(headingFinding).toBeDefined();
    expect(headingFinding?.severity).toBe("MEDIUM");
    expect(headingFinding?.recommendation).toContain("standard");
  });

  // Scenario 4: Resume with inconsistent date formats
  it("Scenario 4: Identifies inconsistent date formatting across job entries", () => {
    const result = analyzeResumeAtsIntelligence({
      rawText: "Employment history text...",
      mimeType: "application/pdf",
      fileSizeBytes: 25000,
      parsedData: {
        personal: { fullName: "Alex Rivera", email: "alex@example.com" },
        experience: [
          {
            company: "Meta",
            title: "Senior Engineer",
            startDate: "05/2021",
            endDate: "Present",
            isCurrent: true,
            confidence: 0.95,
            source: "ai",
          },
          {
            company: "Uber",
            title: "Software Engineer",
            startDate: "March 2018",
            endDate: "April 2021",
            isCurrent: false,
            confidence: 0.95,
            source: "ai",
          },
        ],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
        overallConfidence: 0.95,
      },
    });

    const dateFinding = result.findings.find((f) => f.id === "structure-inconsistent-date-formats");
    expect(dateFinding).toBeDefined();
    expect(dateFinding?.severity).toBe("MEDIUM");
    expect(result.dimensions.structureQuality).toBeLessThan(95);
  });

  // Scenario 5: Resume containing multiple relevant technical skills
  it("Scenario 5: Recognizes relevant technical skills and contextual alignment with target job", () => {
    const text = `
John Developer
john@example.com | (555) 012-3456
Work Experience
Tech Lead at Cloud Corp (2020 - Present)
• Built distributed microservices in Go and TypeScript.
• Managed Kubernetes clusters on AWS handling 50k requests per minute.
• Tuned PostgreSQL database schemas and automated CI/CD with Docker.
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-go",
        name: "Go (Golang)",
        normalizedSkill: "Go",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 3,
        domain: "Backend",
        evidenceSentence: "Required Go experience.",
      },
      {
        id: "req-k8s",
        name: "Kubernetes",
        normalizedSkill: "Kubernetes",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 2,
        domain: "DevOps",
        evidenceSentence: "Must manage Kubernetes.",
      },
    ];

    const result = analyzeResumeAtsIntelligence({
      rawText: text,
      mimeType: "application/pdf",
      fileSizeBytes: 24000,
      jobRequirements: requirements,
    });

    expect(result.dimensions.terminologyAlignment).toBeGreaterThanOrEqual(90);
    expect(result.metrics.directKeywordsMatched).toBe(2);
  });

  // Scenario 6: Resume with relevant skills but weak project descriptions
  it("Scenario 6: Classifies skills in bare lists as DEMONSTRATED_BUT_POORLY_COMMUNICATED", () => {
    const textWithBareSkills = `
Developer Name
dev@example.com | (555) 123-4567
Work Experience
Company A — Engineer (2021-2023)
• Worked on various internal web applications.
• Attended daily standups.

Technical Skills:
TypeScript, React, GraphQL, Docker, Redis
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-graphql",
        name: "GraphQL",
        normalizedSkill: "GraphQL",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: null,
        domain: "API",
        evidenceSentence: "Must know GraphQL.",
      },
    ];

    const parsedData = {
      personal: { fullName: "Developer Name", email: "dev@example.com" },
      experience: [
        {
          company: "Company A",
          title: "Engineer",
          isCurrent: true,
          responsibilities: ["Worked on various internal web applications."],
          confidence: 0.9,
          source: "ai" as const,
        },
      ],
      education: [],
      skills: [
        {
          name: "GraphQL",
          confidence: 0.9,
          source: "ai" as const,
          evidenceCategory: "AI_EXTRACTED" as const,
        },
      ],
      projects: [],
      certifications: [],
      overallConfidence: 0.9,
    };

    const result = analyzeResumeAtsIntelligence({
      rawText: textWithBareSkills,
      mimeType: "application/pdf",
      fileSizeBytes: 20000,
      parsedData,
      jobRequirements: requirements,
    });

    const gqlItem = result.alignmentItems.find((i) => i.normalizedSkill === "GraphQL");
    expect(gqlItem?.status).toBe("DEMONSTRATED_BUT_POORLY_COMMUNICATED");
    expect(gqlItem?.contextQuality).toBe("WEAK");
    expect(result.recommendations.some((r) => r.title.includes("In Context"))).toBe(true);
  });

  // Scenario 7: Resume with relevant experience but missing job-specific terminology
  it("Scenario 7: Flags EVIDENCE_EXISTS_TERMINOLOGY_MISSING when candidate has proof but resume text omits keyword", () => {
    const resumeTextWithoutTerm = `
Alex Rivera
alex@example.com | (555) 019-2831
Experience
Acme Corp — Backend Engineer (2020 - Present)
• Developed scalable backend web services and relational database APIs.
• Reduced service latency by 35%.
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-fastapi",
        name: "FastAPI",
        normalizedSkill: "FastAPI",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 2,
        domain: "Backend",
        evidenceSentence: "Required: FastAPI framework experience.",
      },
    ];

    // Candidate profile (Phase 2) proves they built FastAPI services at Acme Corp!
    const profile = makeBaseProfile({
      experience: [
        {
          id: "exp-acme",
          company: "Acme Corp",
          title: "Backend Engineer",
          location: "Remote",
          startDate: "2020-01-01",
          endDate: null,
          isCurrent: true,
          description: "Built high-performance async microservices with FastAPI and Python.",
          responsibilities: ["Engineered FastAPI endpoints"],
          technologies: ["FastAPI", "Python"],
          evidenceSentences: ["Engineered async REST APIs using FastAPI."],
          source: "user",
          confidence: 0.98,
        },
      ],
    });

    // Phase 3 requirement match result confirmed DIRECT_MATCH for FastAPI
    const requirementMatchResult: RequirementMatchResult = {
      overallScore: 85,
      mustHaveCoverage: 100,
      preferredCoverage: 100,
      experienceAlignment: 90,
      technicalAlignment: 100,
      evidenceStrength: 100,
      transferableContribution: 0,
      hardConstraintCoverage: 100,
      matches: [
        {
          requirement: requirements[0]!,
          status: "DIRECT_MATCH",
          candidateSkill: "FastAPI",
          sourceExperience: "Acme Corp",
          sourceProject: null,
          evidenceSentence: "Engineered async REST APIs using FastAPI.",
          evidenceCategory: "USER_CONFIRMED",
          transferableReason: null,
          rationale: "Direct match at Acme Corp.",
          confidence: 0.95,
        },
      ],
      strongestMatches: [],
      partialMatches: [],
      missingRequirements: [],
      unverifiedRequirements: [],
      gaps: [],
      criticalGapsCount: 0,
      scoringBreakdown: {
        positiveFactors: [],
        negativeFactors: [],
        scoreCapApplied: false,
        scoreCapReason: null,
        evidenceQualityScore: 100,
      },
    };

    const result = analyzeResumeAtsIntelligence({
      rawText: resumeTextWithoutTerm,
      mimeType: "application/pdf",
      fileSizeBytes: 20000,
      profile,
      jobRequirements: requirements,
      requirementMatchResult,
    });

    const fastApiItem = result.alignmentItems.find((i) => i.normalizedSkill === "FastAPI");
    expect(fastApiItem?.status).toBe("EVIDENCE_EXISTS_TERMINOLOGY_MISSING");
    expect(fastApiItem?.candidateEvidenceSummary).toContain("Acme Corp");
    // Actionable recommendation tells them to explicitly mention FastAPI because they have the evidence
    expect(result.recommendations.some((r) => r.title.includes("Explicitly Mention"))).toBe(true);
  });

  // Scenario 8: Resume with keyword stuffing
  it("Scenario 8: Identifies and penalizes unnatural keyword stuffing without rewarding repetition", () => {
    const stuffedResume = `
Jane Doe | jane@example.com
Kubernetes Kubernetes Kubernetes Kubernetes Kubernetes Kubernetes Kubernetes Kubernetes Kubernetes Kubernetes
Engineer with Kubernetes Docker Kubernetes AWS Kubernetes
Cloud infrastructure with Kubernetes Kubernetes Kubernetes.
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-k8s-stuff",
        name: "Kubernetes",
        normalizedSkill: "Kubernetes",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: null,
        domain: "DevOps",
        evidenceSentence: "Must know Kubernetes.",
      },
    ];

    const result = analyzeResumeAtsIntelligence({
      rawText: stuffedResume,
      mimeType: "application/pdf",
      fileSizeBytes: 18000,
      jobRequirements: requirements,
    });

    expect(result.keywordStuffingDetected).toBe(true);
    expect(result.keywordStuffingPenalty).toBeGreaterThanOrEqual(20);
    // Score is penalized rather than artificially boosted
    expect(result.overallReadiness).toBeLessThan(70);
    expect(result.findings.some((f) => f.id === "terminology-keyword-stuffing-detected")).toBe(true);
  });

  // Scenario 9: Resume with unsupported or unextractable document content
  it("Scenario 9: Reports unextractable scanned PDF as critical failure without inventing results", () => {
    const result = analyzeResumeAtsIntelligence({
      rawText: "",
      mimeType: "application/pdf",
      fileSizeBytes: 95000,
      processingError: "Could not extract text from this PDF. It may be scanned or image-only.",
    });

    expect(result.dimensions.parsingReadiness).toBe(0);
    expect(result.overallReadiness).toBeLessThanOrEqual(30);
    expect(result.findings.some((f) => f.severity === "CRITICAL")).toBe(true);
  });

  // Scenario 10: Candidate with strong Phase 3 fit but poor resume communication
  it("Scenario 10: Distinguishes candidate qualifications from resume communication efficacy", () => {
    // Vague resume that omits technical details
    const vagueResume = `
Alex Rivera | alex@example.com | (555) 019-2831
Work Experience
Tech Lead at Acme Corp (2020 - Present)
• Built backend applications and led software team.
• Improved delivery speed.
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-k8s-p4",
        name: "Kubernetes",
        normalizedSkill: "Kubernetes",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 3,
        domain: "DevOps",
        evidenceSentence: "Must have Kubernetes.",
      },
      {
        id: "req-python-p4",
        name: "Python",
        normalizedSkill: "Python",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 3,
        domain: "Backend",
        evidenceSentence: "Must have Python.",
      },
    ];

    // Phase 3 confirmed candidate has 100% must-have fit
    const matchResult: RequirementMatchResult = {
      overallScore: 88,
      mustHaveCoverage: 100,
      preferredCoverage: 80,
      experienceAlignment: 90,
      technicalAlignment: 100,
      evidenceStrength: 95,
      transferableContribution: 0,
      hardConstraintCoverage: 100,
      matches: requirements.map((r) => ({
        requirement: r,
        status: "DIRECT_MATCH",
        candidateSkill: r.normalizedSkill,
        sourceExperience: "Acme Corp",
        sourceProject: null,
        evidenceSentence: `Engineered production ${r.normalizedSkill} services at Acme Corp.`,
        evidenceCategory: "USER_CONFIRMED",
        transferableReason: null,
        rationale: "Direct match.",
        confidence: 0.95,
      })),
      strongestMatches: [],
      partialMatches: [],
      missingRequirements: [],
      unverifiedRequirements: [],
      gaps: [],
      criticalGapsCount: 0,
      scoringBreakdown: {
        positiveFactors: [],
        negativeFactors: [],
        scoreCapApplied: false,
        scoreCapReason: null,
        evidenceQualityScore: 95,
      },
    };

    const result = analyzeResumeAtsIntelligence({
      rawText: vagueResume,
      mimeType: "application/pdf",
      fileSizeBytes: 22000,
      jobRequirements: requirements,
      requirementMatchResult: matchResult,
    });

    // While Phase 3 was 88%, the resume fails to communicate the terminology
    expect(result.dimensions.evidenceCommunication).toBeLessThanOrEqual(50);
    expect(result.dimensions.terminologyAlignment).toBeLessThanOrEqual(50);
    // Explicitly flags both as EVIDENCE_EXISTS_TERMINOLOGY_MISSING
    const missingTermCount = result.alignmentItems.filter(
      (i) => i.status === "EVIDENCE_EXISTS_TERMINOLOGY_MISSING"
    ).length;
    expect(missingTermCount).toBe(2);
  });

  // Scenario 11: Candidate with weak Phase 3 fit but many superficially matching keywords
  it("Scenario 11: Prevents superficial keyword presence from creating false candidate qualification", () => {
    // Resume includes keywords as a comma list
    const superficialResume = `
Candidate Name | cand@example.com
Summary: Learning full stack technologies.
Skills: Kubernetes, PyTorch, Rust, Solidity, Distributed Systems, Go, Scala
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-k8s-s11",
        name: "Kubernetes",
        normalizedSkill: "Kubernetes",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 5,
        domain: "DevOps",
        evidenceSentence: "5+ years managing Kubernetes.",
      },
    ];

    // Phase 3 confirms candidate has NO verified experience (status MISSING or UNVERIFIED)
    const matchResult: RequirementMatchResult = {
      overallScore: 25,
      mustHaveCoverage: 0,
      preferredCoverage: 0,
      experienceAlignment: 30,
      technicalAlignment: 0,
      evidenceStrength: 0,
      transferableContribution: 0,
      hardConstraintCoverage: 0,
      matches: [
        {
          requirement: requirements[0]!,
          status: "MISSING",
          candidateSkill: null,
          sourceExperience: null,
          sourceProject: null,
          evidenceSentence: null,
          evidenceCategory: null,
          transferableReason: null,
          rationale: "Missing evidence in candidate profile.",
          confidence: 0,
        },
      ],
      strongestMatches: [],
      partialMatches: [],
      missingRequirements: [
        {
          requirement: requirements[0]!,
          status: "MISSING",
          candidateSkill: null,
          sourceExperience: null,
          sourceProject: null,
          evidenceSentence: null,
          evidenceCategory: null,
          transferableReason: null,
          rationale: "Missing evidence in candidate profile.",
          confidence: 0,
        },
      ],
      unverifiedRequirements: [],
      gaps: [],
      criticalGapsCount: 1,
      scoringBreakdown: {
        positiveFactors: [],
        negativeFactors: ["Missing mandatory requirement: Kubernetes"],
        scoreCapApplied: true,
        scoreCapReason: "Capped due to missing mandatory requirements.",
        evidenceQualityScore: 0,
      },
    };

    const result = analyzeResumeAtsIntelligence({
      rawText: superficialResume,
      mimeType: "application/pdf",
      fileSizeBytes: 19000,
      jobRequirements: requirements,
      requirementMatchResult: matchResult,
    });

    const k8sItem = result.alignmentItems.find((i) => i.normalizedSkill === "Kubernetes");
    // Does not grant full DEMONSTRATED_AND_COMMUNICATED status because candidate has no evidence
    expect(k8sItem?.status).toBe("NO_SUPPORTING_CANDIDATE_EVIDENCE");
    expect(result.overallReadiness).toBeLessThan(75);
  });

  // Scenario 12: Candidate with project evidence that must not be represented as professional experience
  it("Scenario 12: Preserves boundary between personal project demonstration and professional employment", () => {
    const resumeText = `
Alex Rivera | alex@example.com
Projects
Distributed Cache Engine (Personal Project)
• Architected in-memory key-value store in Go and Redis with Raft consensus.
• Tested at 15k ops/sec.
`;

    const requirements: JobRequirement[] = [
      {
        id: "req-redis-s12",
        name: "Redis",
        normalizedSkill: "Redis",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: null,
        domain: "Databases",
        evidenceSentence: "Hands-on experience with Redis.",
      },
    ];

    const parsedData = {
      personal: { fullName: "Alex Rivera", email: "alex@example.com" },
      experience: [],
      education: [],
      skills: [],
      projects: [
        {
          name: "Distributed Cache Engine",
          description: "Architected in-memory key-value store in Go and Redis.",
          measurableOutcomes: ["Tested at 15k ops/sec."],
          technologies: ["Go", "Redis"],
          confidence: 0.95,
          source: "user" as const,
        },
      ],
      certifications: [],
      overallConfidence: 0.95,
    };

    const result = analyzeResumeAtsIntelligence({
      rawText: resumeText,
      mimeType: "application/pdf",
      fileSizeBytes: 20000,
      parsedData,
      jobRequirements: requirements,
    });

    const redisItem = result.alignmentItems.find((i) => i.normalizedSkill === "Redis");
    expect(redisItem?.status).toBe("DEMONSTRATED_AND_COMMUNICATED");
    expect(redisItem?.contextQuality).toBe("HIGH");
  });
});

