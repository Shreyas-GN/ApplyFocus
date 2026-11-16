import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { jobs, tailoredDocuments } from '@/lib/db/schema';
import type {
  ApplicationStrategyContent,
  ApplicationStrategyDto,
  ProfileDto,
  RankedEvidenceItem,
} from '@/lib/types';
import { cleanJsonFence, type ClaudeMessagesClient } from './tailoring';
import { getProfile } from './profile';

const STRATEGY_TYPE = 'strategy' as const;

// ─── Zod schema ────────────────────────────────────────────────────────────

export const rankedEvidenceItemSchema = z.object({
  type: z.enum(['experience', 'skill', 'project', 'education']),
  id: z.string(),
  label: z.string(),
  relevanceScore: z.number().min(0).max(100),
  reason: z.string(),
});

export const applicationStrategyContentSchema = z.object({
  positioning: z.string().min(1),
  topEvidence: z.array(rankedEvidenceItemSchema).default([]),
  coveringStrengths: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  approved: z.boolean().default(false),
  approvedAt: z.string().nullable().default(null),
});

// ─── Evidence ranking (deterministic) ─────────────────────────────────────

function scoreEvidence(
  profile: ProfileDto,
  jobSkills: string[],
  jobDescription: string
): RankedEvidenceItem[] {
  const jobText = `${jobDescription} ${jobSkills.join(' ')}`.toLowerCase();
  const items: RankedEvidenceItem[] = [];

  for (const exp of profile.experience) {
    if (exp.source === 'ai') continue;
    const expText = `${exp.title} ${exp.company} ${exp.description ?? ''} ${(exp.technologies ?? []).join(' ')}`.toLowerCase();
    const matchCount = jobSkills.filter((s) =>
      expText.includes(s.toLowerCase())
    ).length;
    const relevanceScore = Math.min(
      100,
      35 + matchCount * 10 + (exp.isCurrent ? 10 : 0)
    );
    items.push({
      type: 'experience',
      id: exp.id,
      label: `${exp.title} at ${exp.company}`,
      relevanceScore,
      reason:
        matchCount > 0
          ? `Directly uses ${jobSkills.filter((s) => expText.includes(s.toLowerCase())).slice(0, 3).join(', ')}`
          : 'Relevant professional experience',
    });
  }

  for (const skill of profile.skills) {
    if (skill.source === 'ai') continue;
    const skillLower = skill.name.toLowerCase();
    const inJob = jobText.includes(skillLower);
    if (inJob) {
      items.push({
        type: 'skill',
        id: skill.id,
        label: skill.name,
        relevanceScore: 80,
        reason: `Required or preferred skill in job posting`,
      });
    }
  }

  for (const proj of profile.projects) {
    if (proj.source === 'ai') continue;
    const projText = `${proj.name} ${proj.description ?? ''} ${(proj.technologies ?? []).join(' ')}`.toLowerCase();
    const matchCount = jobSkills.filter((s) =>
      projText.includes(s.toLowerCase())
    ).length;
    if (matchCount > 0 || projText.length > 50) {
      items.push({
        type: 'project',
        id: proj.id,
        label: proj.name,
        relevanceScore: Math.min(100, 40 + matchCount * 12),
        reason:
          matchCount > 0
            ? `Uses ${jobSkills.filter((s) => projText.includes(s.toLowerCase())).slice(0, 2).join(', ')}`
            : 'Portfolio project demonstrating technical depth',
      });
    }
  }

  for (const edu of profile.education) {
    if (edu.source === 'ai') continue;
    items.push({
      type: 'education',
      id: edu.id,
      label: `${edu.degree ?? 'Degree'} from ${edu.institution}`,
      relevanceScore: 50,
      reason: 'Academic credential',
    });
  }

  return items.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
}

// ─── AI strategy generation ────────────────────────────────────────────────

const STRATEGY_SYSTEM_PROMPT = `You generate a targeted application strategy for a job candidate.

STRICT GROUNDING RULES:
1. Only reference companies, roles, skills, and projects that explicitly exist in candidateProfile.
2. NEVER invent qualifications, achievements, or experience not in the candidate profile.
3. If the candidate lacks a required skill or qualification, list it in "gaps" rather than pretending they have it.
4. The "recommendations" array must contain specific, actionable steps the candidate can take.
5. Output ONLY a single valid JSON object (no markdown, no commentary) matching:
{
  "positioning": "",
  "coveringStrengths": [""],
  "gaps": [""],
  "recommendations": [""]
}`;

