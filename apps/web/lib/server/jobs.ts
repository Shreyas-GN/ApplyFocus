import { desc, eq, ilike, or, and, gte, count, sql, notInArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  applicationEvents,
  applications,
  jobs,
  jobBoards,
  jobStates,
  tailoredDocuments,
} from '@/lib/db/schema';
import type {
  ApplicationStatus,
  JobDetailDto,
  JobDto,
  JobUserState,
} from '@/lib/types';
import { getProfile } from './profile';
import {
  analyzeJobIntelligence,
  computeJobMatch,
  extractJobSkills,
  inferSeniorityLevel,
  inferWorkMode,
  stripHtml,
} from './job-matching';

export interface BoardSource {
  provider: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters';
  slug: string;
  companyName: string;
}

// ─── ATS type definitions ─────────────────────────────────────────────────────

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location?: { name?: string };
  content?: string;
  updated_at?: string;
}

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  categories?: {
    location?: string;
    commitment?: string;
  };
  descriptionPlain?: string;
  description?: string;
  createdAt?: number;
}

interface AshbyPosting {
  id: string;
  title: string;
  locationName?: string;
  employmentType?: string;
  jobLink?: string;
  departmentName?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  publishedDate?: string;
}

interface SmartRecruitersPosting {
  id: string;
  name: string;
  location?: {
    city?: string;
    country?: string;
    remote?: boolean;
  };
  typeOfEmployment?: { id?: string; label?: string };
  jobAd?: {
    sections?: {
      companyDescription?: { text?: string };
      jobDescription?: { text?: string };
    };
  };
  releasedDate?: string;
  ref?: string;
}

// ─── Sync orchestration ───────────────────────────────────────────────────────

export async function syncPublicJobs(
  customBoards?: BoardSource[]
): Promise<{ synced: number; boardsChecked: number }> {
  let boards: BoardSource[];

  if (customBoards && customBoards.length > 0) {
    boards = customBoards;
  } else {
    // Load active boards from the catalogue; fall back to hardcoded seeds if table is empty
    try {
      const dbBoards = await db
        .select({
          provider: jobBoards.provider,
          slug: jobBoards.slug,
          companyName: jobBoards.companyName,
        })
        .from(jobBoards)
        .where(eq(jobBoards.isActive, true));

      boards =
        dbBoards.length > 0
          ? dbBoards.map((b) => ({
              provider: b.provider as BoardSource['provider'],
              slug: b.slug,
              companyName: b.companyName,
            }))
          : FALLBACK_BOARDS;
    } catch {
      boards = FALLBACK_BOARDS;
    }
  }

  let totalSynced = 0;

  for (const board of boards) {
    try {
      let count = 0;
      if (board.provider === 'greenhouse') {
        count = await ingestGreenhouseBoard(board.slug, board.companyName);
      } else if (board.provider === 'lever') {
        count = await ingestLeverBoard(board.slug, board.companyName);
      } else if (board.provider === 'ashby') {
        count = await ingestAshbyBoard(board.slug, board.companyName);
      } else if (board.provider === 'smartrecruiters') {
        count = await ingestSmartRecruitersBoard(board.slug, board.companyName);
      }
      totalSynced += count;

      // Update last_synced_at for this board in the catalogue
      await db
        .update(jobBoards)
        .set({ lastSyncedAt: new Date() })
        .where(
          and(
            eq(jobBoards.provider, board.provider),
            eq(jobBoards.slug, board.slug)
          )
        )
        .catch(() => undefined); // Non-fatal if board row doesn't exist yet
    } catch (error) {
      console.warn(
        `[Jobs Sync] Failed syncing ${board.provider}:${board.slug}`,
        error
      );
    }
  }

  return { synced: totalSynced, boardsChecked: boards.length };
}

