import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/session';
import { getOrComputeRequirementMatch } from '@/lib/server/requirement-matching';

const uuidSchema = z.string().uuid();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  const { id: jobId } = await params;
  if (!uuidSchema.safeParse(jobId).success) {
    return NextResponse.json({ detail: 'Invalid job ID' }, { status: 400 });
  }

  try {
    const result = await getOrComputeRequirementMatch(user.id, jobId);
    if (!result) {
      return NextResponse.json({ detail: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Job Requirements GET] error:', error);
    return NextResponse.json(
      { detail: 'Failed to load requirement matches' },
      { status: 500 }
    );
  }
}