function resolveClaudeClient(injectedClient?: ClaudeMessagesClient): {
  claude: ClaudeMessagesClient;
  model: string;
} {
  if (injectedClient) {
    return {
      claude: injectedClient,
      model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
    };
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured.');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Anthropic = require('@anthropic-ai/sdk').default ?? require('@anthropic-ai/sdk');
  return {
    claude: new Anthropic({ apiKey }) as ClaudeMessagesClient,
    model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
  };
}

async function generateStrategyWithClaude(
  profile: ProfileDto,
  job: { company: string; title: string; description: string; skills: string[] },
  rankedEvidence: RankedEvidenceItem[],
  client?: ClaudeMessagesClient
): Promise<Pick<ApplicationStrategyContent, 'positioning' | 'coveringStrengths' | 'gaps' | 'recommendations'>> {
  const candidateContext = {
    fullName: profile.fullName,
    headline: profile.headline,
    yearsOfExperience: profile.yearsOfExperience,
    topSkills: profile.skills.filter((s) => s.source !== 'ai').map((s) => s.name).slice(0, 10),
    topExperience: profile.experience
      .filter((e) => e.source !== 'ai')
      .slice(0, 3)
      .map((e) => ({ company: e.company, title: e.title, description: e.description })),
    rankedEvidence: rankedEvidence.slice(0, 6).map((e) => ({ label: e.label, reason: e.reason })),
  };

  const { claude, model } = resolveClaudeClient(client);
  const response = await claude.messages.create({
    model,
    max_tokens: 2048,
    system: STRATEGY_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({ targetJob: job, candidateProfile: candidateContext }),
      },
    ],
  });

  const rawText = response.content
    .filter((b) => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text ?? '')
    .join('');

  const strategySchema = z.object({
    positioning: z.string().min(1),
    coveringStrengths: z.array(z.string()).default([]),
    gaps: z.array(z.string()).default([]),
    recommendations: z.array(z.string()).default([]),
  });

  try {
    const parsed = JSON.parse(cleanJsonFence(rawText));
    return strategySchema.parse(parsed);
  } catch {
    throw new Error('AI strategy generation returned an unexpected format. Please retry.');
  }
}