// Fallback boards used when the job_boards catalogue is empty.
const FALLBACK_BOARDS: BoardSource[] = [
  { provider: 'greenhouse', slug: 'vercel', companyName: 'Vercel' },
  { provider: 'greenhouse', slug: 'anthropic', companyName: 'Anthropic' },
  { provider: 'greenhouse', slug: 'stripe', companyName: 'Stripe' },
  { provider: 'greenhouse', slug: 'figma', companyName: 'Figma' },
];

// ─── Upsert helpers ───────────────────────────────────────────────────────────

type UpsertJobRow = typeof jobs.$inferInsert;

/**
 * Upsert a batch of jobs. Returns the count of rows upserted.
 * Also deactivates jobs from this source/slug that were NOT returned
 * by the latest sync (stale-job handling).
 */
async function upsertJobBatch(
  rows: UpsertJobRow[],
  source: string,
  slug: string
): Promise<number> {
  if (rows.length === 0) return 0;

  // Deduplicate within the batch
  const dedupedMap = new Map<string, UpsertJobRow>();
  for (const row of rows) {
    dedupedMap.set(`${row.source}:${row.externalId}`, row);
  }
  const deduped = [...dedupedMap.values()];

  await db
    .insert(jobs)
    .values(deduped)
    .onConflictDoUpdate({
      target: [jobs.source, jobs.externalId],
      set: {
        title: sql`excluded.title`,
        location: sql`excluded.location`,
        workMode: sql`excluded.work_mode`,
        url: sql`excluded.url`,
        description: sql`excluded.description`,
        skills: sql`excluded.skills`,
        postedAt: sql`excluded.posted_at`,
        isActive: sql`true`,
      },
    });

  // Deactivate jobs from this board that were not in this sync response
  const syncedExternalIds = deduped.map((r) => r.externalId as string);
  if (syncedExternalIds.length > 0) {
    await db
      .update(jobs)
      .set({ isActive: false })
      .where(
        and(
          eq(jobs.source, source),
          sql`${jobs.externalId} LIKE ${slug + ':%'}`,
          eq(jobs.isActive, true),
          notInArray(jobs.externalId, syncedExternalIds)
        )
      )
      .catch(() => undefined); // Non-fatal
  }

  return deduped.length;
}

// ─── ATS ingestion functions ──────────────────────────────────────────────────

async function ingestGreenhouseBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Greenhouse API returned ${res.status} for ${slug}`);
  }

  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const items = (data.jobs ?? []).slice(0, 50);
  const rows: UpsertJobRow[] = items.map((item) => {
    const cleanDescription = stripHtml(item.content ?? '');
    const location = item.location?.name ?? null;
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.updated_at ? new Date(item.updated_at) : null;
    return {
      source: 'greenhouse',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.title,
      location,
      workMode,
      employmentType: 'full_time',
      url: item.absolute_url,
      description: cleanDescription.slice(0, 12000),
      skills,
      isActive: true,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, 'greenhouse', slug);
}

async function ingestLeverBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Lever API returned ${res.status} for ${slug}`);
  }

  const items = ((await res.json()) as LeverPosting[]).slice(0, 50);
  const rows: UpsertJobRow[] = items.map((item) => {
    const cleanDescription =
      item.descriptionPlain ?? stripHtml(item.description ?? '');
    const location = item.categories?.location ?? null;
    const workMode = inferWorkMode(item.text, location, cleanDescription);
    const skills = extractJobSkills(item.text, cleanDescription);
    const postedAt = item.createdAt ? new Date(item.createdAt) : null;
    return {
      source: 'lever',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.text,
      location,
      workMode,
      employmentType: item.categories?.commitment ?? 'full_time',
      url: item.hostedUrl,
      description: cleanDescription.slice(0, 12000),
      skills,
      isActive: true,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, 'lever', slug);
}

async function ingestAshbyBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Ashby API returned ${res.status} for ${slug}`);
  }

  const data = (await res.json()) as { jobPostings?: AshbyPosting[] };
  const items = (data.jobPostings ?? []).slice(0, 50);
  const rows: UpsertJobRow[] = items.map((item) => {
    const cleanDescription =
      item.descriptionPlain ?? stripHtml(item.descriptionHtml ?? '');
    const location = item.locationName ?? null;
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.publishedDate ? new Date(item.publishedDate) : null;
    return {
      source: 'ashby',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.title,
      location,
      workMode,
      employmentType: item.employmentType ?? 'full_time',
      url: item.jobLink ?? `https://jobs.ashbyhq.com/${encodeURIComponent(slug)}/${item.id}`,
      description: cleanDescription.slice(0, 12000),
      skills,
      isActive: true,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, 'ashby', slug);
}

