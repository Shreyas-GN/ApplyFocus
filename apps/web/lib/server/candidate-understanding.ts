/**
 * Candidate Understanding Engine — ApplyFocus Decision Intelligence™
 *
 * Pure computation: takes a ProfileDto, returns a CandidateCapabilityProfileDto.
 * No AI calls. No network calls. All rules are deterministic and testable.
 *
 * Evidence classification hierarchy (best wins):
 *   achievement_backed > directly_demonstrated > self_reported > ai_extracted
 *
 * Evidence strength is a 0-1 deterministic score, NOT a probability estimate.
 */

import { z } from 'zod';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { candidateCapabilityProfiles } from '@/lib/db/schema';
import { getProfile } from './profile';
import type {
  CandidateCapabilityDto,
  CandidateCapabilityProfileDto,
  CandidateCapabilityProfileRecord,
  CapabilityContradictionDto,
  CapabilityEvidenceDto,
  CapabilityGapDto,
  MissingInformationDto,
  ProjectDto,
  SkillDto,
  WorkExperienceDto,
} from '@/lib/types';
import type { ProfileDto } from '@/lib/types';

// Increment when scoring rules or evidence classification changes substantially.
export const ASSESSMENT_VERSION = '1.0.0';

// ─── Zod validation schemas ──────────────────────────────────────────────────

const evidenceTypeSchema = z.enum([
  'work_technology',
  'work_achievement',
  'project_technology',
  'skill_self_report',
  'resume_extraction',
]);

const evidenceClassSchema = z.enum([
  'directly_demonstrated',
  'achievement_backed',
  'self_reported',
  'ai_extracted',
]);

const capabilityEvidenceSchema = z.object({
  type: evidenceTypeSchema,
  sourceId: z.string(),
  sourceLabel: z.string(),
  excerpt: z.string().nullable(),
});

const candidateCapabilitySchema = z.object({
  name: z.string().min(1),
  normalizedName: z.string().min(1),
  category: z.string().nullable(),
  evidenceClass: evidenceClassSchema,
  evidenceStrength: z.number().min(0).max(1),
  evidence: z.array(capabilityEvidenceSchema),
  proficiency: z.string().nullable(),
  yearsOfExperience: z.number().nullable(),
  sourceSkillId: z.string().nullable(),
  confirmedByUser: z.boolean(),
});

const capabilityGapSchema = z.object({
  type: z.enum(['work_technology_undeclared', 'project_technology_undeclared']),
  description: z.string(),
  sourceId: z.string(),
  sourceLabel: z.string(),
  technologyName: z.string(),
});

const capabilityContradictionSchema = z.object({
  type: z.enum([
    'ai_low_confidence_no_corroboration',
    'experience_duration_exceeds_career',
  ]),
  description: z.string(),
  capabilityName: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});

const missingInformationSchema = z.object({
  type: z.enum([
    'work_experience_no_technologies',
    'project_no_technologies',
    'skill_no_proficiency_or_evidence',
  ]),
  description: z.string(),
  sourceId: z.string(),
  sourceLabel: z.string(),
  affectedCount: z.number().int().min(1),
});

export const candidateCapabilityProfileSchema = z.object({
  assessmentVersion: z.string(),
  computedAt: z.string().datetime(),
  processingTrigger: z.enum(['resume_confirmed', 'profile_updated', 'manual']),
  sourceResumeId: z.string().nullable(),
  totalCapabilities: z.number().int().min(0),
  directlyDemonstratedCount: z.number().int().min(0),
  achievementBackedCount: z.number().int().min(0),
  selfReportedOnlyCount: z.number().int().min(0),
  aiExtractedUnverifiedCount: z.number().int().min(0),
  evidenceCoveragePercent: z.number().min(0).max(100),
  capabilities: z.array(candidateCapabilitySchema),
  gaps: z.array(capabilityGapSchema),
  contradictions: z.array(capabilityContradictionSchema),
  missingInformation: z.array(missingInformationSchema),
});

// ─── Pure engine ─────────────────────────────────────────────────────────────

/**
 * Compute a fully-evidenced capability profile from the candidate's ProfileDto.
 * Pure function — no DB, no AI, no side effects. Safe to call in tests.
 */
