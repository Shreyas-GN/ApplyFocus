import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/session';
import { searchAndIngestLiveJobs } from '@/lib/server/jobs';

const liveSearchSchema = z.object({
  query: z.string().trim().min(1, 'Query is required').max(150),
  location: z.string().trim().max(100).optional(),
  countryCode: z.string().trim().max(10).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = liveSearchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { query, location, countryCode } = parsed.data;
    const result = await searchAndIngestLiveJobs(user.id, {
      query,
      location,
      countryCode,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed live multi-platform job search:', error);
    return NextResponse.json(
      { detail: 'Failed to search live jobs from external platforms' },
      { status: 500 }
    );
  }
}

