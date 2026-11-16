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

// Fallback if job_boards table is empty on first run (before seed migration)
const FALLBACK_BOARDS: BoardSource[] = [
  { provider: 'greenhouse', slug: 'vercel', companyName: 'Vercel' },
  { provider: 'greenhouse', slug: 'anthropic', companyName: 'Anthropic' },
  { provider: 'greenhouse', slug: 'stripe', companyName: 'Stripe' },
  { provider: 'greenhouse', slug: 'figma', companyName: 'Figma' },
];

async function loadActiveBoards(): Promise<BoardSource[]> {
  try {
    const rows = await db
      .select({
        provider: jobBoards.provider,
        slug: jobBoards.slug,
        companyName: jobBoards.companyName,
      })
      .from(jobBoards)
      .where(eq(jobBoards.isActive, true));

    if (rows.length > 0) {
      return rows.map((r) => ({
        provider: r.provider as BoardSource['provider'],
        slug: r.slug,
        companyName: r.companyName,
      }));
    }
  } catch {
    // DB not migrated yet — fall through to fallback
  }
  return FALLBACK_BOARDS;
}

async function updateBoardSyncStatus(
  provider: string,
  slug: string,
  status: 'ok' | 'failed'
): Promise<void> {
  try {
    if (status === 'ok') {
      await db
        .update(jobBoards)
        .set({ lastSyncedAt: new Date(), lastSyncStatus: 'ok', failureCount: 0 })
        .where(and(eq(jobBoards.provider, provider), eq(jobBoards.slug, slug)));
    } else {
      await db
        .update(jobBoards)
        .set({
          lastSyncedAt: new Date(),
          lastSyncStatus: 'failed',
          failureCount: sql`${jobBoards.failureCount} + 1`,
        })
        .where(and(eq(jobBoards.provider, provider), eq(jobBoards.slug, slug)));
    }
  } catch {
    // Non-fatal — board status tracking is best-effort
  }
}

// ─── Shared interfaces ───────────────────────────────────────────────────────

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

interface AshbyJob {
  id: string;
  title: string;
  employmentType?: string;
  applicationLink: string;
  location?: { name?: string };
  descriptionHtml?: string;
  publishedAt?: string;
}

interface SmartRecruitersPosting {
  id: string;
  name: string;
  location?: { city?: string; country?: string; remote?: boolean };
  typeOfEmployment?: { id: string };
  releasedDate?: string;
  ref: string;
}

interface SmartRecruitersResponse {
  content: SmartRecruitersPosting[];
  totalFound: number;
  limit: number;
  offset: number;
}

// ─── Upsert (with FTS vector + stale detection) ──────────────────────────────

type UpsertJobRow = typeof jobs.$inferInsert;

async function upsertJobBatch(
  rows: UpsertJobRow[],
  opts?: { markStaleFor?: { source: string; company: string } }
): Promise<number> {
  if (rows.length === 0) {
    // If stale detection requested on empty response, skip — likely a source failure.
    return 0;
  }

  const dedupedMap = new Map<string, UpsertJobRow>();
  for (const row of rows) {
    dedupedMap.set(`${row.source}:${row.externalId}`, row);
  }
  const deduped = [...dedupedMap.values()];

  await db
    .insert(jobs)
    .values(
      deduped.map((row) => ({
        ...row,
        isActive: true,
        searchVector: sql`
          setweight(to_tsvector('english', coalesce(${row.title}, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(${row.company}, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(${row.location ?? ''}, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(array_to_string(${sql.raw(`ARRAY[${(row.skills ?? []).map((s) => `'${s.replace(/'/g, "''")}'`).join(',')}]::text[]`)}, ' '), '')), 'B') ||
          setweight(to_tsvector('english', coalesce(left(${row.description ?? ''}, 4000), '')), 'C')
        `,
      }))
    )
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
        searchVector: sql`
          setweight(to_tsvector('english', coalesce(excluded.title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(excluded.company, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(excluded.location, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(array_to_string(excluded.skills, ' '), '')), 'B') ||
          setweight(to_tsvector('english', coalesce(left(excluded.description, 4000), '')), 'C')
        `,
      },
    });

  if (opts?.markStaleFor) {
    const { source: src, company } = opts.markStaleFor;
    const seenIds = deduped.map((r) => r.externalId);
    if (seenIds.length > 0) {
      await db
        .update(jobs)
        .set({ isActive: false })
        .where(
          and(
            eq(jobs.source, src),
            eq(jobs.company, company),
            eq(jobs.isActive, true),
            notInArray(jobs.externalId, seenIds)
          )
        );
    }
  }

  return deduped.length;
}

