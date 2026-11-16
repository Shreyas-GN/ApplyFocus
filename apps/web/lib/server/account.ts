import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, neonUsers } from '@/lib/db/schema';
import type { AuditLogDto } from '@/lib/types';
import { listApplications } from './applications';
import { recordAudit } from './audit';
import { getProfile } from './profile';
import { listResumes } from './resumes';
import { listTailoredDocuments } from './tailoring';

export async function listAccountActivity(
  userId: string
): Promise<AuditLogDto[]> {
  const rows = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    metadata: (row.metadata as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function exportUserData(userId: string) {
  const [profile, userResumes, userApplications, tailoredDocs, activity] =
    await Promise.all([
      getProfile(userId),
      listResumes(userId),
      listApplications(userId),
      listTailoredDocuments(userId),
      listAccountActivity(userId),
    ]);

  await recordAudit(userId, 'account_data_exported', {
    resumeCount: userResumes.length,
    applicationCount: userApplications.length,
    tailoredDocumentCount: tailoredDocs.length,
  });

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile,
    resumes: userResumes,
    applications: userApplications,
    tailoredDocuments: tailoredDocs,
    recentActivity: activity,
  };
}

export async function deleteUserAccount(userId: string): Promise<void> {
  // Delete auth user from neon_auth.user — cascades across all user tables
  await db.delete(neonUsers).where(eq(neonUsers.id, userId));
}
