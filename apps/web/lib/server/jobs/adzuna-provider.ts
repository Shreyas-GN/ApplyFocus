import { stripHtml, inferWorkMode, extractJobSkills } from '../job-matching';
import type { jobs } from '@/lib/db/schema';

type UpsertJobRow = typeof jobs.$inferInsert;

interface AdzunaJobItem {
  id: string;
  title: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  description?: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  created?: string;
}

interface AdzunaResponse {
  results?: AdzunaJobItem[];
}

export async function queryAdzunaJobs(params: {
  query: string;
  location?: string;
  countryCode?: string; // 'in' | 'us' | 'gb'
  page?: number;
}): Promise<UpsertJobRow[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    return [];
  }

  // Detect country code (default 'in' if location contains India/Bangalore/etc., else 'us')
  let country = params.countryCode || 'us';
  const locLower = (params.location || '').toLowerCase();
  if (
    locLower.includes('india') ||
    locLower.includes('bangalore') ||
    locLower.includes('bengaluru') ||
    locLower.includes('hyderabad') ||
    locLower.includes('pune') ||
    locLower.includes('mumbai') ||
    locLower.includes('delhi') ||
    locLower.includes('noida') ||
    locLower.includes('chennai')
  ) {
    country = 'in';
  }

  const page = params.page || 1;
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`);
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('what', params.query);
  if (params.location) {
    url.searchParams.set('where', params.location);
  }
  url.searchParams.set('content-type', 'application/json');

  const res = await fetch(url.toString(), {
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    console.warn(`[Adzuna] Search failed with status ${res.status}`);
    return [];
  }

  const json = (await res.json()) as AdzunaResponse;
  const items = json.results ?? [];

  return items.map((item) => {
    const cleanDescription = stripHtml(item.description ?? '');
    const location = item.location?.display_name ?? null;
    const company = item.company?.display_name ?? 'Hiring Organization';
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);
    const postedAt = item.created ? new Date(item.created) : new Date();

    return {
      source: 'adzuna',
      sourcePlatform: country === 'in' ? 'Naukri & Job Boards' : 'Indeed & Adzuna',
      externalId: `adzuna:${item.id}`,
      company,
      title: item.title,
      location,
      workMode,
      employmentType: 'full_time',
      url: item.redirect_url,
      directApplyUrl: item.redirect_url,
      salaryMin: item.salary_min ? Math.round(item.salary_min) : null,
      salaryMax: item.salary_max ? Math.round(item.salary_max) : null,
      salaryCurrency: country === 'in' ? 'INR' : 'USD',
      description: cleanDescription.slice(0, 14000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });
}