export function computeCandidateCapabilityProfile(
  profile: Omit<ProfileDto, 'intelligence' | 'completionPercent'>,
  options: {
    processingTrigger: CandidateCapabilityProfileDto['processingTrigger'];
    sourceResumeId: string | null;
  }
): CandidateCapabilityProfileDto {
  // Index confirmed work + project evidence once
  const workIndex = buildWorkTechIndex(profile.experience);
  const projectIndex = buildProjectTechIndex(profile.projects);

  const capabilities: CandidateCapabilityDto[] = profile.skills.map((skill) =>
    buildCapability(skill, profile.experience, profile.projects, workIndex, projectIndex)
  );

  capabilities.sort((a, b) => b.evidenceStrength - a.evidenceStrength);

  const gaps = findGaps(profile.skills, profile.experience, profile.projects);
  const contradictions = findContradictions(profile.skills, profile.experience, capabilities);
  const missingInformation = findMissingInformation(
    profile.experience,
    profile.projects,
    profile.skills
  );

  const directlyDemonstratedCount = capabilities.filter(
    (c) => c.evidenceClass === 'directly_demonstrated'
  ).length;
  const achievementBackedCount = capabilities.filter(
    (c) => c.evidenceClass === 'achievement_backed'
  ).length;
  const selfReportedOnlyCount = capabilities.filter(
    (c) => c.evidenceClass === 'self_reported'
  ).length;
  const aiExtractedUnverifiedCount = capabilities.filter(
    (c) => c.evidenceClass === 'ai_extracted'
  ).length;

  const evidencedCount = directlyDemonstratedCount + achievementBackedCount;
  const evidenceCoveragePercent =
    capabilities.length === 0
      ? 0
      : Math.round((evidencedCount / capabilities.length) * 100);

  const result: CandidateCapabilityProfileDto = {
    assessmentVersion: ASSESSMENT_VERSION,
    computedAt: new Date().toISOString(),
    processingTrigger: options.processingTrigger,
    sourceResumeId: options.sourceResumeId,
    totalCapabilities: capabilities.length,
    directlyDemonstratedCount,
    achievementBackedCount,
    selfReportedOnlyCount,
    aiExtractedUnverifiedCount,
    evidenceCoveragePercent,
    capabilities,
    gaps,
    contradictions,
    missingInformation,
  };

  // Validate the output — catches logic bugs early in development
  return candidateCapabilityProfileSchema.parse(result);
}

// ─── Index builders ───────────────────────────────────────────────────────────

interface WorkTechEntry {
  workId: string;
  label: string;
  achievements: string[];
  source: 'user' | 'ai';
}

interface ProjectTechEntry {
  projectId: string;
  label: string;
  source: 'user' | 'ai';
}

function buildWorkTechIndex(
  experiences: WorkExperienceDto[]
): Map<string, WorkTechEntry[]> {
  const index = new Map<string, WorkTechEntry[]>();
  for (const exp of experiences) {
    for (const tech of exp.technologies ?? []) {
      const key = tech.toLowerCase().trim();
      if (!key) continue;
      const entries = index.get(key) ?? [];
      entries.push({
        workId: exp.id,
        label: `${exp.company} (${exp.title})`,
        achievements: exp.achievements ?? [],
        source: exp.source,
      });
      index.set(key, entries);
    }
  }
  return index;
}

function buildProjectTechIndex(
  projects: ProjectDto[]
): Map<string, ProjectTechEntry[]> {
  const index = new Map<string, ProjectTechEntry[]>();
  for (const proj of projects) {
    for (const tech of proj.technologies ?? []) {
      const key = tech.toLowerCase().trim();
      if (!key) continue;
      const entries = index.get(key) ?? [];
      entries.push({
        projectId: proj.id,
        label: `Project: ${proj.name}`,
        source: proj.source,
      });
      index.set(key, entries);
    }
  }
  return index;
}

// ─── Capability builder ───────────────────────────────────────────────────────

