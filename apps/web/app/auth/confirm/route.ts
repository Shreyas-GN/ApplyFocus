import { type NextRequest, NextResponse } from 'next/server';
import { db, profiles } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth/session';

function sanitizeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard';
  }
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = sanitizeNextPath(searchParams.get('next'));
  const user = await getUser();
  if (user) {
    try {
      const existing = await db
        .select({ id: profiles.id })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(profiles).values({ id: user.id });
      }
    } catch (e) {
      console.warn('[Auth Confirm] Profile provision warning:', e);
    }
  }
  return NextResponse.redirect(new URL(next, request.nextUrl.origin));
}
