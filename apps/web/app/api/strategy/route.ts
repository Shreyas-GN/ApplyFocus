import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/supabase/auth';
import { createStrategy, listStrategies } from '@/lib/server/strategy';

export const maxDuration = 60;

const createStrategySchema = z.object({
  jobId: z.string().uuid(),
  applicationId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  if (!jobId) {
    return NextResponse.json({ detail: 'jobId is required' }, { status: 400 });
  }

  try {
    const strategies = await listStrategies(user.id, jobId);
    return NextResponse.json(strategies);
  } catch (error) {
    console.error('Failed to list strategies:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = createStrategySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }
    const strategy = await createStrategy(user.id, parsed.data);
    return NextResponse.json(strategy, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate strategy.';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ detail: message }, { status });
  }
}
