import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/session';
import { syncPublicJobs } from '@/lib/server/jobs';
import { syncCuratedCompanyCatalog } from '@/lib/server/jobs/universal-job-broker';

const syncSchema = z
  .object({
    provider: z.enum(['greenhouse', 'lever', 'ashby']).optional(),
    slug: z.string().trim().min(1).max(100).optional(),
    companyName: z.string().trim().min(1).max(100).optional(),
    tier: z
      .enum(['all', 'tier_1_global', 'tier_2_india_unicorns', 'tier_3_growth_startups'])
      .optional(),
    country: z.enum(['all', 'india', 'us', 'global']).optional(),
  })
  .optional();

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const text = await request.text();
    if (text) {
      const parsed = syncSchema.safeParse(JSON.parse(text));
      if (!parsed.success) {
        return NextResponse.json(
          { detail: parsed.error.issues.map((i) => i.message).join(', ') },
          { status: 400 }
        );
      }

      if (parsed.data?.tier || parsed.data?.country) {
        const result = await syncCuratedCompanyCatalog({
          tier: parsed.data.tier,
          country: parsed.data.country,
          maxCompanies: 25,
        });
        return NextResponse.json(result);
      }

      if (parsed.data?.provider && parsed.data?.slug && parsed.data?.companyName) {
        const result = await syncPublicJobs([
          {
            provider: parsed.data.provider,
            slug: parsed.data.slug,
            companyName: parsed.data.companyName,
          },
        ]);
        return NextResponse.json(result);
      }
    }

    // Default sync across top curated companies
    const result = await syncCuratedCompanyCatalog({
      tier: 'all',
      maxCompanies: 20,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to sync jobs:', error);
    return NextResponse.json(
      { detail: 'Failed to sync job opportunities' },
      { status: 500 }
    );
  }
}