async function ingestSmartRecruitersBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=50`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`SmartRecruiters API returned ${res.status} for ${slug}`);
  }

  const data = (await res.json()) as { content?: SmartRecruitersPosting[] };
  const items = (data.content ?? []).slice(0, 50);
  const rows: UpsertJobRow[] = items.map((item) => {
    const descriptionParts = [
      item.jobAd?.sections?.companyDescription?.text ?? '',
      item.jobAd?.sections?.jobDescription?.text ?? '',
    ].filter(Boolean);
    const rawDescription = descriptionParts.join('\n\n');
    const cleanDescription = stripHtml(rawDescription);
    const locationParts = [item.location?.city, item.location?.country].filter(Boolean);
    const location = locationParts.join(', ') || null;
    const isRemote = item.location?.remote ?? false;
    const workMode = isRemote
      ? 'remote'
      : inferWorkMode(item.name, location, cleanDescription);
    const skills = extractJobSkills(item.name, cleanDescription);
    const postedAt = item.releasedDate ? new Date(item.releasedDate) : null;
    return {
      source: 'smartrecruiters',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.name,
      location,
      workMode,
      employmentType: item.typeOfEmployment?.id ?? 'full_time',
      url: item.ref ?? `https://jobs.smartrecruiters.com/${encodeURIComponent(slug)}/${item.id}`,
      description: cleanDescription.slice(0, 12000),
      skills,
      isActive: true,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, 'smartrecruiters', slug);
}

// ─── Job listing ──────────────────────────────────────────────────────────────

export type DiscoverJobsTab = 'for_you' | 'search' | 'adjacent' | 'saved';

export interface ListJobsOptions {
  tab?: DiscoverJobsTab;
  q?: string;
  workMode?: string;
  minScore?: number;
  freshness?: 'all' | '24h' | '7d' | '30d';
  seniority?: string;
  includeDismissed?: boolean;
  limit?: number;
}

function matchesSeniorityFilter(jobTitle: string, description: string, filter: string): boolean {
  if (!filter || filter === 'all') return true;
  const level = inferSeniorityLevel(jobTitle, description).toLowerCase();
  if (filter === 'junior') return level.includes('junior') || level.includes('entry');
  if (filter === 'mid') return level.includes('mid');
  if (filter === 'senior') return level.includes('senior');
  if (filter === 'staff') return level.includes('staff') || level.includes('lead');
  return true;
}

let initialJobsSeedPromise: Promise<void> | null = null;

async function ensureJobsSeededIfEmpty() {
  try {
    const [countRow] = await db
      .select({ total: count() })
      .from(jobs)
      .where(eq(jobs.isActive, true));
    if ((countRow?.total ?? 0) > 0) return;

    if (!initialJobsSeedPromise) {
      initialJobsSeedPromise = syncPublicJobs()
        .then(() => undefined)
        .catch((error) => {
          console.warn('[Jobs Seed] Initial public board sync skipped:', error);
        })
        .finally(() => {
          initialJobsSeedPromise = null;
        });
    }
    await initialJobsSeedPromise;
  } catch (error) {
    console.warn('[Jobs Seed] Failed checking job catalog count:', error);
  }
}

