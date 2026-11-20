import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  applicationEvents,
  applications,
  jobs,
  tailoredDocuments,
} from '@/lib/db/schema';
import type {
  CoverLetterContent,
  CoverLetterTone,
  ProfileDto,
  ScreeningAnswerResult,
  TailoredDocumentDto,
  TailoredDocumentType,
  TailoredResumeContent,
} from '@/lib/types';
import { resolveAiClient, type AiMessagesClient } from './ai-provider';
import { recordAudit } from './audit';
import { getProfile } from './profile';

export const tailoredResumeExperienceItemSchema = z.object({
  company: z.string().min(1),
  title: z.string().min(1),
  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  originalDescription: z.string().nullable().default(null),
  tailoredDescription: z.string().min(1),
});

export const tailoredResumeContentSchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  highlightedSkills: z.array(z.string()).default([]),
  experience: z.array(tailoredResumeExperienceItemSchema).default([]),
  keywordsUsed: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  rationale: z.string().default(''),
  atsScore: z.number().optional().default(85),
});

export const coverLetterContentSchema = z.object({
  subjectLine: z.string().min(1),
  greeting: z.string().min(1),
  bodyParagraphs: z.array(z.string().min(1)).min(1),
  closing: z.string().min(1),
  signature: z.string().min(1),
  keyPointsHighlighted: z.array(z.string()).default([]),
});

// Backward-compatible alias
export type ClaudeMessagesClient = AiMessagesClient;

export interface CreateTailoredDocumentInput {
  type: TailoredDocumentType;
  tone?: CoverLetterTone;
  jobId?: string;
  applicationId?: string;
  company?: string;
  jobTitle?: string;
  jobDescription?: string;
}

const RESUME_TAILOR_SYSTEM_PROMPT = `You are an elite executive resume writer and ATS optimization strategist.
Your mission is to tailor the candidate's authentic experience into a compelling, high-converting, recruiter-ready resume specifically for the target job.

CORE PRINCIPLES:
1. IMPACT & ACTION ORIENTATION: For every experience item, write punchy, quantifiable bullet points using the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]". Use strong active power verbs (Architected, Orchestrated, Spearheaded, Accelerated, Automated, Engineered).
2. ATS ALIGNMENT: Explicitly incorporate key technical skills, frameworks, and domain terminologies from the target job description that the candidate actually has experience with into the headline, summary, and tailored descriptions.
3. STRICT FACTUAL ACCURACY:
   - Only use companies, job titles, dates, projects, education, and skills that exist in the candidate profile JSON.
   - Do NOT invent companies, credentials, degrees, or fabricate unmentioned technologies.
   - If a crucial keyword or requirement from the job description is absent in the candidate profile, place it in "missingKeywords" so the candidate knows their gap.
4. Calculate an estimated ATS match score (atsScore: integer from 50 to 98) representing the percentage of target job requirements covered by the candidate's background.

Output ONLY a single valid JSON object (no markdown code fences, no preamble, no postscript) matching:
{
  "headline": "High-impact targeted headline (e.g. Staff Full Stack Engineer | Cloud Architecture & Distributed Systems)",
  "summary": "Compelling 3-4 sentence professional summary explicitly targeted at the role, highlighting core competencies and domain strengths.",
  "highlightedSkills": ["Relevant Skill 1", "Relevant Skill 2"],
  "experience": [
    {
      "company": "Company Name",
      "title": "Title",
      "startDate": null,
      "endDate": null,
      "originalDescription": null,
      "tailoredDescription": "• Spearheaded ...\\n• Architected ...\\n• Reduced ..."
    }
  ],
  "keywordsUsed": ["keyword1", "keyword2"],
  "missingKeywords": ["gap1", "gap2"],
  "rationale": "Strategic explanation of how this resume positioning highlights the candidate's strongest fit for this specific opening.",
  "atsScore": 88
}`;

const COVER_LETTER_SYSTEM_PROMPT = `You write a grounded, job-specific cover letter for a candidate based strictly on their verified profile and the target job posting.

STRICT NO-FABRICATION RULES:
1. Only cite companies, roles, projects, education, and skills explicitly present in the candidate profile JSON.
2. NEVER fabricate metrics, awards, employers, or skills.
3. Match the requested tone:
   - "formal": polished, structured, traditional professional voice.
   - "conversational": warm, direct, human, confident without slang.
   - "concise": crisp 2-3 short paragraphs focused purely on fit and impact.
4. Output ONLY a single valid JSON object (no markdown fences, no commentary) matching:
{
  "subjectLine": "",
  "greeting": "",
  "bodyParagraphs": ["", ""],
  "closing": "",
  "signature": "",
  "keyPointsHighlighted": [""]
}`;

