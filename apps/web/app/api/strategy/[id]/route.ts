import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/auth';
import { approveStrategy } from '@/lib/server/strategy';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const updated = await approveStrategy(user.id, id);
    if (!updated) {
      return NextResponse.json({ detail: 'Strategy not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update strategy:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}