export async function listMatchedJobs(
  userId: string,
  options: ListJobsOptions = {}
): Promise<JobDto[]> {
  await ensureJobsSeededIfEmpty();
  const {
    tab,
    q,
    workMode,
    minScore = 0,
    freshness = 'all',
    seniority = 'all',
    includeDismissed = false,
    limit = 100,
  } = options;

  const conditions = [eq(jobs.isActive, true)];

  if (q && q.trim()) {
    // Use full-text search when available, fall back to ILIKE
    const term = q.trim();
    const sanitizedTerm = term.replace(/[^\w\s]/g, ' ').trim();
    if (sanitizedTerm) {
      conditions.push(
        or(
          sql`${jobs.searchVector} @@ plainto_tsquery('english', ${sanitizedTerm})`,
          ilike(jobs.company, `%${term}%`),
          ilike(jobs.location, `%${term}%`)
        )!
      );
    } else {
      conditions.push(
        or(
          ilike(jobs.title, `%${term}%`),
          ilike(jobs.company, `%${term}%`)
        )!
      );
    }
  }
  if (workMode && workMode !== 'all') {
    conditions.push(eq(jobs.workMode, workMode));
  }
  if (freshness && freshness !== 'all') {
    const now = Date.now();
    const hours = freshness === '24h' ? 24 : freshness === '7d' ? 24 * 7 : 24 * 30;
    const cutoff = new Date(now - hours * 60 * 60 * 1000);
    conditions.push(or(gte(jobs.postedAt, cutoff), gte(jobs.createdAt, cutoff))!);
  }

  const [jobRows, userProfile, userApps, userStates] = await Promise.all([
    db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(desc(jobs.postedAt), desc(jobs.createdAt))
      .limit(limit),
    getProfile(userId),
    db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        status: applications.status,
      })
      .from(applications)
      .where(eq(applications.userId, userId)),
    db
      .select({
        jobId: jobStates.jobId,
        state: jobStates.state,
      })
      .from(jobStates)
      .where(eq(jobStates.userId, userId)),
  ]);

  const appByJobId = new Map<string, { id: string; status: ApplicationStatus }>();
  for (const app of userApps) {
    if (app.jobId) {
      appByJobId.set(app.jobId, { id: app.id, status: app.status });
    }
  }

  const stateByJobId = new Map<string, 'saved' | 'dismissed'>();
  for (const row of userStates) {
    stateByJobId.set(row.jobId, row.state);
  }

  const excludedCompanies = new Set(
    (userProfile?.excludedCompanies ?? []).map((c) => c.trim().toLowerCase()).filter(Boolean)
  );

  let mapped: JobDto[] = jobRows.map((job) => {
    const match = computeJobMatch(userProfile, job);
    const existingApp = appByJobId.get(job.id);
    const userState: JobUserState = stateByJobId.get(job.id) ?? null;
    return {
      id: job.id,
      source: job.source,
      externalId: job.externalId,
      company: job.company,
      title: job.title,
      location: job.location,
      workMode: job.workMode,
      employmentType: job.employmentType,
      url: job.url,
      description: job.description,
      skills: job.skills,
      postedAt: job.postedAt ? job.postedAt.toISOString() : null,
      createdAt: job.createdAt.toISOString(),
      match,
      userState,
      applicationId: existingApp?.id ?? null,
      applicationStatus: existingApp?.status ?? null,
    };
  });

  if (!includeDismissed) {
    mapped = mapped.filter((j) => j.userState !== 'dismissed');
  }

  if (tab === 'for_you' || tab === 'adjacent') {
    mapped = mapped.filter((j) => !excludedCompanies.has(j.company.toLowerCase()));
  }

  if (tab === 'adjacent') {
    mapped = mapped.filter((j) => j.match.isAdjacentRole);
  } else if (tab === 'saved') {
    mapped = mapped.filter(
      (j) => j.userState === 'saved' || j.applicationStatus === 'saved'
    );
  }

  if (minScore > 0) {
    mapped = mapped.filter((j) => j.match.score >= minScore);
  }

  if (seniority && seniority !== 'all') {
    mapped = mapped.filter((j) => matchesSeniorityFilter(j.title, j.description, seniority));
  }

  // Sort highest match first (tie-breaking by recency)
  mapped.sort((a, b) => b.match.score - a.match.score);
  return mapped;
}

