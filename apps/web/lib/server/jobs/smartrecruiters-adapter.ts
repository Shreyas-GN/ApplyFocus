import { stripHtml, inferWorkMode, extractJobSkills } from '../job-matching';
import { computeAtsFingerprint } from './listing-fingerprint';
import type { jobs } from '@/lib/db/schema';

type UpsertJobRow = typeof jobs.$inferInsert;

export interface SmartRecruitersPostingSummary {
  id: string;
  name: string;
  releasedDate?: string;
  location?: {
    city?: string;
    region?: string;
    country?: string;
    remote?: boolean;
  };
  typeOfEmployment?: {
    id?: string;
    label?: string;
  };
}

export interface SmartRecruitersListResponse {
  totalFound?: number;
  content?: SmartRecruitersPostingSummary[];
}

export interface SmartRecruitersDetailResponse {
  id?: string;
  name?: string;
  jobAd?: {
    sections?: {
      jobDescription?: { title?: string; text?: string };
      qualifications?: { title?: string; text?: string };
      additionalInformation?: { title?: string; text?: string };
    };
  };
  compensation?: {
    min?: number;
    max?: number;
    currency?: string;
  };
}

export interface SmartRecruitersBoardConfig {
  companySlug: string; // e.g. "square", "visa"
  companyName: string; // e.g. "Block / Square", "Visa"
  maxJobs?: number; // Cap per run (default 30)
}

/**
 * Ingests public job postings from SmartRecruiters for a given company slug.
 */
export async function ingestSmartRecruitersBoardDirect(
  configOrSlug: SmartRecruitersBoardConfig | string,
  companyNameParam?: string,
  maxJobsParam?: number
): Promise<UpsertJobRow[]> {
  const config: SmartRecruitersBoardConfig =
    typeof configOrSlug === 'string'
      ? {
          companySlug: configOrSlug,
          companyName: companyNameParam || configOrSlug,
          maxJobs: maxJobsParam ?? 30,
        }
      : configOrSlug;
  const { companySlug, companyName, maxJobs = 30 } = config;
  const slug = companySlug.trim().toLowerCase();
  const limit = Math.min(50, maxJobs);
  const listUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=${limit}`;

  let postings: SmartRecruitersPostingSummary[] = [];

  try {
    const res = await fetch(listUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ApplyFocus-JobBroker/1.0',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (res.status === 429) {
      console.warn(`[SmartRecruiters Ingest] Rate limited (429) on ${slug}`);
      return [];
    }

    if (!res.ok) {
      console.warn(`[SmartRecruiters Ingest] API error ${res.status} on ${slug}`);
      return [];
    }

    const data = (await res.json()) as SmartRecruitersListResponse;
    postings = (data.content || []).slice(0, maxJobs);
  } catch (err) {
    console.warn(`[SmartRecruiters Ingest] List fetch failed on ${slug}:`, err);
    return [];
  }

  const rows: UpsertJobRow[] = [];

  for (const item of postings) {
    const postingId = item.id;
    const detailUrl = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings/${encodeURIComponent(postingId)}`;
    const directUrl = `https://jobs.smartrecruiters.com/${encodeURIComponent(slug)}/${encodeURIComponent(postingId)}`;

    let description = '';
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    let salaryCurrency: string | null = null;

    try {
      const detailRes = await fetch(detailUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ApplyFocus-JobBroker/1.0',
        },
        signal: AbortSignal.timeout(8000),
      });

      if (detailRes.ok) {
        const detailData = (await detailRes.json()) as SmartRecruitersDetailResponse;
        const sections = detailData.jobAd?.sections;
        const descParts: string[] = [];
        if (sections?.jobDescription?.text) {
          descParts.push(sections.jobDescription.text);
        }
        if (sections?.qualifications?.text) {
          descParts.push(sections.qualifications.text);
        }
        if (sections?.additionalInformation?.text) {
          descParts.push(sections.additionalInformation.text);
        }
        description = stripHtml(descParts.join('\n\n'));

        if (detailData.compensation) {
          salaryMin = detailData.compensation.min ?? null;
          salaryMax = detailData.compensation.max ?? null;
          salaryCurrency = detailData.compensation.currency ?? null;
        }
      }
    } catch {
      // Continue with summary if detail fails
    }

    const locParts: string[] = [];
    if (item.location?.city) locParts.push(item.location.city);
    if (item.location?.region) locParts.push(item.location.region);
    if (item.location?.country) locParts.push(item.location.country.toUpperCase());
    const location = locParts.length > 0 ? locParts.join(', ') : null;

    let workMode = inferWorkMode(item.name, location, description);
    if (item.location?.remote) {
      workMode = 'remote';
    }

    const employmentType =
      item.typeOfEmployment?.id === 'part_time' ? 'part_time' : 'full_time';
    const cleanTitle = item.name.trim();
    const skills = extractJobSkills(cleanTitle, description);
    const postedAt = item.releasedDate ? new Date(item.releasedDate) : null;
    const fingerprint = computeAtsFingerprint({
      atsProvider: 'smartrecruiters',
      boardSlug: slug,
      postingId,
    });

    rows.push({
      source: 'smartrecruiters',
      sourcePlatform: 'SmartRecruiters ATS',
      externalId: `${slug}:${postingId}`,
      fingerprint,
      status: 'active',
      company: companyName,
      title: cleanTitle,
      location,
      workMode,
      employmentType,
      url: directUrl,
      directApplyUrl: directUrl,
      salaryMin,
      salaryMax,
      salaryCurrency,
      description: description.slice(0, 14000) || cleanTitle,
      skills,
      postedAt: postedAt && !Number.isNaN(postedAt.getTime()) ? postedAt : null,
    });
  }

  return rows;
}

