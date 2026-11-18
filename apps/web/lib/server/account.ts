import { desc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  applicationEvents,
  applicationStrategies,
  applications,
  auditLogs,
  certifications,
  educationEntries,
  extensionSessions,
  jobStates,
  profiles,
  projects,
  resumeParsedData,
  resumes,
  screeningAnswers,
  skills,
  tailoredDocuments,
  workExperiences,
} from '@/lib/db/schema';
import { getAuth } from '@/lib/auth/server';
import { createStorageClient } from '@/lib/storage/client';
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
  // 1. Remove the user's private files from storage first so nothing orphans.
  const userResumes = await db
    .select({ storageKey: resumes.storageKey })
    .from(resumes)
    .where(eq(resumes.userId, userId));

  const storageKeys = userResumes
    .map((r) => r.storageKey)
    .filter((k): k is string => Boolean(k));

  if (storageKeys.length > 0) {
    const { error: storageError } = await createStorageClient()
      .storage.from('resumes')
      .remove(storageKeys);
    if (storageError) {
      throw new Error(
        `Failed to delete stored resume files: ${storageError.message}`
      );
    }
  }

  // 2. Delete every row the user owns. Neon Auth users live outside this
  //    database, so there is no foreign-key cascade to rely on. Child tables
  //    (resume_parsed_data, application_events, ...) are removed explicitly
  //    too, and the whole step is atomic and safe to retry.
  await db.transaction(async (tx) => {
    await tx.delete(applicationEvents).where(eq(applicationEvents.userId, userId));
    await tx.delete(screeningAnswers).where(eq(screeningAnswers.userId, userId));
    await tx
      .delete(applicationStrategies)
      .where(eq(applicationStrategies.userId, userId));
    await tx.delete(tailoredDocuments).where(eq(tailoredDocuments.userId, userId));
    await tx.delete(applications).where(eq(applications.userId, userId));
    await tx.delete(jobStates).where(eq(jobStates.userId, userId));
    await tx.delete(extensionSessions).where(eq(extensionSessions.userId, userId));
    await tx.delete(resumeParsedData).where(eq(resumeParsedData.userId, userId));
    await tx.delete(resumes).where(eq(resumes.userId, userId));
    await tx.delete(workExperiences).where(eq(workExperiences.userId, userId));
    await tx.delete(educationEntries).where(eq(educationEntries.userId, userId));
    await tx.delete(skills).where(eq(skills.userId, userId));
    await tx.delete(projects).where(eq(projects.userId, userId));
    await tx.delete(certifications).where(eq(certifications.userId, userId));
    // Audit entries are kept but anonymised (matches the former ON DELETE SET NULL).
    await tx
      .update(auditLogs)
      .set({ userId: null })
      .where(eq(auditLogs.userId, userId));
    await tx.delete(profiles).where(eq(profiles.id, userId));
  });

  // 3. Delete the Neon Auth user (and end the session). Done last so a
  //    failure here leaves a retryable, data-free account rather than
  //    orphaned data.
  const { error: deleteUserError } = await getAuth().deleteUser({});
  if (deleteUserError) {
    throw new Error(`Failed to delete account: ${deleteUserError.message}`);
  }
}
