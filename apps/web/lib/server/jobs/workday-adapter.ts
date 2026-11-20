import { stripHtml, inferWorkMode, extractJobSkills } from '../job-matching';
import { computeAtsFingerprint } from './listing-fingerprint';
import type { jobs } from '@/lib/db/schema';

type UpsertJobRow = typeof jobs.$inferInsert;

export interface WorkdayBoardConfig {
  host: string; // e.g. "nvidia.wd5.myworkdayjobs.com"
  companySlug: string; // e.g. "nvidia"
  siteId: string; // e.g. "NVIDIAExternalCareerSite"
  companyName: string; // e.g. "NVIDIA"
  maxJobs?: number; // Cap per run (default 30)
}

export interface WorkdayJobPostingSummary {
  title: string;
  externalPath: string; // e.g. "/job/USA-CA-Santa-Clara/Software-Engineer_JR123"
  locationsText?: string;
  postedOn?: string;
  bulletFields?: string[];
}

export interface WorkdayListResponse {
  total?: number;
  jobPostings?: WorkdayJobPostingSummary[];
}

export interface WorkdayDetailResponse {
  jobPostingInfo?: {
    id?: string;
    title?: string;
    externalUrl?: string;
    jobDescription?: string;
    location?: string;
    timeType?: string;
    startDate?: string;
    postedOn?: string;
    compensation?: string;
  };
}

const LOCALE_REGEX = /^[a-z]{2}(?:-[A-Za-z]{2})?$/;
const WORKDAY_HOST_REGEX = /^([a-z0-9-]+)(\.wd\d+)?\.myworkdayjobs\.com$/i;

/**
 * Parses a raw Workday career URL into host, company slug, and site ID.
 *
 * Examples:
 *   https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite
 *   -> host: "nvidia.wd5.myworkdayjobs.com", companySlug: "nvidia", siteId: "NVIDIAExternalCareerSite"
 */
export function parseWorkdayBoardUrl(rawUrl: string): {
  host: string;
  companySlug: string;
  siteId: string;
} | null {
  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    const match = WORKDAY_HOST_REGEX.exec(host);
    if (!match) return null;

    const companySlug = match[1]?.toLowerCase() || '';
    const segments = parsed.pathname.split('/').filter(Boolean);

    // Skip locale segment (e.g. 'en-US', 'de', 'fr-FR')
    let siteIdx = 0;
    if (segments[0] && LOCALE_REGEX.test(segments[0])) {
      siteIdx = 1;
    }

    const siteId = segments[siteIdx] || '';
    if (!companySlug || !siteId) return null;

    return {
      host,
      companySlug,
      siteId,
    };
  } catch {
    return null;
  }
}

/**
 * Global mutex for polite pacing across Workday requests.
 * Standard delay: 400ms between calls to avoid triggering shared infrastructure rate limits.
 */
let nextAllowedWorkdayCall = 0;
export const WORKDAY_POLITE_GAP_MS = 400;

export interface ParsedCompensation {
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
}

export function parseCompensationString(raw?: string | null): ParsedCompensation {
  if (!raw || typeof raw !== 'string') {
    return { salaryMin: null, salaryMax: null, salaryCurrency: null };
  }

  const clean = raw.trim();
  if (!clean) {
    return { salaryMin: null, salaryMax: null, salaryCurrency: null };
  }

  // Detect currency
  let salaryCurrency: string | null = null;
  if (/\$|USD/i.test(clean)) salaryCurrency = 'USD';
  else if (/€|EUR/i.test(clean)) salaryCurrency = 'EUR';
  else if (/£|GBP/i.test(clean)) salaryCurrency = 'GBP';
  else if (/₹|INR/i.test(clean)) salaryCurrency = 'INR';
  else if (/CAD/i.test(clean)) salaryCurrency = 'CAD';
  else if (/AUD/i.test(clean)) salaryCurrency = 'AUD';

  // Check if hourly or annual
  const isHourly = /\b(?:hour|hourly|hr|\/hr)\b/i.test(clean);

  // Extract all numeric figures (e.g. "120,000", "120000", "65.50")
  const matches = clean.match(/(?:[\d]{1,3}(?:,[\d]{3})+|\d+)(?:\.\d+)?/g);
  if (!matches || matches.length === 0) {
    return { salaryMin: null, salaryMax: null, salaryCurrency };
  }

  const numbers = matches
    .map((m) => parseFloat(m.replace(/,/g, '')))
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (numbers.length === 0) {
    return { salaryMin: null, salaryMax: null, salaryCurrency };
  }

  let minVal = numbers[0]!;
  let maxVal = numbers.length > 1 ? numbers[1]! : minVal;

  if (minVal > maxVal) {
    const temp = minVal;
    minVal = maxVal;
    maxVal = temp;
  }

  // Annualize hourly rates (standard 2,080 hours/year) to align with integer annual schema
  if (isHourly && maxVal < 500) {
    minVal = Math.round(minVal * 2080);
    maxVal = Math.round(maxVal * 2080);
  } else {
    minVal = Math.round(minVal);
    maxVal = Math.round(maxVal);
  }

  return {
    salaryMin: minVal,
    salaryMax: maxVal,
    salaryCurrency,
  };
}

