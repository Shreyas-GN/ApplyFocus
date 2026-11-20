import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUser } from '@/lib/auth/session';
import {
  executeResumeAiWorkflow,
  type ResumeAiWorkflowAction,
} from '@/lib/server/resume-ai-workflow';

const workflowRequestSchema = z.object({
  action: z.enum([
    'enhance_bullet_xyz',
    'bridge_keywords',
    'elevate_action_verbs',
    'synthesize_summary',
    'auto_optimize_ats',
  ]),
  bulletText: z.string().optional(),
  experienceIndex: z.number().int().min(0).optional(),
  bulletIndex: z.number().int().min(0).optional(),
  keywordsToBridge: z.array(z.string()).optional(),
  summaryStyle: z.enum(['leadership', 'technical', 'startup']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = workflowRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { detail: parsed.error.issues.map((i) => i.message).join(', ') },
        { status: 400 }
      );
    }

    const result = await executeResumeAiWorkflow(user.id, id, {
      action: parsed.data.action as ResumeAiWorkflowAction,
      bulletText: parsed.data.bulletText,
      experienceIndex: parsed.data.experienceIndex,
      bulletIndex: parsed.data.bulletIndex,
      keywordsToBridge: parsed.data.keywordsToBridge,
      summaryStyle: parsed.data.summaryStyle,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Resume AI workflow execution failed:', error);
    const message = error instanceof Error ? error.message : 'AI workflow failed.';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ detail: message }, { status });
  }
}