const SCREENING_ANSWER_SYSTEM_PROMPT = `You answer a job application screening question concisely and persuasively in first-person voice, strictly grounded in the candidate's verified profile.

STRICT NO-FABRICATION RULES:
1. Only cite skills, companies, job titles, years of experience, education, and projects explicitly present in candidateProfile.
2. NEVER invent metrics, years of experience, authorizations, or technologies the candidate does not have.
3. Keep the answer concise (2-5 sentences), direct, and tailored to the question and target role.
4. Output ONLY a single valid JSON object (no markdown fences) matching:
{
  "answer": "",
  "groundedFacts": [""]
}`;

export const screeningAnswerSchema = z.object({
  answer: z.string().min(1),
  groundedFacts: z.array(z.string()).default([]),
});

export interface ScreeningQuestionInput {
  question: string;
  jobId?: string;
  applicationId?: string;
  company?: string;
  jobTitle?: string;
  jobDescription?: string;
}

export function cleanJsonFence(raw: string): string {
  const stripped = raw.trim();
  const match = stripped.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return match && match[1] ? match[1].trim() : stripped;
}

export function buildCandidateContext(profile: ProfileDto) {
  // Use verified items if available; fall back to unverified parsed items when newly uploaded so tailoring is not empty
  const userSkills = profile.skills.filter((s) => s.source !== 'ai');
  const skillsToUse = userSkills.length > 0 ? userSkills : profile.skills;

  const userExp = profile.experience.filter((e) => e.source !== 'ai');
  const expToUse = userExp.length > 0 ? userExp : profile.experience;

  const userEdu = profile.education.filter((ed) => ed.source !== 'ai');
  const eduToUse = userEdu.length > 0 ? userEdu : profile.education;

  const userProj = profile.projects.filter((p) => p.source !== 'ai');
  const projToUse = userProj.length > 0 ? userProj : profile.projects;

  return {
    fullName: profile.fullName,
    location: profile.location,
    headline: profile.headline,
    summary: profile.summary,
    yearsOfExperience: profile.yearsOfExperience,
    skills: skillsToUse.map((s) => s.name),
    experience: expToUse.map((e) => ({
      company: e.company,
      title: e.title,
      startDate: e.startDate,
      endDate: e.isCurrent ? 'Present' : e.endDate,
      description: e.description,
      responsibilities: e.responsibilities ?? [],
      achievements: e.achievements ?? [],
      technologies: e.technologies ?? [],
    })),
    education: eduToUse.map((ed) => ({
      institution: ed.institution,
      degree: ed.degree,
      fieldOfStudy: ed.fieldOfStudy,
      graduationYear: ed.graduationYear ?? null,
    })),
    projects: projToUse.map((p) => ({
      name: p.name,
      role: p.role ?? null,
      description: p.description,
      technologies: p.technologies ?? [],
      contributions: p.contributions ?? [],
    })),
  };
}


async function runClaudeJson<T>(
  system: string,
  userContent: string,
  schema: z.ZodType<T>,
  injectedClient?: AiMessagesClient
): Promise<T> {
  const { client: claude, model } = resolveAiClient(injectedClient);

  const response = await claude.messages.create({
    model,
    max_tokens: 4096,
    system,
    messages: [{ role: 'user', content: userContent }],
  });

  const rawText = response.content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text ?? '')
    .join('');

  try {
    const parsed = JSON.parse(cleanJsonFence(rawText));
    return schema.parse(parsed);
  } catch (error) {
    console.error('Claude tailoring response validation failed:', rawText, error);
    throw new Error(
      'AI tailoring returned an unexpected response format. Please retry.'
    );
  }
}

export async function tailorResumeWithClaude(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  client?: AiMessagesClient,
  atsGuidance?: string[],
  decisionContext?: {
    recommendationTier?: string;
    actionPlan?: string[];
    skillsToEmphasize?: string[];
    claimsToAvoid?: string[];
  }
): Promise<TailoredResumeContent> {
  const candidate = buildCandidateContext(profile);
  const userMessage = JSON.stringify({
    targetJob: job,
    candidateProfile: candidate,
    atsImprovementGuidance: atsGuidance ?? [],
    decisionContext: decisionContext ?? null,
  });

  const result = await runClaudeJson(
    RESUME_TAILOR_SYSTEM_PROMPT,
    userMessage,
    tailoredResumeContentSchema,
    client
  );

  return {
    ...result,
    contactInfo: {
      fullName: profile.fullName,
      email: profile.email || profile.authEmail || null,
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      portfolioUrl: profile.portfolioUrl,
    },
    education: candidate.education,
    projects: candidate.projects,
    certifications: profile.certifications?.map((c) => ({
      name: c.name,
      issuer: c.issuer ?? null,
      issueDate: c.issueDate ?? null,
      credentialUrl: c.credentialUrl ?? null,
    })) ?? [],
  };
}