function buildCapability(
  skill: SkillDto,
  experiences: WorkExperienceDto[],
  projects: ProjectDto[],
  workIndex: Map<string, WorkTechEntry[]>,
  projectIndex: Map<string, ProjectTechEntry[]>
): CandidateCapabilityDto {
  const normalizedName = skill.name.toLowerCase().trim();
  const evidence: CapabilityEvidenceDto[] = [];

  // 1. Work technology evidence (confirmed work only)
  const workEntries = (workIndex.get(normalizedName) ?? []).filter(
    (e) => e.source !== 'ai'
  );
  for (const entry of workEntries) {
    evidence.push({
      type: 'work_technology',
      sourceId: entry.workId,
      sourceLabel: entry.label,
      excerpt: null,
    });

    // Check if any achievement mentions the skill
    const matchingAchievement = entry.achievements.find((a) =>
      a.toLowerCase().includes(normalizedName)
    );
    if (matchingAchievement) {
      evidence.push({
        type: 'work_achievement',
        sourceId: entry.workId,
        sourceLabel: entry.label,
        excerpt: truncate(matchingAchievement, 200),
      });
    }
  }

  // 2. Project technology evidence (confirmed projects only)
  const projectEntries = (projectIndex.get(normalizedName) ?? []).filter(
    (e) => e.source !== 'ai'
  );
  for (const entry of projectEntries) {
    evidence.push({
      type: 'project_technology',
      sourceId: entry.projectId,
      sourceLabel: entry.label,
      excerpt: null,
    });
  }

  // 3. Skill self-report or resume extraction record
  if (skill.source === 'ai') {
    evidence.push({
      type: 'resume_extraction',
      sourceId: skill.id,
      sourceLabel: `AI-extracted skill (confidence: ${skill.confidence ?? 'unknown'})`,
      excerpt: skill.evidence ?? null,
    });
  } else {
    evidence.push({
      type: 'skill_self_report',
      sourceId: skill.id,
      sourceLabel: 'User-confirmed skill',
      excerpt: skill.evidence ?? null,
    });
  }

  // Classify: best evidence wins
  const hasWorkEvidence = evidence.some((e) => e.type === 'work_technology');
  const hasAchievementEvidence = evidence.some((e) => e.type === 'work_achievement');
  const hasProjectEvidence = evidence.some((e) => e.type === 'project_technology');

  let evidenceClass: CandidateCapabilityDto['evidenceClass'];
  if (hasAchievementEvidence) {
    evidenceClass = 'achievement_backed';
  } else if (hasWorkEvidence || hasProjectEvidence) {
    evidenceClass = 'directly_demonstrated';
  } else if (skill.source === 'ai') {
    evidenceClass = 'ai_extracted';
  } else {
    evidenceClass = 'self_reported';
  }

  const evidenceStrength = computeEvidenceStrength(
    evidenceClass,
    hasWorkEvidence,
    hasProjectEvidence,
    skill
  );

  return {
    name: skill.name,
    normalizedName,
    category: skill.category ?? null,
    evidenceClass,
    evidenceStrength,
    evidence,
    proficiency: skill.proficiency ?? null,
    yearsOfExperience: skill.yearsOfExperience ?? null,
    sourceSkillId: skill.id,
    confirmedByUser: skill.source !== 'ai',
  };
}

function computeEvidenceStrength(
  evidenceClass: CandidateCapabilityDto['evidenceClass'],
  hasWorkEvidence: boolean,
  hasProjectEvidence: boolean,
  skill: SkillDto
): number {
  switch (evidenceClass) {
    case 'achievement_backed':
      return 0.9;
    case 'directly_demonstrated':
      return hasWorkEvidence ? 0.75 : 0.65;
    case 'self_reported': {
      const hasProficiency = Boolean(skill.proficiency);
      const hasYears = (skill.yearsOfExperience ?? 0) > 0;
      const hasEvidence = Boolean(skill.evidence);
      if (hasProficiency && (hasYears || hasEvidence)) return 0.55;
      if (hasProficiency || hasEvidence) return 0.45;
      return 0.35;
    }
    case 'ai_extracted':
      return Math.min(0.4, Math.max(0.1, (skill.confidence ?? 0.3) * 0.6));
  }
}

// ─── Gaps ─────────────────────────────────────────────────────────────────────

