import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth/server';
import { db, screeningAnswers } from '@/lib/db';

const patchSchema = z.object({
  answer: z.string().min(1).max(10000).optional(),
  approved: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const updates: Partial<typeof screeningAnswers.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (parsed.data.answer !== undefined) updates.answer = parsed.data.answer;
    if (parsed.data.approved !== undefined) updates.approved = parsed.data.approved;

    const [updated] = await db
      .update(screeningAnswers)
      .set(updates)
      .where(and(eq(screeningAnswers.id, id), eq(screeningAnswers.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ detail: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      jobId: updated.jobId,
      applicationId: updated.applicationId,
      question: updated.question,
      answer: updated.answer,
      groundedFacts: updated.groundedFacts,
      source: updated.source,
      approved: updated.approved,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to update screening answer:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
