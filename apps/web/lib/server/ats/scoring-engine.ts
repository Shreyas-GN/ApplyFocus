import type { AtsDimensionBreakdown } from "@/lib/types";

export interface ScoringEngineInput {
  parsingReadiness: number;
  structureQuality: number;
  terminologyAlignment: number;
  evidenceCommunication: number;
  formattingCompatibility: number;
  keywordStuffingDetected: boolean;
  keywordStuffingPenalty: number;
  hasTargetJob: boolean;
}

export interface ScoringEngineOutput {
  overallReadiness: number;
  readinessLabel: string;
  dimensions: AtsDimensionBreakdown;
  limitations: string[];
}

export function computeAtsScoring(
  input: ScoringEngineInput
): ScoringEngineOutput {
  const {
    parsingReadiness,
    structureQuality,
    terminologyAlignment,
    evidenceCommunication,
    formattingCompatibility,
    keywordStuffingDetected,
    keywordStuffingPenalty,
    hasTargetJob,
  } = input;

  let rawScore = 0;

  if (hasTargetJob) {
    // Weighted formula when target job criteria are available:
    // Terminology: 30%, Evidence Communication: 20%, Parsing: 20%, Structure: 20%, Formatting: 10%
    rawScore = Math.round(
      terminologyAlignment * 0.3 +
        evidenceCommunication * 0.2 +
        parsingReadiness * 0.2 +
        structureQuality * 0.2 +
        formattingCompatibility * 0.1
    );
  } else {
    // General document health when evaluated without a specific job posting:
    // Parsing: 35%, Structure: 35%, Formatting: 30%
    rawScore = Math.round(
      parsingReadiness * 0.35 +
        structureQuality * 0.35 +
        formattingCompatibility * 0.3
    );
  }

  // Deduct keyword stuffing penalty if detected
  if (keywordStuffingDetected) {
    rawScore -= keywordStuffingPenalty;
  }

  // Gating rule: If the document cannot be read or parsed by an ATS (< 40 parsing readiness),
  // overall readiness must not exceed 30 regardless of other factors.
  if (parsingReadiness < 40) {
    rawScore = Math.min(rawScore, 30);
  }

  const overallReadiness = Math.max(0, Math.min(100, rawScore));

  let readinessLabel = "Critical Parsing or Structural Blockers";
  if (overallReadiness >= 85) {
    readinessLabel = "Optimal ATS Readiness";
  } else if (overallReadiness >= 70) {
    readinessLabel = "Competitive Foundation — Targeted Optimizations Recommended";
  } else if (overallReadiness >= 50) {
    readinessLabel = "Moderate Compatibility Issues Detected";
  }

  const limitations = [
    "This assessment evaluates deterministic document readability, section extraction, and job-specific terminology alignment.",
    "Applicant tracking systems (Workday, Greenhouse, Lever, iCIMS, Taleo) implement varied parsing heuristics; this assessment reflects standard enterprise extraction practices, not a guaranteed hiring outcome.",
    "Keyword matching alone does not establish qualification; genuine recruiter review evaluates business impact, role scope, and interview performance.",
  ];

  return {
    overallReadiness,
    readinessLabel,
    dimensions: {
      parsingReadiness,
      structureQuality,
      terminologyAlignment,
      evidenceCommunication,
      formattingCompatibility,
    },
    limitations,
  };
}

