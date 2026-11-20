import { stripHtml, inferWorkMode, extractJobSkills } from '../job-matching';
import type { jobs } from '@/lib/db/schema';

type UpsertJobRow = typeof jobs.$inferInsert;

interface AshbyCompensationTier {
  compensationTierSummary?: string;
  minAmount?: number;
  maxAmount?: number;
  currencyCode?: string;
}

interface AshbyJobItem {
  id: string;
  title: string;
  department?: string;
  location?: string;
  isRemote?: boolean;
  employmentType?: string;
  jobUrl?: string;
  applyUrl?: string;
  publishedAt?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
  compensation?: AshbyCompensationTier;
}

interface AshbyApiResponse {
  jobs?: AshbyJobItem[];
}

export async function ingestAshbyBoard(
  slug: string,
  companyName: string
): Promise<UpsertJobRow[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`Ashby API returned ${res.status} for ${slug}`);
  }

  const data = (await res.json()) as AshbyApiResponse;
  const items = (data.jobs ?? []).slice(0, 30);

  return items.map((item) => {
    const cleanDescription =
      item.descriptionPlain ?? stripHtml(item.descriptionHtml ?? '');
    const location = item.location ?? (item.isRemote ? 'Remote' : null);
    const workMode = item.isRemote
      ? 'remote'
      : inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.publishedAt ? new Date(item.publishedAt) : null;

    let salaryMin: number | undefined;
    let salaryMax: number | undefined;
    let salaryCurrency: string | undefined;

    if (item.compensation) {
      salaryMin = item.compensation.minAmount;
      salaryMax = item.compensation.maxAmount;
      salaryCurrency = item.compensation.currencyCode ?? 'USD';
    }

    const jobUrl =
      item.jobUrl ?? `https://jobs.ashbyhq.com/${slug}/${item.id}`;

    return {
      source: 'ashby',
      sourcePlatform: 'Ashby',
      externalId: `${slug}:${item.id}`,
      company: companyName,
      title: item.title,
      location,
      workMode,
      employmentType: item.employmentType
        ? item.employmentType.toLowerCase().replace('fulltime', 'full_time')
        : 'full_time',
      url: jobUrl,
      directApplyUrl: item.applyUrl ?? jobUrl,
      salaryMin,
      salaryMax,
      salaryCurrency,
      description: cleanDescription.slice(0, 14000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });
}

