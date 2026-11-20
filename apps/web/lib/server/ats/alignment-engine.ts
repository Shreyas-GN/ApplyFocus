import type {
  JobRequirement,
  ProfileDto,
  RequirementMatchResult,
  RequirementResumeAlignmentItem,
} from "@/lib/types";
import type { TerminologyAnalysisOutput } from "./terminology-analyzer";

export interface AlignmentEngineInput {
  profile: ProfileDto | null;
  matchResult: RequirementMatchResult | null;
  terminologyOutput: TerminologyAnalysisOutput;
  requirements: JobRequirement[];
}

export interface AlignmentEngineOutput {
  evidenceCommunicationScore: number;
  alignedItems: RequirementResumeAlignmentItem[];
  demonstratedAndCommunicatedCount: number;
  demonstratedButPoorlyCommunicatedCount: number;
  evidenceExistsTerminologyMissingCount: number;
  noSupportingEvidenceCount: number;
}

export function computeRequirementResumeAlignment(
  input: AlignmentEngineInput
): AlignmentEngineOutput {
  const { matchResult, terminologyOutput, requirements } = input;
  const phase3Matches = matchResult?.matches ?? [];
  const initialAlignmentItems = terminologyOutput.alignmentItems;

  const alignedItems: RequirementResumeAlignmentItem[] = [];

  let demonstratedAndCommunicated = 0;
  let demonstratedPoorly = 0;
  let evidenceExistsTerminologyMissing = 0;
  let noSupportingEvidence = 0;

  // Track requirements where candidate actually has proven evidence in Phase 3
  let totalProvenRequirements = 0;
  let totalProvenAndWellCommunicated = 0;

  for (const req of requirements) {
    const p3Match = phase3Matches.find((m) => m.requirement.id === req.id);
    const termItem = initialAlignmentItems.find((i) => i.requirementId === req.id);

    const keywordFound = termItem?.keywordFound ?? false;
    const contextQuality = termItem?.contextQuality ?? "NONE";
    const resumeExcerpt = termItem?.resumeExcerpt ?? null;

    let candidateEvidenceSummary: string | null = null;
    if (p3Match && p3Match.status === "DIRECT_MATCH") {
      candidateEvidenceSummary = p3Match.evidenceSentence
        ? `Verified in ${p3Match.sourceExperience ?? p3Match.sourceProject ?? "profile"}: "${p3Match.evidenceSentence}"`
        : `Verified experience in ${p3Match.sourceExperience ?? p3Match.sourceProject ?? "profile"}.`;
    } else if (p3Match && p3Match.status === "RELATED_MATCH" && p3Match.candidateSkill) {
      candidateEvidenceSummary = `Transferable competency demonstrated in ${p3Match.candidateSkill} (${p3Match.transferableReason ?? "adjacent framework"}).`;
    }

    let status: RequirementResumeAlignmentItem["status"] = "NO_SUPPORTING_CANDIDATE_EVIDENCE";
    let rationale = "";
    let suggestedImprovement: string | null = null;

    const hasProvenEvidence =
      p3Match?.status === "DIRECT_MATCH" ||
      (!matchResult && (contextQuality === "HIGH" || contextQuality === "MODERATE"));
    const hasTransferableEvidence = p3Match?.status === "RELATED_MATCH";
    const isUnverifiedAI = p3Match?.status === "UNVERIFIED";

    if (hasProvenEvidence) {
      totalProvenRequirements++;

      if (keywordFound && (contextQuality === "HIGH" || contextQuality === "MODERATE")) {
        status = "DEMONSTRATED_AND_COMMUNICATED";
        demonstratedAndCommunicated++;
        totalProvenAndWellCommunicated++;
        rationale = `Your verified background in ${req.normalizedSkill} is clearly communicated in your resume with descriptive context.`;
      } else if (keywordFound && contextQuality === "WEAK") {
        status = "DEMONSTRATED_BUT_POORLY_COMMUNICATED";
        demonstratedPoorly++;
        rationale = `Your profile contains verified evidence of ${req.normalizedSkill}, but your resume only lists it as an isolated tag without showing deliverables.`;
        suggestedImprovement = `Expand your description under ${p3Match?.sourceExperience ?? p3Match?.sourceProject ?? "relevant experience"} to highlight deliverables achieved using ${req.normalizedSkill}.`;
      } else {
        // Evidence exists in profile, but the terminology is missing from the resume!
        status = "EVIDENCE_EXISTS_TERMINOLOGY_MISSING";
        evidenceExistsTerminologyMissing++;
        rationale = `Your profile contains verified experience with ${req.normalizedSkill} (${p3Match?.sourceExperience ?? p3Match?.sourceProject ?? "profile"}), but this terminology is missing from your uploaded resume.`;
        suggestedImprovement = `Your background supports ${req.normalizedSkill}. Explicitly incorporate "${req.normalizedSkill}" into your bullet points for ${p3Match?.sourceExperience ?? p3Match?.sourceProject ?? "recent experience"} so ATS scanners index it.`;
      }
    } else if (hasTransferableEvidence) {
      status = "RELATED_TERMINOLOGY_PRESENT";
      rationale = `Target technology "${req.normalizedSkill}" is not directly documented, but your verified competency in ${p3Match?.candidateSkill ?? "related tools"} establishes a strong bridge.`;
      suggestedImprovement = `Highlight how your mastery of ${p3Match?.candidateSkill ?? "related tools"} enables immediate ramp-up on ${req.normalizedSkill}.`;
    } else if (isUnverifiedAI) {
      status = "UNVERIFIED";
      rationale = `Skill "${req.normalizedSkill}" is listed in your profile as an unconfirmed suggestion, but lacks verified resume or project citations.`;
      suggestedImprovement = `If you have worked with ${req.normalizedSkill}, attach a concrete achievement bullet to confirm it as verified experience.`;
    } else if (!matchResult && keywordFound && contextQuality === "WEAK") {
      status = "DEMONSTRATED_BUT_POORLY_COMMUNICATED";
      demonstratedPoorly++;
      rationale = `Terminology "${req.normalizedSkill}" is listed in the resume, but lacks narrative context or demonstrated deliverables.`;
      suggestedImprovement = `Add a specific achievement bullet under relevant employment or project work describing how you applied ${req.normalizedSkill}.`;
    } else {
      status = "NO_SUPPORTING_CANDIDATE_EVIDENCE";
      noSupportingEvidence++;
      rationale = `No supporting candidate evidence was found in your profile or resume for ${req.name}.`;
      suggestedImprovement = `Do not fabricate claims. If you do not have professional experience with ${req.name}, consider learning the fundamentals or building a portfolio project before claiming it.`;
    }

    alignedItems.push({
      requirementId: req.id,
      requirementName: req.name,
      normalizedSkill: req.normalizedSkill,
      category: req.category,
      importance: req.importance,
      status,
      candidateEvidenceSummary,
      resumeExcerpt,
      keywordFound,
      contextQuality,
      rationale,
      suggestedImprovement,
    });
  }

  // Calculate Evidence Communication Score:
  // Out of all requirements the candidate genuinely possesses verified evidence for,
  // how well does their resume communicate that evidence?
  let evidenceCommunicationScore = 100;
  if (totalProvenRequirements > 0) {
    const communicationRatio =
      (totalProvenAndWellCommunicated + demonstratedPoorly * 0.5) /
      totalProvenRequirements;
    evidenceCommunicationScore = Math.round(communicationRatio * 100);
  } else if (!matchResult && requirements.length > 0) {
    const earned = alignedItems.reduce((acc, item) => {
      if (item.status === "DEMONSTRATED_AND_COMMUNICATED") return acc + 1.0;
      if (item.status === "DEMONSTRATED_BUT_POORLY_COMMUNICATED") return acc + 0.6;
      return acc;
    }, 0);
    evidenceCommunicationScore = Math.round((earned / requirements.length) * 100);
  } else if (requirements.length > 0) {
    // If candidate was evaluated in Phase 3 and had 0 verified requirements
    const foundRatio = initialAlignmentItems.filter((i) => i.keywordFound).length / requirements.length;
    evidenceCommunicationScore = Math.round(foundRatio * 40);
  }

  return {
    evidenceCommunicationScore: Math.max(0, Math.min(100, evidenceCommunicationScore)),
    alignedItems,
    demonstratedAndCommunicatedCount: demonstratedAndCommunicated,
    demonstratedButPoorlyCommunicatedCount: demonstratedPoorly,
    evidenceExistsTerminologyMissingCount: evidenceExistsTerminologyMissing,
    noSupportingEvidenceCount: noSupportingEvidence,
  };
}
