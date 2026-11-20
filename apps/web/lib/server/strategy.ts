import { db } from '@/lib/db';
import { applicationStrategies, jobs } from '@/lib/db/schema';
import { calculateRequirementMatchResult } from '@/lib/requirement-matching';
import type {
  ApplicationStrategyContent,
  ApplicationStrategyDto,
  EvidenceStrength,
  ProfileDto,
  ProjectDto,
  RequirementMatchResult,
  StrategyGapItem,
  StrategyRecommendation,
  WorkExperienceDto,
} from '@/lib/types';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { resolveAiClient } from './ai-provider';
import { recordAudit } from './audit';
import {
  analyzeJobIntelligence,
  computeJobMatch,
} from './job-matching';
import { getProfile } from './profile';
import { extractJobRequirementsDeterministic, getOrExtractJobRequirements } from './requirement-extraction';
import { buildCandidateContext, cleanJsonFence, type ClaudeMessagesClient } from './tailoring';

// ─── Zod schema for AI strategy response ────────────────────────────────────

const strategyEvidenceItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['experience', 'project']),
  name: z.string().min(1),
  relevanceReason: z.string().min(1),
});

const strategyGapItemSchema = z.object({
  requirement: z.string().min(1),
  evidenceStrength: z.enum(['direct', 'transferable', 'weak', 'none']),
  note: z.string().min(1),
});

import {
  decisionEvaluationSchema
} from '@applypilot/validators';

export const applicationStrategyContentSchema = z.object({
  recommendation: z.enum(['strong_opportunity', 'worth_pursuing', 'lower_priority']),
  recommendationReason: z.string().min(1),
  positioning: z.string().min(1),
  whyPursue: z.array(z.string()).default([]),
  strongestExperiences: z.array(strategyEvidenceItemSchema).default([]),
  bestProjects: z.array(strategyEvidenceItemSchema).default([]),
  topAchievements: z.array(z.string()).default([]),
  skillsToEmphasize: z.array(z.string()).default([]),
  evidenceGaps: z.array(strategyGapItemSchema).default([]),
  resumeImprovements: z.array(z.string()).default([]),
  screeningPrep: z.array(z.string()).default([]),
  potentialConcerns: z.array(z.string()).default([]),
  nextAction: z.string().min(1),
  decisionEvaluation: decisionEvaluationSchema.optional(),
});

// ─── Deterministic evidence retrieval & ranking ──────────────────────────────

interface RankedExperience {
  item: WorkExperienceDto;
  score: number;
  reasons: string[];
}

interface RankedProject {
  item: ProjectDto;
  score: number;
  reasons: string[];
}

