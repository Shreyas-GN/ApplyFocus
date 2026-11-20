import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/session';
import { listMatchedJobs, type DiscoverJobsTab } from '@/lib/server/jobs';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { computeJobMatch, extractJobSkills, inferWorkMode, stripHtml } from '@/lib/server/job-matching';
import { getProfile } from '@/lib/server/profile';

const VALID_TABS = new Set<DiscoverJobsTab>(['for_you', 'search', 'adjacent', 'saved']);
const VALID_FRESHNESS = new Set(['all', '24h', '7d', '30d']);

const postJobSchema = z.object({
  company: z.string().trim().min(1, 'Company is required').max(100),
  title: z.string().trim().min(1, 'Job title is required').max(150),
  location: z.string().trim().max(100).optional().nullable(),
  workMode: z.enum(['remote', 'hybrid', 'onsite']).optional().nullable(),
  employmentType: z.string().trim().max(50).optional().nullable(),
  sourcePlatform: z.string().trim().max(100).optional().nullable(),
  url: z.string().trim().optional().nullable(),
  directApplyUrl: z.string().trim().optional().nullable(),
  salaryMin: z.number().int().positive().optional().nullable(),
  salaryMax: z.number().int().positive().optional().nullable(),
  salaryCurrency: z.string().trim().max(10).optional().nullable(),
  description: z.string().trim().min(10, 'Job description must be at least 10 characters'),
  skills: z.array(z.string().trim()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawTab = searchParams.get('tab');
    const tab =
      rawTab && VALID_TABS.has(rawTab as DiscoverJobsTab)
        ? (rawTab as DiscoverJobsTab)
        : undefined;
    const q = searchParams.get('q') ?? undefined;
    const workMode = searchParams.get('workMode') ?? undefined;
    const platform = searchParams.get('platform') ?? undefined;
    const seniority = searchParams.get('seniority') ?? undefined;
    const rawMinScore = searchParams.get('minScore');
    const minScore = rawMinScore ? Number.parseInt(rawMinScore, 10) || 0 : 0;
    const rawFreshness = searchParams.get('freshness');
    const freshness =
      rawFreshness && VALID_FRESHNESS.has(rawFreshness)
        ? (rawFreshness as 'all' | '24h' | '7d' | '30d')
        : 'all';
    const includeDismissed = searchParams.get('includeDismissed') === 'true';

    const results = await listMatchedJobs(user.id, {
      tab,
      q,
      workMode,
      platform,
      minScore,
      freshness,
      seniority,
      includeDismissed,
    });
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to list matched jobs:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await request.json();
    const parsed = postJobSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const cleanDesc = stripHtml(data.description);
    const location = data.location || null;
    const workMode = data.workMode || inferWorkMode(data.title, location, cleanDesc);
    const skills =
      data.skills && data.skills.length > 0
        ? data.skills
        : extractJobSkills(data.title, cleanDesc);

    const extId = `post:${user.id}:${Date.now()}`;
    const sourcePlatform = data.sourcePlatform || 'Verified Direct Post';
    const canonicalUrl =
      data.url ||
      data.directApplyUrl ||
      `https://applyfocus.local/jobs/${extId}`;

    const [createdJob] = await db
      .insert(jobs)
      .values({
        source: 'manual',
        sourcePlatform,
        externalId: extId,
        company: data.company,
        title: data.title,
        location,
        workMode,
        employmentType: data.employmentType || 'full_time',
        url: canonicalUrl,
        directApplyUrl: data.directApplyUrl || null,
        salaryMin: data.salaryMin || null,
        salaryMax: data.salaryMax || null,
        salaryCurrency:
          data.salaryCurrency ||
          (data.location?.toLowerCase().includes('india') ? 'INR' : 'USD'),
        description: cleanDesc.slice(0, 14000),
        skills,
        postedAt: new Date(),
      })
      .returning();

    if (!createdJob) {
      return NextResponse.json({ detail: 'Failed to create job posting' }, { status: 500 });
    }

    const profile = await getProfile(user.id);
    const match = computeJobMatch(profile, createdJob);

    return NextResponse.json({
      id: createdJob.id,
      source: createdJob.source,
      sourcePlatform: createdJob.sourcePlatform,
      externalId: createdJob.externalId,
      company: createdJob.company,
      companyLogo: createdJob.companyLogo ?? null,
      title: createdJob.title,
      location: createdJob.location,
      workMode: createdJob.workMode,
      employmentType: createdJob.employmentType,
      url: createdJob.url,
      directApplyUrl: createdJob.directApplyUrl,
      salaryMin: createdJob.salaryMin,
      salaryMax: createdJob.salaryMax,
      salaryCurrency: createdJob.salaryCurrency,
      description: createdJob.description,
      skills: createdJob.skills,
      postedAt: createdJob.postedAt?.toISOString() ?? new Date().toISOString(),
      createdAt: createdJob.createdAt.toISOString(),
      match,
      userState: null,
      applicationId: null,
      applicationStatus: null,
    });
  } catch (error) {
    console.error('Failed to post manual job:', error);
    return NextResponse.json({ detail: 'Failed to create job listing' }, { status: 500 });
  }
}