export async function draftCoverLetterWithClaude(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  tone: CoverLetterTone,
  client?: AiMessagesClient
): Promise<CoverLetterContent> {
  const candidate = buildCandidateContext(profile);
  const userMessage = JSON.stringify({
    tone,
    targetJob: job,
    candidateProfile: candidate,
  });

  return runClaudeJson(
    COVER_LETTER_SYSTEM_PROMPT,
    userMessage,
    coverLetterContentSchema,
    client
  );
}

export function buildGroundedScreeningAnswer(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  question: string
): ScreeningAnswerResult {
  const skills = profile.skills
    .filter((s) => s.source !== 'ai')
    .map((s) => s.name)
    .slice(0, 5);
  const topExp = profile.experience.find((e) => e.source !== 'ai');
  const topProject = profile.projects.find((p) => p.source !== 'ai');
  const summaryConfirmed = profile.intelligenceMetadata?.summarySource !== 'ai';
  const confirmedHeadline = summaryConfirmed ? profile.headline : null;
  const confirmedSummary = summaryConfirmed ? profile.summary : null;
  const qLower = question.toLowerCase();
  const facts: string[] = [];
  const parts: string[] = [];

  if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) {
    facts.push(`${profile.yearsOfExperience} years of experience`);
  }
  if (topExp) {
    facts.push(`${topExp.title} at ${topExp.company}`);
  }
  if (skills.length > 0) {
    facts.push(`Skills: ${skills.join(', ')}`);
  }

  if (/\b(why|interest|motivat|excited|company)\b/.test(qLower)) {
    const companyText = job.company ? ` at ${job.company}` : '';
    const roleText = job.title ? ` the ${job.title} role` : ' this role';
    parts.push(
      `I am excited about${roleText}${companyText} because it aligns closely with my background${confirmedHeadline ? ` as a ${confirmedHeadline}` : ''}.`
    );
    if (topExp) {
      parts.push(
        `Most recently as ${topExp.title} at ${topExp.company}, I worked extensively with ${skills.length > 0 ? skills.slice(0, 3).join(', ') : 'core engineering workflows'}${topExp.description ? ` (${topExp.description.slice(0, 140)})` : ''}.`
      );
    }
  } else if (/\b(project|challenge|proud|example|architecture|built)\b/.test(qLower)) {
    if (topProject) {
      facts.push(`Project: ${topProject.name}`);
      parts.push(
        `A representative example is ${topProject.name}${topProject.description ? `: ${topProject.description.slice(0, 220)}` : '.'}`
      );
    } else if (topExp) {
      parts.push(
        `In my role as ${topExp.title} at ${topExp.company}, ${topExp.description ? topExp.description.slice(0, 220) : `I delivered production work using ${skills.slice(0, 3).join(', ')}.`}`
      );
    }
  } else {
    if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) {
      parts.push(
        `I bring ${profile.yearsOfExperience} years of professional experience${skills.length > 0 ? ` working with ${skills.join(', ')}` : ''}.`
      );
    } else if (skills.length > 0) {
      parts.push(`My hands-on background covers ${skills.join(', ')}.`);
    }
    if (topExp) {
      parts.push(
        `As ${topExp.title} at ${topExp.company}, ${topExp.description ? topExp.description.slice(0, 180) : 'I applied these capabilities in production.'}`
      );
    }
  }

  if (parts.length === 0) {
    parts.push(
      confirmedSummary?.trim() ||
        `Based on my verified profile${skills.length > 0 ? ` (${skills.join(', ')})` : ''}, I am well positioned to contribute to ${job.title || 'this team'}${job.company ? ` at ${job.company}` : ''}.`
    );
  }

  return {
    answer: parts.join(' '),
    groundedFacts: facts,
    source: 'grounded_fallback',
  };
}

export async function generateScreeningAnswer(
  profile: ProfileDto,
  job: { company: string; title: string; description: string },
  question: string,
  client?: AiMessagesClient
): Promise<ScreeningAnswerResult> {
  if (!client && !process.env.OPENROUTER_API_KEY) {
    return buildGroundedScreeningAnswer(profile, job, question);
  }

  const candidate = buildCandidateContext(profile);
  const parsed = await runClaudeJson(
    SCREENING_ANSWER_SYSTEM_PROMPT,
    JSON.stringify({
      question,
      targetJob: job,
      candidateProfile: candidate,
    }),
    screeningAnswerSchema,
    client
  );

  return {
    answer: parsed.answer,
    groundedFacts: parsed.groundedFacts,
    source: 'claude',
  };
}

