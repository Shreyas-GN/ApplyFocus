import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth/server';
import { db, screeningAnswers } from '@/lib/db';
import type { ScreeningAnswerDto } from '@/lib/types';

function toDto(row: typeof screeningAnswers.$inferSelect): ScreeningAnswerDto {
  return {
    id: row.id,
    jobId: row.jobId,
    applicationId: row.applicationId,
    question: row.question,
    answer: row.answer,
    groundedFacts: row.groundedFacts,
    source: row.source,
    approved: row.approved,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

const saveSchema = z.object({
  jobId: z.string().uuid().optional().nullable(),
  applicationId: z.string().uuid().optional().nullable(),
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(10000),
  groundedFacts: z.array(z.string()).default([]),
  source: z.string().default('claude'),
  approved: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const jobId = searchParams.get('jobId');
  const applicationId = searchParams.get('applicationId');

  const conditions = [eq(screeningAnswers.userId, user.id)];
  if (jobId) conditions.push(eq(screeningAnswers.jobId, jobId));
  if (applicationId) conditions.push(eq(screeningAnswers.applicationId, applicationId));

  const rows = await db
    .select()
    .from(screeningAnswers)
    .where(and(...conditions))
    .orderBy(desc(screeningAnswers.createdAt));

  return NextResponse.json(rows.map(toDto));
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(screeningAnswers)
      .values({
        userId: user.id,
        jobId: parsed.data.jobId ?? null,
        applicationId: parsed.data.applicationId ?? null,
        question: parsed.data.question,
        answer: parsed.data.answer,
        groundedFacts: parsed.data.groundedFacts,
        source: parsed.data.source,
        approved: parsed.data.approved,
      })
      .returning();

    return NextResponse.json(toDto(created!), { status: 201 });
  } catch (error) {
    console.error('Failed to save screening answer:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
