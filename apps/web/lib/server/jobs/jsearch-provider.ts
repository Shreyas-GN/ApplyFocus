import { stripHtml, inferWorkMode, extractJobSkills } from '../job-matching';
import type { jobs } from '@/lib/db/schema';

type UpsertJobRow = typeof jobs.$inferInsert;

interface JSearchJobItem {
  job_id: string;
  employer_name: string;
  employer_logo?: string;
  job_title: string;
  job_publisher?: string;
  job_employment_type?: string;
  job_apply_link?: string;
  job_description?: string;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_is_remote?: boolean;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_posted_at_timestamp?: number;
}

interface JSearchResponse {
  status: string;
  data?: JSearchJobItem[];
}

export async function queryJSearchJobs(params: {
  query: string;
  location?: string;
  page?: number;
  numPages?: number;
}): Promise<UpsertJobRow[]> {
  const apiKey =
    process.env.JSEARCH_API_KEY ||
    process.env.RAPIDAPI_KEY ||
    process.env.RAPID_API_KEY;

  if (!apiKey) {
    return [];
  }

  const fullQuery = [params.query, params.location].filter(Boolean).join(' in ');
  const url = new URL('https://jsearch.p.rapidapi.com/search');
  url.searchParams.set('query', fullQuery);
  url.searchParams.set('page', String(params.page || 1));
  url.searchParams.set('num_pages', String(params.numPages || 1));

  const res = await fetch(url.toString(), {
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'jsearch.p.rapidapi.com',
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    console.warn(`[JSearch] Search failed with status ${res.status}`);
    return [];
  }

  const json = (await res.json()) as JSearchResponse;
  const items = json.data ?? [];

  return items.map((item) => {
    const cleanDescription = stripHtml(item.job_description ?? '');
    const locationParts = [item.job_city, item.job_state, item.job_country].filter(Boolean);
    const location = locationParts.join(', ') || (item.job_is_remote ? 'Remote' : null);
    const workMode = item.job_is_remote
      ? 'remote'
      : inferWorkMode(item.job_title, location, cleanDescription);
    const skills = extractJobSkills(item.job_title, cleanDescription);

    // Normalize publisher (Naukri, Indeed, LinkedIn, Glassdoor, etc.)
    let platform = item.job_publisher ?? 'Indeed';
    if (platform.toLowerCase().includes('naukri')) platform = 'Naukri.com';
    else if (platform.toLowerCase().includes('linkedin')) platform = 'LinkedIn';
    else if (platform.toLowerCase().includes('indeed')) platform = 'Indeed';
    else if (platform.toLowerCase().includes('glassdoor')) platform = 'Glassdoor';

    const postedAt = item.job_posted_at_timestamp
      ? new Date(item.job_posted_at_timestamp * 1000)
      : new Date();

    return {
      source: 'jsearch',
      sourcePlatform: platform,
      externalId: `jsearch:${item.job_id}`,
      company: item.employer_name,
      companyLogo: item.employer_logo ?? null,
      title: item.job_title,
      location,
      workMode,
      employmentType: (item.job_employment_type || 'full_time').toLowerCase(),
      url: item.job_apply_link || `https://www.google.com/search?q=${encodeURIComponent(item.job_title + ' ' + item.employer_name)}`,
      directApplyUrl: item.job_apply_link ?? null,
      salaryMin: item.job_min_salary ? Math.round(item.job_min_salary) : null,
      salaryMax: item.job_max_salary ? Math.round(item.job_max_salary) : null,
      salaryCurrency: item.job_salary_currency ?? null,
      description: cleanDescription.slice(0, 14000),
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    };
  });
}

