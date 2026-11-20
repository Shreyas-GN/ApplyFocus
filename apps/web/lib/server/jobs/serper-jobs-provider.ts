import { stripHtml, inferWorkMode, extractJobSkills } from '../job-matching';
import type { jobs } from '@/lib/db/schema';

type UpsertJobRow = typeof jobs.$inferInsert;

interface GoogleJobApplyOption {
  title?: string;
  link?: string;
}

interface GoogleJobItem {
  id?: string;
  title: string;
  companyName: string;
  location?: string;
  via?: string;
  description?: string;
  thumbnail?: string;
  applyOptions?: GoogleJobApplyOption[];
  detectedExtensions?: {
    posted_at?: string;
    schedule_type?: string;
    salary?: string;
  };
}

interface SerperJobsResponse {
  jobs?: GoogleJobItem[];
}

export async function queryGoogleJobsViaSerper(params: {
  query: string;
  location?: string;
  page?: number;
}): Promise<UpsertJobRow[]> {
  const apiKey =
    process.env.SERPER_API_KEY ||
    process.env.SERP_API_KEY ||
    process.env.SERPER_KEY;

  if (!apiKey) {
    return [];
  }

  const fullQuery = [params.query, params.location].filter(Boolean).join(' in ');
  const res = await fetch('https://google.serper.dev/jobs', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: fullQuery,
      page: params.page || 1,
    }),
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    console.warn(`[Serper Google Jobs] Search failed with status ${res.status}`);
    return [];
  }

  const json = (await res.json()) as SerperJobsResponse;
  const items = json.jobs ?? [];

  return items.map((item, idx) => {
    const cleanDescription = stripHtml(item.description ?? '');
    const location = item.location ?? null;
    const workMode = inferWorkMode(item.title, location, cleanDescription);
    const skills = extractJobSkills(item.title, cleanDescription);

    // Extract platform: "via Naukri.com" -> "Naukri.com", "via Indeed" -> "Indeed", "via LinkedIn" -> "LinkedIn"
    let platform = 'Google Jobs';
    if (item.via) {
      const rawVia = item.via.replace(/^via\s+/i, '').trim();
      if (rawVia.toLowerCase().includes('naukri')) platform = 'Naukri.com';
      else if (rawVia.toLowerCase().includes('indeed')) platform = 'Indeed';
      else if (rawVia.toLowerCase().includes('linkedin')) platform = 'LinkedIn';
      else if (rawVia.toLowerCase().includes('glassdoor')) platform = 'Glassdoor';
      else if (rawVia.toLowerCase().includes('foundit')) platform = 'Foundit';
      else platform = rawVia;
    }

    const directApply = item.applyOptions?.[0]?.link ?? null;
    const fallbackUrl =
      directApply ||
      `https://www.google.com/search?q=${encodeURIComponent(item.title + ' ' + item.companyName + ' job')}`;

    // Hash or generate external id
    const extId = item.id || `${item.companyName.toLowerCase().replace(/\s+/g, '-')}:${idx}:${Date.now()}`;

    return {
      source: 'google_jobs',
      sourcePlatform: platform,
      externalId: `google:${extId}`,
      company: item.companyName,
      companyLogo: item.thumbnail ?? null,
      title: item.title,
      location,
      workMode,
      employmentType: (item.detectedExtensions?.schedule_type || 'full_time')
        .toLowerCase()
        .replace(/\s+/g, '_'),
      url: fallbackUrl,
      directApplyUrl: directApply,
      description: cleanDescription.slice(0, 14000),
      skills,
      postedAt: new Date(),
    };
  });
}

