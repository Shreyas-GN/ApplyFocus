"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Compass,
  ExternalLink,
  EyeOff,
  FileText,
  Info,
  Sparkles,
  Undo2,
  User,
} from "lucide-react";
import type { JobDetailDto, ProfileDto } from "@/lib/types";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { barTone, formatFreshness, matchLabel, matchLabelClass } from "@/lib/job-ui";

export default function JobDetailPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <JobDetailContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function JobDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<JobDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRawDescription, setShowRawDescription] = useState(false);

  const { data: profile } = useApi<ProfileDto>("/profile");

  useEffect(() => {
    let cancelled = false;
    api
      .get<JobDetailDto>(`/jobs/${jobId}`)
      .then((data) => {
        if (!cancelled) {
          setJob(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.detail : "Failed to load job details.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  async function handleToggleSave() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      if (job.userState === "saved") {
        await api.delete(`/jobs/${job.id}/state`);
        setJob({ ...job, userState: null });
      } else {
        const res = await api.put<{
          userState: "saved";
          applicationId: string | null;
          applicationStatus: JobDetailDto["applicationStatus"];
        }>(`/jobs/${job.id}/state`, { state: "saved" });
        setJob({
          ...job,
          userState: res.userState,
          applicationId: res.applicationId ?? job.applicationId,
          applicationStatus: res.applicationStatus ?? job.applicationStatus,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to update saved state.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDismiss() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      if (job.userState === "dismissed") {
        await api.delete(`/jobs/${job.id}/state`);
        setJob({ ...job, userState: null });
      } else {
        await api.put(`/jobs/${job.id}/state`, { state: "dismissed" });
        router.push("/jobs");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to dismiss job.");
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkApplied() {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<{ id: string; status: JobDetailDto["applicationStatus"] }>(
        "/applications",
        {
          jobId: job.id,
          company: job.company,
          title: job.title,
          location: job.location,
          url: job.url,
          status: "applied",
          matchScore: job.match.score,
        }
      );
      setJob({
        ...job,
        applicationId: created.id,
        applicationStatus: created.status,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to track application.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-44 animate-pulse rounded-xl bg-ui-linen" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-72 animate-pulse rounded-xl bg-ui-linen lg:col-span-5" />
          <div className="h-72 animate-pulse rounded-xl bg-ui-linen lg:col-span-7" />
        </div>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="flex flex-col gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ui-violet hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover Jobs</span>
        </Link>
        <Alert tone="error">{error}</Alert>
      </div>
    );
  }

  if (!job) return null;

  const isSaved = job.userState === "saved" || job.applicationStatus === "saved";
  const isDismissed = job.userState === "dismissed";

  // Compute which profile gaps are preference/constraint vs skill gaps
  const preferenceGaps = job.match.gaps.filter(
    (g) =>
      g.toLowerCase().includes("work mode") ||
      g.toLowerCase().includes("prefer") ||
      g.toLowerCase().includes("excluded role") ||
      g.toLowerCase().includes("senior") ||
      g.toLowerCase().includes("entry-level")
  );
  const skillGaps = job.match.gaps.filter((g) => !preferenceGaps.includes(g));

  // Find relevant experience from profile
  const jobTitleWords = job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const matchedSkillsLower = new Set(job.match.matchedSkills.map((s) => s.toLowerCase()));
  const relevantExperience = (profile?.experience ?? [])
    .filter((e) => e.source !== "ai")
    .filter((e) => {
      const expTitle = e.title.toLowerCase();
      const expDesc = (e.description ?? "").toLowerCase();
      const titleOverlap = jobTitleWords.some((w) => expTitle.includes(w));
      const techOverlap = (e.technologies ?? []).some((t) => matchedSkillsLower.has(t.toLowerCase()));
      const descOverlap = job.match.matchedSkills.some((s) =>
        expDesc.includes(s.toLowerCase())
      );
      return titleOverlap || techOverlap || descOverlap;
    })
    .slice(0, 3);

  const relevantProjects = (profile?.projects ?? [])
    .filter((p) => p.source !== "ai")
    .filter((p) =>
      (p.technologies ?? []).some((t) => matchedSkillsLower.has(t.toLowerCase()))
    )
    .slice(0, 2);

  // Build recommended next action
  function getRecommendedAction(): { label: string; href: string; description: string } {
    if (job!.applicationId) {
      return {
        label: "View in Application Tracker",
        href: "/applications",
        description: "Track your progress and prepare for next steps.",
      };
    }
    if (isSaved) {
      return {
        label: "Tailor Your Resume",
        href: `/studio?tab=tailored&jobId=${job!.id}`,
        description: "Create a tailored version of your resume targeting this specific role.",
      };
    }
    if (isDismissed) {
      return {
        label: "Restore to Your Feed",
        href: "#",
        description: "This role was dismissed. Restore it if you want to reconsider.",
      };
    }
    const confirmedSkillsCount = (profile?.skills ?? []).filter((s) => s.source !== "ai").length;
    if (confirmedSkillsCount < 3) {
      return {
        label: "Complete Your Profile First",
        href: "/profile",
        description:
          "Add confirmed skills and experience to get a more accurate evaluation for this role.",
      };
    }
    return {
      label: "Save & Build Application Strategy",
      href: "#save",
      description: "Save this role and tailor your materials for a stronger application.",
    };
  }

  const recommendedAction = getRecommendedAction();

  return (
    <div className="flex flex-col gap-6">
      {/* Nav */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ui-body hover:text-ui-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Discover Jobs</span>
        </Link>
        {job.tailoredDocumentsCount > 0 && (
          <Link
            href={`/studio?tab=tailored&jobId=${job.id}`}
            className="text-xs font-medium text-ui-violet hover:underline"
          >
            {job.tailoredDocumentsCount} tailored draft
            {job.tailoredDocumentsCount === 1 ? "" : "s"} created →
          </Link>
        )}
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* Job Header */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold text-ui-ink">{job.title}</h1>
              <span
                className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${matchLabelClass(
                  job.match.score
                )}`}
              >
                {matchLabel(job.match.score)}
              </span>
              {job.match.isAdjacentRole && (
                <Badge className="bg-ui-lilac-soft text-ui-violet">Adjacent Role</Badge>
              )}
              {job.applicationStatus && <StatusBadge status={job.applicationStatus} />}
              {isDismissed && (
                <Badge className="bg-ui-linen text-ui-muted">Dismissed</Badge>
              )}
            </div>

            <p className="mt-2 text-sm text-ui-body">
              <span className="font-semibold text-ui-ink">{job.company}</span>
              {job.location ? ` · ${job.location}` : ""}
              {job.workMode ? ` · ${job.workMode}` : ""}
              {" · "}
              <span>{formatFreshness(job.postedAt, job.createdAt)}</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-ui-linen text-ui-ink">
                {`Level: ${job.intelligence.seniorityLevel}`}
              </Badge>
              {job.intelligence.expectedExperienceYears && (
                <Badge className="bg-ui-linen text-ui-ink">
                  {`Experience: ${job.intelligence.expectedExperienceYears}`}
                </Badge>
              )}
              <Badge className="bg-ui-linen text-ui-ink">{`Source: ${job.source}`}</Badge>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-ui-border bg-white px-3 py-2 text-xs font-medium text-ui-ink hover:bg-ui-canvas"
            >
              <span>Original posting</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            <Button
              variant={isSaved ? "primary" : "secondary"}
              className="px-3 py-2 text-xs"
              loading={busy}
              onClick={handleToggleSave}
            >
              <Bookmark className="mr-1.5 inline h-3.5 w-3.5" />
              {isSaved ? "Saved" : "Save"}
            </Button>

            <Button
              variant="ghost"
              className="px-3 py-2 text-xs"
              loading={busy}
              onClick={handleDismiss}
            >
              {isDismissed ? (
                <>
                  <Undo2 className="mr-1.5 inline h-3.5 w-3.5" />
                  Restore
                </>
              ) : (
                <>
                  <EyeOff className="mr-1.5 inline h-3.5 w-3.5" />
                  Dismiss
                </>
              )}
            </Button>

            <Link href={`/studio?tab=tailored&jobId=${job.id}`}>
              <Button variant="secondary" className="px-3 py-2 text-xs">
                <FileText className="mr-1.5 inline h-3.5 w-3.5" />
                Tailor Resume
              </Button>
            </Link>

            {job.applicationId ? (
              <Link href="/applications">
                <Button className="px-3 py-2 text-xs">View in Tracker</Button>
              </Link>
            ) : (
              <Button className="px-3 py-2 text-xs" loading={busy} onClick={handleMarkApplied}>
                Mark Applied
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main two-column evaluation */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: Why it matches + constraints */}
        <div className="flex flex-col gap-6 lg:col-span-5">

          {/* Opportunity Evaluation */}
          <Card>
            <CardHeader
              title="Opportunity Evaluation"
              description="How your confirmed profile aligns with this role."
            />

            <div className="flex flex-col gap-4">
              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-100 bg-ui-canvas p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-ui-muted">Skills compatibility</span>
                    <span className="text-sm font-semibold text-ui-ink">
                      {job.match.skillsScore}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${barTone(job.match.skillsScore)}`}
                      style={{ width: `${job.match.skillsScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-100 bg-ui-canvas p-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-ui-muted">Experience fit</span>
                    <span className="text-sm font-semibold text-ui-ink">
                      {job.match.experienceScore}%
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${barTone(job.match.experienceScore)}`}
                      style={{ width: `${job.match.experienceScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {job.match.adjacencyReason && (
                <div className="flex items-start gap-2.5 rounded-lg border border-ui-lilac bg-ui-lilac-soft/70 p-3 text-xs text-ui-ink">
                  <Compass className="mt-0.5 h-4 w-4 shrink-0 text-ui-violet" />
                  <div>
                    <p className="font-semibold text-ui-ink">Adjacent role insight</p>
                    <p className="mt-0.5 leading-relaxed">{job.match.adjacencyReason}</p>
                  </div>
                </div>
              )}

              {job.match.reasons.length > 0 && (
                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    <Sparkles className="h-3.5 w-3.5 text-ui-violet" />
                    <span>Why this was recommended</span>
                  </p>
                  <ul className="flex flex-col gap-1.5 text-xs text-ui-ink">
                    {job.match.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {job.match.strengths.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Strengths
                  </p>
                  <ul className="flex flex-col gap-1 text-xs text-ui-ink">
                    {job.match.strengths.map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Preferences & Constraints */}
          {(preferenceGaps.length > 0 || job.workMode || (profile?.workMode)) && (
            <Card>
              <CardHeader
                title="Your Preferences & Constraints"
                description="How this role aligns with your stated preferences."
              />
              <div className="flex flex-col gap-3 text-xs">
                {job.workMode && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-ui-muted">Work mode</span>
                    <span
                      className={`font-medium ${
                        profile?.workMode && profile.workMode !== job.workMode
                          ? "text-amber-700"
                          : "text-ui-ink"
                      }`}
                    >
                      {job.workMode}
                      {profile?.workMode && profile.workMode !== job.workMode
                        ? ` (you prefer ${profile.workMode})`
                        : profile?.workMode === job.workMode
                          ? " ✓ matches your preference"
                          : ""}
                    </span>
                  </div>
                )}
                {job.location && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-ui-muted">Location</span>
                    <span className="font-medium text-ui-ink">{job.location}</span>
                  </div>
                )}
                {preferenceGaps.map((g) => (
                  <div key={g} className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-amber-800">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{g}</span>
                  </div>
                ))}
                {preferenceGaps.length === 0 && !profile?.workMode && (
                  <p className="text-ui-muted">
                    Set work mode and location preferences in your{" "}
                    <Link href="/profile" className="font-medium text-ui-violet hover:underline">
                      profile
                    </Link>{" "}
                    to see constraint analysis.
                  </p>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Demonstrated capabilities, requirements, missing */}
        <div className="flex flex-col gap-6 lg:col-span-7">

          {/* What You Can Demonstrate */}
          <Card>
            <CardHeader
              title="What You Can Demonstrate"
              description="Requirements supported by your confirmed profile."
            />
            <div className="flex flex-col gap-4">
              {job.match.matchedSkills.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Confirmed skill matches
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.match.matchedSkills.map((skill) => (
                      <Badge key={`m-${skill}`} className="bg-emerald-50 text-emerald-700">
                        <CheckCircle2 className="mr-1 inline h-3 w-3" />
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 rounded-lg border border-ui-border bg-ui-linen p-3 text-xs text-ui-muted">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    No skills from your profile directly match listed requirements. Add confirmed skills in your{" "}
                    <Link href="/profile" className="font-medium text-ui-violet hover:underline">profile</Link>.
                  </span>
                </div>
              )}

              {/* Relevant experience */}
              {relevantExperience.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    Relevant experience
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {relevantExperience.map((exp) => (
                      <li key={exp.id} className="rounded-lg border border-slate-100 bg-ui-canvas p-3 text-xs">
                        <div className="flex items-start gap-2">
                          <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ui-muted" />
                          <div>
                            <p className="font-semibold text-ui-ink">
                              {exp.title}
                              {exp.company ? ` at ${exp.company}` : ""}
                            </p>
                            {exp.startDate && (
                              <p className="text-ui-muted">
                                {exp.startDate}
                                {exp.endDate ? ` – ${exp.endDate}` : exp.isCurrent ? " – Present" : ""}
                              </p>
                            )}
                            {(exp.technologies ?? []).length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {(exp.technologies ?? [])
                                  .filter((t) => matchedSkillsLower.has(t.toLowerCase()))
                                  .slice(0, 4)
                                  .map((t) => (
                                    <span
                                      key={t}
                                      className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                                    >
                                      {t}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Relevant projects */}
              {relevantProjects.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    Relevant projects
                  </p>
                  <ul className="flex flex-col gap-2">
                    {relevantProjects.map((proj) => (
                      <li key={proj.id} className="rounded-lg border border-slate-100 bg-ui-canvas p-3 text-xs">
                        <p className="font-semibold text-ui-ink">{proj.name}</p>
                        {proj.description && (
                          <p className="mt-0.5 text-ui-body line-clamp-2">{proj.description}</p>
                        )}
                        {(proj.technologies ?? []).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {(proj.technologies ?? []).slice(0, 5).map((t) => (
                              <span
                                key={t}
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  matchedSkillsLower.has(t.toLowerCase())
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-ui-linen text-ui-body"
                                }`}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {relevantExperience.length === 0 && relevantProjects.length === 0 && job.match.matchedSkills.length > 0 && (
                <p className="text-xs text-ui-muted">
                  Add technologies to your work experience and projects in your{" "}
                  <Link href="/profile" className="font-medium text-ui-violet hover:underline">
                    profile
                  </Link>{" "}
                  to see relevant entries here.
                </p>
              )}
            </div>
          </Card>

          {/* Transferable Capabilities */}
          {job.match.transferableSkills.length > 0 && (
            <Card>
              <CardHeader
                title="Transferable Capabilities"
                description="Skills from your profile that bridge related requirements."
              />
              <ul className="flex flex-col gap-3">
                {job.match.transferableSkills.map((item) => (
                  <li
                    key={`${item.candidateSkill}-${item.targetSkill}`}
                    className="rounded-lg border border-sky-100 bg-sky-50/50 p-3 text-xs"
                  >
                    <p className="flex items-center gap-1.5 font-semibold text-ui-ink">
                      <span>{item.candidateSkill}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-sky-600" />
                      <span>{item.targetSkill}</span>
                    </p>
                    <p className="mt-1 leading-relaxed text-ui-body">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* What This Role Requires */}
          <Card>
            <CardHeader
              title="What This Role Requires"
              description="Requirements extracted from the posting. ✓ marks skills found in your profile."
            />
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                  Required Skills
                </p>
                {job.intelligence.requiredSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {job.intelligence.requiredSkills.map((skill) => {
                      const matched = job.match.matchedSkills.some(
                        (m) => m.toLowerCase() === skill.toLowerCase()
                      );
                      return (
                        <Badge
                          key={`req-${skill}`}
                          className={
                            matched
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-ui-linen text-ui-ink"
                          }
                        >
                          {matched ? `✓ ${skill}` : skill}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-ui-muted">No specific keyword tags detected.</p>
                )}
              </div>

              {job.intelligence.preferredSkills.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    Preferred / Bonus Skills
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.intelligence.preferredSkills.map((skill) => (
                      <Badge key={`pref-${skill}`} className="bg-amber-50 text-amber-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {job.intelligence.technicalRequirements.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                    Technical Requirements
                  </p>
                  <ul className="flex flex-col gap-2 text-sm leading-relaxed text-ui-ink">
                    {job.intelligence.technicalRequirements.map((req) => (
                      <li key={req} className="flex items-start gap-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          {/* Not Documented in Your Profile */}
          {(job.match.missingSkills.length > 0 || skillGaps.length > 0) && (
            <Card>
              <CardHeader
                title="Not Documented in Your Profile"
                description=""
              />
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="leading-relaxed">
                    These requirements weren&apos;t found in your documented profile. This does not mean you lack these skills — it means they aren&apos;t currently documented. Add them to your profile if you have the experience.
                  </p>
                </div>

                {job.match.missingSkills.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-ui-muted">Missing from your profile</p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.match.missingSkills.map((skill) => (
                        <Badge key={`missing-${skill}`} className="bg-ui-linen text-ui-body">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {skillGaps.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-ui-muted">Other notes</p>
                    <ul className="flex flex-col gap-1 text-xs text-ui-ink">
                      {skillGaps.map((g) => (
                        <li key={g}>• {g}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Link
                  href="/profile#section-skills"
                  className="text-xs font-medium text-ui-violet hover:underline"
                >
                  Add skills to your profile →
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Recommended Next Action */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ui-lilac-soft">
              <Sparkles className="h-4 w-4 text-ui-violet" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ui-muted">
                Recommended Next Action
              </p>
              <p className="mt-0.5 text-base font-semibold text-ui-ink">
                {recommendedAction.label}
              </p>
              <p className="mt-0.5 text-sm text-ui-body">{recommendedAction.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isDismissed ? (
              <Button loading={busy} onClick={handleDismiss}>
                <Undo2 className="mr-1.5 inline h-4 w-4" />
                Restore to Feed
              </Button>
            ) : !isSaved ? (
              <>
                <Button loading={busy} onClick={handleToggleSave}>
                  <Bookmark className="mr-1.5 inline h-4 w-4" />
                  Save This Role
                </Button>
                <Link href={`/studio?tab=tailored&jobId=${job.id}`}>
                  <Button variant="secondary">
                    <FileText className="mr-1.5 inline h-4 w-4" />
                    Tailor Resume
                  </Button>
                </Link>
              </>
            ) : (
              <Link href={`/studio?tab=tailored&jobId=${job.id}`}>
                <Button>
                  <FileText className="mr-1.5 inline h-4 w-4" />
                  Tailor Resume
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Card>

      {/* Role Overview */}
      <Card>
        <CardHeader
          title="Role Overview"
          description="Company context, seniority expectations, and what this role focuses on."
        />
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-ui-ink">{job.intelligence.summary}</p>

          {job.intelligence.companyAndRoleHighlights.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2">
              {job.intelligence.companyAndRoleHighlights.map((hl) => (
                <div
                  key={hl}
                  className="flex items-center gap-2 rounded-lg border border-slate-100 bg-ui-canvas px-3 py-2 text-xs font-medium text-ui-ink"
                >
                  <Briefcase className="h-3.5 w-3.5 shrink-0 text-ui-muted" />
                  <span>{hl}</span>
                </div>
              ))}
            </div>
          )}

          {job.intelligence.responsibilities.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                Key Responsibilities
              </p>
              <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-ui-ink">
                {job.intelligence.responsibilities.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ui-wine" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowRawDescription((prev) => !prev)}
              className="text-xs font-medium text-ui-violet hover:underline"
            >
              {showRawDescription
                ? "Hide full job posting"
                : "Show full job posting"}
            </button>
            {showRawDescription && (
              <p className="mt-3 whitespace-pre-line rounded-lg bg-ui-canvas p-4 text-xs leading-relaxed text-ui-ink">
                {job.description}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
