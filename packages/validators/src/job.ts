import { z } from "zod";

export const jobStateSchema = z.object({
  state: z.enum(["saved", "dismissed"]),
});

export type JobStateInput = z.infer<typeof jobStateSchema>;

export const screeningQuestionSchema = z.object({
  question: z.string().trim().min(3, "Enter a screening question").max(1500),
  jobId: z.string().uuid().optional(),
  applicationId: z.string().uuid().optional(),
  company: z.string().trim().max(200).optional(),
  jobTitle: z.string().trim().max(200).optional(),
  jobDescription: z.string().trim().max(20000).optional(),
});

export type ScreeningQuestionPayload = z.infer<typeof screeningQuestionSchema>;

// --- Phase 3: Requirement-Level Matching Schemas ---

export const jobRequirementCategorySchema = z.enum([
  "TECHNICAL",
  "EXPERIENCE",
  "EDUCATION",
  "ADDITIONAL",
]);
export type JobRequirementCategory = z.infer<typeof jobRequirementCategorySchema>;

export const jobRequirementImportanceSchema = z.enum([
  "MUST_HAVE",
  "PREFERRED",
  "OPTIONAL",
]);
export type JobRequirementImportance = z.infer<typeof jobRequirementImportanceSchema>;

export const jobRequirementSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  normalizedSkill: z.string().min(1),
  category: jobRequirementCategorySchema,
  importance: jobRequirementImportanceSchema,
  isHardConstraint: z.boolean().optional(),
  confidence: z.number().min(0).max(1).optional(),
  domain: z.string().optional(),
  minYears: z.number().nullable().optional(),
  evidenceSentence: z.string().min(1),
});
export type JobRequirement = z.infer<typeof jobRequirementSchema>;

export const jobRequirementsExtractionSchema = z.object({
  requirements: z.array(jobRequirementSchema),
});
export type JobRequirementsExtraction = z.infer<typeof jobRequirementsExtractionSchema>;

export const requirementMatchStatusSchema = z.enum([
  "DIRECT_MATCH",
  "RELATED_MATCH",
  "PARTIAL_MATCH",
  "MISSING",
  "UNVERIFIED",
]);
export type RequirementMatchStatus = z.infer<typeof requirementMatchStatusSchema>;

export const candidateGapClassificationSchema = z.enum([
  "CRITICAL_GAP",
  "EXPERIENCE_GAP",
  "SKILL_GAP",
  "EVIDENCE_GAP",
  "MINOR_GAP",
]);
export type CandidateGapClassification = z.infer<typeof candidateGapClassificationSchema>;

export const candidateGapAnalysisSchema = z.object({
  requirementId: z.string(),
  requirementName: z.string(),
  classification: candidateGapClassificationSchema,
  gapType: z.enum(["QUALIFICATION_GAP", "EVIDENCE_GAP"]).optional(),
  employerExpectation: z.string(),
  candidateDemonstration: z.string(),
  missingEvidence: z.string(),
  transferableSkillContext: z.string().nullable().optional(),
  actionableImprovement: z.string(),
});
export type CandidateGapAnalysis = z.infer<typeof candidateGapAnalysisSchema>;

export const requirementMatchSchema = z.object({
  requirement: jobRequirementSchema,
  status: requirementMatchStatusSchema,
  candidateSkill: z.string().nullable().optional(),
  sourceExperience: z.string().nullable().optional(),
  sourceProject: z.string().nullable().optional(),
  evidenceSentence: z.string().nullable().optional(),
  evidenceCategory: z.string().nullable().optional(),
  transferableReason: z.string().nullable().optional(),
  rationale: z.string(),
  confidence: z.number().min(0).max(1),
});
export type RequirementMatch = z.infer<typeof requirementMatchSchema>;

export const scoringBreakdownSchema = z.object({
  positiveFactors: z.array(z.string()),
  negativeFactors: z.array(z.string()),
  scoreCapApplied: z.boolean(),
  scoreCapReason: z.string().nullable().optional(),
  evidenceQualityScore: z.number().min(0).max(100),
});
export type ScoringBreakdown = z.infer<typeof scoringBreakdownSchema>;

export const requirementMatchResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  mustHaveCoverage: z.number().min(0).max(100),
  preferredCoverage: z.number().min(0).max(100),
  experienceAlignment: z.number().min(0).max(100),
  technicalAlignment: z.number().min(0).max(100),
  evidenceStrength: z.number().min(0).max(100),
  transferableContribution: z.number().min(0).max(100),
  hardConstraintCoverage: z.number().min(0).max(100).optional(),
  matches: z.array(requirementMatchSchema),
  strongestMatches: z.array(requirementMatchSchema),
  partialMatches: z.array(requirementMatchSchema),
  missingRequirements: z.array(requirementMatchSchema),
  unverifiedRequirements: z.array(requirementMatchSchema),
  gaps: z.array(candidateGapAnalysisSchema),
  criticalGapsCount: z.number(),
  scoringBreakdown: scoringBreakdownSchema.optional(),
});
export type RequirementMatchResult = z.infer<typeof requirementMatchResultSchema>;
