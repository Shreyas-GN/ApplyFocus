import type {
  AtsAnalysisResult,
  JobRequirement,
  ProfileDto,
  RequirementMatchResult,
} from "@/lib/types";
import type { ResumeParsedData } from "@applypilot/validators";
import { analyzeDocumentParsing } from "./parsing-analyzer";
import { analyzeDocumentStructure } from "./structure-analyzer";
import { analyzeJobTerminology } from "./terminology-analyzer";
import { computeRequirementResumeAlignment } from "./alignment-engine";
import { computeAtsScoring } from "./scoring-engine";
import { generateAtsRecommendations } from "./recommendation-engine";

export interface AtsEngineInput {
  rawText: string | null | undefined;
  mimeType: string;
  fileSizeBytes: number;
  parsedData?: ResumeParsedData | null;
  profile?: ProfileDto | null;
  jobRequirements?: JobRequirement[];
  requirementMatchResult?: RequirementMatchResult | null;
  processingError?: string | null;
}

export function analyzeResumeAtsIntelligence(
  input: AtsEngineInput
): AtsAnalysisResult {
  const requirements = input.jobRequirements ?? [];
  const hasTargetJob = requirements.length > 0;

  // 1. Parsing & Document Readability Analysis
  const parsingOutput = analyzeDocumentParsing({
    rawText: input.rawText,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    parsedData: input.parsedData,
    processingError: input.processingError,
  });

  // 2. Structure & Formatting Analysis
  const structureOutput = analyzeDocumentStructure({
    rawText: input.rawText,
    parsedData: input.parsedData,
  });

  // 3. Job-Specific Terminology Analysis
  const terminologyOutput = analyzeJobTerminology({
    rawText: input.rawText,
    parsedData: input.parsedData,
    requirements,
  });

  // 4. Requirement-to-Resume Evidence Alignment
  const alignmentOutput = computeRequirementResumeAlignment({
    profile: input.profile ?? null,
    matchResult: input.requirementMatchResult ?? null,
    terminologyOutput,
    requirements,
  });

  // 5. Aggregate Findings
  const allFindings = [
    ...parsingOutput.findings,
    ...structureOutput.findings,
    ...terminologyOutput.findings,
  ];

  // 6. Transparent Deterministic Scoring
  const scoringOutput = computeAtsScoring({
    parsingReadiness: parsingOutput.parsingReadinessScore,
    structureQuality: structureOutput.structureQualityScore,
    terminologyAlignment: terminologyOutput.terminologyAlignmentScore,
    evidenceCommunication: alignmentOutput.evidenceCommunicationScore,
    formattingCompatibility: structureOutput.formattingCompatibilityScore,
    keywordStuffingDetected: terminologyOutput.keywordStuffingDetected,
    keywordStuffingPenalty: terminologyOutput.keywordStuffingPenalty,
    hasTargetJob,
  });

  // 7. Actionable Evidence-Grounded Recommendations
  const recommendations = generateAtsRecommendations({
    findings: allFindings,
    alignmentItems: alignmentOutput.alignedItems,
  });

  return {
    overallReadiness: scoringOutput.overallReadiness,
    readinessLabel: scoringOutput.readinessLabel,
    dimensions: scoringOutput.dimensions,
    keywordStuffingDetected: terminologyOutput.keywordStuffingDetected,
    keywordStuffingPenalty: terminologyOutput.keywordStuffingPenalty,
    findings: allFindings,
    alignmentItems: alignmentOutput.alignedItems,
    recommendations,
    metrics: {
      totalSectionsIdentified: parsingOutput.detectedSections.length,
      detectedSections: parsingOutput.detectedSections,
      missingSections: parsingOutput.missingSections,
      totalWords: parsingOutput.totalWords,
      bulletCount: structureOutput.bulletCount,
      quantifiedBulletCount: structureOutput.quantifiedBulletCount,
      directKeywordsMatched: terminologyOutput.directKeywordsMatched,
      missingKeywordsCount: terminologyOutput.missingKeywordsCount,
    },
    limitations: scoringOutput.limitations,
  };
}

