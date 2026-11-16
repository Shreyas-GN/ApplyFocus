import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import {
  generateAndPersistCapabilityProfile,
  getLatestCapabilityProfileRecord,
} from '@/lib/server/candidate-understanding';

/** GET /api/intelligence/candidate — return the latest stored assessment. */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const record = await getLatestCapabilityProfileRecord(user.id);
    if (!record) {
      return NextResponse.json({ detail: 'No assessment available yet. POST to generate one.' }, { status: 404 });
    }
    return NextResponse.json(record);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load assessment.';
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

/** POST /api/intelligence/candidate — trigger a fresh assessment synchronously. */
export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    await generateAndPersistCapabilityProfile(user.id, 'manual', null);
    const record = await getLatestCapabilityProfileRecord(user.id);
    if (!record) {
      return NextResponse.json(
        { detail: 'Assessment ran but could not be retrieved.' },
        { status: 500 }
      );
    }
    return NextResponse.json(record, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Assessment failed.';
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