// ─── Greenhouse ──────────────────────────────────────────────────────────────

async function ingestGreenhouseBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Greenhouse API returned ${res.status}`);
  }

  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const items = data.jobs ?? [];
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
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, { markStaleFor: { source: 'greenhouse', company: companyName } });
}

// ─── Lever ───────────────────────────────────────────────────────────────────

async function ingestLeverBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Lever API returned ${res.status}`);
  }

  const items = (await res.json()) as LeverPosting[];
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
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, { markStaleFor: { source: 'lever', company: companyName } });
}

// ─── Ashby ───────────────────────────────────────────────────────────────────

function mapAshbyEmploymentType(raw?: string): string {
  switch (raw) {
    case 'FullTime': return 'full_time';
    case 'PartTime': return 'part_time';
    case 'Contract':
    case 'Contractor': return 'contract';
    case 'Intern':
    case 'Internship': return 'internship';
    default: return 'full_time';
  }
}

async function ingestAshbyBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Ashby API returned ${res.status}`);
  }

  const data = (await res.json()) as { jobs?: AshbyJob[] };
  const items = data.jobs ?? [];
  const rows: UpsertJobRow[] = items.map((item) => {
    const cleanDescription = stripHtml(item.descriptionHtml ?? '');
    const location = item.location?.name ?? null;
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.publishedAt ? new Date(item.publishedAt) : null;
    return {
      source: 'ashby',
      externalId: `ashby:${slug}:${item.id}`,
      company: companyName,
      title: item.title,
      location,
      workMode,
      employmentType: mapAshbyEmploymentType(item.employmentType),
      url: item.applicationLink,
      description: cleanDescription.slice(0, 12000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, { markStaleFor: { source: 'ashby', company: companyName } });
}

// ─── SmartRecruiters ─────────────────────────────────────────────────────────

function mapSmartRecruitersEmploymentType(raw?: string): string {
  switch (raw) {
    case 'permanent': return 'full_time';
    case 'contract':
    case 'freelance': return 'contract';
    case 'part_time': return 'part_time';
    case 'internship': return 'internship';
    default: return 'full_time';
  }
}

async function fetchSmartRecruitersDescription(jobUrl: string): Promise<string> {
  try {
    const res = await fetch(jobUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return '';
    const html = await res.text();
    return stripHtml(html).slice(0, 12000);
  } catch {
    return '';
  }
}

async function ingestSmartRecruitersBoard(
  slug: string,
  companyName: string
): Promise<number> {
  const MAX_JOBS = 500;
  const PAGE_SIZE = 100;
  const allItems: SmartRecruitersPosting[] = [];

  let offset = 0;
  let totalFound = 0;

  do {
    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      if (offset === 0) throw new Error(`SmartRecruiters API returned ${res.status}`);
      break; // Stop pagination on subsequent page failures
    }

    const page = (await res.json()) as SmartRecruitersResponse;
    totalFound = page.totalFound ?? 0;
    allItems.push(...(page.content ?? []));
    offset += PAGE_SIZE;
  } while (offset < totalFound && allItems.length < MAX_JOBS);

  // Fetch descriptions in parallel, up to 5 at a time
  const CONCURRENCY = 5;
  const descriptions: string[] = new Array(allItems.length).fill('');
  for (let i = 0; i < allItems.length; i += CONCURRENCY) {
    const batch = allItems.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((item) => fetchSmartRecruitersDescription(item.ref))
    );
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') descriptions[i + idx] = r.value;
    });
  }

  const rows: UpsertJobRow[] = allItems.map((item, idx) => {
    const cleanDescription = descriptions[idx] ?? '';
    const locationParts = [item.location?.city, item.location?.country].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(', ') : null;
    const workMode = item.location?.remote
      ? 'remote'
      : inferWorkMode(item.name, location, cleanDescription);
    const skills = extractJobSkills(item.name, cleanDescription);
    const postedAt = item.releasedDate ? new Date(item.releasedDate) : null;
    return {
      source: 'smartrecruiters',
      externalId: `smartrecruiters:${slug}:${item.id}`,
      company: companyName,
      title: item.name,
      location,
      workMode,
      employmentType: mapSmartRecruitersEmploymentType(item.typeOfEmployment?.id),
      url: item.ref,
      description: cleanDescription,
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });

  return upsertJobBatch(rows, { markStaleFor: { source: 'smartrecruiters', company: companyName } });
}

// ─── Sync orchestrator ────────────────────────────────────────────────────────

export async function syncPublicJobs(
  customBoards?: BoardSource[]
): Promise<{ synced: number; boardsChecked: number }> {
  const boards =
    customBoards && customBoards.length > 0 ? customBoards : await loadActiveBoards();
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
      // Workday: no public API; login-protected ATS instances are out of scope.
      totalSynced += count;
      await updateBoardSyncStatus(board.provider, board.slug, 'ok');
    } catch (error) {
      console.warn(
        `[Jobs Sync] Failed syncing ${board.provider}:${board.slug}`,
        error
      );
      await updateBoardSyncStatus(board.provider, board.slug, 'failed');
    }
  }

  return { synced: totalSynced, boardsChecked: boards.length };
}

// ─── Job listing / retrieval ──────────────────────────────────────────────────

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

import type { ProfileDto } from '@/lib/types';

function buildCandidateQuery(profile: ProfileDto | null): string | null {
  if (!profile) return null;
  const terms = [
    ...(profile.preferredTitles ?? []),
    ...(profile.desiredRoles ?? []),
    ...(profile.skills ?? [])
      .filter(
        (s) =>
          s.source !== 'ai' &&
          (s.proficiency === 'expert' || s.proficiency === 'proficient')
      )
      .slice(0, 8)
      .map((s) => s.name),
  ]
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (terms.length === 0) return null;
  return terms.join(' OR ');
}

let initialJobsSeedPromise: Promise<void> | null = null;

async function ensureJobsSeededIfEmpty() {
  try {
    const [countRow] = await db.select({ total: count() }).from(jobs);
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

  const conditions: ReturnType<typeof eq>[] = [];

  // Active-only filter, except for saved tab (users should still see jobs they saved that are now inactive)
  if (tab !== 'saved') {
    conditions.push(eq(jobs.isActive, true));
  }

  if (q && q.trim()) {
    // Use FTS for keyword search
    conditions.push(
      sql`${jobs.searchVector} @@ websearch_to_tsquery('english', ${q.trim()})`
    );
  } else if (tab === 'for_you') {
    // Candidate-aware query expansion — will be applied after profile is loaded
    // (defer to post-query since profile isn't loaded yet here)
  }

  if (workMode && workMode !== 'all') {
    conditions.push(eq(jobs.workMode, workMode));
  }
  if (freshness && freshness !== 'all') {
    const now = Date.now();
    const hours = freshness === '24h' ? 24 : freshness === '7d' ? 24 * 7 : 24 * 30;
    const cutoff = new Date(now - hours * 60 * 60 * 1000);
    conditions.push(sql`(${jobs.postedAt} >= ${cutoff} OR ${jobs.createdAt} >= ${cutoff})`);
  }

  const [jobRows, userProfile, userApps, userStates] = await Promise.all([
    db
      .select()
      .from(jobs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
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

  // If for_you tab with no explicit query and profile has preferences, do a secondary FTS pass
  // to supplement results when the base fetch returns fewer than limit
  let supplementaryRows: typeof jobRows = [];
  if (tab === 'for_you' && !q && userProfile) {
    const candidateQuery = buildCandidateQuery(userProfile);
    if (candidateQuery && jobRows.length < limit) {
      try {
        const supplementary = await db
          .select()
          .from(jobs)
          .where(
            and(
              eq(jobs.isActive, true),
              sql`${jobs.searchVector} @@ websearch_to_tsquery('english', ${candidateQuery})`
            )
          )
          .orderBy(desc(jobs.postedAt), desc(jobs.createdAt))
          .limit(limit);

        const existingIds = new Set(jobRows.map((r) => r.id));
        supplementaryRows = supplementary.filter((r) => !existingIds.has(r.id));
      } catch {
        // FTS failure is non-fatal; continue with base results
      }
    }
  }

  const allRows = [...jobRows, ...supplementaryRows].slice(0, limit);

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

  let mapped: JobDto[] = allRows.map((job) => {
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
