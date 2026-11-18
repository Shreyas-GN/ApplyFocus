import { NextResponse } from 'next/server';
import {
  clearSessionCookie,
  deleteSession,
  readSessionCookie,
} from '@/lib/auth/session';

export async function POST() {
  const raw = await readSessionCookie();
  if (raw) await deleteSession(raw);
  await clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
