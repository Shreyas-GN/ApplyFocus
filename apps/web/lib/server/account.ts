import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, resumes, users } from '@/lib/db/schema';
import { stackServerApp } from '@/lib/auth/stack-server';
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
  // 1. Look up the Stack Auth ID for this user
  const [appUser] = await db
    .select({ stackAuthId: users.stackAuthId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!appUser) {
    throw new Error('User not found.');
  }

  // 2. Delete the Stack Auth user (this deletes the auth record)
  const stackUser = await stackServerApp.getUser(appUser.stackAuthId);
  if (stackUser) {
    await stackUser.delete();
  }

  // 3. Delete the local user record — cascades to all user tables and resume_files
  await db.delete(users).where(eq(users.id, userId));
}

