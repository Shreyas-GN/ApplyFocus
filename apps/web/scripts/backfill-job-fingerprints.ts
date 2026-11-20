/**
 * ApplyFocus — Fingerprint Backfill Script
 *
 * Safely computes and populates canonical fingerprints for all legacy jobs
 * where `fingerprint IS NULL`.
 *
 * Usage:
 *   # Dry run (default, read-only analysis):
 *   pnpm tsx scripts/backfill-job-fingerprints.ts
 *
 *   # Execute backfill against database:
 *   pnpm tsx scripts/backfill-job-fingerprints.ts --apply
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// Parse .env.local if not already provided in environment
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...vals] = trimmed.split('=');
    if (key && vals.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

import { isNull, eq } from 'drizzle-orm';
import { resolveJobFingerprint } from '@/lib/server/jobs/listing-fingerprint';

async function main() {
  const { db, jobs, applications, tailoredDocuments } = await import('@/lib/db');
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply') || args.includes('--execute');

  console.log(`\n=======================================================`);
  console.log(`   ApplyFocus: Job Fingerprint Backfill Utility`);
  console.log(`   Mode: ${isApply ? '🚀 EXECUTE (WRITE)' : '🔍 DRY RUN (READ ONLY)'}`);
  console.log(`=======================================================\n`);

  // 1. Fetch all jobs where fingerprint IS NULL
  const nullJobs = await db
    .select({
      id: jobs.id,
      source: jobs.source,
      sourcePlatform: jobs.sourcePlatform,
      externalId: jobs.externalId,
      company: jobs.company,
      title: jobs.title,
      location: jobs.location,
      url: jobs.url,
      directApplyUrl: jobs.directApplyUrl,
      fingerprint: jobs.fingerprint,
      createdAt: jobs.createdAt,
    })
    .from(jobs)
    .where(isNull(jobs.fingerprint));

  console.log(`Found ${nullJobs.length} job(s) with NULL fingerprint.`);

  if (nullJobs.length === 0) {
    console.log('No legacy jobs require backfilling. Database is already fully fingerprinted.');
    process.exit(0);
  }

  // 2. Fetch existing fingerprints to detect cross-row collisions
  const existingWithFp = await db
    .select({
      id: jobs.id,
      fingerprint: jobs.fingerprint,
      company: jobs.company,
      title: jobs.title,
    })
    .from(jobs);

  const existingFpSet = new Map<string, string>(); // fingerprint -> jobId
  for (const row of existingWithFp) {
    if (row.fingerprint) {
      existingFpSet.set(row.fingerprint, row.id);
    }
  }

  const plannedUpdates: Array<{ id: string; fingerprint: string; company: string; title: string }> = [];
  const duplicatesToResolve: Array<{
    duplicateJobId: string;
    canonicalJobId: string;
    fingerprint: string;
    company: string;
    title: string;
  }> = [];

  const seenInBatch = new Map<string, string>(); // fingerprint -> firstJobId

  for (const job of nullJobs) {
    const fp = resolveJobFingerprint({
      source: job.source,
      externalId: job.externalId,
      url: job.url,
      directApplyUrl: job.directApplyUrl,
      company: job.company,
      title: job.title,
      location: job.location,
    });

    // Check collision against pre-existing rows in DB
    const existingJobId = existingFpSet.get(fp);
    if (existingJobId && existingJobId !== job.id) {
      duplicatesToResolve.push({
        duplicateJobId: job.id,
        canonicalJobId: existingJobId,
        fingerprint: fp,
        company: job.company,
        title: job.title,
      });
      continue;
    }

    // Check collision within current batch
    const batchJobId = seenInBatch.get(fp);
    if (batchJobId) {
      duplicatesToResolve.push({
        duplicateJobId: job.id,
        canonicalJobId: batchJobId,
        fingerprint: fp,
        company: job.company,
        title: job.title,
      });
      continue;
    }

    seenInBatch.set(fp, job.id);
    plannedUpdates.push({
      id: job.id,
      fingerprint: fp,
      company: job.company,
      title: job.title,
    });
  }

  console.log(`\nComputed Fingerprints Summary:`);
  console.log(`- Unique valid updates: ${plannedUpdates.length}`);
  console.log(`- Collisions / Duplicates identified: ${duplicatesToResolve.length}\n`);

  if (duplicatesToResolve.length > 0) {
    console.warn(`⚠️ Warning: Found ${duplicatesToResolve.length} duplicate job listings:`);
    for (const dup of duplicatesToResolve) {
      console.warn(
        `  - Duplicate Job ${dup.duplicateJobId} ("${dup.title}" @ "${dup.company}") collides with Canonical Job ${dup.canonicalJobId} (FP: ${dup.fingerprint.slice(0, 12)}...)`
      );
    }
  }

  if (!isApply) {
    console.log(`\n[DRY RUN COMPLETE]`);
    console.log(`No database changes were committed.`);
    console.log(`To write these updates to the database, run again with --apply.`);
    process.exit(0);
  }

  // 3. Execution Phase (Transactional or sequential with foreign key re-pointing)
  console.log(`\nStarting migration apply...`);

  // Handle duplicates if any: re-point dependent records and purge duplicate row
  for (const dup of duplicatesToResolve) {
    console.log(`Re-pointing dependent references from duplicate ${dup.duplicateJobId} to canonical ${dup.canonicalJobId}...`);
    await db
      .update(applications)
      .set({ jobId: dup.canonicalJobId })
      .where(eq(applications.jobId, dup.duplicateJobId));

    await db
      .update(tailoredDocuments)
      .set({ jobId: dup.canonicalJobId })
      .where(eq(tailoredDocuments.jobId, dup.duplicateJobId));

    console.log(`Removing redundant duplicate job row ${dup.duplicateJobId}...`);
    await db.delete(jobs).where(eq(jobs.id, dup.duplicateJobId));
  }

  // Update canonical fingerprints
  let successCount = 0;
  for (const update of plannedUpdates) {
    await db
      .update(jobs)
      .set({ fingerprint: update.fingerprint })
      .where(eq(jobs.id, update.id));
    successCount++;
  }

  console.log(`\n✅ Successfully updated ${successCount} job record(s) with canonical fingerprints.`);
  console.log(`Database is now prepared for CREATE UNIQUE INDEX "jobs_fingerprint_idx".\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Fingerprint backfill failed with error:', err);
  process.exit(1);
});

