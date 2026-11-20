import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { candidateRequirementMatches, jobs } from '@/lib/db/schema';
import type { ProfileDto, RequirementMatchResult } from '@/lib/types';
import { requirementMatchResultSchema } from '@applypilot/validators';
import { getProfile } from './profile';
import { getOrExtractJobRequirements } from './requirement-extraction';
import {
  calculateRequirementMatchResult,
  matchRequirementAgainstCandidate,
} from '@/lib/requirement-matching';

export * from '@/lib/requirement-matching';
export * from './requirement-extraction';

function computeProfileHash(profile: ProfileDto | null): string {
  if (!profile) return 'no-profile';
  const parts = [
    profile.headline ?? '',
    String(profile.yearsOfExperience ?? 0),
    (profile.skills ?? []).map((s) => `${s.name}:${s.evidenceCategory ?? ''}`).join(','),
    (profile.experience ?? []).map((e) => `${e.company}:${e.title}:${(e.technologies ?? []).join(';')}`).join(','),
    (profile.projects ?? []).map((p) => `${p.name}:${(p.technologies ?? []).join(';')}`).join(','),
  ];
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
}

export async function getOrComputeRequirementMatch(
  userId: string,
  jobId: string
): Promise<RequirementMatchResult | null> {
  // 1. Fetch Job and Candidate Profile
  const [[jobRow], userProfile] = await Promise.all([
    db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1),
    getProfile(userId),
  ]);

  if (!jobRow) return null;

  const profileHash = computeProfileHash(userProfile);
  const jobHash = crypto.createHash('sha256').update(jobRow.description.trim()).digest('hex');

  // 2. Check cached match result in database
  try {
    const [cached] = await db
      .select()
      .from(candidateRequirementMatches)
      .where(
        and(
          eq(candidateRequirementMatches.userId, userId),
          eq(candidateRequirementMatches.jobId, jobId)
        )
      )
      .limit(1);

    if (cached && cached.profileHash === profileHash && cached.jobHash === jobHash) {
      const parsed = requirementMatchResultSchema.safeParse(cached.matchResult);
      if (parsed.success) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.warn('[Requirement Match Cache] Cache read error:', err);
  }

  // 3. Extract/Fetch Requirements
  const requirements = await getOrExtractJobRequirements(jobId, jobRow);

  // 4. Compute Requirement Matching
  const matchResult = calculateRequirementMatchResult(requirements, userProfile);

  // 5. Persist to cache
  try {
    await db
      .insert(candidateRequirementMatches)
      .values({
        userId,
        jobId,
        profileHash,
        jobHash,
        matchResult,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [
          candidateRequirementMatches.userId,
          candidateRequirementMatches.jobId,
        ],
        set: {
          profileHash,
          jobHash,
          matchResult,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.warn('[Requirement Match Cache] Cache write error:', err);
  }

  return matchResult;
}

