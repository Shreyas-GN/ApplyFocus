import { z } from "zod";

// ─── Phase 5: ApplyFocus Decision Intelligence Schemas ───────────────────────

export const decisionRecommendationTierSchema = z.enum([
  "STRONG_OPPORTUNITY",
  "WORTH_PURSUING",
  "SELECTIVE_APPLICATION",
  "LOW_PRIORITY",
  "INSUFFICIENT_INFORMATION",
]);
export type DecisionRecommendationTier = z.infer<typeof decisionRecommendationTierSchema>;

export const opportunityPriorityTierSchema = z.enum([
  "HIGH_PRIORITY",
  "MEDIUM_PRIORITY",
  "LOW_PRIORITY",
  "NEEDS_REVIEW",
]);
export type OpportunityPriorityTier = z.infer<typeof opportunityPriorityTierSchema>;

export const decisionApplicationReadinessSchema = z.enum([
  "READY_TO_APPLY",
  "READY_AFTER_IMPROVEMENTS",
  "NEEDS_REVIEW",
  "NOT_RECOMMENDED",
]);
export type DecisionApplicationReadiness = z.infer<typeof decisionApplicationReadinessSchema>;

export const decisionGapCategorySchema = z.enum([
  "QUALIFICATION_GAP",
  "EXPERIENCE_GAP",
  "EVIDENCE_GAP",
  "RESUME_COMMUNICATION_GAP",
  "UNKNOWN_INFORMATION",
]);
export type DecisionGapCategory = z.infer<typeof decisionGapCategorySchema>;

export const decisionEvidenceStrengthSchema = z.enum([
  "direct",
  "transferable",
  "weak",
  "none",
]);
export type DecisionEvidenceStrength = z.infer<typeof decisionEvidenceStrengthSchema>;

export const decisionEvidenceItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["experience", "project", "education"]),
  name: z.string().min(1),
  relevanceReason: z.string().min(1),
  metricsCited: z.array(z.string()).default([]),
});
export type DecisionEvidenceItem = z.infer<typeof decisionEvidenceItemSchema>;

export const decisionGapItemSchema = z.object({
  requirement: z.string().min(1),
  category: decisionGapCategorySchema,
  evidenceStrength: decisionEvidenceStrengthSchema,
  isHardConstraint: z.boolean().default(false),
  note: z.string().min(1),
  actionGuidance: z.string().min(1),
});
export type DecisionGapItem = z.infer<typeof decisionGapItemSchema>;

export const decisionActionPrioritySchema = z.enum([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
]);
export type DecisionActionPriority = z.infer<typeof decisionActionPrioritySchema>;

export const decisionActionPlanItemSchema = z.object({
  id: z.string().min(1),
  actionTitle: z.string().min(1),
  reason: z.string().min(1),
  supportingEvidence: z.string().min(1),
  priority: decisionActionPrioritySchema,
  expectedImprovement: z.string().min(1),
  isRequiredBeforeApplying: z.boolean().default(false),
  destinationUrl: z.string().nullable().optional(),
});
export type DecisionActionPlanItem = z.infer<typeof decisionActionPlanItemSchema>;

export const decisionPositioningSchema = z.object({
  headlineAngle: z.string().min(1),
  strongestEvidence: z.array(decisionEvidenceItemSchema).default([]),
  differentiators: z.array(z.string()).default([]),
  positioningRisks: z.array(z.string()).default([]),
  claimsToAvoid: z.array(z.string()).default([]),
});
export type DecisionPositioning = z.infer<typeof decisionPositioningSchema>;

export const constraintEvaluationItemSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["SATISFIED", "VIOLATED", "UNKNOWN"]),
  detail: z.string().min(1),
  candidatePreference: z.string().nullable().optional(),
  jobOffering: z.string().nullable().optional(),
});
export type ConstraintEvaluationItem = z.infer<typeof constraintEvaluationItemSchema>;

export const jobInformationQualitySchema = z.object({
  descriptionCompletenessScore: z.number().min(0).max(100),
  hasSalarySpecified: z.boolean(),
  hasClearSeniority: z.boolean(),
  isFresh: z.boolean(),
  freshnessLabel: z.string().min(1),
  ambiguousRequirements: z.array(z.string()).default([]),
  missingEmployerDetails: z.array(z.string()).default([]),
});
export type JobInformationQuality = z.infer<typeof jobInformationQualitySchema>;

export const decisionSummaryMetricsSchema = z.object({
  mandatoryCoveragePercent: z.number().min(0).max(100),
  preferredCoveragePercent: z.number().min(0).max(100),
  overallMatchScore: z.number().min(0).max(100),
  atsReadinessScore: z.number().nullable().optional(),
  evidenceStrengthScore: z.number().min(0).max(100),
  priorityScore: z.number().min(0).max(100),
});
export type DecisionSummaryMetrics = z.infer<typeof decisionSummaryMetricsSchema>;

// Primary Decision Intelligence Evaluation Payload
export const decisionEvaluationSchema = z.object({
  recommendationTier: decisionRecommendationTierSchema,
  recommendationReason: z.string().min(1),
  priorityTier: opportunityPriorityTierSchema,
  priorityReason: z.string().min(1),
  applicationReadiness: decisionApplicationReadinessSchema,
  readinessReason: z.string().min(1),
  whyPursue: z.array(z.string()).default([]),
  whyCaution: z.array(z.string()).default([]),
  positioning: decisionPositioningSchema,
  actionPlan: z.array(decisionActionPlanItemSchema).default([]),
  strongestExperiences: z.array(decisionEvidenceItemSchema).default([]),
  bestProjects: z.array(decisionEvidenceItemSchema).default([]),
  topAchievements: z.array(z.string()).default([]),
  skillsToEmphasize: z.array(z.string()).default([]),
  categorizedGaps: z.array(decisionGapItemSchema).default([]),
  constraintsEvaluation: z.array(constraintEvaluationItemSchema).default([]),
  jobInformationQuality: jobInformationQualitySchema,
  summaryMetrics: decisionSummaryMetricsSchema,
  nextAction: z.string().min(1),
});
export type DecisionEvaluation = z.infer<typeof decisionEvaluationSchema>;

