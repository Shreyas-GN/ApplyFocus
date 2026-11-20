import { createHash } from 'node:crypto';

export type AtsProviderName =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'workday'
  | 'smartrecruiters'
  | 'custom';

export interface AtsTriple {
  atsProvider: AtsProviderName;
  boardSlug: string;
  postingId: string;
}

/**
 * Normalizes input strings by trimming whitespace and lowercasing.
 * Strips non-alphanumeric trailing tokens while preserving standard identifiers.
 */
function normalizeToken(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
}

/**
 * Computes an immutable, deterministic SHA-256 ATS-native fingerprint from the
 * primary triple: (ats_provider, board_slug, posting_id).
 *
 * Example:
 *   atsProvider: 'greenhouse', boardSlug: 'stripe', postingId: '6145321'
 *   -> SHA-256("greenhouse:stripe:6145321")
 */
export function computeAtsFingerprint(triple: AtsTriple): string {
  const provider = normalizeToken(triple.atsProvider);
  const slug = normalizeToken(triple.boardSlug);
  const id = normalizeToken(triple.postingId);

  if (!provider || !slug || !id) {
    throw new Error(
      `Invalid ATS Triple for fingerprinting: provider="${provider}", slug="${slug}", id="${id}"`
    );
  }

  return createHash('sha256')
    .update(`${provider}:${slug}:${id}`)
    .digest('hex');
}

/**
 * Fallback deterministic fingerprint for jobs without a recognized primary ATS triple
 * (e.g., jobs from aggregators, direct career pages, or manual listings).
 * Normalizes company, title, and location into a canonical hash.
 */
export function computeFallbackFingerprint(params: {
  company: string;
  title: string;
  location?: string | null;
}): string {
  const normCompany = normalizeToken(params.company).replace(/[^a-z0-9]/g, '');
  const normTitle = normalizeToken(params.title).replace(/[^a-z0-9]/g, '');
  const normLoc = normalizeToken(params.location || 'remote').replace(/[^a-z0-9]/g, '');

  if (!normCompany || !normTitle) {
    throw new Error('Fallback fingerprint requires non-empty company and title');
  }

  return createHash('sha256')
    .update(`fallback:${normCompany}:${normTitle}:${normLoc}`)
    .digest('hex');
}

/**
 * Parses known ATS employer/posting URLs to extract the native ATS Triple.
 * Supports Greenhouse, Lever, Ashby, Workday, and SmartRecruiters.
 */
export function extractAtsTripleFromUrl(rawUrl: string): AtsTriple | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const parsed = new URL(rawUrl.trim());
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    // 1. Greenhouse
    // Patterns:
    //   boards.greenhouse.io/{slug}/jobs/{id}
    //   job-boards.greenhouse.io/{slug}/jobs/{id}
    //   boards.greenhouse.io/embed/job_app?for={slug}&token={id}
    if (host.includes('greenhouse.io')) {
      const parts = pathname.split('/').filter(Boolean);
      const jobsIdx = parts.indexOf('jobs');
      const nextPart = jobsIdx !== -1 ? parts[jobsIdx + 1] : undefined;
      if (jobsIdx !== -1 && nextPart) {
        const slug = parts[jobsIdx - 1] || parsed.searchParams.get('for') || '';
        if (slug) {
          return {
            atsProvider: 'greenhouse',
            boardSlug: slug,
            postingId: nextPart,
          };
        }
      }
      const token = parsed.searchParams.get('token');
      const forParam = parsed.searchParams.get('for');
      if (token && forParam) {
        return {
          atsProvider: 'greenhouse',
          boardSlug: forParam,
          postingId: token,
        };
      }
    }

    // 2. Lever
    // Pattern: jobs.lever.co/{slug}/{id}
    if (host.includes('lever.co')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return {
          atsProvider: 'lever',
          boardSlug: parts[0],
          postingId: parts[1].split('?')[0] || parts[1],
        };
      }
    }

    // 3. Ashby
    // Pattern: jobs.ashbyhq.com/{slug}/{id}
    if (host.includes('ashbyhq.com')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return {
          atsProvider: 'ashby',
          boardSlug: parts[0],
          postingId: parts[1].split('?')[0] || parts[1],
        };
      }
    }

    // 4. Workday
    // Pattern: {company}.wd{N}.myworkdayjobs.com/[locale/]{site}/job/[location/]{title}_{id}
    if (host.includes('myworkdayjobs.com')) {
      const company = host.split('.')[0];
      const parts = pathname.split('/').filter(Boolean);
      const jobIdx = parts.indexOf('job');
      if (company && jobIdx !== -1 && parts.length > jobIdx + 1) {
        // The last path segment holds the job title and requisition ID
        const rawJobPath = parts[parts.length - 1];
        if (rawJobPath) {
          const lastUnderscore = rawJobPath.lastIndexOf('_');
          const postingId =
            lastUnderscore !== -1 && lastUnderscore < rawJobPath.length - 1
              ? rawJobPath.slice(lastUnderscore + 1)
              : rawJobPath;
          return {
            atsProvider: 'workday',
            boardSlug: company.toLowerCase(),
            postingId,
          };
        }
      }
    }

    // 5. SmartRecruiters
    // Pattern: jobs.smartrecruiters.com/{slug}/{id}
    if (host.includes('smartrecruiters.com')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return {
          atsProvider: 'smartrecruiters',
          boardSlug: parts[0].toLowerCase(),
          postingId: parts[1].split('?')[0] || parts[1],
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolves a canonical fingerprint for any job posting candidate.
 * Attempts ATS extraction first, falling back to company + title + location.
 */
export function resolveJobFingerprint(job: {
  source?: string | null;
  externalId?: string | null;
  url: string;
  directApplyUrl?: string | null;
  company: string;
  title: string;
  location?: string | null;
}): string {
  // Check if direct apply or standard URL maps to a known ATS
  const urlTriple =
    (job.directApplyUrl ? extractAtsTripleFromUrl(job.directApplyUrl) : null) ||
    extractAtsTripleFromUrl(job.url);

  if (urlTriple) {
    return computeAtsFingerprint(urlTriple);
  }

  // If source is a known ATS and externalId contains slug:id
  if (
    job.source &&
    ['greenhouse', 'lever', 'ashby', 'workday', 'smartrecruiters'].includes(
      job.source.toLowerCase()
    ) &&
    job.externalId
  ) {
    const parts = job.externalId.split(':');
    if (parts.length >= 2 && parts[0]) {
      return computeAtsFingerprint({
        atsProvider: job.source.toLowerCase() as AtsProviderName,
        boardSlug: parts[0],
        postingId: parts.slice(1).join(':'),
      });
    }
    return computeAtsFingerprint({
      atsProvider: job.source.toLowerCase() as AtsProviderName,
      boardSlug: job.company,
      postingId: job.externalId,
    });
  }

  // Fallback to normalized content hash
  return computeFallbackFingerprint({
    company: job.company,
    title: job.title,
    location: job.location,
  });
}