function findGaps(
  skills: SkillDto[],
  experiences: WorkExperienceDto[],
  projects: ProjectDto[]
): CapabilityGapDto[] {
  const confirmedSkillNames = new Set(
    skills
      .filter((s) => s.source !== 'ai')
      .map((s) => s.name.toLowerCase().trim())
  );

  const gaps: CapabilityGapDto[] = [];
  const seenTechNames = new Set<string>();

  for (const exp of experiences.filter((e) => e.source !== 'ai')) {
    for (const tech of exp.technologies ?? []) {
      const techKey = tech.toLowerCase().trim();
      if (!techKey || confirmedSkillNames.has(techKey) || seenTechNames.has(techKey))
        continue;
      seenTechNames.add(techKey);
      gaps.push({
        type: 'work_technology_undeclared',
        description: `${tech} appears in your ${exp.company} work experience but is not listed as a skill`,
        sourceId: exp.id,
        sourceLabel: `${exp.company} (${exp.title})`,
        technologyName: tech,
      });
    }
  }

  for (const proj of projects.filter((p) => p.source !== 'ai')) {
    for (const tech of proj.technologies ?? []) {
      const techKey = tech.toLowerCase().trim();
      if (!techKey || confirmedSkillNames.has(techKey) || seenTechNames.has(techKey))
        continue;
      seenTechNames.add(techKey);
      gaps.push({
        type: 'project_technology_undeclared',
        description: `${tech} is used in project "${proj.name}" but is not listed as a skill`,
        sourceId: proj.id,
        sourceLabel: `Project: ${proj.name}`,
        technologyName: tech,
      });
    }
  }

  return gaps;
}

// ─── Contradictions ───────────────────────────────────────────────────────────

function findContradictions(
  skills: SkillDto[],
  experiences: WorkExperienceDto[],
  capabilities: CandidateCapabilityDto[]
): CapabilityContradictionDto[] {
  const contradictions: CapabilityContradictionDto[] = [];

  // 1. AI-extracted skill with low confidence and no corroborating work/project evidence
  for (const cap of capabilities) {
    if (cap.evidenceClass !== 'ai_extracted') continue;
    const skill = skills.find((s) => s.id === cap.sourceSkillId);
    if (!skill) continue;
    const confidence = skill.confidence ?? 0;
    if (confidence < 0.5) {
      contradictions.push({
        type: 'ai_low_confidence_no_corroboration',
        description: `"${skill.name}" was AI-extracted with ${Math.round(confidence * 100)}% confidence and has no corroborating work or project evidence`,
        capabilityName: cap.name,
        severity: confidence < 0.3 ? 'high' : 'medium',
      });
    }
  }

  // 2. Skill claims more years of experience than the candidate's entire career span
  const careerYears = calculateCareerYears(experiences);
  if (careerYears !== null) {
    for (const skill of skills.filter((s) => s.source !== 'ai')) {
      const claimed = skill.yearsOfExperience ?? 0;
      if (claimed > 0 && claimed > careerYears + 0.5) {
        contradictions.push({
          type: 'experience_duration_exceeds_career',
          description: `${skill.name} claims ${claimed} years but your total career span is approximately ${Math.round(careerYears * 10) / 10} years`,
          capabilityName: skill.name,
          severity: claimed > careerYears + 2 ? 'high' : 'low',
        });
      }
    }
  }

  return contradictions;
}

function calculateCareerYears(experiences: WorkExperienceDto[]): number | null {
  const confirmed = experiences.filter((e) => e.source !== 'ai');
  if (confirmed.length === 0) return null;

  const startTimes = confirmed
    .map((e) => (e.startDate ? new Date(e.startDate).getTime() : null))
    .filter((t): t is number => t !== null && !isNaN(t));

  if (startTimes.length === 0) return null;

  const earliestMs = Math.min(...startTimes);
  return (Date.now() - earliestMs) / (1000 * 60 * 60 * 24 * 365.25);
}

// ─── Missing information ──────────────────────────────────────────────────────

