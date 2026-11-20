"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Compass,
  EyeOff,
  Search,
  Undo2,
  Sparkles,
  ExternalLink,
  MapPin,
  Building2,
  Layers,
  ArrowRight,
  Plus,
  CheckCircle2,
} from "lucide-react";
import type { JobDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { TextField } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api-client";
import {
  formatFreshness,
  scoreTone,
  formatSalary,
  getPlatformBadgeConfig,
} from "@/lib/job-ui";

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
    description: "Explore the full multi-platform catalog with live web search, platform, freshness, and level filters.",
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

const POPULAR_LOCATIONS = [
  { label: "All Locations", value: "" },
  { label: "Bangalore", value: "Bangalore" },
  { label: "Pune / Mumbai", value: "Pune" },
  { label: "Hyderabad", value: "Hyderabad" },
  { label: "Remote", value: "Remote" },
  { label: "United States", value: "United States" },
];

function parseTab(raw: string | null): UiTab {
  if (raw === "search" || raw === "adjacent" || raw === "saved") return raw;
  return "for-you";
}

function buildJobsQuery(params: {
  tab: UiTab;
  q: string;
  workMode: string;
  platform: string;
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
  if (params.platform !== "all") sp.set("platform", params.platform);
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
  const [searchingLive, setSearchingLive] = useState(false);
  const [postingJob, setPostingJob] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [lastDismissed, setLastDismissed] = useState<{
    id: string;
    title: string;
    company: string;
  } | null>(null);

  // Search & Filter State
  const [query, setQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [workMode, setWorkMode] = useState("all");
  const [freshness, setFreshness] = useState("all");
  const [minScore, setMinScore] = useState("0");
  const [seniority, setSeniority] = useState("all");
  const [includeDismissed, setIncludeDismissed] = useState(false);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  // Manual Post Job Form State
  const [postCompany, setPostCompany] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postLocation, setPostLocation] = useState("");
  const [postWorkMode, setPostWorkMode] = useState<"remote" | "hybrid" | "onsite">("remote");
  const [postPlatform, setPostPlatform] = useState("Direct Posting");
  const [postUrl, setPostUrl] = useState("");
  const [postSalaryMin, setPostSalaryMin] = useState("");
  const [postSalaryMax, setPostSalaryMax] = useState("");
  const [postCurrency, setPostCurrency] = useState("INR");
  const [postDescription, setPostDescription] = useState("");

  const fetchJobs = useCallback(
    async (overrides?: {
      tab?: UiTab;
      q?: string;
      workMode?: string;
      platform?: string;
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
          platform: overrides?.platform ?? platform,
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
    [activeTab, freshness, includeDismissed, minScore, platform, query, seniority, workMode]
  );

  useEffect(() => {
    let cancelled = false;
    const url = buildJobsQuery({
      tab: activeTab,
      q: query,
      workMode,
      platform,
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

  async function handleLiveWebSearch(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim()) {
      setError("Please enter a job title or skill keyword to search live postings.");
      return;
    }
    setSearchingLive(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await api.post<{ totalIngested: number; jobs: JobDto[] }>("/jobs/live-search", {
        query: query.trim(),
        location: locationQuery.trim() || undefined,
      });
      setSyncMessage(
        `Discovered & ingested ${res.totalIngested} live opportunities across Naukri, Indeed, LinkedIn, and company portals.`
      );
      setJobs(res.jobs);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Live job board search currently busy. Showing local results."
      );
      await fetchJobs();
    } finally {
      setSearchingLive(false);
    }
  }

  async function handleSyncCurated(tier?: string) {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await api.post<{ synced: number; companiesChecked: number }>("/jobs/sync", {
        tier: tier || "all",
      });
      setSyncMessage(`Synced ${res.synced} verified opportunities from ${res.companiesChecked} company portals.`);
      await fetchJobs();
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to sync company portals.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreateJob(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPostingJob(true);
    try {
      const created = await api.post<JobDto>("/jobs", {
        company: postCompany.trim(),
        title: postTitle.trim(),
        location: postLocation.trim() || undefined,
        workMode: postWorkMode,
        sourcePlatform: postPlatform,
        url: postUrl.trim() || undefined,
        directApplyUrl: postUrl.trim() || undefined,
        salaryMin: postSalaryMin ? Number.parseInt(postSalaryMin, 10) : undefined,
        salaryMax: postSalaryMax ? Number.parseInt(postSalaryMax, 10) : undefined,
        salaryCurrency: postCurrency,
        description: postDescription.trim(),
      });

      setJobs((prev) => [created, ...prev]);
      setIsPostModalOpen(false);
      setSyncMessage(`Successfully posted "${created.title}" at ${created.company}. Ready for 1-click tailoring!`);
      // Reset form
      setPostCompany("");
      setPostTitle("");
      setPostLocation("");
      setPostUrl("");
      setPostSalaryMin("");
      setPostSalaryMax("");
      setPostDescription("");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to post job opportunity.");
    } finally {
      setPostingJob(false);
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          eyebrow="Multi-Platform Job Intelligence"
          title="Discover Jobs"
          description={activeMeta?.description}
        />
        {/* Header Actions: Post Job & Tier Sync */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsPostModalOpen(true)}
            className="text-xs font-semibold shadow-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Post Opportunity
          </Button>

          <Button
            variant="secondary"
            className="text-xs"
            loading={syncing}
            onClick={() => handleSyncCurated("tier_2_india_unicorns")}
            title="Sync India Tech Unicorns (Swiggy, Zomato, Razorpay, CRED, Zepto, PhonePe)"
          >
            <Building2 className="mr-1.5 h-3.5 w-3.5 text-ui-teal" />
            Sync India Tech
          </Button>

          <Button
            variant="secondary"
            className="text-xs"
            loading={syncing}
            onClick={() => handleSyncCurated("tier_1_global")}
            title="Sync Global Tech Leaders (OpenAI, Anthropic, Stripe, Vercel, Supabase, Figma)"
          >
            <Layers className="mr-1.5 h-3.5 w-3.5 text-ui-teal" />
            Sync Global Tech
          </Button>
        </div>
      </div>

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

      {/* Sticky Multi-Platform Live Search & Filter Deck */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-ui-border bg-ui-canvas/95 px-4 py-3 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-2.5">
          {/* Row 1: Keyword + Location + Live Web Search Button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-ui-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search job title, tech stack (e.g. Fullstack, Python, React)..."
                className="w-full rounded-[var(--radius-input)] border border-ui-border py-2 pr-3 pl-9 text-sm text-ui-ink shadow-xs focus:border-ui-teal focus:outline-none"
              />
            </div>

            <div className="relative min-w-[150px] max-w-xs">
              <MapPin className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-ui-muted" />
              <input
                type="text"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Location (Bangalore, Remote)..."
                className="w-full rounded-[var(--radius-input)] border border-ui-border py-2 pr-3 pl-8 text-xs text-ui-ink shadow-xs focus:border-ui-teal focus:outline-none"
              />
            </div>

            <Button
              type="button"
              onClick={() => handleLiveWebSearch()}
              loading={searchingLive}
              className="text-xs font-semibold shadow-xs"
              title="Search live web job boards across Naukri, Indeed, LinkedIn, and company portals"
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Live Search on Web
            </Button>

            <Button type="submit" variant="secondary" className="text-xs">
              Filter Catalog
            </Button>
          </div>

          {/* Row 2: Location presets & Secondary Filters */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-ui-border/50 text-xs">
            <span className="text-ui-muted font-medium mr-1">Location:</span>
            {POPULAR_LOCATIONS.map((loc) => (
              <button
                key={loc.label}
                type="button"
                onClick={() => {
                  setLocationQuery(loc.value);
                  void fetchJobs({ q: query ? `${query} ${loc.value}`.trim() : loc.value });
                }}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  locationQuery === loc.value
                    ? "bg-ui-teal text-white shadow-2xs"
                    : "bg-white text-ui-body border border-ui-border hover:border-ui-teal"
                }`}
              >
                {loc.label}
              </button>
            ))}

            <div className="h-4 w-px bg-ui-border mx-1" />

            {/* Platform Filter */}
            <select
              aria-label="Platform source filter"
              value={platform}
              onChange={(e) => {
                const next = e.target.value;
                setPlatform(next);
                void fetchJobs({ platform: next });
              }}
              className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
            >
              <option value="all">All Platforms (Naukri, Indeed, ATS)</option>
              <option value="Naukri">Naukri.com</option>
              <option value="Indeed">Indeed</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Glassdoor">Glassdoor</option>
              <option value="ATS">Direct Career Portals</option>
            </select>

            {/* Work Mode */}
            <select
              aria-label="Work mode filter"
              value={workMode}
              onChange={(e) => {
                const next = e.target.value;
                setWorkMode(next);
                void fetchJobs({ workMode: next });
              }}
              className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
            >
              <option value="all">All modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">Onsite</option>
            </select>

            {/* Freshness */}
            <select
              aria-label="Freshness filter"
              value={freshness}
              onChange={(e) => {
                const next = e.target.value;
                setFreshness(next);
                void fetchJobs({ freshness: next });
              }}
              className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
            >
              <option value="all">Any time</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>

            {/* Min Match Score */}
            <select
              aria-label="Minimum match score"
              value={minScore}
              onChange={(e) => {
                const next = e.target.value;
                setMinScore(next);
                void fetchJobs({ minScore: next });
              }}
              className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
            >
              <option value="0">Any score</option>
              <option value="50">50%+ Match</option>
              <option value="70">70%+ Strong</option>
              <option value="85">85%+ Top</option>
            </select>

            {/* Seniority */}
            <select
              aria-label="Seniority filter"
              value={seniority}
              onChange={(e) => {
                const next = e.target.value;
                setSeniority(next);
                void fetchJobs({ seniority: next });
              }}
              className="rounded-[var(--radius-input)] border border-ui-border bg-white px-2.5 py-1 text-xs font-medium text-ui-ink focus:border-ui-teal focus:outline-none"
            >
              <option value="all">All levels</option>
              <option value="junior">Entry / Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
              <option value="staff">Staff / Lead</option>
            </select>

            {activeTab !== "saved" && (
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ui-body ml-auto">
                <input
                  type="checkbox"
                  checked={includeDismissed}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIncludeDismissed(next);
                    void fetchJobs({ includeDismissed: next });
                  }}
                  className="rounded border-ui-border text-ui-teal focus:ring-ui-teal"
                />
                <span>Dismissed</span>
              </label>
            )}
          </div>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ui-teal-soft text-ui-teal shadow-2xs">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold text-ui-ink">
                {activeTab === "saved"
                  ? "No saved jobs yet."
                  : activeTab === "adjacent"
                    ? "No adjacent roles matched your current skills and filters."
                    : "No jobs found matching your filters."}
              </p>
              <p className="mt-1 text-sm text-ui-muted max-w-md mx-auto leading-relaxed">
                {activeTab === "saved"
                  ? "Save roles from For You or Search Jobs to review and tailor later."
                  : "Search the live web to instantly discover active postings across Naukri, Indeed, and verified company portals, or post an opportunity directly."}
              </p>
            </div>
            {activeTab !== "saved" && (
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => handleLiveWebSearch()} loading={searchingLive}>
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Search Live on Web
                </Button>
                <Button onClick={() => setIsPostModalOpen(true)} variant="secondary">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Post Job Directly
                </Button>
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((job) => {
            const isSaved = job.userState === "saved" || job.applicationStatus === "saved";
            const isDismissed = job.userState === "dismissed";
            const isTracked = !!job.applicationId;
            const platformConfig = getPlatformBadgeConfig(job.sourcePlatform);
            const salaryFormatted = formatSalary(
              job.salaryMin,
              job.salaryMax,
              job.salaryCurrency
            );

            // Compute clean monogram avatar
            const monogram = job.company
              .split(" ")
              .map((w) => w[0])
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase() || "JB";

            return (
              <Card key={job.id} className="hover:border-ui-teal/40 transition-all shadow-xs border-ui-border">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  {/* Left: Monogram / Logo + Content */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Monogram / Logo */}
                    {job.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={job.companyLogo}
                        alt={job.company}
                        className="h-11 w-11 shrink-0 rounded-xl border border-ui-border object-contain bg-white p-1"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ui-canvas border border-ui-border text-xs font-bold text-ui-ink shadow-2xs">
                        {monogram}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* Top Row: Platform Badge + Title + Match Score + Salary */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold shadow-2xs ${platformConfig.badgeClass}`}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          {platformConfig.label}
                        </span>

                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-base sm:text-lg font-bold text-ui-ink hover:text-ui-teal hover:underline tracking-tight"
                        >
                          {job.title}
                        </Link>

                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${scoreTone(job.match.score)}`}
                        >
                          {job.match.score}% Match
                        </span>

                        {salaryFormatted && (
                          <span className="inline-flex items-center rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-xs font-semibold">
                            {salaryFormatted}
                          </span>
                        )}

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

                      {/* Company + Location + Work Mode + Freshness */}
                      <p className="mt-1 text-xs sm:text-sm text-ui-body">
                        <span className="font-semibold text-ui-ink">{job.company}</span>
                        {job.location ? ` · ${job.location}` : ""}
                        {job.workMode ? ` · ${job.workMode.toUpperCase()}` : ""}
                        {" · "}
                        <span className="text-ui-muted">
                          {formatFreshness(job.postedAt, job.createdAt)}
                        </span>
                      </p>

                      {/* Adjacency or Reasons */}
                      {job.match.adjacencyReason && activeTab === "adjacent" ? (
                        <p className="mt-2 text-xs text-ui-teal font-medium">{job.match.adjacencyReason}</p>
                      ) : (
                        job.match.reasons.length > 0 && (
                          <ul className="mt-2 flex flex-col gap-0.5 text-xs text-ui-body">
                            {job.match.reasons.slice(0, 2).map((reason) => (
                              <li key={reason}>• {reason}</li>
                            ))}
                          </ul>
                        )
                      )}

                      {/* Verified Skills Chips */}
                      {(job.match.matchedSkills.length > 0 || job.skills.length > 0) && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {job.match.matchedSkills.slice(0, 4).map((skill) => (
                            <Badge key={`m-${skill}`} className="bg-ui-success-soft text-ui-success text-2xs">
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
                              <Badge key={`s-${skill}`} className="bg-ui-linen text-ui-body text-2xs">
                                {skill}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Suite */}
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {/* Primary Tailor Resume Button */}
                    <Link
                      href={`/resumes?jobId=${job.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-button)] bg-ui-teal px-3 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-ui-teal-hover"
                      title="Tailor your resume for this opportunity"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Tailor Resume
                    </Link>

                    {/* View Details */}
                    <Link
                      href={`/jobs/${job.id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-button)] border border-ui-border bg-white px-2.5 text-xs font-medium text-ui-ink transition-colors hover:border-ui-teal hover:text-ui-teal"
                    >
                      Details
                      <ArrowRight className="h-3 w-3" />
                    </Link>

                    {/* External Link to Platform */}
                    <a
                      href={job.directApplyUrl || job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-button)] border border-ui-border bg-ui-canvas px-2.5 text-xs font-medium text-ui-body transition-colors hover:bg-white hover:text-ui-ink"
                      title={`Open job on ${platformConfig.label}`}
                    >
                      <ExternalLink className="h-3 w-3 text-ui-muted" />
                      Apply
                    </a>

                    {/* Bookmark / Save */}
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

                    {/* Dismiss / Restore */}
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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-button)] border border-ui-border bg-white text-ui-muted transition-colors hover:border-ui-error/30 hover:text-ui-error disabled:opacity-50"
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

      {/* Post / Import Opportunity Modal */}
      <Modal
        open={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title="Post or Import Job Opportunity"
        description="Add an active role from Naukri, Indeed, LinkedIn, or directly from an employer. ApplyFocus will immediately compute your match score and enable 1-click tailoring."
      >
        <form onSubmit={handleCreateJob} className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Company Name"
              placeholder="e.g. Swiggy, Stripe, Google"
              value={postCompany}
              onChange={(e) => setPostCompany(e.target.value)}
              required
            />
            <TextField
              label="Job Title"
              placeholder="e.g. Senior Backend Engineer"
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label="Location"
              placeholder="e.g. Bangalore, India"
              value={postLocation}
              onChange={(e) => setPostLocation(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ui-ink">
                Work Mode
              </label>
              <select
                value={postWorkMode}
                onChange={(e) => setPostWorkMode(e.target.value as "remote" | "hybrid" | "onsite")}
                className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-xs text-ui-ink focus:border-ui-teal focus:outline-none"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ui-ink">
                Platform Source
              </label>
              <select
                value={postPlatform}
                onChange={(e) => setPostPlatform(e.target.value)}
                className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-xs text-ui-ink focus:border-ui-teal focus:outline-none"
              >
                <option value="Naukri.com">Naukri.com</option>
                <option value="Indeed">Indeed</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Glassdoor">Glassdoor</option>
                <option value="Direct Career Portal">Direct Career Portal</option>
                <option value="Manual / Recruiter">Manual / Recruiter</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label="Min Salary (Annual)"
              type="number"
              placeholder="e.g. 2000000"
              value={postSalaryMin}
              onChange={(e) => setPostSalaryMin(e.target.value)}
            />
            <TextField
              label="Max Salary (Annual)"
              type="number"
              placeholder="e.g. 3500000"
              value={postSalaryMax}
              onChange={(e) => setPostSalaryMax(e.target.value)}
            />
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ui-ink">
                Currency
              </label>
              <select
                value={postCurrency}
                onChange={(e) => setPostCurrency(e.target.value)}
                className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-xs text-ui-ink focus:border-ui-teal focus:outline-none"
              >
                <option value="INR">₹ INR (India)</option>
                <option value="USD">$ USD (US & Global)</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>

          <TextField
            label="Job Application URL (optional)"
            placeholder="https://naukri.com/... or https://careers.company.com/..."
            value={postUrl}
            onChange={(e) => setPostUrl(e.target.value)}
          />

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ui-ink">
              Job Description & Requirements
            </label>
            <textarea
              rows={5}
              value={postDescription}
              onChange={(e) => setPostDescription(e.target.value)}
              placeholder="Paste the role responsibilities, qualifications, and tech stack requirements..."
              className="w-full rounded-lg border border-ui-border p-2.5 text-xs text-ui-ink focus:border-ui-teal focus:outline-none leading-relaxed"
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-ui-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPostModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={postingJob}>
              Post & Add to Feed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
