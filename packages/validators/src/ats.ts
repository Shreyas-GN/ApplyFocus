import { z } from "zod";

export const atsFindingSeveritySchema = z.enum([
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "LOW",
  "INFORMATIONAL",
]);
export type AtsFindingSeverity = z.infer<typeof atsFindingSeveritySchema>;

export const atsFindingCategorySchema = z.enum([
  "PARSING",
  "STRUCTURE",
  "FORMATTING",
  "TERMINOLOGY",
  "COMMUNICATION",
]);
export type AtsFindingCategory = z.infer<typeof atsFindingCategorySchema>;

export const atsFindingSchema = z.object({
  id: z.string(),
  category: atsFindingCategorySchema,
  severity: atsFindingSeveritySchema,
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  evidence: z.string().nullable().optional(),
  recommendation: z.string(),
});
export type AtsFinding = z.infer<typeof atsFindingSchema>;

export const requirementResumeAlignmentStatusSchema = z.enum([
  "DEMONSTRATED_AND_COMMUNICATED",
  "DEMONSTRATED_BUT_POORLY_COMMUNICATED",
  "RELATED_TERMINOLOGY_PRESENT",
  "EVIDENCE_EXISTS_TERMINOLOGY_MISSING",
  "NO_SUPPORTING_CANDIDATE_EVIDENCE",
  "UNVERIFIED",
]);
export type RequirementResumeAlignmentStatus = z.infer<
  typeof requirementResumeAlignmentStatusSchema
>;

export const requirementResumeAlignmentItemSchema = z.object({
  requirementId: z.string(),
  requirementName: z.string(),
  normalizedSkill: z.string(),
  category: z.string(),
  importance: z.string(),
  status: requirementResumeAlignmentStatusSchema,
  candidateEvidenceSummary: z.string().nullable(),
  resumeExcerpt: z.string().nullable(),
  keywordFound: z.boolean(),
  contextQuality: z.enum(["HIGH", "MODERATE", "WEAK", "NONE"]),
  rationale: z.string(),
  suggestedImprovement: z.string().nullable(),
});
export type RequirementResumeAlignmentItem = z.infer<
  typeof requirementResumeAlignmentItemSchema
>;

export const atsRecommendationPrioritySchema = z.enum([
  "HIGH",
  "MEDIUM",
  "LOW",
]);
export type AtsRecommendationPriority = z.infer<
  typeof atsRecommendationPrioritySchema
>;

export const atsRecommendationCategorySchema = z.enum([
  "TERMINOLOGY_ALIGNMENT",
  "EXPERIENCE_COMMUNICATION",
  "PROJECT_DEPTH",
  "STRUCTURE_CLARITY",
  "PARSING_COMPATIBILITY",
]);
export type AtsRecommendationCategory = z.infer<
  typeof atsRecommendationCategorySchema
>;

export const atsRecommendationSchema = z.object({
  id: z.string(),
  priority: atsRecommendationPrioritySchema,
  category: atsRecommendationCategorySchema,
  title: z.string(),
  targetSection: z.string(),
  currentWording: z.string().nullable().optional(),
  suggestedWording: z.string().nullable().optional(),
  rationale: z.string(),
  groundedCandidateEvidence: z.string().nullable().optional(),
});
export type AtsRecommendation = z.infer<typeof atsRecommendationSchema>;

export const atsDimensionBreakdownSchema = z.object({
  parsingReadiness: z.number().min(0).max(100),
  structureQuality: z.number().min(0).max(100),
  terminologyAlignment: z.number().min(0).max(100),
  evidenceCommunication: z.number().min(0).max(100),
  formattingCompatibility: z.number().min(0).max(100),
});
export type AtsDimensionBreakdown = z.infer<typeof atsDimensionBreakdownSchema>;

export const atsAnalysisMetricsSchema = z.object({
  totalSectionsIdentified: z.number(),
  detectedSections: z.array(z.string()),
  missingSections: z.array(z.string()),
  totalWords: z.number(),
  bulletCount: z.number(),
  quantifiedBulletCount: z.number(),
  directKeywordsMatched: z.number(),
  missingKeywordsCount: z.number(),
});
export type AtsAnalysisMetrics = z.infer<typeof atsAnalysisMetricsSchema>;

export const atsAnalysisResultSchema = z.object({
  overallReadiness: z.number().min(0).max(100),
  readinessLabel: z.string(),
  dimensions: atsDimensionBreakdownSchema,
  keywordStuffingDetected: z.boolean(),
  keywordStuffingPenalty: z.number().min(0).max(100),
  findings: z.array(atsFindingSchema),
  alignmentItems: z.array(requirementResumeAlignmentItemSchema),
  recommendations: z.array(atsRecommendationSchema),
  metrics: atsAnalysisMetricsSchema,
  limitations: z.array(z.string()),
});
export type AtsAnalysisResult = z.infer<typeof atsAnalysisResultSchema>;

