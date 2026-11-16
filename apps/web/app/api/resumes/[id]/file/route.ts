import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth/server';
import { db } from '@/lib/db';
import { resumes, resumeFiles } from '@/lib/db/schema';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  const { id: resumeId } = await params;

  const [row] = await db
    .select({
      mimeType: resumes.mimeType,
      originalFilename: resumes.originalFilename,
      userId: resumes.userId,
      fileData: resumeFiles.fileData,
    })
    .from(resumes)
    .innerJoin(resumeFiles, eq(resumeFiles.resumeId, resumes.id))
    .where(eq(resumes.id, resumeId))
    .limit(1);

  if (!row || row.userId !== user.id) {
    return NextResponse.json({ detail: 'Resume not found.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(row.fileData), {
    status: 200,
    headers: {
      'Content-Type': row.mimeType,
      'Content-Disposition': `attachment; filename="${row.originalFilename}"`,
      'Cache-Control': 'private, no-cache',
    },
  });
}
