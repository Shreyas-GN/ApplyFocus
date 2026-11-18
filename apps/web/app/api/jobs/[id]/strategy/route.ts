import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/session';
import {
  approveStrategy,
  applicationStrategyContentSchema,
  generateAndSaveStrategy,
  getStrategyForJob,
} from '@/lib/server/strategy';

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
    const strategy = await getStrategyForJob(user.id, jobId);
    if (!strategy) {
      return NextResponse.json({ detail: 'No strategy found' }, { status: 404 });
    }
    return NextResponse.json(strategy);
  } catch (error) {
    console.error('[Strategy GET] error:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
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
    const strategy = await generateAndSaveStrategy(user.id, jobId);
    return NextResponse.json(strategy, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Strategy generation failed';
    console.error('[Strategy POST] error:', error);
    if (message.includes('Job not found')) {
      return NextResponse.json({ detail: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
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
    const body = await request.json();
    const { content } = z.object({ content: applicationStrategyContentSchema }).parse(body);
    const updated = await approveStrategy(user.id, jobId, content);
    if (!updated) {
      return NextResponse.json({ detail: 'Strategy not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { detail: error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }
    console.error('[Strategy PATCH] error:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
