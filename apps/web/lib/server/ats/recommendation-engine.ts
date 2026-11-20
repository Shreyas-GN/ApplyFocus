import type {
  AtsFinding,
  AtsRecommendation,
  RequirementResumeAlignmentItem,
} from "@/lib/types";

export interface RecommendationEngineInput {
  findings: AtsFinding[];
  alignmentItems: RequirementResumeAlignmentItem[];
}

export function generateAtsRecommendations(
  input: RecommendationEngineInput
): AtsRecommendation[] {
  const recommendations: AtsRecommendation[] = [];
  const { findings, alignmentItems } = input;

  // 1. Recommendations from CRITICAL and HIGH severity findings
  for (const f of findings) {
    if (f.severity === "CRITICAL" || f.severity === "HIGH") {
      let category: AtsRecommendation["category"] = "PARSING_COMPATIBILITY";
      if (f.category === "STRUCTURE") category = "STRUCTURE_CLARITY";
      if (f.category === "TERMINOLOGY") category = "TERMINOLOGY_ALIGNMENT";

      recommendations.push({
        id: `rec-${f.id}`,
        priority: "HIGH",
        category,
        title: f.title,
        targetSection: f.category === "PARSING" ? "Document Header / File Export" : "Resume Structure",
        currentWording: f.evidence ?? null,
        suggestedWording: f.recommendation,
        rationale: f.impact,
        groundedCandidateEvidence: null,
      });
    }
  }

  // 2. High-Impact Terminology Alignment Recommendations
  // When candidate has verified evidence in Phase 3, but terminology is absent from resume!
  const missingTerminologyItems = alignmentItems.filter(
    (item) => item.status === "EVIDENCE_EXISTS_TERMINOLOGY_MISSING"
  );

  for (const item of missingTerminologyItems) {
    const isMustHave = item.importance === "MUST_HAVE";
    recommendations.push({
      id: `rec-missing-term-${item.requirementId}`,
      priority: isMustHave ? "HIGH" : "MEDIUM",
      category: "TERMINOLOGY_ALIGNMENT",
      title: `Explicitly Mention Required Terminology: "${item.normalizedSkill}"`,
      targetSection: "Work Experience / Key Projects",
      currentWording: item.resumeExcerpt ?? "Terminology not found in current resume draft.",
      suggestedWording: item.suggestedImprovement ?? `Incorporate "${item.normalizedSkill}" into relevant achievements.`,
      rationale: `The target role explicitly requires ${item.requirementName}. Your candidate background already includes verified evidence for this, but your current resume text does not explicitly feature the keyword.`,
      groundedCandidateEvidence: item.candidateEvidenceSummary,
    });
  }

  // 3. Experience Communication Recommendations
  // When candidate has the skill listed as a bare tag, but lacks narrative context in bullets
  const poorlyCommunicatedItems = alignmentItems.filter(
    (item) => item.status === "DEMONSTRATED_BUT_POORLY_COMMUNICATED"
  );

  for (const item of poorlyCommunicatedItems) {
    recommendations.push({
      id: `rec-poorly-comm-${item.requirementId}`,
      priority: item.importance === "MUST_HAVE" ? "HIGH" : "MEDIUM",
      category: "EXPERIENCE_COMMUNICATION",
      title: `Demonstrate "${item.normalizedSkill}" In Context Rather Than Isolated Tag`,
      targetSection: "Work Experience Bullets",
      currentWording: item.resumeExcerpt ?? `Listed under Skills as "${item.normalizedSkill}".`,
      suggestedWording: item.suggestedImprovement ?? `Highlight a deliverable built with ${item.normalizedSkill} using action verbs and metrics.`,
      rationale: `ATS scanners and recruiters give substantially greater weight to competencies demonstrated through measurable deliverables than to isolated items in a skills list.`,
      groundedCandidateEvidence: item.candidateEvidenceSummary,
    });
  }

  // 4. Recommendations from MEDIUM and LOW severity findings
  for (const f of findings) {
    if (f.severity === "MEDIUM" || f.severity === "LOW") {
      let category: AtsRecommendation["category"] = "STRUCTURE_CLARITY";
      if (f.category === "COMMUNICATION") category = "EXPERIENCE_COMMUNICATION";
      if (f.category === "FORMATTING") category = "PARSING_COMPATIBILITY";

      recommendations.push({
        id: `rec-${f.id}`,
        priority: f.severity === "MEDIUM" ? "MEDIUM" : "LOW",
        category,
        title: f.title,
        targetSection: "Experience Achievements",
        currentWording: f.evidence ?? null,
        suggestedWording: f.recommendation,
        rationale: f.impact,
        groundedCandidateEvidence: null,
      });
    }
  }

  // Deduplicate recommendations by title
  const seenTitles = new Set<string>();
  const uniqueRecommendations: AtsRecommendation[] = [];

  for (const rec of recommendations) {
    if (seenTitles.has(rec.title)) continue;
    seenTitles.add(rec.title);
    uniqueRecommendations.push(rec);
  }

  // Sort by priority: HIGH -> MEDIUM -> LOW
  const priorityWeight: Record<AtsRecommendation["priority"], number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  uniqueRecommendations.sort(
    (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]
  );

  return uniqueRecommendations.slice(0, 10);
}

