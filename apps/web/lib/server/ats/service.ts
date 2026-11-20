import { createHash } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { atsAnalyses, jobs, resumeParsedData, resumes } from "@/lib/db/schema";
import type { AtsAnalysisResult } from "@/lib/types";
import { getProfile } from "../profile";
import { getOrExtractJobRequirements } from "../requirement-extraction";
import { getOrComputeRequirementMatch } from "../requirement-matching";
import { analyzeResumeAtsIntelligence } from "./ats-engine";

function computeHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export async function getOrComputeAtsAnalysis(
  userId: string,
  resumeId: string,
  jobId?: string | null
): Promise<AtsAnalysisResult> {
  // 1. Fetch resume and parsed data
  const [resumeRow] = await db
    .select({
      resume: resumes,
      parsedData: resumeParsedData,
    })
    .from(resumes)
    .leftJoin(resumeParsedData, eq(resumes.id, resumeParsedData.resumeId))
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1);

  if (!resumeRow) {
    throw new Error("Resume not found or unauthorized.");
  }

  const { resume, parsedData } = resumeRow;
  const rawText = resume.extractedText ?? "";
  const resumeHash = computeHash(
    `${rawText}::${JSON.stringify(parsedData?.structuredData ?? {})}`
  );

  let jobHash: string | null = null;
  let jobRequirements: import("@applypilot/validators").JobRequirement[] = [];
  let requirementMatchResult: import("@applypilot/validators").RequirementMatchResult | null = null;
  let candidateProfile = null;

  if (jobId) {
    const [job] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, jobId))
      .limit(1);

    if (job) {
      jobHash = computeHash(job.description);

      // Check Cache in ats_analyses table
      try {
        const [cached] = await db
          .select()
          .from(atsAnalyses)
          .where(
            and(
              eq(atsAnalyses.userId, userId),
              eq(atsAnalyses.resumeId, resumeId),
              eq(atsAnalyses.jobId, jobId)
            )
          )
          .limit(1);

        if (
          cached &&
          cached.resumeHash === resumeHash &&
          cached.jobHash === jobHash
        ) {
          return cached.analysisResult as AtsAnalysisResult;
        }
      } catch (err) {
        console.warn("[ATS Analysis Cache] Read failure, recomputing:", err);
      }

      // Reusing Phase 2 Profile & Phase 3 Requirement Matching
      const [reqs, profile, matchResult] = await Promise.all([
        getOrExtractJobRequirements(jobId, job),
        getProfile(userId),
        getOrComputeRequirementMatch(userId, jobId),
      ]);

      jobRequirements = reqs;
      candidateProfile = profile;
      requirementMatchResult = matchResult;
    }
  } else {
    // Standalone resume evaluation without a target job
    try {
      const [cached] = await db
        .select()
        .from(atsAnalyses)
        .where(
          and(
            eq(atsAnalyses.userId, userId),
            eq(atsAnalyses.resumeId, resumeId),
            isNull(atsAnalyses.jobId)
          )
        )
        .limit(1);

      if (cached && cached.resumeHash === resumeHash) {
        return cached.analysisResult as AtsAnalysisResult;
      }
    } catch (err) {
      console.warn("[ATS Standalone Cache] Read failure, recomputing:", err);
    }
  }

  // 2. Execute ATS Intelligence Engine
  const analysisResult = analyzeResumeAtsIntelligence({
    rawText,
    mimeType: resume.mimeType,
    fileSizeBytes: resume.fileSizeBytes,
    parsedData: (parsedData?.structuredData as import("@applypilot/validators").ResumeParsedData) ?? null,
    profile: candidateProfile,
    jobRequirements,
    requirementMatchResult,
    processingError: resume.processingError,
  });

  // 3. Persist Analysis Cache
  try {
    const existing = await db
      .select({ id: atsAnalyses.id })
      .from(atsAnalyses)
      .where(
        jobId
          ? and(
              eq(atsAnalyses.userId, userId),
              eq(atsAnalyses.resumeId, resumeId),
              eq(atsAnalyses.jobId, jobId)
            )
          : and(
              eq(atsAnalyses.userId, userId),
              eq(atsAnalyses.resumeId, resumeId),
              isNull(atsAnalyses.jobId)
            )
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      await db
        .update(atsAnalyses)
        .set({
          resumeHash,
          jobHash,
          analysisResult,
          updatedAt: new Date(),
        })
        .where(eq(atsAnalyses.id, existing[0].id));
    } else {
      await db.insert(atsAnalyses).values({
        userId,
        resumeId,
        jobId: jobId ?? null,
        resumeHash,
        jobHash,
        analysisResult,
      });
    }
  } catch (err) {
    console.warn("[ATS Analysis Cache] Write failure:", err);
  }

  return analysisResult;
}