function rankExperienceForJob(
  experiences: WorkExperienceDto[],
  jobTitle: string,
  jobDescription: string,
  requiredSkills: string[]
): RankedExperience[] {
  const confirmed = experiences.filter((e) => e.source !== 'ai');
  const descLower = jobDescription.toLowerCase();
  const titleLower = jobTitle.toLowerCase();
  const requiredLower = requiredSkills.map((s) => s.toLowerCase());

  return confirmed
    .map((exp) => {
      let score = 0;
      const reasons: string[] = [];
      const expText =
        `${exp.title} ${exp.company} ${exp.description ?? ''} ${(exp.responsibilities ?? []).join(' ')} ${(exp.technologies ?? []).join(' ')}`.toLowerCase();

      // Title alignment
      const titleWords = titleLower.split(/\s+/).filter((w) => w.length > 3);
      const titleHits = titleWords.filter((w) => expText.includes(w)).length;
      if (titleHits > 0) {
        score += titleHits * 8;
        reasons.push(`Role title overlaps with ${jobTitle}`);
      }

      // Required skills overlap
      const techMatches = (exp.technologies ?? []).filter((t) =>
        requiredLower.some((r) => r === t.toLowerCase() || t.toLowerCase().includes(r))
      );
      if (techMatches.length > 0) {
        score += techMatches.length * 10;
        reasons.push(`Uses ${techMatches.slice(0, 3).join(', ')}`);
      }

      // Description mentions key job terms
      const descWords = descLower
        .split(/\W+/)
        .filter((w) => w.length > 5)
        .slice(0, 60);
      const descHits = descWords.filter((w) => expText.includes(w)).length;
      score += Math.min(descHits, 10) * 2;

      // Achievements add evidence weight
      if ((exp.achievements ?? []).length > 0) {
        score += 5;
        reasons.push('Has documented achievements');
      }

      // Recency bonus (current or recent role)
      if (exp.isCurrent) {
        score += 15;
        reasons.push('Current role');
      } else if (exp.endDate) {
        const year = parseInt(exp.endDate.slice(0, 4));
        if (!Number.isNaN(year) && year >= 2022) {
          score += 8;
          reasons.push('Recent experience');
        }
      }

      return { item: exp, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

function rankProjectsForJob(
  projects: ProjectDto[],
  jobDescription: string,
  requiredSkills: string[]
): RankedProject[] {
  const confirmed = projects.filter((p) => p.source !== 'ai');
  const descLower = jobDescription.toLowerCase();
  const requiredLower = requiredSkills.map((s) => s.toLowerCase());

  return confirmed
    .map((proj) => {
      let score = 0;
      const reasons: string[] = [];
      const projText =
        `${proj.name} ${proj.description ?? ''} ${proj.role ?? ''} ${(proj.technologies ?? []).join(' ')} ${(proj.contributions ?? []).join(' ')}`.toLowerCase();

      // Tech stack match
      const techMatches = (proj.technologies ?? []).filter((t) =>
        requiredLower.some((r) => r === t.toLowerCase() || t.toLowerCase().includes(r))
      );
      if (techMatches.length > 0) {
        score += techMatches.length * 12;
        reasons.push(`Built with ${techMatches.slice(0, 3).join(', ')}`);
      }

      // Description relevance
      const descWords = descLower
        .split(/\W+/)
        .filter((w) => w.length > 5)
        .slice(0, 50);
      const descHits = descWords.filter((w) => projText.includes(w)).length;
      score += Math.min(descHits, 8) * 3;

      // Contributions signal
      if ((proj.contributions ?? []).length > 0) {
        score += 5;
        reasons.push('Documents specific contributions');
      }

      return { item: proj, score, reasons };
    })
    .sort((a, b) => b.score - a.score);
}

function inferEvidenceStrength(
  skill: string,
  profile: ProfileDto
): EvidenceStrength {
  const skillLower = skill.toLowerCase();
  const confirmedSkills = profile.skills.filter((s) => s.source !== 'ai');
  const confirmedExp = profile.experience.filter((e) => e.source !== 'ai');
  const confirmedProjects = profile.projects.filter((p) => p.source !== 'ai');

  // Direct: explicitly confirmed
  if (confirmedSkills.some((s) => s.name.toLowerCase() === skillLower)) {
    return 'direct';
  }

  // Transferable: appears in technologies or descriptions
  const inTech = confirmedExp.some((e) =>
    (e.technologies ?? []).some((t) => t.toLowerCase().includes(skillLower))
  );
  const inProjects = confirmedProjects.some((p) =>
    (p.technologies ?? []).some((t) => t.toLowerCase().includes(skillLower))
  );
  if (inTech || inProjects) return 'transferable';

  // Weak: mentioned somewhere in descriptions
  const descText = confirmedExp.map((e) => e.description ?? '').join(' ').toLowerCase();
  if (descText.includes(skillLower)) return 'weak';

  return 'none';
}

function computeStrategyRecommendation(
  matchScore: number,
  skillsScore: number,
  hardConstraintsMet: boolean,
  criticalGapsCount = 0,
  mustHaveCoverage = 100
): StrategyRecommendation {
  if (!hardConstraintsMet || criticalGapsCount >= 2 || mustHaveCoverage < 45) return 'lower_priority';
  if (criticalGapsCount === 1 || mustHaveCoverage < 65) return 'worth_pursuing';
  if (matchScore >= 70 && skillsScore >= 60 && mustHaveCoverage >= 75) return 'strong_opportunity';
  if (matchScore >= 45 || skillsScore >= 40) return 'worth_pursuing';
  return 'lower_priority';
}

// ─── AI strategy text generation ─────────────────────────────────────────────

const STRATEGY_SYSTEM_PROMPT = `You are an expert career coach helping a job candidate build a targeted application strategy.

STRICT RULES:
1. Only reference companies, roles, projects, and skills that appear in candidateProfile.
2. NEVER invent qualifications, achievements, metrics, or experience the candidate doesn't have.
3. Be direct, specific, and grounded — no generic advice.
4. Keep each array item to 1-2 clear sentences max.
5. Output ONLY a single valid JSON object (no markdown fences) matching exactly:
{
  "recommendation": "strong_opportunity" | "worth_pursuing" | "lower_priority",
  "recommendationReason": "1-2 sentence explanation",
  "positioning": "1 sentence: how to frame yourself for this specific role",
  "whyPursue": ["reason 1", "reason 2"],
  "strongestExperiences": [{"id":"<exp id>","type":"experience","name":"Title at Company","relevanceReason":"why this matters for this job"}],
  "bestProjects": [{"id":"<proj id>","type":"project","name":"Project Name","relevanceReason":"why this project is relevant"}],
  "topAchievements": ["achievement from profile"],
  "skillsToEmphasize": ["skill name"],
  "evidenceGaps": [{"requirement":"skill or req","evidenceStrength":"direct"|"transferable"|"weak"|"none","note":"brief note"}],
  "resumeImprovements": ["specific section improvement suggestion"],
  "screeningPrep": ["question topic or area to prepare"],
  "potentialConcerns": ["specific concern to be ready to address"],
  "nextAction": "single most important next step"
}

The recommendationReason must reference actual evidence from the profile.
strongestExperiences and bestProjects must only include items whose IDs appear in the candidateProfile.
evidenceGaps should only list requirements that have insufficient direct evidence.`;

function resolveClaudeClient(client?: ClaudeMessagesClient): {
  claude: ClaudeMessagesClient;
  model: string;
} {
  const { client: resolved, model } = resolveAiClient(client);
  return { claude: resolved, model };
}

async function generateStrategyWithAI(
  profile: ProfileDto,
  job: { id: string; company: string; title: string; description: string },
  rankedExperiences: RankedExperience[],
  rankedProjects: RankedProject[],
  matchScore: number,
  recommendation: StrategyRecommendation,
  gapItems: StrategyGapItem[],
  client?: ClaudeMessagesClient
): Promise<ApplicationStrategyContent> {
  const candidateCtx = buildCandidateContext(profile);
  const topExp = rankedExperiences.slice(0, 3);
  const topProj = rankedProjects.slice(0, 3);

  const payload = {
    targetJob: {
      company: job.company,
      title: job.title,
      description: job.description.slice(0, 3000),
    },
    candidateProfile: {
      ...candidateCtx,
      experience: candidateCtx.experience.map((e, i) => ({
        ...e,
        id: profile.experience.filter((x) => x.source !== 'ai')[i]?.id ?? `exp-${i}`,
      })),
      projects: candidateCtx.projects.map((p, i) => ({
        ...p,
        id: profile.projects.filter((x) => x.source !== 'ai')[i]?.id ?? `proj-${i}`,
      })),
    },
    analysisContext: {
      matchScore,
      suggestedRecommendation: recommendation,
      topScoredExperiences: topExp.map((r) => ({
        id: r.item.id,
        name: `${r.item.title} at ${r.item.company}`,
        score: r.score,
        reasons: r.reasons,
      })),
      topScoredProjects: topProj.map((r) => ({
        id: r.item.id,
        name: r.item.name,
        score: r.score,
        reasons: r.reasons,
      })),
      identifiedGaps: gapItems.slice(0, 5),
    },
  };

  const { claude, model } = resolveClaudeClient(client);
  const response = await claude.messages.create({
    model,
    max_tokens: 4096,
    system: STRATEGY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: JSON.stringify(payload) }],
  });

  const rawText = response.content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text ?? '')
    .join('');

  const parsed = JSON.parse(cleanJsonFence(rawText));
  return applicationStrategyContentSchema.parse(parsed);
}

// ─── Deterministic fallback strategy ─────────────────────────────────────────

function buildFallbackStrategy(
  profile: ProfileDto,
  job: { company: string; title: string },
  matchScore: number,
  recommendation: StrategyRecommendation,
  rankedExperiences: RankedExperience[],
  rankedProjects: RankedProject[],
  matchedSkills: string[],
  missingSkills: string[],
  gapItems: StrategyGapItem[],
  requirementMatch?: RequirementMatchResult
): ApplicationStrategyContent {
  const confirmedExp = profile.experience.filter((e) => e.source !== 'ai');

  const topExp = rankedExperiences.slice(0, 2);
  const topProj = rankedProjects.slice(0, 2);

  const allAchievements = confirmedExp.flatMap((e) => e.achievements ?? []).slice(0, 3);

  const reasonMap: Record<StrategyRecommendation, string> = {
    strong_opportunity: `Your profile shows strong alignment with ${job.title} at ${job.company}, with ${matchedSkills.slice(0, 3).join(', ')} directly matching the requirements.`,
    worth_pursuing: `Your background covers key aspects of this ${job.title} role at ${job.company}. With targeted preparation, this is an achievable opportunity.`,
    lower_priority: `Your current profile has limited direct overlap with ${job.title} at ${job.company}. Consider strengthening key areas before prioritizing this application.`,
  };

  const improvements =
    requirementMatch && requirementMatch.gaps.length > 0
      ? requirementMatch.gaps.slice(0, 3).map((g) => g.actionableImprovement)
      : missingSkills.length > 0
        ? [`Add context around ${missingSkills.slice(0, 3).join(', ')} if you have relevant experience.`]
        : ['Quantify your achievements with specific metrics where possible.'];

  return {
    recommendation,
    recommendationReason: reasonMap[recommendation],
    positioning: `Experienced ${profile.headline ?? confirmedExp[0]?.title ?? 'professional'} with hands-on background in ${matchedSkills.slice(0, 3).join(', ') || 'relevant domains'}.`,
    whyPursue: [
      matchedSkills.length > 0
        ? `Your ${matchedSkills.slice(0, 3).join(', ')} skills align with key requirements.`
        : `The ${job.title} role offers relevant growth for your career trajectory.`,
      `${job.company} is an opportunity worth exploring given your background.`,
    ],
    strongestExperiences: topExp.map((r) => ({
      id: r.item.id,
      type: 'experience' as const,
      name: `${r.item.title} at ${r.item.company}`,
      relevanceReason: r.reasons[0] ?? 'Relevant professional experience',
    })),
    bestProjects: topProj.map((r) => ({
      id: r.item.id,
      type: 'project' as const,
      name: r.item.name,
      relevanceReason: r.reasons[0] ?? 'Demonstrates relevant technical skills',
    })),
    topAchievements: allAchievements.length > 0 ? allAchievements : [],
    skillsToEmphasize: matchedSkills.slice(0, 6),
    evidenceGaps: gapItems,
    resumeImprovements: improvements,
    screeningPrep: [
      `Be ready to discuss your work at ${confirmedExp[0]?.company ?? 'previous roles'} in detail.`,
      `Prepare examples demonstrating your experience with ${matchedSkills.slice(0, 2).join(' and ') || 'core skills'}.`,
    ],
    potentialConcerns:
      missingSkills.length > 0
        ? [`${missingSkills.slice(0, 3).join(', ')} appear in requirements but are not in your confirmed profile. Prepare to address this.`]
        : [],
    nextAction:
      recommendation === 'strong_opportunity'
        ? 'Start tailoring your resume to emphasize your strongest matching experiences.'
        : recommendation === 'worth_pursuing'
          ? 'Build your application strategy, then tailor your resume to bridge the gaps.'
          : 'Strengthen your profile documentation in key gap areas before applying.',
  };
}

// ─── Main pipeline ───────────────────────────────────────────────────────────

import { evaluateDecisionIntelligence } from './decision-engine';

export async function buildApplicationStrategy(
  profile: ProfileDto,
  job: {
    id: string;
    company: string;
    title: string;
    location: string | null;
    workMode: string | null;
    employmentType: string | null;
    description: string;
    skills: string[];
    source: string;
    salaryMin?: number | null;
    salaryMax?: number | null;
    postedAt?: Date | string | null;
    sourcePlatform?: string | null;
  },
  client?: ClaudeMessagesClient,
  atsAnalysis?: import('@/lib/types').AtsAnalysisResult | null
): Promise<ApplicationStrategyContent> {
  // Step A: Requirement understanding & matching
  const intelligence = analyzeJobIntelligence(job);
  const requirements = job.id
    ? await getOrExtractJobRequirements(job.id, job, client)
    : extractJobRequirementsDeterministic(job);
  const requirementMatch = calculateRequirementMatchResult(requirements, profile);

  // Step A.1: Phase 5 Decision Intelligence Evaluation
  const decisionEval = evaluateDecisionIntelligence({
    profile,
    job: {
      id: job.id,
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      workMode: job.workMode,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      postedAt: job.postedAt,
      sourcePlatform: job.sourcePlatform,
    },
    requirementMatch,
    atsAnalysis,
  });

  // Step B: Candidate evidence retrieval & ranking
  const matchBreakdown = computeJobMatch(profile, job);
  const { matchedSkills, missingSkills, transferableSkills } = matchBreakdown;

  const rankedExperiences = rankExperienceForJob(
    profile.experience,
    job.title,
    job.description,
    intelligence.requiredSkills
  );
  const rankedProjects = rankProjectsForJob(
    profile.projects,
    job.description,
    intelligence.requiredSkills
  );

  // Step C: Evidence gaps per requirement
  const allRequirements = [
    ...intelligence.requiredSkills,
    ...intelligence.preferredSkills.slice(0, 3),
  ];
  const gapItems: StrategyGapItem[] =
    requirementMatch.gaps.length > 0
      ? requirementMatch.gaps.slice(0, 6).map((g) => ({
        requirement: g.requirementName,
        evidenceStrength:
          g.classification === 'CRITICAL_GAP'
            ? ('none' as const)
            : g.classification === 'EXPERIENCE_GAP'
              ? ('weak' as const)
              : g.transferableSkillContext
                ? ('transferable' as const)
                : ('none' as const),
        note: g.actionableImprovement,
      }))
      : allRequirements
        .filter((req) => !matchedSkills.some((m) => m.toLowerCase() === req.toLowerCase()))
        .slice(0, 6)
        .map((req) => {
          const strength = inferEvidenceStrength(req, profile);
          const transferable = transferableSkills.find(
            (t) => t.targetSkill.toLowerCase() === req.toLowerCase()
          );
          return {
            requirement: req,
            evidenceStrength: strength,
            note:
              strength === 'none'
                ? transferable
                  ? `Your ${transferable.candidateSkill} background is transferable here.`
                  : `No documented evidence. Consider whether you have undocumented experience.`
                : strength === 'transferable'
                  ? `Found in your technologies but not as an explicit skill.`
                  : `Mentioned in your work history.`,
          };
        });

  // Step D: Recommendation
  const workModeMismatch =
    Boolean(profile.workMode) &&
    Boolean(job.workMode) &&
    profile.workMode !== job.workMode &&
    job.workMode !== 'remote';
  const recommendation = computeStrategyRecommendation(
    requirementMatch.overallScore,
    matchBreakdown.skillsScore,
    !workModeMismatch,
    requirementMatch.criticalGapsCount,
    requirementMatch.mustHaveCoverage
  );

  // Step E: Strategy compilation (AI or fallback)
  const hasAiKey = Boolean(process.env.OPENROUTER_API_KEY) || Boolean(client);
  let finalContent: ApplicationStrategyContent;

  if (hasAiKey) {
    try {
      finalContent = await generateStrategyWithAI(
        profile,
        job,
        rankedExperiences,
        rankedProjects,
        requirementMatch.overallScore,
        recommendation,
        gapItems,
        client
      );
    } catch (error) {
      console.error('[Strategy] AI generation failed, using fallback:', error);
      finalContent = buildFallbackStrategy(
        profile,
        job,
        requirementMatch.overallScore,
        recommendation,
        rankedExperiences,
        rankedProjects,
        matchedSkills,
        missingSkills,
        gapItems,
        requirementMatch
      );
    }
  } else {
    finalContent = buildFallbackStrategy(
      profile,
      job,
      requirementMatch.overallScore,
      recommendation,
      rankedExperiences,
      rankedProjects,
      matchedSkills,
      missingSkills,
      gapItems,
      requirementMatch
    );
  }

  // Attach enriched Phase 5 Decision Intelligence
  return {
    ...finalContent,
    decisionEvaluation: decisionEval,
  };
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function toStrategyDto(
  row: typeof applicationStrategies.$inferSelect
): ApplicationStrategyDto {
  return {
    id: row.id,
    jobId: row.jobId,
    status: row.status as ApplicationStrategyDto['status'],
    content: row.content as ApplicationStrategyContent,
    approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getStrategyForJob(
  userId: string,
  jobId: string
): Promise<ApplicationStrategyDto | null> {
  const [row] = await db
    .select()
    .from(applicationStrategies)
    .where(
      and(
        eq(applicationStrategies.userId, userId),
        eq(applicationStrategies.jobId, jobId)
      )
    )
    .orderBy(desc(applicationStrategies.updatedAt))
    .limit(1);

  return row ? toStrategyDto(row) : null;
}

export async function generateAndSaveStrategy(
  userId: string,
  jobId: string,
  client?: ClaudeMessagesClient
): Promise<ApplicationStrategyDto> {
  const [jobRow] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!jobRow) throw new Error('Job not found');

  const profile = await getProfile(userId);

  // Retrieve Primary Resume ATS analysis if available
  let atsAnalysis: import('@/lib/types').AtsAnalysisResult | null = null;
  try {
    const { listResumes } = await import('./resumes');
    const { getOrComputeAtsAnalysis } = await import('./ats/service');
    const allResumes = await listResumes(userId);
    const primaryResume = allResumes.find((r) => r.isPrimary) ?? allResumes[0];
    if (primaryResume) {
      atsAnalysis = await getOrComputeAtsAnalysis(userId, primaryResume.id, jobId);
    }
  } catch (err) {
    console.warn('[Strategy] Could not fetch primary resume ATS analysis:', err);
  }

  const content = await buildApplicationStrategy(profile, jobRow, client, atsAnalysis);

  const [saved] = await db
    .insert(applicationStrategies)
    .values({
      userId,
      jobId,
      status: 'ready',
      content,
    })
    .onConflictDoUpdate({
      target: [applicationStrategies.userId, applicationStrategies.jobId],
      set: {
        content,
        status: 'ready',
        approvedAt: null,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!saved) throw new Error('Failed to save strategy');

  await recordAudit(userId, 'application_strategy_generated', { jobId });

  return toStrategyDto(saved);
}

export async function approveStrategy(
  userId: string,
  jobId: string,
  content: ApplicationStrategyContent
): Promise<ApplicationStrategyDto | null> {
  const validated = applicationStrategyContentSchema.parse(content);

  const [updated] = await db
    .update(applicationStrategies)
    .set({
      content: validated,
      status: 'approved',
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(applicationStrategies.userId, userId),
        eq(applicationStrategies.jobId, jobId)
      )
    )
    .returning();

  if (!updated) return null;

  await recordAudit(userId, 'application_strategy_approved', { jobId });

  return toStrategyDto(updated);
}
