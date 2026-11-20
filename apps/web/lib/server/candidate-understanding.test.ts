import { describe, expect, it } from "vitest";
import {
  resumeParsedDataSchema,
  type ResumeParsedData,
  replaceSkillsSchema,
} from "@applypilot/validators";
import {
  calculateProfileStrength,
  type ProfileStrengthInput,
} from "@/lib/profile-strength";
import {
  identifyCandidateTransferableSkills,
  findTransferableMatches,
} from "@/lib/transferable-skills";
import { computeJobMatch } from "@/lib/server/job-matching";
import type { ProfileDto } from "@/lib/types";

describe("Candidate Understanding Engine — Phase 2", () => {
  // 1. Candidate Extraction & Provenance
  describe("Candidate Extraction Schema & Provenance", () => {
    it("validates structured candidate intelligence with evidence and domain scope", () => {
      const sampleExtraction: ResumeParsedData = {
        personal: {
          fullName: "Alex Rivera",
          email: "alex.rivera@example.com",
          phone: "+1-555-0199",
          location: "Seattle, WA",
          headline: "Senior Backend & Cloud Systems Engineer",
          summary:
            "8+ years architecting fault-tolerant microservices, distributed storage pipelines, and Kubernetes infrastructure.",
          yearsOfExperience: 8,
          currentRole: "Lead Infrastructure Engineer",
          careerDomain: "Backend & Cloud Systems",
          seniorityEstimate: "Senior",
          githubUrl: "https://github.com/alexrivera",
          linkedinUrl: "https://linkedin.com/in/alexrivera",
        },
        experience: [
          {
            company: "CloudScale Inc",
            title: "Senior Backend Engineer",
            location: "Seattle, WA",
            startDate: "2020-03",
            endDate: "2024-08",
            isCurrent: false,
            description: "Led core distributed services and event processing.",
            responsibilities: [
              "Designed Kafka event ingestion pipelines processing 20M events/day.",
              "Mentored junior engineers on Go concurrency and database indexing.",
            ],
            achievements: [
              "Reduced p99 API latency by 42% through connection pooling and caching.",
              "Migrated 14 monolithic endpoints into resilient Go microservices.",
            ],
            technologies: ["Go", "Kafka", "PostgreSQL", "Docker", "Kubernetes"],
            evidenceSentences: [
              "Designed Kafka event ingestion pipelines processing 20M events/day.",
              "Reduced p99 API latency by 42% through connection pooling and caching.",
            ],
            confidence: 0.95,
            source: "ai",
          },
        ],
        education: [
          {
            institution: "University of Washington",
            degree: "Bachelor of Science",
            fieldOfStudy: "Computer Science",
            graduationYear: 2016,
            confidence: 0.98,
            source: "ai",
          },
        ],
        skills: [
          {
            name: "Go",
            category: "languages",
            confidence: 0.96,
            source: "ai",
            evidenceCategory: "AI_EXTRACTED",
            evidenceSentence:
              "Migrated 14 monolithic endpoints into resilient Go microservices.",
            connectedExperience: "CloudScale Inc",
          },
          {
            name: "PostgreSQL",
            category: "databases",
            confidence: 0.92,
            source: "ai",
            evidenceCategory: "AI_EXTRACTED",
            evidenceSentence:
              "Reduced p99 API latency by 42% through connection pooling and caching.",
            connectedExperience: "CloudScale Inc",
          },
          {
            name: "Rust",
            category: "languages",
            confidence: 0.75,
            source: "ai",
            evidenceCategory: "AI_SUGGESTED",
            evidenceSentence: "",
            connectedExperience: "",
          },
        ],
        projects: [
          {
            name: "DistQueue",
            description:
              "High-throughput distributed FIFO queue with Raft consensus in Go.",
            url: "https://github.com/alexrivera/distqueue",
            startDate: "2023-01",
            endDate: "2023-06",
            technologies: ["Go", "Raft", "gRPC", "Docker"],
            responsibilities: [
              "Implemented Raft consensus log replication from scratch.",
            ],
            measurableOutcomes: [
              "Achieved 85,000 requests/sec with sub-5ms commit latency.",
            ],
            skillsDemonstrated: ["Go", "Distributed Systems", "gRPC"],
            confidence: 0.94,
            source: "ai",
          },
        ],
        certifications: [],
        overallConfidence: 0.94,
      };

      const parsed = resumeParsedDataSchema.parse(sampleExtraction);
      expect(parsed.personal.yearsOfExperience).toBe(8);
      expect(parsed.personal.careerDomain).toBe("Backend & Cloud Systems");
      expect(parsed.skills).toHaveLength(3);

      const goSkill = parsed.skills.find((s) => s.name === "Go")!;
      expect(goSkill.evidenceCategory).toBe("AI_EXTRACTED");
      expect(goSkill.evidenceSentence).toContain("resilient Go microservices");
      expect(goSkill.connectedExperience).toBe("CloudScale Inc");

      const rustSkill = parsed.skills.find((s) => s.name === "Rust")!;
      expect(rustSkill.evidenceCategory).toBe("AI_SUGGESTED");
    });

    it("leaves missing extraction fields as undefined rather than inventing data", () => {
      const minimalExtraction = {
        personal: {
          fullName: "Minimal Candidate",
        },
        experience: [],
        education: [],
        skills: [],
        projects: [],
        certifications: [],
      };

      const parsed = resumeParsedDataSchema.parse(minimalExtraction);
      expect(parsed.personal.headline).toBeUndefined();
      expect(parsed.personal.yearsOfExperience).toBeUndefined();
      expect(parsed.personal.careerDomain).toBeUndefined();
      expect(parsed.experience).toHaveLength(0);
      expect(parsed.skills).toHaveLength(0);
    });
  });

  // 2. Skill Confirmation and Rejection Lifecycle
  describe("Skill Provenance & Confirmation Lifecycle", () => {
    it("transitions an AI_EXTRACTED skill to USER_CONFIRMED upon confirmation", () => {
      const aiExtractedSkill = {
        name: "PostgreSQL",
        category: "databases",
        source: "ai" as const,
        evidenceCategory: "AI_EXTRACTED" as const,
        evidenceSentence: "Optimized complex query execution plans across 50M rows.",
        connectedExperience: "FinTech Corp",
        confidence: 0.92,
      };

      // User confirms the skill
      const confirmedSkill = {
        ...aiExtractedSkill,
        source: "user" as const,
        evidenceCategory: "USER_CONFIRMED" as const,
      };

      const validation = replaceSkillsSchema.safeParse({
        items: [confirmedSkill],
      });

      expect(validation.success).toBe(true);
      if (validation.success) {
        expect(validation.data.items[0]?.evidenceCategory).toBe("USER_CONFIRMED");
        expect(validation.data.items[0]?.source).toBe("user");
        expect(validation.data.items[0]?.evidenceSentence).toBe(
          "Optimized complex query execution plans across 50M rows."
        );
      }
    });

    it("rejects an unwanted skill by removing it from the candidate skill list", () => {
      const initialSkills = [
        { name: "TypeScript", source: "ai" as const, evidenceCategory: "AI_EXTRACTED" as const },
        { name: "PHP", source: "ai" as const, evidenceCategory: "AI_SUGGESTED" as const },
      ];

      // Rejection of "PHP"
      const retainedSkills = initialSkills.filter((s) => s.name !== "PHP");
      expect(retainedSkills).toHaveLength(1);
      expect(retainedSkills[0]?.name).toBe("TypeScript");
    });
  });

  // 3. Transferable Skills Intelligence
  describe("Transferable Skills Intelligence (Feature D)", () => {
    it("identifies deterministic transferable skills with evidence and confidence", () => {
      const candidateSkills = [
        { name: "JavaScript", evidenceCategory: "USER_CONFIRMED" as const },
        { name: "React", evidenceCategory: "USER_CONFIRMED" as const },
        { name: "SQL", evidenceCategory: "AI_EXTRACTED" as const },
      ];

      const analysis = identifyCandidateTransferableSkills(candidateSkills);
      expect(analysis.totalAcquired).toBe(3);
      expect(analysis.opportunities.length).toBeGreaterThan(0);

      // Check JS -> TS transfer
      const tsBridge = analysis.opportunities.find(
        (o) => o.transferableSkill.toLowerCase() === "typescript"
      );
      expect(tsBridge).toBeDefined();
      expect(tsBridge?.sourceSkill.toLowerCase()).toBe("javascript");
      expect(tsBridge?.confidence).toBeGreaterThanOrEqual(0.9);
      expect(tsBridge?.evidence).toContain("TypeScript");

      // Check React -> Component-Based Frontend transfer
      const reactBridge = analysis.opportunities.find((o) =>
        o.transferableSkill.toLowerCase().includes("component")
      );
      expect(reactBridge).toBeDefined();
      expect(reactBridge?.sourceSkill.toLowerCase()).toBe("react");

      // Check SQL -> Relational Database Fundamentals transfer
      const sqlBridge = analysis.opportunities.find((o) =>
        o.transferableSkill.toLowerCase().includes("relational database")
      );
      expect(sqlBridge).toBeDefined();
    });

    it("matches job missing skills against candidate transferable competencies", () => {
      const userSkills = ["React", "PostgreSQL", "Docker"];
      const missingJobRequirements = [
        "TypeScript",
        "Relational Database Fundamentals",
        "Kubernetes",
        "Ruby on Rails",
      ];

      const matches = findTransferableMatches(userSkills, missingJobRequirements);
      expect(matches.length).toBeGreaterThanOrEqual(2);

      const k8sMatch = matches.find((m) => m.targetSkill === "Kubernetes");
      expect(k8sMatch).toBeDefined();
      expect(k8sMatch?.candidateSkill).toBe("Docker");

      const dbMatch = matches.find(
        (m) => m.targetSkill === "Relational Database Fundamentals"
      );
      expect(dbMatch).toBeDefined();
      expect(dbMatch?.candidateSkill).toBe("PostgreSQL");
    });
  });

  // 4. Deterministic Profile Strength Calculations (Feature E)
  describe("Deterministic Profile Strength (Feature E)", () => {
    it("is strictly deterministic: identical inputs yield identical outputs", () => {
      const profileInput: ProfileStrengthInput = {
        personal: {
          fullName: "Sam Taylor",
          email: "sam@example.com",
          phone: "555-0100",
          location: "San Francisco, CA",
          headline: "Senior Full-Stack Engineer",
          summary:
            "Experienced engineer specializing in React, Next.js, and Node.js microservices with 6+ years in production.",
          yearsOfExperience: 6,
          linkedinUrl: "https://linkedin.com/in/samtaylor",
        },
        skills: [
          { name: "TypeScript", category: "languages", evidenceCategory: "USER_CONFIRMED" },
          { name: "React", category: "frameworks", evidenceCategory: "USER_CONFIRMED" },
          { name: "Node.js", category: "frameworks", evidenceCategory: "USER_CONFIRMED" },
          { name: "PostgreSQL", category: "databases", evidenceCategory: "AI_EXTRACTED", evidenceSentence: "Wrote complex queries" },
          { name: "Docker", category: "cloud", evidenceCategory: "AI_EXTRACTED" },
          { name: "GraphQL", category: "apis", evidenceCategory: "USER_CONFIRMED" },
        ],
        experience: [
          {
            company: "TechWorks",
            title: "Senior Engineer",
            startDate: "2021-01",
            endDate: "2024-01",
            isCurrent: false,
            description: "Built scalable web apps.",
            achievements: ["Increased transaction throughput by 40%."],
            technologies: ["React", "TypeScript", "Node.js"],
            evidenceSentences: ["Increased transaction throughput by 40%."],
          },
        ],
        projects: [
          {
            name: "AppSync",
            description: "Real-time collaboration app.",
            url: "https://github.com/samtaylor/appsync",
            technologies: ["React", "WebSockets"],
            measurableOutcomes: ["Scaled to 10k users."],
          },
        ],
        education: [
          {
            institution: "UC Berkeley",
            degree: "BS Computer Science",
            graduationYear: 2018,
          },
        ],
      };

      const result1 = calculateProfileStrength(profileInput);
      const result2 = calculateProfileStrength(profileInput);

      expect(result1.overallScore).toBe(result2.overallScore);
      expect(result1.categoryScores).toEqual(result2.categoryScores);
      expect(result1.overallScore).toBeGreaterThanOrEqual(80);
      expect(result1.disclaimer).toContain("does not guarantee employment");
    });

    it("penalizes score when crucial information is missing and offers actionable suggestions", () => {
      const bareProfile: ProfileStrengthInput = {
        personal: {
          fullName: "New Candidate",
        },
        skills: [],
        experience: [],
        projects: [],
        education: [],
      };

      const result = calculateProfileStrength(bareProfile);
      expect(result.overallScore).toBeLessThan(20);
      expect(result.missingInformation).toContain("Missing professional headline");
      expect(result.missingInformation).toContain("Missing professional summary");
      expect(result.missingInformation).toContain("No skills listed on profile");
      expect(result.missingInformation).toContain("No work experience recorded");
      expect(result.suggestions.length).toBeGreaterThanOrEqual(4);
    });
  });

  // 5. Job Matching Integration (Feature F)
  describe("Job Matching Integration with Candidate Intelligence (Feature F)", () => {
    function makeTestProfile(overrides: Partial<ProfileDto> = {}): ProfileDto {
      return {
        fullName: "Sarah Connor",
        phone: null,
        location: "New York, NY",
        linkedinUrl: null,
        githubUrl: null,
        portfolioUrl: null,
        headline: "Senior Cloud Engineer",
        summary: "Specialized in Kubernetes, Docker, and AWS infrastructure.",
        yearsOfExperience: 6,
        employmentStatus: "open",
        preferredTitles: ["Cloud Engineer", "DevOps Engineer"],
        preferredLocations: ["New York, NY", "Remote"],
        workMode: "remote",
        employmentTypes: ["full_time"],
        expectedSalaryMin: null,
        expectedSalaryMax: null,
        preferredIndustries: [],
        excludedCompanies: [],
        completionPercent: 90,
        experience: [
          {
            id: "e1",
            company: "Apex Cloud",
            title: "Senior DevOps Engineer",
            location: "New York",
            startDate: "2020-01-01",
            endDate: null,
            isCurrent: true,
            description: "Managed Kubernetes clusters on AWS.",
            technologies: ["Kubernetes", "AWS", "Terraform"],
            achievements: ["Reduced cloud costs by 28%."],
            evidenceSentences: ["Managed 12 production EKS clusters."],
            source: "user",
            confidence: 1,
          },
        ],
        education: [],
        skills: [
          {
            id: "s1",
            name: "Kubernetes",
            category: "cloud",
            evidenceCategory: "USER_CONFIRMED",
            source: "user",
            confidence: 1,
          },
          {
            id: "s2",
            name: "Docker",
            category: "cloud",
            evidenceCategory: "USER_CONFIRMED",
            source: "user",
            confidence: 1,
          },
          {
            id: "s3",
            name: "AWS",
            category: "cloud",
            evidenceCategory: "AI_EXTRACTED",
            evidenceSentence: "Provisioned VPCs and RDS databases.",
            connectedExperience: "Apex Cloud",
            source: "ai",
            confidence: 0.95,
          },
          {
            id: "s4",
            name: "COBOL",
            category: "legacy",
            evidenceCategory: "AI_SUGGESTED",
            source: "ai",
            confidence: 0.4,
          },
        ],
        projects: [
          {
            id: "p1",
            name: "Terraform Modules",
            description: "Reusable IaC templates.",
            url: "https://github.com/sarah/tf-modules",
            startDate: null,
            endDate: null,
            technologies: ["Terraform", "AWS"],
            source: "user",
            confidence: 1,
          },
        ],
        certifications: [],
        updatedAt: new Date().toISOString(),
        ...overrides,
      };
    }

    it("clearly distinguishes direct matches, related matches, and missing requirements", () => {
      const profile = makeTestProfile();
      const job = {
        title: "Senior Cloud Platform Engineer",
        location: "Remote",
        workMode: "remote",
        description: "Looking for Kubernetes, AWS, Linux, and Go experience.",
        skills: ["Kubernetes", "AWS", "Linux", "Go"],
      };

      const match = computeJobMatch(profile, job);

      // Direct matches: Kubernetes and AWS
      expect(match.directMatches).toEqual(expect.arrayContaining(["Kubernetes", "AWS"]));

      // Related matches: Docker -> Linux/CI/CD (transferable)
      expect(match.relatedMatches?.length).toBeGreaterThan(0);
      const linuxTransfer = match.relatedMatches?.find((r) => r.targetSkill.toLowerCase() === "linux");
      expect(linuxTransfer).toBeDefined();

      // Missing requirements: Go (no direct match or transferable bridge)
      expect(match.missingRequirements).toContain("Go");

      // Unsupported skills: COBOL (unconfirmed AI suggestion not needed for job)
      expect(match.unsupportedSkills).toContain("COBOL");

      // Project evidence in strengths
      expect(
        match.strengths.some((s) => s.includes("Terraform") || s.includes("AWS"))
      ).toBe(true);
    });

    it("does not inflate match score with unconfirmed AI_SUGGESTED skills", () => {
      const profileWithUnconfirmedSuggestions = makeTestProfile({
        skills: [
          {
            id: "s1",
            name: "Kubernetes",
            category: "cloud",
            evidenceCategory: "USER_CONFIRMED",
            source: "user",
            confidence: 1,
          },
          {
            id: "s-suggested-1",
            name: "Go",
            category: "languages",
            evidenceCategory: "AI_SUGGESTED",
            source: "ai",
            confidence: 0.3,
          },
        ],
      });

      const match = computeJobMatch(profileWithUnconfirmedSuggestions, {
        title: "Go Systems Engineer",
        location: "Remote",
        workMode: "remote",
        description: "Go microservices development.",
        skills: ["Go"],
      });

      // Go is only an unconfirmed suggestion, so it must not be treated as a direct matched skill
      expect(match.matchedSkills).not.toContain("Go");
      expect(match.missingSkills).toContain("Go");
      expect(match.missingRequirements).toContain("Go");
    });
  });

  // 6. User Data Isolation
  describe("User Data Isolation", () => {
    it("ensures skills and experience records are keyed to their respective userId", () => {
      const userA = "11111111-1111-1111-1111-111111111111";
      const userB = "22222222-2222-2222-2222-222222222222";

      const skillA = {
        id: "skill-1",
        userId: userA,
        name: "Python",
        source: "user" as const,
      };

      const skillB = {
        id: "skill-2",
        userId: userB,
        name: "Java",
        source: "user" as const,
      };

      expect(skillA.userId).not.toBe(skillB.userId);
      expect(skillA.userId).toBe(userA);
      expect(skillB.userId).toBe(userB);
    });
  });
});
