import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth/session';
import { db, applications } from '@/lib/db';

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  try {
    const apps = await db
      .select({
        id: applications.id,
        title: applications.title,
        status: applications.status,
        appliedAt: applications.appliedAt,
        followUpAt: applications.followUpAt,
      })
      .from(applications)
      .where(eq(applications.userId, user.id));

    const total = apps.length;
    if (total === 0) {
      return NextResponse.json({
        total: 0,
        byStatus: {},
        responseRate: null,
        interviewConversionRate: null,
        offerRate: null,
        followUpsDue: 0,
        awaitingResponse: 0,
        topCategories: [],
        insights: [],
        sampleCount: 0,
      });
    }

    const byStatus: Record<string, number> = {};
    for (const app of apps) {
      byStatus[app.status] = (byStatus[app.status] ?? 0) + 1;
    }

    const applied =
      (byStatus['applied'] ?? 0) +
      (byStatus['under_review'] ?? 0) +
      (byStatus['assessment'] ?? 0) +
      (byStatus['interviewing'] ?? 0) +
      (byStatus['offer'] ?? 0) +
      (byStatus['rejected'] ?? 0);
    const interviewed =
      (byStatus['interviewing'] ?? 0) +
      (byStatus['offer'] ?? 0) +
      (byStatus['rejected'] ?? 0);
    const offered = byStatus['offer'] ?? 0;
    const awaitingResponse =
      (byStatus['applied'] ?? 0) + (byStatus['under_review'] ?? 0);

    const now = Date.now();
    const followUpsDue = apps.filter(
      (a) =>
        a.followUpAt &&
        new Date(a.followUpAt).getTime() <= now + 3 * 24 * 60 * 60 * 1000
    ).length;

    const responseRate =
      applied > 0
        ? Math.round(((applied - awaitingResponse) / applied) * 100)
        : null;
    const interviewConversionRate =
      applied > 0 ? Math.round((interviewed / applied) * 100) : null;
    const offerRate =
      applied > 0 ? Math.round((offered / applied) * 100) : null;

    const titleCounts: Record<string, number> = {};
    const titleInterviews: Record<string, number> = {};
    for (const app of apps) {
      const category = extractCategory(app.title);
      titleCounts[category] = (titleCounts[category] ?? 0) + 1;
      if (['interviewing', 'offer'].includes(app.status)) {
        titleInterviews[category] = (titleInterviews[category] ?? 0) + 1;
      }
    }

    const topCategories = Object.entries(titleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, count]) => ({
        category,
        count,
        interviews: titleInterviews[category] ?? 0,
      }));

    const insights: Array<{
      text: string;
      kind: 'positive' | 'neutral' | 'attention';
      sampleSize: number;
    }> = [];

    if (applied >= 3) {
      if (interviewConversionRate !== null && interviewConversionRate > 20) {
        insights.push({
          text: `${interviewConversionRate}% of your applications have reached interview stage — above average.`,
          kind: 'positive',
          sampleSize: applied,
        });
      } else if (
        interviewConversionRate !== null &&
        interviewConversionRate === 0 &&
        applied >= 5
      ) {
        insights.push({
          text: `No interviews from ${applied} applications. Consider reviewing your resume alignment with job requirements.`,
          kind: 'attention',
          sampleSize: applied,
        });
      }
    }

    if (awaitingResponse >= 3) {
      insights.push({
        text: `${awaitingResponse} applications are awaiting a response. Consider following up on the oldest ones.`,
        kind: 'neutral',
        sampleSize: awaitingResponse,
      });
    }

    if (followUpsDue > 0) {
      insights.push({
        text: `${followUpsDue} follow-up${followUpsDue === 1 ? '' : 's'} due within 3 days.`,
        kind: 'attention',
        sampleSize: followUpsDue,
      });
    }

    if (topCategories.length > 0 && applied >= 3) {
      const bestCategory = topCategories.find((c) => c.interviews > 0);
      if (bestCategory) {
        insights.push({
          text: `"${bestCategory.category}" roles have generated interview responses (${bestCategory.interviews} of ${bestCategory.count} applications).`,
          kind: 'positive',
          sampleSize: bestCategory.count,
        });
      }
    }

    return NextResponse.json({
      total,
      byStatus,
      responseRate,
      interviewConversionRate,
      offerRate,
      followUpsDue,
      awaitingResponse,
      topCategories,
      insights,
      sampleCount: applied,
    });
  } catch (error) {
    console.error('Failed to load application insights:', error);
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
  }
}

function extractCategory(title: string): string {
  const t = title.toLowerCase();
  if (/engineer|developer|programmer|swe|sde/.test(t)) return 'Software Engineering';
  if (/product manager|pm\b|product lead/.test(t)) return 'Product Management';
  if (/data scientist|ml\b|machine learning|ai researcher/.test(t)) return 'Data / ML';
  if (/design|ux|ui\b/.test(t)) return 'Design';
  if (/devops|platform|infra|sre|reliability/.test(t)) return 'DevOps / Platform';
  if (/analyst|analytics/.test(t)) return 'Analytics';
  if (/manager|director|vp |head of/.test(t)) return 'Management';
  if (/marketing|growth|seo/.test(t)) return 'Marketing';
  if (/sales|account exec|ae\b/.test(t)) return 'Sales';
  return 'Other';
}
