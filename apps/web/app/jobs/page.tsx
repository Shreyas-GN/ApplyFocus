"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Compass,
  EyeOff,
  RefreshCw,
  Search,
  Undo2,
} from "lucide-react";
import type { JobDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api-client";
import { formatFreshness, scoreTone } from "@/lib/job-ui";

type UiTab = "for-you" | "search" | "adjacent" | "saved";

const UI_TABS: Array<{
  id: UiTab;
  apiTab: "for_you" | "search" | "adjacent" | "saved";
  label: string;
  description: string;
}> = [
  {
    id: "for-you",
    apiTab: "for_you",
    label: "For You",
    description: "Personalized job feed ranked transparently against your verified profile.",
  },
  {
    id: "search",
    apiTab: "search",
    label: "Search Jobs",
    description: "Explore the full job catalog with keyword, work mode, freshness, and level filters.",
  },
  {
    id: "adjacent",
    apiTab: "adjacent",
    label: "Explore Adjacent Roles",
    description:
      "Roles beyond conventional title searches where your core and transferable skills overlap strongly.",
  },
  {
    id: "saved",
    apiTab: "saved",
    label: "Saved Jobs",
    description: "Bookmarked opportunities ready for tailoring and application.",
  },
];

function parseTab(raw: string | null): UiTab {
  if (raw === "search" || raw === "adjacent" || raw === "saved") return raw;
  return "for-you";
}

function buildJobsQuery(params: {
  tab: UiTab;
  q: string;
  workMode: string;
  freshness: string;
  minScore: string;
  seniority: string;
  includeDismissed: boolean;
}): string {
  const apiTab = UI_TABS.find((t) => t.id === params.tab)?.apiTab ?? "for_you";
  const sp = new URLSearchParams();
  sp.set("tab", apiTab);
  if (params.q.trim()) sp.set("q", params.q.trim());
  if (params.workMode !== "all") sp.set("workMode", params.workMode);
  if (params.freshness !== "all") sp.set("freshness", params.freshness);
  if (params.minScore !== "0") sp.set("minScore", params.minScore);
  if (params.seniority !== "all") sp.set("seniority", params.seniority);
  if (params.includeDismissed) sp.set("includeDismissed", "true");
  return `/jobs?${sp.toString()}`;
}

export default function JobsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-white" />}>
          <JobsContent />
        </Suspense>
      </AppShell>
    </ProtectedRoute>
  );
}

function JobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));

  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastDismissed, setLastDismissed] = useState<{
    id: string;
    title: string;
    company: string;
  } | null>(null);

  const [query, setQuery] = useState("");
  const [workMode, setWorkMode] = useState("all");
  const [freshness, setFreshness] = useState("all");
  const [minScore, setMinScore] = useState("0");
  const [seniority, setSeniority] = useState("all");
  const [includeDismissed, setIncludeDismissed] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  const fetchJobs = useCallback(
    async (overrides?: {
      tab?: UiTab;
      q?: string;
      workMode?: string;
      freshness?: string;
      minScore?: string;
      seniority?: string;
      includeDismissed?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const url = buildJobsQuery({
          tab: overrides?.tab ?? activeTab,
          q: overrides?.q ?? query,
          workMode: overrides?.workMode ?? workMode,
          freshness: overrides?.freshness ?? freshness,
          minScore: overrides?.minScore ?? minScore,
          seniority: overrides?.seniority ?? seniority,
          includeDismissed: overrides?.includeDismissed ?? includeDismissed,
        });
        const data = await api.get<JobDto[]>(url);
        setJobs(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.detail : "Failed to load jobs.");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, freshness, includeDismissed, minScore, query, seniority, workMode]
  );

  useEffect(() => {
    let cancelled = false;
    const url = buildJobsQuery({
      tab: activeTab,
      q: query,
      workMode,
      freshness,
      minScore,
      seniority,
      includeDismissed,
    });
    api
      .get<JobDto[]>(url)
      .then((data) => {
        if (!cancelled) {
          setJobs(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load jobs.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function handleTabChange(nextTab: UiTab) {
    setLoading(true);
    setLastDismissed(null);
    router.replace(`/jobs?tab=${nextTab}`);
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    void fetchJobs();
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await api.post<{ synced: number; boardsChecked: number }>("/jobs/sync");
      setSyncMessage(`Synced ${res.synced} jobs from ${res.boardsChecked} public ATS boards.`);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to sync jobs.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleSave(job: JobDto) {
    setBusyJobId(job.id);
    setError(null);
    try {
      if (job.userState === "saved") {
        await api.delete(`/jobs/${job.id}/state`);
        setJobs((prev) => {
          const updated = prev.map((j) =>
            j.id === job.id ? { ...j, userState: null } : j
          );
          return activeTab === "saved"
            ? updated.filter((j) => j.userState === "saved" || j.applicationStatus === "saved")
            : updated;
        });
      } else {
        const res = await api.put<{
          userState: "saved";
          applicationId: string | null;
          applicationStatus: JobDto["applicationStatus"];
        }>(`/jobs/${job.id}/state`, { state: "saved" });
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  userState: res.userState,
                  applicationId: res.applicationId ?? j.applicationId,
                  applicationStatus: res.applicationStatus ?? j.applicationStatus,
                }
              : j
          )
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update saved state.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleDismiss(job: JobDto) {
    setBusyJobId(job.id);
    setError(null);
    try {
      await api.put(`/jobs/${job.id}/state`, { state: "dismissed" });
      setLastDismissed({ id: job.id, title: job.title, company: job.company });
      if (!includeDismissed) {
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
      } else {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, userState: "dismissed" } : j))
        );
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to dismiss job.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleRestoreDismissed(jobId: string) {
    setBusyJobId(jobId);
    setError(null);
    try {
      await api.delete(`/jobs/${jobId}/state`);
      setLastDismissed(null);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to restore job.");
    } finally {
      setBusyJobId(null);
    }
  }

  const activeMeta = UI_TABS.find((t) => t.id === activeTab) ?? UI_TABS[0];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Opportunity Intelligence"
        title="Discover Jobs"
        description={activeMeta?.description}
      />

      <Tabs
        ariaLabel="Discover Jobs views"
        value={activeTab}
        onChange={handleTabChange}
        items={UI_TABS.map((tab) => ({ id: tab.id, label: tab.label }))}
      />

      {activeTab === "adjacent" && (
        <div className="flex items-start gap-3 rounded-xl border border-ui-teal-soft bg-ui-teal-soft/50 p-4 text-sm text-ui-ink">
          <Compass className="mt-0.5 h-5 w-5 shrink-0 text-ui-teal" />
          <div>
            <p className="font-semibold text-ui-ink">Adjacent-role discovery</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ui-body">
              These roles have titles outside your primary search targets, yet strongly overlap with your verified skills and transferable capabilities.
            </p>
          </div>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {syncMessage && <Alert tone="success">{syncMessage}</Alert>}

      {lastDismissed && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-ui-border bg-white px-4 py-2.5 text-sm shadow-xs">
          <span className="text-ui-ink">
            Dismissed <strong>{lastDismissed.title}</strong> at {lastDismissed.company}.
          </span>
          <button
            type="button"
            onClick={() => handleRestoreDismissed(lastDismissed.id)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold text-ui-teal hover:bg-ui-teal-soft"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
          </button>
        </div>
      )}

      {/* Sticky filter toolbar */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-ui-border bg-ui-canvas/95 px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ui-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, company, skill, location…"
              className="w-full rounded-[var(--radius-input)] border border-ui-border py-1.5 pr-3 pl-9 text-sm text-ui-ink focus:border-ui-teal focus:outline-none"
            />
          </div>

          <select
            aria-label="Work mode filter"
            value={workMode}
            onChange={(e) => { const next = e.target.value; setWorkMode(next); void fetchJobs({ workMode: next }); }}
            className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
          >
            <option value="all">All modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
          </select>

          <select
            aria-label="Freshness filter"
            value={freshness}
            onChange={(e) => { const next = e.target.value; setFreshness(next); void fetchJobs({ freshness: next }); }}
            className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
          >
            <option value="all">Any time</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>

          <select
            aria-label="Minimum match score"
            value={minScore}
            onChange={(e) => { const next = e.target.value; setMinScore(next); void fetchJobs({ minScore: next }); }}
            className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
          >
            <option value="0">Any score</option>
            <option value="50">50%+ Match</option>
            <option value="70">70%+ Strong</option>
            <option value="85">85%+ Top</option>
          </select>

          <select
            aria-label="Seniority filter"
            value={seniority}
            onChange={(e) => { const next = e.target.value; setSeniority(next); void fetchJobs({ seniority: next }); }}
            className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1.5 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
          >
            <option value="all">All levels</option>
            <option value="junior">Entry / Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
            <option value="staff">Staff / Lead</option>
          </select>

          {activeTab !== "saved" && (
            <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ui-body">
              <input
                type="checkbox"
                checked={includeDismissed}
                onChange={(e) => { const next = e.target.checked; setIncludeDismissed(next); void fetchJobs({ includeDismissed: next }); }}
                className="rounded border-ui-border text-ui-teal focus:ring-ui-teal"
              />
              <span>Dismissed</span>
            </label>
          )}
        </form>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-ui-linen" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-sm font-medium text-ui-ink">
              {activeTab === "saved"
                ? "No saved jobs yet."
                : activeTab === "adjacent"
                  ? "No adjacent roles matched your current skills and filters."
                  : "No jobs found matching your filters."}
            </p>
            <p className="text-sm text-ui-muted">
              {activeTab === "saved"
                ? "Save roles from For You or Search Jobs to review and tailor later."
                : "Try adjusting your filters, or sync fresh postings from public job boards."}
            </p>
            {activeTab !== "saved" && (
              <Button onClick={handleSync} loading={syncing} variant="secondary">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Sync live jobs
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const isSaved = job.userState === "saved" || job.applicationStatus === "saved";
            const isDismissed = job.userState === "dismissed";
            const isTracked = !!job.applicationId;

            return (
              <Card key={job.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="text-lg font-semibold text-ui-ink hover:text-ui-teal hover:underline"
                      >
                        {job.title}
                      </Link>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreTone(job.match.score)}`}
                      >
                        {job.match.score}% Match
                      </span>
                      {job.match.isAdjacentRole && (
                        <Badge className="bg-ui-teal-soft text-ui-teal">Adjacent Role</Badge>
                      )}
                      {job.applicationStatus && <StatusBadge status={job.applicationStatus} />}
                      {isDismissed && (
                        <Badge className="bg-ui-linen text-ui-muted">Dismissed</Badge>
                      )}
                      {isTracked && !job.applicationStatus && (
                        <Badge className="bg-ui-linen text-ui-muted">In tracker</Badge>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-ui-body">
                      <span className="font-medium text-ui-ink">{job.company}</span>
                      {job.location ? ` · ${job.location}` : ""}
                      {job.workMode ? ` · ${job.workMode}` : ""}
                      {" · "}
                      <span className="text-ui-muted">
                        {formatFreshness(job.postedAt, job.createdAt)}
                      </span>
                    </p>

                    {job.match.adjacencyReason && activeTab === "adjacent" ? (
                      <p className="mt-2 text-xs text-ui-teal">{job.match.adjacencyReason}</p>
                    ) : (
                      job.match.reasons.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-0.5 text-xs text-ui-body">
                          {job.match.reasons.slice(0, 2).map((reason) => (
                            <li key={reason}>• {reason}</li>
                          ))}
                        </ul>
                      )
                    )}

                    {(job.match.matchedSkills.length > 0 || job.skills.length > 0) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.match.matchedSkills.slice(0, 4).map((skill) => (
                          <Badge key={`m-${skill}`} className="bg-emerald-50 text-emerald-700">
                            {`✓ ${skill}`}
                          </Badge>
                        ))}
                        {job.skills
                          .filter(
                            (s) =>
                              !job.match.matchedSkills.some(
                                (m) => m.toLowerCase() === s.toLowerCase()
                              )
                          )
                          .slice(0, 3)
                          .map((skill) => (
                            <Badge key={`s-${skill}`} className="bg-ui-linen text-ui-body">
                              {skill}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Simplified 3-action card: View, Save, Dismiss */}
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-button)] bg-ui-teal px-3 text-xs font-medium text-white transition-colors hover:bg-ui-teal-hover"
                    >
                      View →
                    </Link>

                    {!isDismissed && (
                      <button
                        type="button"
                        title={isSaved ? "Remove bookmark" : "Save job"}
                        onClick={() => handleToggleSave(job)}
                        disabled={busyJobId === job.id}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border transition-colors disabled:opacity-50 ${
                          isSaved
                            ? "border-ui-teal bg-ui-teal-soft text-ui-teal hover:bg-ui-teal-soft/70"
                            : "border-ui-border bg-white text-ui-muted hover:border-ui-teal hover:text-ui-teal"
                        }`}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-3.5 w-3.5" />
                        ) : (
                          <Bookmark className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}

                    {isDismissed ? (
                      <button
                        type="button"
                        onClick={() => handleRestoreDismissed(job.id)}
                        disabled={busyJobId === job.id}
                        className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-button)] border border-ui-border px-2.5 text-xs font-medium text-ui-muted transition-colors hover:border-ui-teal hover:text-ui-teal disabled:opacity-50"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDismiss(job)}
                        disabled={busyJobId === job.id}
                        title="Dismiss job from feed"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-ui-border bg-white text-ui-muted transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
