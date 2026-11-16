import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { profiles } from '@/lib/db/schema';
import { stackServerApp } from '@/lib/auth/stack-server';

function sanitizeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return '/dashboard';
  }
  return raw;
}

async function ensureProfileRow(userId: string) {
  try {
    await db.insert(profiles).values({ id: userId }).onConflictDoNothing();
  } catch (error) {
    console.warn('[Auth Confirm] Profile provision warning:', error);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = sanitizeNextPath(searchParams.get('next'));

  if (code) {
    const user = await stackServerApp.getUser({ or: 'return-null' });
    if (user) {
      await ensureProfileRow(user.id);
      return NextResponse.redirect(new URL(next, request.nextUrl.origin));
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=invalid_or_expired_token', request.nextUrl.origin)
  );
}
