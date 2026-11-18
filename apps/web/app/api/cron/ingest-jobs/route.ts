import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredRateLimits } from '@/lib/auth/rate-limit';
import { purgeExpiredSessions } from '@/lib/auth/session';
import { syncPublicJobs } from '@/lib/server/jobs';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Housekeeping for auth tables rides along with the existing cron.
    await Promise.all([purgeExpiredSessions(), purgeExpiredRateLimits()]);
    const result = await syncPublicJobs();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Cron job ingestion failed:', error);
    return NextResponse.json(
      { detail: 'Job ingestion failed' },
      { status: 500 }
    );
  }
}