function buildGroundedStrategy(
  profile: ProfileDto,
  job: { company: string; title: string; skills: string[] },
  rankedEvidence: RankedEvidenceItem[]
): Pick<ApplicationStrategyContent, 'positioning' | 'coveringStrengths' | 'gaps' | 'recommendations'> {
  const confirmedSkills = profile.skills.filter((s) => s.source !== 'ai').map((s) => s.name);
  const topExp = profile.experience.find((e) => e.source !== 'ai');
  const matchedSkills = job.skills.filter((s) =>
    confirmedSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
  );
  const missingSkills = job.skills.filter(
    (s) => !confirmedSkills.some((cs) => cs.toLowerCase() === s.toLowerCase())
  );

  const positioning = `${profile.headline ?? 'Experienced professional'} applying for ${job.title} at ${job.company}${topExp ? `, with direct experience as ${topExp.title} at ${topExp.company}` : ''}.`;

  return {
    positioning,
    coveringStrengths: matchedSkills.slice(0, 5).map((s) => `Demonstrated skill in ${s}`),
    gaps: missingSkills.slice(0, 5),
    recommendations: [
      rankedEvidence.length > 0
        ? `Highlight ${rankedEvidence[0]?.label ?? 'top experience'} prominently`
        : 'Complete your profile to get specific recommendations',
      matchedSkills.length > 0
        ? `Emphasize your ${matchedSkills.slice(0, 3).join(', ')} skills`
        : 'Add relevant skills to your profile',
    ].filter(Boolean),
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface CreateStrategyInput {
  jobId: string;
  applicationId?: string;
}

function toDto(row: typeof tailoredDocuments.$inferSelect): ApplicationStrategyDto {
  return {
    id: row.id,
    jobId: row.jobId,
    applicationId: row.applicationId,
    company: row.company,
    jobTitle: row.jobTitle,
    content: row.content as ApplicationStrategyContent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listStrategies(
  userId: string,
  jobId: string
): Promise<ApplicationStrategyDto[]> {
  const rows = await db
    .select()
    .from(tailoredDocuments)
    .where(
      and(
        eq(tailoredDocuments.userId, userId),
        eq(tailoredDocuments.jobId, jobId),
        eq(tailoredDocuments.type, STRATEGY_TYPE)
      )
    )
    .orderBy(desc(tailoredDocuments.createdAt))
    .limit(5);

  return rows.map(toDto);
}

export async function createStrategy(
  userId: string,
  input: CreateStrategyInput,
  client?: ClaudeMessagesClient
): Promise<ApplicationStrategyDto> {
  const [jobRow] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, input.jobId))
    .limit(1);

  if (!jobRow) throw new Error('Job not found.');

  const profile = await getProfile(userId);

  const rankedEvidence = scoreEvidence(profile, jobRow.skills, jobRow.description);

  let strategyParts: Pick<ApplicationStrategyContent, 'positioning' | 'coveringStrengths' | 'gaps' | 'recommendations'>;

  if (process.env.ANTHROPIC_API_KEY || client) {
    try {
      strategyParts = await generateStrategyWithClaude(
        profile,
        { company: jobRow.company, title: jobRow.title, description: jobRow.description, skills: jobRow.skills },
        rankedEvidence,
        client
      );
    } catch {
      strategyParts = buildGroundedStrategy(profile, { company: jobRow.company, title: jobRow.title, skills: jobRow.skills }, rankedEvidence);
    }
  } else {
    strategyParts = buildGroundedStrategy(profile, { company: jobRow.company, title: jobRow.title, skills: jobRow.skills }, rankedEvidence);
  }

  const content: ApplicationStrategyContent = {
    ...strategyParts,
    topEvidence: rankedEvidence,
    approved: false,
    approvedAt: null,
  };

  const [created] = await db
    .insert(tailoredDocuments)
    .values({
      userId,
      jobId: input.jobId,
      applicationId: input.applicationId ?? null,
      company: jobRow.company,
      jobTitle: jobRow.title,
      type: STRATEGY_TYPE,
      tone: null,
      content,
    })
    .returning();

  if (!created) throw new Error('Failed to save strategy.');
  return toDto(created);
}

export async function approveStrategy(
  userId: string,
  strategyId: string
): Promise<ApplicationStrategyDto | null> {
  const [existing] = await db
    .select()
    .from(tailoredDocuments)
    .where(
      and(
        eq(tailoredDocuments.id, strategyId),
        eq(tailoredDocuments.userId, userId),
        eq(tailoredDocuments.type, STRATEGY_TYPE)
      )
    )
    .limit(1);

  if (!existing) return null;

  const currentContent = existing.content as ApplicationStrategyContent;
  const updatedContent: ApplicationStrategyContent = {
    ...currentContent,
    approved: true,
    approvedAt: new Date().toISOString(),
  };

  const [updated] = await db
    .update(tailoredDocuments)
    .set({ content: updatedContent, updatedAt: new Date() })
    .where(
      and(
        eq(tailoredDocuments.id, strategyId),
        eq(tailoredDocuments.userId, userId)
      )
    )
    .returning();

  return updated ? toDto(updated) : null;
}

export async function getApprovedStrategy(
  userId: string,
  jobId: string
): Promise<ApplicationStrategyDto | null> {
  const rows = await db
    .select()
    .from(tailoredDocuments)
    .where(
      and(
        eq(tailoredDocuments.userId, userId),
        eq(tailoredDocuments.jobId, jobId),
        eq(tailoredDocuments.type, STRATEGY_TYPE)
      )
    )
    .orderBy(desc(tailoredDocuments.createdAt))
    .limit(10);

  const approved = rows.find((r) => {
    const content = r.content as ApplicationStrategyContent;
    return content.approved === true;
  });

  return approved ? toDto(approved) : null;
}
