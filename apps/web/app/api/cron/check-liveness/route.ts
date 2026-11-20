import { NextRequest, NextResponse } from 'next/server';
import { checkJobBatchLiveness } from '@/lib/server/jobs/liveness-checker';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await checkJobBatchLiveness(50);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('Liveness cron failed:', error);
    return NextResponse.json({ detail: 'Liveness check failed' }, { status: 500 });
  }
}