export async function politeWorkdayFetch(
  url: string,
  options: RequestInit = {},
  maxRetries = 1
): Promise<Response> {
  let attempt = 0;
  while (attempt <= maxRetries) {
    const now = Date.now();
    const waitMs = Math.max(0, nextAllowedWorkdayCall - now);
    nextAllowedWorkdayCall = Math.max(now, nextAllowedWorkdayCall) + WORKDAY_POLITE_GAP_MS;

    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }

    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ApplyFocus-JobBroker/1.0',
        ...(options.headers || {}),
      },
      signal: options.signal || AbortSignal.timeout(10000),
    });

    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = res.headers.get('retry-after');
      let backoffMs = 1000;
      if (retryAfter) {
        const parsedSec = parseInt(retryAfter, 10);
        if (!Number.isNaN(parsedSec) && parsedSec > 0) {
          backoffMs = Math.min(parsedSec * 1000, 5000);
        }
      }
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    return res;
  }

  return fetch(url, options);
}

/**
 * Extracts posting ID from Workday external path.
 * In Workday, path is typically: "/job/Location-Name/Job-Title_JR123456"
 */
export function extractWorkdayPostingId(externalPath: string): string {
  const clean = externalPath.split('?')[0] || '';
  const segments = clean.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || '';
  const lastUnderscore = lastSegment.lastIndexOf('_');

  if (lastUnderscore !== -1 && lastUnderscore < lastSegment.length - 1) {
    return lastSegment.slice(lastUnderscore + 1);
  }

  return lastSegment || `wd-${Date.now()}`;
}

/**
 * Ingests job postings from a Workday career board using its public CXS JSON API.
 */
export async function ingestWorkdayBoardDirect(
  config: WorkdayBoardConfig
): Promise<UpsertJobRow[]> {
  const { host, companySlug, siteId, companyName, maxJobs = 30 } = config;
  const listEndpoint = `https://${host}/wday/cxs/${companySlug}/${siteId}/jobs`;

  const limit = Math.min(20, maxJobs);
  let offset = 0;
  const summaries: WorkdayJobPostingSummary[] = [];

  // 1. Fetch job posting summaries with pagination
  while (summaries.length < maxJobs) {
    try {
      const res = await politeWorkdayFetch(listEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          appliedFacets: {},
          limit,
          offset,
          searchText: '',
        }),
      });

      if (res.status === 429) {
        console.warn(`[Workday Ingest] Rate limited (429) on ${companySlug}. Halting batch.`);
        break;
      }

      if (!res.ok) {
        console.warn(`[Workday Ingest] List HTTP error ${res.status} on ${companySlug}`);
        break;
      }

      const data = (await res.json()) as WorkdayListResponse;
      const postings = data.jobPostings || [];
      if (postings.length === 0) break;

      summaries.push(...postings);
      offset += postings.length;

      const total = data.total ?? postings.length;
      if (offset >= total) break;
    } catch (err) {
      console.warn(`[Workday Ingest] List fetch failed on ${companySlug}:`, err);
      break;
    }
  }

  const selectedSummaries = summaries.slice(0, maxJobs);
  const rows: UpsertJobRow[] = [];

  // 2. Fetch full job details for each selected summary
  for (const summary of selectedSummaries) {
    const postingId = extractWorkdayPostingId(summary.externalPath);
    const detailEndpoint = `https://${host}/wday/cxs/${companySlug}/${siteId}${summary.externalPath}`;
    const directUrl = `https://${host}/${siteId}${summary.externalPath}`;

    let description = '';
    let employmentType = 'full_time';
    let location = summary.locationsText || null;
    let postedAt: Date | null = null;
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;
    let salaryCurrency: string | null = null;

    try {
      const detailRes = await politeWorkdayFetch(detailEndpoint, { method: 'GET' });
      if (detailRes.ok) {
        const detailData = (await detailRes.json()) as WorkdayDetailResponse;
        const info = detailData.jobPostingInfo;
        if (info?.jobDescription) {
          description = stripHtml(info.jobDescription);
        }
        if (info?.location) {
          location = info.location;
        }
        if (info?.timeType) {
          employmentType = info.timeType.toLowerCase().includes('part')
            ? 'part_time'
            : 'full_time';
        }
        if (info?.startDate) {
          const d = new Date(info.startDate);
          if (!Number.isNaN(d.getTime())) postedAt = d;
        }
        if (info?.compensation) {
          const parsedComp = parseCompensationString(info.compensation);
          salaryMin = parsedComp.salaryMin;
          salaryMax = parsedComp.salaryMax;
          salaryCurrency = parsedComp.salaryCurrency;
        }
      }
    } catch {
      // Fallback: continue with summary-level info if detail fetch fails
    }

    const cleanTitle = summary.title.trim();
    const workMode = inferWorkMode(cleanTitle, location, description);
    const skills = extractJobSkills(cleanTitle, description);
    const fingerprint = computeAtsFingerprint({
      atsProvider: 'workday',
      boardSlug: companySlug,
      postingId,
    });

    rows.push({
      source: 'workday',
      sourcePlatform: 'Workday ATS',
      externalId: `${companySlug}:${postingId}`,
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
      postedAt,
    });
  }

  return rows;
}

