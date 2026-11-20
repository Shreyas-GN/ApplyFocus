import { describe, expect, it } from "vitest";
import { analyzeDocumentParsing } from "./parsing-analyzer";
import { analyzeDocumentStructure } from "./structure-analyzer";
import { analyzeJobTerminology } from "./terminology-analyzer";
import { computeRequirementResumeAlignment } from "./alignment-engine";
import { computeAtsScoring } from "./scoring-engine";
import { generateAtsRecommendations } from "./recommendation-engine";
import { analyzeResumeAtsIntelligence } from "./ats-engine";
import type { JobRequirement, RequirementMatchResult } from "@/lib/types";

describe("ATS Intelligence Engine — Unit Verification", () => {
  it("evaluates clean document parsing readiness and flags missing contact info", () => {
    const textWithoutEmail = `
      John Doe
      Software Engineer
      Summary: Experienced backend engineer.
      Work Experience:
      Acme Corp - Senior Engineer
      Education:
      BS Computer Science
      Skills:
      TypeScript, Node.js, PostgreSQL
    `;

    const result = analyzeDocumentParsing({
      rawText: textWithoutEmail,
      mimeType: "application/pdf",
      fileSizeBytes: 24000,
      parsedData: null,
    });

    expect(result.contactIntegrity.hasName).toBe(true);
    expect(result.contactIntegrity.hasEmail).toBe(false);
    expect(result.parsingReadinessScore).toBeLessThan(100);
    expect(result.findings.some((f) => f.id === "parsing-missing-email")).toBe(true);
  });

  it("flags unextractable or scanned PDF documents with CRITICAL severity", () => {
    const result = analyzeDocumentParsing({
      rawText: "",
      mimeType: "application/pdf",
      fileSizeBytes: 85000,
      processingError: "Scanned document without embedded text stream.",
    });

    expect(result.isScannedOrImageOnly).toBe(true);
    expect(result.parsingReadinessScore).toBe(0);
    const criticalFinding = result.findings.find((f) => f.severity === "CRITICAL");
    expect(criticalFinding).toBeDefined();
    expect(criticalFinding?.id).toBe("parsing-no-text-extracted");
  });

  it("detects corrupted character encoding and replacement glyphs", () => {
    const corruptedText = "Senior Soft\uFFFDware Engi\uFFFDneer at Tech\uFFFDCorp \uFFFD\uFFFD\uFFFD";
    const result = analyzeDocumentParsing({
      rawText: corruptedText,
      mimeType: "application/pdf",
      fileSizeBytes: 20000,
    });

    expect(result.hasEncodingIssues).toBe(true);
    expect(result.findings.some((f) => f.id === "parsing-character-encoding-errors")).toBe(true);
  });

  it("identifies ambiguous creative section headings and recommends standard replacements", () => {
    const textWithAmbiguousHeadings = `
      Jane Smith
      jane@example.com | (555) 019-2831
      My Journey:
      Built high throughput distributed microservices.
      Stuff I Built:
      E-commerce streaming pipeline handling 10k events/sec.
      What I Know:
      Go, Kubernetes, Redis, Kafka
    `;

    const result = analyzeDocumentStructure({
      rawText: textWithAmbiguousHeadings,
    });

    expect(result.findings.some((f) => f.title.includes("Unconventional Section Heading"))).toBe(true);
    const headingFinding = result.findings.find((f) => f.id.includes("ambiguous-heading"));
    expect(headingFinding?.recommendation).toContain("standard");
  });

  it("detects inconsistent date conventions across employment history", () => {
    const result = analyzeDocumentStructure({
      rawText: "Employment history text...",
      parsedData: {
        personal: {},
        experience: [
          {
            company: "Stripe",
            title: "Staff Engineer",
            startDate: "2021-05",
            endDate: "Present",
            isCurrent: true,
            confidence: 0.95,
            source: "ai",
          },
          {
            company: "Square",
            title: "Senior Engineer",
            startDate: "January 2019",
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
        overallConfidence: 0.9,
      },
    });

    expect(result.hasInconsistentDates).toBe(true);
    expect(result.findings.some((f) => f.id === "structure-inconsistent-date-formats")).toBe(true);
  });

  it("identifies multi-column or tabular layout delimiters without false universal claims", () => {
    const textWithTabularDelimiters = `
      Acme Corp\tSenior Engineer\t2021-Present
      • Led backend architecture\t• Scaled infrastructure
      • Tuned database performance\t• Mentored engineers
      Beta Corp\tSoftware Engineer\t2019-2021
      • Built REST services\t• Automated CI/CD
    `;

    const result = analyzeDocumentStructure({
      rawText: textWithTabularDelimiters,
    });

    expect(result.hasMultiColumnIndicators).toBe(true);
    const tableFinding = result.findings.find((f) => f.id === "formatting-multi-column-or-tables");
    expect(tableFinding).toBeDefined();
    // Verifies that universal claims like "all ATS reject" are NOT made
    expect(tableFinding?.impact).toContain("While modern ATS platforms can parse many two-column layouts");
  });

  it("penalizes keyword stuffing and detects unnatural repetitive term density", () => {
    const stuffedText = `
      John Doe | john@example.com
      Python Python Python Python Python Python Python Python Python
      Software engineer specializing in Python.
      Skills: Python, Python, Python, Django, Flask, FastAPI
      Built Python backend systems with Python scripts and Python pipelines.
    `;

    const requirements: JobRequirement[] = [
      {
        id: "req-python",
        name: "Python",
        normalizedSkill: "Python",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: 3,
        domain: "Backend",
        evidenceSentence: "Must have Python experience.",
      },
    ];

    const result = analyzeJobTerminology({
      rawText: stuffedText,
      requirements,
    });

    expect(result.keywordStuffingDetected).toBe(true);
    expect(result.keywordStuffingPenalty).toBeGreaterThanOrEqual(20);
    expect(result.findings.some((f) => f.id === "terminology-keyword-stuffing-detected")).toBe(true);
  });

  it("distinguishes contextual usage quality between bullet points and bare skills tags", () => {
    const textWithBoth = `
      John Doe | john@example.com
      Experience:
      • Engineered streaming data pipelines using Apache Kafka handling 20k events/sec.
      Skills:
      Redis, Docker, AWS
    `;

    const requirements: JobRequirement[] = [
      {
        id: "req-kafka",
        name: "Apache Kafka",
        normalizedSkill: "Kafka",
        category: "TECHNICAL",
        importance: "MUST_HAVE",
        isHardConstraint: true,
        confidence: 0.95,
        minYears: null,
        domain: "Data",
        evidenceSentence: "Experience with Kafka.",
      },
      {
        id: "req-redis",
        name: "Redis",
        normalizedSkill: "Redis",
        category: "TECHNICAL",
        importance: "PREFERRED",
        isHardConstraint: false,
        confidence: 0.9,
        minYears: null,
        domain: "Databases",
        evidenceSentence: "Preferred Redis.",
      },
    ];

    const parsedData = {
      personal: { fullName: "John Doe", email: "john@example.com" },
      experience: [
        {
          company: "Tech Corp",
          title: "Senior Engineer",
          isCurrent: true,
          achievements: ["Engineered streaming data pipelines using Apache Kafka handling 20k events/sec."],
          confidence: 0.95,
          source: "ai" as const,
        },
      ],
      education: [],
      skills: [
        {
          name: "Redis",
          confidence: 0.9,
          source: "ai" as const,
          evidenceCategory: "AI_EXTRACTED" as const,
        },
      ],
      projects: [],
      certifications: [],
      overallConfidence: 0.95,
    };

    const result = analyzeJobTerminology({
      rawText: textWithBoth,
      parsedData,
      requirements,
    });

    const kafkaItem = result.alignmentItems.find((i) => i.normalizedSkill === "Kafka");
    const redisItem = result.alignmentItems.find((i) => i.normalizedSkill === "Redis");

    expect(kafkaItem?.contextQuality).toBe("HIGH");
    expect(kafkaItem?.status).toBe("DEMONSTRATED_AND_COMMUNICATED");

    expect(redisItem?.contextQuality).toBe("WEAK");
    expect(redisItem?.status).toBe("DEMONSTRATED_BUT_POORLY_COMMUNICATED");
  });

  it("computes deterministic multi-dimensional scores without variance", () => {
    const input = {
      parsingReadiness: 90,
      structureQuality: 85,
      terminologyAlignment: 80,
      evidenceCommunication: 75,
      formattingCompatibility: 95,
      keywordStuffingDetected: false,
      keywordStuffingPenalty: 0,
      hasTargetJob: true,
    };

    const run1 = computeAtsScoring(input);
    const run2 = computeAtsScoring(input);

    expect(run1.overallReadiness).toBe(run2.overallReadiness);
    expect(run1.dimensions).toEqual(run2.dimensions);
    expect(run1.readinessLabel).toBe(run2.readinessLabel);
    expect(run1.overallReadiness).toBeGreaterThanOrEqual(80);
  });

  it("gates overall score when parsing readiness is compromised", () => {
    const input = {
      parsingReadiness: 20, // Unreadable document stream
      structureQuality: 90,
      terminologyAlignment: 90,
      evidenceCommunication: 90,
      formattingCompatibility: 90,
      keywordStuffingDetected: false,
      keywordStuffingPenalty: 0,
      hasTargetJob: true,
    };

    const result = computeAtsScoring(input);
    // Even if other dimensions are high, an unreadable document cannot exceed 30
    expect(result.overallReadiness).toBeLessThanOrEqual(30);
    expect(result.readinessLabel).toBe("Critical Parsing or Structural Blockers");
  });
});