export async function answerScreeningQuestion(
  userId: string,
  input: ScreeningQuestionInput
): Promise<ScreeningAnswerResult> {
  const profile = await getProfile(userId);
  let company = input.company?.trim() ?? '';
  let title = input.jobTitle?.trim() ?? '';
  let description = input.jobDescription?.trim() ?? '';

  if (input.jobId) {
    const [jobRow] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, input.jobId))
      .limit(1);
    if (jobRow) {
      company = company || jobRow.company;
      title = title || jobRow.title;
      description = description || jobRow.description;
    }
  }

  if (input.applicationId && (!company || !title)) {
    const [appRow] = await db
      .select()
      .from(applications)
      .where(
        and(eq(applications.id, input.applicationId), eq(applications.userId, userId))
      )
      .limit(1);
    if (appRow) {
      company = company || appRow.company;
      title = title || appRow.title;
      if (appRow.jobId && !description) {
        const [linkedJob] = await db
          .select({ description: jobs.description })
          .from(jobs)
          .where(eq(jobs.id, appRow.jobId))
          .limit(1);
        if (linkedJob) description = linkedJob.description;
      }
    }
  }

  const result = await generateScreeningAnswer(
    profile,
    { company, title, description },
    input.question.trim()
  );

  await recordAudit(userId, 'screening_answer_generated', {
    company: company || null,
    jobTitle: title || null,
    source: result.source,
  });

  return result;
}

