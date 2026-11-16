"use client";

import Link from "next/link";
import type {
  ApplicationDto,
  AuditLogDto,
  JobDto,
  ProfileDto,
  ResumeDto,
} from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import {
  ExploreAdjacentRoles,
  OpportunitySnapshot,
} from "@/components/dashboard/opportunity-sections";
import {
  ApplicationProgressPanel,
  NextActionsPanel,
  ProfileReadinessPanel,
  RecentActivityPanel,
} from "@/components/dashboard/command-center-panels";
import { StatCard } from "@/components/ui/card";
import { summarizeApplicationProgress } from "@/lib/dashboard-helpers";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";

interface ApplicationInsightsDto {
  total: number;
  responseRate: number | null;
  interviewConversionRate: number | null;
  offerRate: number | null;
  followUpsDue: number;
  awaitingResponse: number;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const {
    data: profile,
    loading: profileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useApi<ProfileDto>("/profile");
  const {
    data: resumes,
    loading: resumesLoading,
  } = useApi<ResumeDto[]>("/resumes");
  const {
    data: applications,
    loading: appsLoading,
    error: appsError,
    refetch: refetchApps,
  } = useApi<ApplicationDto[]>("/applications");
  const {
    data: jobs,
    loading: jobsLoading,
    error: jobsError,
    refetch: refetchJobs,
  } = useApi<JobDto[]>("/jobs?tab=for_you");
  const {
    data: activityLogs,
    loading: activityLoading,
  } = useApi<AuditLogDto[]>("/account/activity");
  const {
    data: insights,
    loading: insightsLoading,
  } = useApi<ApplicationInsightsDto>("/applications/insights");

  const firstName = profile?.fullName?.trim()
    ? profile.fullName.trim().split(/\s+/)[0]
    : user?.email?.split("@")[0] ?? "";

  const appSummary = summarizeApplicationProgress(applications);
  const adjacentCount = (jobs ?? []).filter((j) => j.match.isAdjacentRole).length;
  const targetTitles = profile?.preferredTitles ?? [];

  const noJobs = !jobsLoading && (!jobs || jobs.length === 0);
  const profileCompletion = profile?.intelligence?.confirmedPercent ?? profile?.completionPercent ?? 0;
  const lowProfile = !profileLoading && profileCompletion < 60;

  function buildOverviewSummary(): string {
    if (profileLoading || jobsLoading || appsLoading) {
      return "Loading your personalized job search overview…";
    }
    const parts: string[] = [];
    if (jobs && jobs.length > 0) {
      parts.push(
        `${jobs.length} matched opportunit${jobs.length === 1 ? "y" : "ies"} ranked`
      );
      if (adjacentCount > 0) {
        parts.push(
          `${adjacentCount} adjacent role${adjacentCount === 1 ? "" : "s"} worth exploring`
        );
      }
    } else {
      parts.push("No synced jobs matched yet");
    }

    if (appSummary.total > 0) {
      parts.push(
        `${appSummary.activeCount} active application${appSummary.activeCount === 1 ? "" : "s"}`
      );
    }

    if (targetTitles.length > 0) {
      parts.push(`Targeting ${targetTitles.slice(0, 2).join(", ")}`);
    }
    return `${parts.join(" · ")}.`;
  }

  function renderContextualCta() {
    if (noJobs) {
      return (
        <Link
          href="/jobs"
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-ui-teal px-4 text-xs font-medium text-white transition-colors hover:bg-ui-teal-hover"
        >
          Sync Jobs →
        </Link>
      );
    }
    if (lowProfile) {
      return (
        <Link
          href="/profile"
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-ui-teal px-4 text-xs font-medium text-white transition-colors hover:bg-ui-teal-hover"
        >
          Complete Profile →
        </Link>
      );
    }
    if (jobs && jobs.length > 0) {
      return (
        <Link
          href={`/jobs/${jobs[0]?.id}`}
          className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] bg-ui-teal px-4 text-xs font-medium text-white transition-colors hover:bg-ui-teal-hover"
        >
          View Top Match →
        </Link>
      );
    }
    return null;
  }

  function formatRate(rate: number | null, loading: boolean): string {
    if (loading) return "—";
    if (rate === null) return "—";
    return `${rate}%`;
  }

  function rateHint(rate: number | null, label: string): string {
    if (rate === null) return "No applications yet";
    return label;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* 1. Welcome & Overview */}
      <header className="rounded-2xl border border-ui-border bg-ui-surface p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ui-copper">
              Job Search Command Center
            </span>
            <h1 className="mt-1.5 text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] text-ui-ink sm:text-[32px]">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1.5 text-sm text-ui-body">{buildOverviewSummary()}</p>
          </div>

          <div className="shrink-0">
            {renderContextualCta()}
          </div>
        </div>

        {profileError && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-900">
            <span>Couldn&apos;t load profile data: {profileError}</span>
            <button
              type="button"
              onClick={refetchProfile}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}
      </header>

      {/* Metric Strip — powered by insights API */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Matched Roles"
          value={jobsLoading ? "—" : (jobs?.length ?? 0)}
          hint={adjacentCount > 0 ? `${adjacentCount} adjacent roles` : "Ranked for your profile"}
          tone="accent"
        />
        <StatCard
          label="Active Pipeline"
          value={appsLoading ? "—" : appSummary.activeCount}
          hint={`${appSummary.total} total tracked`}
          tone="neutral"
        />
        <StatCard
          label="Response Rate"
          value={formatRate(insights?.responseRate ?? null, insightsLoading)}
          hint={rateHint(insights?.responseRate ?? null, "Of applied roles")}
          tone="success"
        />
        <StatCard
          label="Interview Rate"
          value={formatRate(insights?.interviewConversionRate ?? null, insightsLoading)}
          hint={rateHint(insights?.interviewConversionRate ?? null, "Applications → interview")}
          tone="neutral"
        />
      </div>

      {/* 2. Opportunity Snapshot (Primary Visual Priority) */}
      <OpportunitySnapshot
        jobs={jobs}
        loading={jobsLoading}
        error={jobsError}
        onRetry={refetchJobs}
      />

      {/* Two-Column Command Grid — Next Actions primary, Adjacent Roles secondary */}
      <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          {/* 3. Next Actions — primary position */}
          <NextActionsPanel
            profile={profile}
            resumes={resumes}
            applications={applications}
            jobs={jobs}
            loading={profileLoading || resumesLoading || appsLoading || jobsLoading}
          />

          {/* 4. Explore Adjacent Roles — secondary position */}
          <ExploreAdjacentRoles
            jobs={jobs}
            profile={profile}
            loading={jobsLoading || profileLoading}
          />
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-5">
          {/* 5. Application Progress */}
          <ApplicationProgressPanel
            applications={applications}
            loading={appsLoading}
            error={appsError}
            onRetry={refetchApps}
          />

          {/* 6. Profile Readiness */}
          <ProfileReadinessPanel
            profile={profile}
            resumes={resumes}
            loading={profileLoading || resumesLoading}
          />

          {/* 7. Recent Activity */}
          <RecentActivityPanel
            auditLogs={activityLogs}
            applications={applications}
            jobs={jobs}
            loading={activityLoading && appsLoading && jobsLoading}
          />
        </div>
      </div>
    </div>
  );
}