function findMissingInformation(
  experiences: WorkExperienceDto[],
  projects: ProjectDto[],
  skills: SkillDto[]
): MissingInformationDto[] {
  const missing: MissingInformationDto[] = [];

  const workWithoutTech = experiences.filter(
    (e) => e.source !== 'ai' && (e.technologies ?? []).length === 0
  );
  if (workWithoutTech.length > 0) {
    missing.push({
      type: 'work_experience_no_technologies',
      description: `${workWithoutTech.length} work experience${workWithoutTech.length > 1 ? 's' : ''} have no technologies listed — adding them strengthens evidence for your skills`,
      sourceId: workWithoutTech[0].id,
      sourceLabel: workWithoutTech
        .slice(0, 3)
        .map((e) => `${e.company} (${e.title})`)
        .join(', '),
      affectedCount: workWithoutTech.length,
    });
  }

  const projectsWithoutTech = projects.filter(
    (p) => p.source !== 'ai' && (p.technologies ?? []).length === 0
  );
  if (projectsWithoutTech.length > 0) {
    missing.push({
      type: 'project_no_technologies',
      description: `${projectsWithoutTech.length} project${projectsWithoutTech.length > 1 ? 's' : ''} have no technologies listed`,
      sourceId: projectsWithoutTech[0].id,
      sourceLabel: projectsWithoutTech
        .slice(0, 3)
        .map((p) => p.name)
        .join(', '),
      affectedCount: projectsWithoutTech.length,
    });
  }

  const skillsWithoutContext = skills.filter(
    (s) =>
      s.source !== 'ai' &&
      !s.proficiency &&
      !s.evidence &&
      !(s.yearsOfExperience ?? 0)
  );
  if (skillsWithoutContext.length > 0) {
    missing.push({
      type: 'skill_no_proficiency_or_evidence',
      description: `${skillsWithoutContext.length} skill${skillsWithoutContext.length > 1 ? 's' : ''} have no proficiency, evidence text, or years of experience — this limits evidence strength scoring`,
      sourceId: skillsWithoutContext[0].id,
      sourceLabel:
        skillsWithoutContext
          .slice(0, 3)
          .map((s) => s.name)
          .join(', ') + (skillsWithoutContext.length > 3 ? '…' : ''),
      affectedCount: skillsWithoutContext.length,
    });
  }

  return missing;
}

// ─── Database persistence ─────────────────────────────────────────────────────

export async function persistCandidateCapabilityProfile(
  userId: string,
  profile: CandidateCapabilityProfileDto,
  durationMs: number
): Promise<string> {
  const [inserted] = await db
    .insert(candidateCapabilityProfiles)
    .values({
      userId,
      assessmentVersion: profile.assessmentVersion,
      processingTrigger: profile.processingTrigger,
      sourceResumeId: profile.sourceResumeId,
      capabilityCount: profile.totalCapabilities,
      directlyDemonstratedCount: profile.directlyDemonstratedCount,
      evidenceCoveragePercent: String(profile.evidenceCoveragePercent),
      gapCount: profile.gaps.length,
      contradictionCount: profile.contradictions.length,
      capabilities: profile as unknown as Record<string, unknown>,
      processingDurationMs: durationMs,
    })
    .returning({ id: candidateCapabilityProfiles.id });

  if (!inserted) throw new Error('Failed to persist capability profile');
  return inserted.id;
}

export async function getLatestCapabilityProfileRecord(
  userId: string
): Promise<CandidateCapabilityProfileRecord | null> {
  const [row] = await db
    .select()
    .from(candidateCapabilityProfiles)
    .where(eq(candidateCapabilityProfiles.userId, userId))
    .orderBy(desc(candidateCapabilityProfiles.createdAt))
    .limit(1);

  if (!row) return null;

  const profile = candidateCapabilityProfileSchema.parse(row.capabilities);

  return {
    id: row.id,
    assessmentVersion: row.assessmentVersion,
    processingTrigger: row.processingTrigger as CandidateCapabilityProfileDto['processingTrigger'],
    sourceResumeId: row.sourceResumeId,
    capabilityCount: row.capabilityCount,
    directlyDemonstratedCount: row.directlyDemonstratedCount,
    evidenceCoveragePercent: row.evidenceCoveragePercent
      ? Number(row.evidenceCoveragePercent)
      : null,
    gapCount: row.gapCount,
    contradictionCount: row.contradictionCount,
    processingDurationMs: row.processingDurationMs,
    createdAt: row.createdAt.toISOString(),
    profile,
  };
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

/**
 * Load the candidate's profile, run the engine, persist the result.
 * Safe to call fire-and-forget — catches and logs failures without throwing.
 */
export async function generateAndPersistCapabilityProfile(
  userId: string,
  trigger: CandidateCapabilityProfileDto['processingTrigger'],
  sourceResumeId: string | null = null
): Promise<void> {
  const start = Date.now();
  try {
    const profileDto = await getProfile(userId);
    const result = computeCandidateCapabilityProfile(profileDto, {
      processingTrigger: trigger,
      sourceResumeId,
    });
    const durationMs = Date.now() - start;
    await persistCandidateCapabilityProfile(userId, result, durationMs);
  } catch (err) {
    console.error(
      `[candidate-understanding] Assessment failed for user ${userId}:`,
      err
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 1) + '…';
}
