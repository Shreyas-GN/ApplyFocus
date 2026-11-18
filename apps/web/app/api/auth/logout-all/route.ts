import { NextResponse } from 'next/server';
import {
  clearSessionCookie,
  deleteAllSessions,
  getUser,
} from '@/lib/auth/session';

export async function POST() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }
  await deleteAllSessions(user.id);
  await clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