function toTailoredDocumentDto(
  row: typeof tailoredDocuments.$inferSelect
): TailoredDocumentDto {
  return {
    id: row.id,
    jobId: row.jobId,
    applicationId: row.applicationId,
    company: row.company,
    jobTitle: row.jobTitle,
    type: row.type as TailoredDocumentType,
    tone: (row.tone as CoverLetterTone | null) ?? null,
    content: row.content as TailoredResumeContent | CoverLetterContent,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listTailoredDocuments(
  userId: string,
  filters?: { jobId?: string; applicationId?: string }
): Promise<TailoredDocumentDto[]> {
  const conditions = [eq(tailoredDocuments.userId, userId)];
  if (filters?.jobId) {
    conditions.push(eq(tailoredDocuments.jobId, filters.jobId));
  }
  if (filters?.applicationId) {
    conditions.push(eq(tailoredDocuments.applicationId, filters.applicationId));
  }

  const rows = await db
    .select()
    .from(tailoredDocuments)
    .where(and(...conditions))
    .orderBy(desc(tailoredDocuments.createdAt))
    .limit(50);

  return rows.map(toTailoredDocumentDto);
}

export async function createTailoredDocument(
  userId: string,
  input: CreateTailoredDocumentInput,
  client?: AiMessagesClient
): Promise<TailoredDocumentDto> {
  let resolvedJobId = input.jobId ?? null;
  const resolvedAppId = input.applicationId ?? null;
  let company = input.company?.trim() ?? '';
  let jobTitle = input.jobTitle?.trim() ?? '';
  let jobDescription = input.jobDescription?.trim() ?? '';

  if (resolvedAppId) {
    const [appRow] = await db
      .select()
      .from(applications)
      .where(
        and(eq(applications.id, resolvedAppId), eq(applications.userId, userId))
      )
      .limit(1);

    if (!appRow) {
      throw new Error('Application not found.');
    }
    if (!company) company = appRow.company;
    if (!jobTitle) jobTitle = appRow.title;
    if (!resolvedJobId && appRow.jobId) resolvedJobId = appRow.jobId;
  }

  if (resolvedJobId) {
    const [jobRow] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, resolvedJobId))
      .limit(1);

    if (!jobRow) {
      throw new Error('Job posting not found.');
    }
    if (!company) company = jobRow.company;
    if (!jobTitle) jobTitle = jobRow.title;
    if (!jobDescription) jobDescription = jobRow.description;
  }

  if (!company || !jobTitle) {
    throw new Error('Company and job title are required.');
  }
  if (!jobDescription) {
    jobDescription = `${jobTitle} at ${company}`;
  }

  const profile = await getProfile(userId);
  const summaryConfirmed = profile.intelligenceMetadata?.summarySource !== 'ai';
  const hasCandidateSignal =
    (summaryConfirmed && Boolean(profile.summary?.trim())) ||
    (summaryConfirmed && Boolean(profile.headline?.trim())) ||
    profile.experience.some((e) => e.source !== 'ai') ||
    profile.skills.some((s) => s.source !== 'ai') ||
    profile.projects.some((p) => p.source !== 'ai');

  if (!hasCandidateSignal) {
    throw new Error(
      'Please add profile details or confirm a parsed resume before tailoring.'
    );
  }

  const tone: CoverLetterTone | null =
    input.type === 'cover_letter' ? input.tone ?? 'conversational' : null;

  let atsGuidance: string[] = [];
  let decisionContext: {
    recommendationTier?: string;
    actionPlan?: string[];
    skillsToEmphasize?: string[];
    claimsToAvoid?: string[];
  } | undefined = undefined;

  if (resolvedJobId && input.type === 'resume') {
    try {
      const { listResumes } = await import('./resumes');
      const { getOrComputeAtsAnalysis } = await import('./ats/service');
      const { getStrategyForJob } = await import('./strategy');

      const [userResumes, strategy] = await Promise.all([
        listResumes(userId),
        getStrategyForJob(userId, resolvedJobId),
      ]);

      const primary = userResumes.find((r) => r.isPrimary) ?? userResumes[0];
      if (primary) {
        const atsResult = await getOrComputeAtsAnalysis(userId, primary.id, resolvedJobId);
        atsGuidance = atsResult.recommendations.map(
          (r) => `${r.title}: ${r.suggestedWording ?? r.rationale}`
        );
      }

      if (strategy?.content?.decisionEvaluation) {
        const d = strategy.content.decisionEvaluation;
        decisionContext = {
          recommendationTier: d.recommendationTier,
          actionPlan: d.actionPlan.map((a: { actionTitle: string; reason: string }) => `${a.actionTitle} (${a.reason})`),
          skillsToEmphasize: d.skillsToEmphasize,
          claimsToAvoid: d.positioning.claimsToAvoid,
        };
      }
    } catch {
      // Graceful fallback if no resume uploaded or db unavailable
    }
  }

  const content =
    input.type === 'resume'
      ? await tailorResumeWithClaude(
          profile,
          { company, title: jobTitle, description: jobDescription },
          client,
          atsGuidance,
          decisionContext
        )
      : await draftCoverLetterWithClaude(
          profile,
          { company, title: jobTitle, description: jobDescription },
          tone ?? 'conversational',
          client
        );

  const [created] = await db
    .insert(tailoredDocuments)
    .values({
      userId,
      jobId: resolvedJobId,
      applicationId: resolvedAppId,
      company,
      jobTitle,
      type: input.type,
      tone,
      content,
    })
    .returning();

  if (!created) {
    throw new Error('Failed to save tailored document.');
  }

  if (resolvedAppId) {
    await db.insert(applicationEvents).values({
      applicationId: resolvedAppId,
      userId,
      type: 'tailoring',
      description:
        input.type === 'resume'
          ? `Generated tailored resume for ${jobTitle}`
          : `Drafted ${tone} cover letter for ${jobTitle}`,
    });
  }

  await recordAudit(userId, 'tailored_document_created', {
    documentId: created.id,
    type: input.type,
    jobId: resolvedJobId,
    applicationId: resolvedAppId,
  });

  return toTailoredDocumentDto(created);
}

export async function updateTailoredDocument(
  userId: string,
  documentId: string,
  content: unknown
): Promise<TailoredDocumentDto | null> {
  const [existing] = await db
    .select()
    .from(tailoredDocuments)
    .where(
      and(
        eq(tailoredDocuments.id, documentId),
        eq(tailoredDocuments.userId, userId)
      )
    )
    .limit(1);

  if (!existing) return null;

  const schema =
    existing.type === 'resume'
      ? tailoredResumeContentSchema
      : coverLetterContentSchema;
  const validated = schema.parse(content);

  const [updated] = await db
    .update(tailoredDocuments)
    .set({
      content: validated,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(tailoredDocuments.id, documentId),
        eq(tailoredDocuments.userId, userId)
      )
    )
    .returning();

  return updated ? toTailoredDocumentDto(updated) : null;
}

export async function deleteTailoredDocument(
  userId: string,
  documentId: string
): Promise<boolean> {
  const deleted = await db
    .delete(tailoredDocuments)
    .where(
      and(
        eq(tailoredDocuments.id, documentId),
        eq(tailoredDocuments.userId, userId)
      )
    )
    .returning({ id: tailoredDocuments.id });

  return deleted.length > 0;
}
