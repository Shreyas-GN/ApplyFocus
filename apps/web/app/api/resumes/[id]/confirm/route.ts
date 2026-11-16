import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { confirmResume } from '@/lib/server/resumes';
import { generateAndPersistCapabilityProfile } from '@/lib/server/candidate-understanding';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await confirmResume(user.id, id);

    // Fire-and-forget: build a fresh capability assessment after the profile is updated.
    // Does not block the confirm response or fail it.
    generateAndPersistCapabilityProfile(user.id, 'resume_confirmed', id).catch(
      (err) =>
        console.error('[confirm] Capability assessment failed:', err)
    );

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to confirm resume.';
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}

