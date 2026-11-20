import { and, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { CURATED_COMPANY_REGISTRY } from './curated-registry';
import { ingestAshbyBoard } from './ashby-ingestor';
import { ingestWorkdayBoardDirect } from './workday-adapter';
import { ingestSmartRecruitersBoardDirect } from './smartrecruiters-adapter';
import { resolveJobFingerprint } from './listing-fingerprint';
import { queryJSearchJobs } from './jsearch-provider';
import { queryGoogleJobsViaSerper } from './serper-jobs-provider';
import { queryAdzunaJobs } from './adzuna-provider';
import { stripHtml, inferWorkMode, extractJobSkills } from '../job-matching';

type UpsertJobRow = typeof jobs.$inferInsert;

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

async function ingestGreenhouseBoardDirect(
  slug: string,
  companyName: string
): Promise<UpsertJobRow[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Greenhouse API ${res.status}`);

  const data = (await res.json()) as { jobs?: GreenhouseJob[] };
  const items = (data.jobs ?? []).slice(0, 30);
  return items.map((item) => {
    const cleanDescription = stripHtml(item.content ?? '');
    const location = item.location?.name ?? null;
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.updated_at ? new Date(item.updated_at) : null;
    return {
      source: 'greenhouse',
      sourcePlatform: 'Greenhouse ATS',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.title,
      location,
      workMode,
      employmentType: 'full_time',
      url: item.absolute_url,
      directApplyUrl: item.absolute_url,
      description: cleanDescription.slice(0, 14000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });
}

async function ingestLeverBoardDirect(
  slug: string,
  companyName: string
): Promise<UpsertJobRow[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Lever API ${res.status}`);

  const items = ((await res.json()) as LeverPosting[]).slice(0, 30);
  return items.map((item) => {
    const cleanDescription =
      item.descriptionPlain ?? stripHtml(item.description ?? '');
    const location = item.categories?.location ?? null;
    const workMode = inferWorkMode(item.text, location, cleanDescription);
    const skills = extractJobSkills(item.text, cleanDescription);
    const postedAt = item.createdAt ? new Date(item.createdAt) : null;
    return {
      source: 'lever',
      sourcePlatform: 'Lever ATS',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.text,
      location,
      workMode,
      employmentType: item.categories?.commitment ?? 'full_time',
      url: item.hostedUrl,
      directApplyUrl: item.hostedUrl,
      description: cleanDescription.slice(0, 14000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });
}

const DIRECT_ATS_SOURCES = new Set([
  'greenhouse',
  'lever',
  'ashby',
  'workday',
  'smartrecruiters',
]);

function isDirectAtsSource(source: string): boolean {
  return DIRECT_ATS_SOURCES.has(source.toLowerCase());
}

export async function upsertUniversalJobs(rows: UpsertJobRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const dedupedMap = new Map<string, UpsertJobRow>();

  for (const row of rows) {
    if (!row.fingerprint) {
      row.fingerprint = resolveJobFingerprint({
        source: row.source,
        externalId: row.externalId,
        url: row.url,
        directApplyUrl: row.directApplyUrl,
        company: row.company,
        title: row.title,
        location: row.location,
      });
    }
    if (!row.status) {
      row.status = 'active';
    }

    const existing = dedupedMap.get(row.fingerprint);
    if (!existing) {
      dedupedMap.set(row.fingerprint, row);
    } else {
      // Prioritize direct ATS sources over aggregator syndications
      if (isDirectAtsSource(row.source) && !isDirectAtsSource(existing.source)) {
        dedupedMap.set(row.fingerprint, {
          ...row,
          salaryMin: row.salaryMin ?? existing.salaryMin,
          salaryMax: row.salaryMax ?? existing.salaryMax,
          salaryCurrency: row.salaryCurrency ?? existing.salaryCurrency,
        });
      } else if (!isDirectAtsSource(row.source) && isDirectAtsSource(existing.source)) {
        existing.salaryMin = existing.salaryMin ?? row.salaryMin;
        existing.salaryMax = existing.salaryMax ?? row.salaryMax;
        existing.salaryCurrency = existing.salaryCurrency ?? row.salaryCurrency;
      } else {
        if ((row.description?.length ?? 0) > (existing.description?.length ?? 0)) {
          dedupedMap.set(row.fingerprint, row);
        }
      }
    }
  }

  const deduped = [...dedupedMap.values()];

  // Pre-heal: if legacy rows in DB have NULL fingerprint matching incoming (source, externalId),
  // assign their fingerprint so they participate cleanly in fingerprint uniqueness
  try {
    const legacyMatches = await db
      .select({ id: jobs.id, source: jobs.source, externalId: jobs.externalId })
      .from(jobs)
      .where(
        and(
          isNull(jobs.fingerprint),
          or(
            ...deduped.map((d) =>
              and(eq(jobs.source, d.source), eq(jobs.externalId, d.externalId))
            )
          )
        )
      );

    for (const legacy of legacyMatches) {
      const match = deduped.find(
        (d) => d.source === legacy.source && d.externalId === legacy.externalId
      );
      if (match?.fingerprint) {
        await db
          .update(jobs)
          .set({ fingerprint: match.fingerprint })
          .where(eq(jobs.id, legacy.id));
      }
    }
  } catch {
    // If running in environment where fingerprint column is not yet queried, continue
  }

  await db
    .insert(jobs)
    .values(deduped)
    .onConflictDoUpdate({
      target: jobs.fingerprint,
      set: {
        sourcePlatform: sql`COALESCE(excluded.source_platform, ${jobs.sourcePlatform})`,
        companyLogo: sql`COALESCE(excluded.company_logo, ${jobs.companyLogo})`,
        title: sql`excluded.title`,
        location: sql`COALESCE(excluded.location, ${jobs.location})`,
        workMode: sql`COALESCE(excluded.work_mode, ${jobs.workMode})`,
        url: sql`CASE WHEN ${jobs.source} IN ('greenhouse', 'lever', 'ashby', 'workday', 'smartrecruiters') THEN ${jobs.url} ELSE excluded.url END`,
        directApplyUrl: sql`COALESCE(excluded.direct_apply_url, ${jobs.directApplyUrl})`,
        salaryMin: sql`COALESCE(excluded.salary_min, ${jobs.salaryMin})`,
        salaryMax: sql`COALESCE(excluded.salary_max, ${jobs.salaryMax})`,
        salaryCurrency: sql`COALESCE(excluded.salary_currency, ${jobs.salaryCurrency})`,
        description: sql`CASE WHEN length(excluded.description) > length(${jobs.description}) THEN excluded.description ELSE ${jobs.description} END`,
        skills: sql`excluded.skills`,
        status: sql`excluded.status`,
        postedAt: sql`COALESCE(excluded.posted_at, ${jobs.postedAt})`,
      },
    });

  return deduped.length;
}

export async function searchLiveMultiPlatformJobs(params: {
  query: string;
  location?: string;
  countryCode?: string;
  limit?: number;
}): Promise<{ totalIngested: number; jobs: UpsertJobRow[] }> {
  const query = params.query.trim();
  if (!query) return { totalIngested: 0, jobs: [] };

  const collectedRows: UpsertJobRow[] = [];

  // 1. Check if user query matches any curated company in our registry (e.g. "Swiggy", "Stripe", "OpenAI", "Razorpay")
  const matchedCompany = CURATED_COMPANY_REGISTRY.find(
    (c) =>
      c.companyName.toLowerCase().includes(query.toLowerCase()) ||
      c.slug.toLowerCase().includes(query.toLowerCase())
  );

  if (matchedCompany) {
    try {
      if (matchedCompany.provider === 'greenhouse') {
        const ghRows = await ingestGreenhouseBoardDirect(matchedCompany.slug, matchedCompany.companyName);
        collectedRows.push(...ghRows);
      } else if (matchedCompany.provider === 'lever') {
        const levRows = await ingestLeverBoardDirect(matchedCompany.slug, matchedCompany.companyName);
        collectedRows.push(...levRows);
      } else if (matchedCompany.provider === 'ashby') {
        const ashRows = await ingestAshbyBoard(matchedCompany.slug, matchedCompany.companyName);
        collectedRows.push(...ashRows);
      } else if (matchedCompany.provider === 'workday' && matchedCompany.workdayHost && matchedCompany.workdaySiteId) {
        const wdRows = await ingestWorkdayBoardDirect({
          host: matchedCompany.workdayHost,
          companySlug: matchedCompany.slug,
          siteId: matchedCompany.workdaySiteId,
          companyName: matchedCompany.companyName,
        });
        collectedRows.push(...wdRows);
      } else if (matchedCompany.provider === 'smartrecruiters') {
        const srRows = await ingestSmartRecruitersBoardDirect(matchedCompany.slug, matchedCompany.companyName);
        collectedRows.push(...srRows);
      }
    } catch (err) {
      console.warn(`[LiveSearch] Direct ATS ingest failed for ${matchedCompany.companyName}:`, err);
    }
  }

  // 2. Query Live Aggregated Engines in Parallel (Google Jobs / Serper, JSearch, Adzuna)
  const providerPromises = [
    queryGoogleJobsViaSerper({ query, location: params.location }).catch((e) => {
      console.warn('[LiveSearch] Serper provider skipped:', e);
      return [];
    }),
    queryJSearchJobs({ query, location: params.location }).catch((e) => {
      console.warn('[LiveSearch] JSearch provider skipped:', e);
      return [];
    }),
    queryAdzunaJobs({ query, location: params.location, countryCode: params.countryCode }).catch((e) => {
      console.warn('[LiveSearch] Adzuna provider skipped:', e);
      return [];
    }),
  ];

  const providerResults = await Promise.all(providerPromises);
  for (const res of providerResults) {
    collectedRows.push(...res);
  }

  // 3. Persist and cache discovered jobs in the database
  const totalIngested = await upsertUniversalJobs(collectedRows);

  return { totalIngested, jobs: collectedRows };
}

export async function syncCuratedCompanyCatalog(options?: {
  tier?: string;
  country?: string;
  maxCompanies?: number;
}): Promise<{ synced: number; companiesChecked: number }> {
  let companies = CURATED_COMPANY_REGISTRY;
  if (options?.tier && options.tier !== 'all') {
    companies = companies.filter((c) => c.tier === options.tier);
  }
  if (options?.country && options.country !== 'all') {
    companies = companies.filter((c) => c.country === options.country || c.country === 'global');
  }

  const selected = options?.maxCompanies ? companies.slice(0, options.maxCompanies) : companies.slice(0, 30);
  let totalSynced = 0;

  for (const comp of selected) {
    try {
      let rows: UpsertJobRow[] = [];
      if (comp.provider === 'greenhouse') {
        rows = await ingestGreenhouseBoardDirect(comp.slug, comp.companyName);
      } else if (comp.provider === 'lever') {
        rows = await ingestLeverBoardDirect(comp.slug, comp.companyName);
      } else if (comp.provider === 'ashby') {
        rows = await ingestAshbyBoard(comp.slug, comp.companyName);
      } else if (comp.provider === 'workday' && comp.workdayHost && comp.workdaySiteId) {
        rows = await ingestWorkdayBoardDirect({
          host: comp.workdayHost,
          companySlug: comp.slug,
          siteId: comp.workdaySiteId,
          companyName: comp.companyName,
        });
      } else if (comp.provider === 'smartrecruiters') {
        rows = await ingestSmartRecruitersBoardDirect(comp.slug, comp.companyName);
      }
      const count = await upsertUniversalJobs(rows);
      totalSynced += count;
    } catch (err) {
      console.warn(`[CatalogSync] Failed syncing ${comp.companyName}:`, err);
    }
  }

  return { synced: totalSynced, companiesChecked: selected.length };
}