export async function getJobDetail(
  userId: string,
  jobId: string
): Promise<JobDetailDto | null> {
  const [jobRow] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!jobRow) return null;

  const [userProfile, appRows, stateRows, tailoredCountRows] = await Promise.all([
    getProfile(userId),
    db
      .select({ id: applications.id, status: applications.status })
      .from(applications)
      .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
      .limit(1),
    db
      .select({ state: jobStates.state })
      .from(jobStates)
      .where(and(eq(jobStates.userId, userId), eq(jobStates.jobId, jobId)))
      .limit(1),
    db
      .select({ value: count() })
      .from(tailoredDocuments)
      .where(and(eq(tailoredDocuments.userId, userId), eq(tailoredDocuments.jobId, jobId))),
  ]);

  const match = computeJobMatch(userProfile, jobRow);
  const intelligence = analyzeJobIntelligence(jobRow);
  const existingApp = appRows[0];

  return {
    id: jobRow.id,
    source: jobRow.source,
    externalId: jobRow.externalId,
    company: jobRow.company,
    title: jobRow.title,
    location: jobRow.location,
    workMode: jobRow.workMode,
    employmentType: jobRow.employmentType,
    url: jobRow.url,
    description: jobRow.description,
    skills: jobRow.skills,
    postedAt: jobRow.postedAt ? jobRow.postedAt.toISOString() : null,
    createdAt: jobRow.createdAt.toISOString(),
    match,
    userState: stateRows[0]?.state ?? null,
    applicationId: existingApp?.id ?? null,
    applicationStatus: existingApp?.status ?? null,
    intelligence,
    tailoredDocumentsCount: Number(tailoredCountRows[0]?.value ?? 0),
  };
}

export async function setJobState(
  userId: string,
  jobId: string,
  state: 'saved' | 'dismissed'
): Promise<{
  userState: 'saved' | 'dismissed';
  applicationId: string | null;
  applicationStatus: ApplicationStatus | null;
} | null> {
  const [jobRow] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!jobRow) return null;

  await db
    .insert(jobStates)
    .values({
      userId,
      jobId,
      state,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [jobStates.userId, jobStates.jobId],
      set: { state, updatedAt: new Date() },
    });

  const [existingApp] = await db
    .select({ id: applications.id, status: applications.status })
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.jobId, jobId)))
    .limit(1);

  if (state === 'saved' && !existingApp) {
    const profile = await getProfile(userId);
    const match = computeJobMatch(profile, jobRow);
    const [createdApp] = await db
      .insert(applications)
      .values({
        userId,
        jobId: jobRow.id,
        company: jobRow.company,
        title: jobRow.title,
        location: jobRow.location,
        url: jobRow.url,
        status: 'saved',
        matchScore: match.score,
      })
      .returning({ id: applications.id, status: applications.status });

    if (createdApp) {
      await db.insert(applicationEvents).values({
        applicationId: createdApp.id,
        userId,
        type: 'created',
        description: 'Saved from Discover Jobs',
      });
      return {
        userState: state,
        applicationId: createdApp.id,
        applicationStatus: createdApp.status,
      };
    }
  }

  return {
    userState: state,
    applicationId: existingApp?.id ?? null,
    applicationStatus: existingApp?.status ?? null,
  };
}

export async function clearJobState(
  userId: string,
  jobId: string
): Promise<boolean> {
  const deleted = await db
    .delete(jobStates)
    .where(and(eq(jobStates.userId, userId), eq(jobStates.jobId, jobId)))
    .returning({ id: jobStates.id });
  return deleted.length > 0;
}
