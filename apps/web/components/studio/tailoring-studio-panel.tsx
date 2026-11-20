"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import type {
  ApplicationDto,
  CoverLetterContent,
  CoverLetterTone,
  JobDto,
  TailoredDocumentDto,
  TailoredDocumentType,
  TailoredResumeContent,
} from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Printer,
  Copy,
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Columns2,
  Plus,
  Trash2,
  ChevronDown,
  Palette,
  ShieldCheck,
  TrendingUp,
  FileCode,
  Check,
  Briefcase,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { api, ApiError } from "@/lib/api-client";
import { ResumeCanvas } from "./resume-canvas";
import { ResumeDesignPanel } from "./resume-design-panel";
import { AtsAuditCard } from "./ats-audit-card";
import { AiWorkflowToolbar } from "./ai-workflow-toolbar";
import {
  DEFAULT_RESUME_DESIGN_SETTINGS,
  type ResumeDesignSettings,
} from "@/lib/resume/types";
import { exportToJsonResume, exportToMarkdown } from "@/lib/resume/export";

function formatResumeAsText(doc: TailoredDocumentDto): string {
  const c = doc.content as TailoredResumeContent;
  const contactParts = c.contactInfo
    ? [c.contactInfo.email, c.contactInfo.phone, c.contactInfo.location]
        .filter(Boolean)
        .join(" | ")
    : "";
  const lines = [
    `# ${c.contactInfo?.fullName || doc.jobTitle} — ${doc.company}`,
    contactParts ? `Contact: ${contactParts}` : "",
    "",
    `## ${c.headline}`,
    c.summary,
    "",
    `### Core Competencies & Skills`,
    c.highlightedSkills.join(", "),
    "",
    `### Professional Experience`,
    ...c.experience.flatMap((exp) => [
      `**${exp.title}** — ${exp.company} (${exp.startDate ?? ""} – ${exp.endDate ?? "Present"})`,
      exp.tailoredDescription,
      "",
    ]),
  ];
  if (c.education && c.education.length > 0) {
    lines.push(`### Education`);
    for (const edu of c.education) {
      lines.push(
        `${edu.degree ? `${edu.degree} in ` : ""}${edu.fieldOfStudy || ""} — ${edu.institution}${
          edu.graduationYear ? ` (${edu.graduationYear})` : ""
        }`
      );
    }
    lines.push("");
  }
  return lines.filter((l) => l !== "").join("\n");
}

function formatCoverLetterAsText(doc: TailoredDocumentDto): string {
  const c = doc.content as CoverLetterContent;
  return [
    `Subject: ${c.subjectLine}`,
    "",
    c.greeting,
    "",
    ...c.bodyParagraphs.flatMap((p) => [p, ""]),
    c.closing,
    c.signature,
  ].join("\n");
}

function downloadTextFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export type StudioLayoutMode = "split" | "canvas" | "editor";

export function TailoringStudioPanel({
  mode = "all",
  embedded = false,
}: {
  mode?: "all" | TailoredDocumentType;
  embedded?: boolean;
}) {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get("jobId") ?? "";
  const initialAppId = searchParams.get("applicationId") ?? "";
  const paramType: TailoredDocumentType =
    searchParams.get("type") === "cover_letter" ? "cover_letter" : "resume";
  const initialDocType: TailoredDocumentType = mode === "all" ? paramType : mode;

  const [docs, setDocs] = useState<TailoredDocumentDto[]>([]);
  const [jobs, setJobs] = useState<JobDto[]>([]);
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewingPdf, setPreviewingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Layout mode: split (dual-command), canvas (artboard focus), editor (content workbench focus)
  const [layoutMode, setLayoutMode] = useState<StudioLayoutMode>("split");

  // Modal creation dialog
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [docType, setDocType] = useState<TailoredDocumentType>(initialDocType);
  const [tone, setTone] = useState<CoverLetterTone>("conversational");
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [selectedAppId, setSelectedAppId] = useState(initialAppId);
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const [activeDoc, setActiveDoc] = useState<TailoredDocumentDto | null>(null);
  const [draftContent, setDraftContent] = useState<
    TailoredResumeContent | CoverLetterContent | null
  >(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.get<TailoredDocumentDto[]>("/tailor"),
      api.get<JobDto[]>("/jobs"),
      api.get<ApplicationDto[]>("/applications"),
    ])
      .then(([loadedDocs, loadedJobs, loadedApps]) => {
        if (cancelled) return;
        const scopedDocs =
          mode === "all" ? loadedDocs : loadedDocs.filter((d) => d.type === mode);
        setDocs(scopedDocs);
        setJobs(loadedJobs);
        setApplications(loadedApps);

        if (initialJobId) {
          const matched = loadedJobs.find((j) => j.id === initialJobId);
          if (matched) {
            setCompany(matched.company);
            setJobTitle(matched.title);
            setJobDescription(matched.description);
          }
        } else if (initialAppId) {
          const matchedApp = loadedApps.find((a) => a.id === initialAppId);
          if (matchedApp) {
            setCompany(matchedApp.company);
            setJobTitle(matchedApp.title);
            if (matchedApp.jobId) {
              setSelectedJobId(matchedApp.jobId);
              const linkedJob = loadedJobs.find((j) => j.id === matchedApp.jobId);
              if (linkedJob) setJobDescription(linkedJob.description);
            }
          }
        }

        const matchingDoc =
          (initialJobId && scopedDocs.find((d) => d.jobId === initialJobId)) ||
          (initialAppId && scopedDocs.find((d) => d.applicationId === initialAppId)) ||
          scopedDocs[0] ||
          null;
        if (matchingDoc) {
          setActiveDoc(matchingDoc);
          setDraftContent(matchingDoc.content);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.detail : "Failed to load tailoring workspace."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialAppId, initialJobId, mode]);

  function handleSelectSavedJob(jobId: string) {
    setSelectedJobId(jobId);
    setSelectedAppId("");
    const job = jobs.find((j) => j.id === jobId);
    if (job) {
      setCompany(job.company);
      setJobTitle(job.title);
      setJobDescription(job.description);
      if (job.applicationId) setSelectedAppId(job.applicationId);
    }
  }

  function selectDoc(doc: TailoredDocumentDto) {
    setActiveDoc(doc);
    setDraftContent(doc.content);
    setNotice(null);
    setError(null);
  }

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setGenerating(true);
    try {
      const created = await api.post<TailoredDocumentDto>("/tailor", {
        type: docType,
        tone: docType === "cover_letter" ? tone : undefined,
        jobId: selectedJobId || undefined,
        applicationId: selectedAppId || undefined,
        company: company.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        jobDescription: jobDescription.trim() || undefined,
      });
      setDocs((prev) => [created, ...prev]);
      setActiveDoc(created);
      setDraftContent(created.content);
      setIsCreateModalOpen(false);
      setNotice(
        created.type === "resume"
          ? "Tailored resume generated from your verified profile."
          : "Cover letter drafted from your verified profile."
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to generate draft.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveEdits() {
    if (!activeDoc || !draftContent) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api.patch<TailoredDocumentDto>(
        `/tailor/${activeDoc.id}`,
        { content: draftContent }
      );
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setActiveDoc(updated);
      setDraftContent(updated.content);
      setNotice("Saved changes.");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePreviewPdf() {
    if (!activeDoc || !draftContent) return;
    const tab = window.open("", "_blank");
    setPreviewingPdf(true);
    setError(null);
    try {
      const updated = await api.patch<TailoredDocumentDto>(
        `/tailor/${activeDoc.id}`,
        { content: draftContent }
      );
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      setActiveDoc(updated);
      setDraftContent(updated.content);
      if (tab) {
        tab.location.href = `/api/tailor/${activeDoc.id}/pdf`;
      }
    } catch (err) {
      tab?.close();
      setError(
        err instanceof ApiError
          ? err.detail
          : "Failed to save before PDF preview. Please save your edits first and try again."
      );
    } finally {
      setPreviewingPdf(false);
    }
  }

  async function handleDelete(docId: string) {
    if (!window.confirm("Are you sure you want to delete this tailored draft?")) return;
    setError(null);
    try {
      await api.delete(`/tailor/${docId}`);
      const remaining = docs.filter((d) => d.id !== docId);
      setDocs(remaining);
      if (activeDoc?.id === docId) {
        const next = remaining[0] ?? null;
        setActiveDoc(next);
        setDraftContent(next?.content ?? null);
      }
      setNotice("Draft deleted.");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to delete document.");
    }
  }

  async function handleCopy() {
    if (!activeDoc || !draftContent) return;
    const mergedDoc = { ...activeDoc, content: draftContent };
    const text =
      activeDoc.type === "resume"
        ? formatResumeAsText(mergedDoc)
        : formatCoverLetterAsText(mergedDoc);
    await navigator.clipboard.writeText(text);
    setNotice("Copied to clipboard.");
  }

  function handleDownloadJson() {
    if (!activeDoc || !draftContent || activeDoc.type !== "resume") return;
    const jsonDoc = exportToJsonResume(draftContent as TailoredResumeContent, {
      jobTitle: activeDoc.jobTitle,
      company: activeDoc.company,
    });
    downloadTextFile(
      `${activeDoc.company}-${activeDoc.jobTitle}-resume.json`,
      JSON.stringify(jsonDoc, null, 2)
    );
  }

  function handleDownloadMarkdown() {
    if (!activeDoc || !draftContent || activeDoc.type !== "resume") return;
    const md = exportToMarkdown(draftContent as TailoredResumeContent, {
      jobTitle: activeDoc.jobTitle,
      company: activeDoc.company,
    });
    downloadTextFile(`${activeDoc.company}-${activeDoc.jobTitle}-resume.md`, md);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page Header (when not embedded) */}
      {!embedded && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-ui-teal-soft px-2 py-0.5 text-xs font-semibold text-ui-teal">
                Dual-Command Studio
              </span>
              <span className="text-xs text-ui-muted">• Evidence-Grounded</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-ui-ink">
              Application Tailoring Studio
            </h1>
            <p className="mt-0.5 text-sm text-ui-muted">
              Evidence-based resume tailoring and strategic cover letters — zero hallucination, Google XYZ impact formula, and live ATS intelligence.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Application Draft
          </Button>
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col gap-4">
          <div className="h-14 animate-pulse rounded-xl bg-ui-canvas border border-ui-border" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="h-96 animate-pulse rounded-xl bg-ui-canvas border border-ui-border lg:col-span-6" />
            <div className="h-96 animate-pulse rounded-xl bg-ui-canvas border border-ui-border lg:col-span-6" />
          </div>
        </div>
      )}

      {/* Empty State when no documents exist */}
      {!loading && docs.length === 0 && (
        <Card className="py-12 px-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ui-teal-soft text-ui-teal shadow-sm">
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-ui-ink">
            No Application Drafts Yet
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ui-muted leading-relaxed">
            ApplyFocus tailors your verified career history to specific roles without ever inventing skills, experience, or metrics. Start by generating your first evidence-grounded draft.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-ui-border bg-ui-canvas p-3.5">
              <div className="flex items-center gap-2 text-ui-teal font-semibold text-xs">
                <CheckCircle2 className="h-4 w-4" />
                Zero Hallucination
              </div>
              <p className="mt-1 text-xs text-ui-muted">
                Strictly grounded in your verified career history. Never fabricates claims.
              </p>
            </div>

            <div className="rounded-xl border border-ui-border bg-ui-canvas p-3.5">
              <div className="flex items-center gap-2 text-ui-teal font-semibold text-xs">
                <Sparkles className="h-4 w-4" />
                Google XYZ Formula
              </div>
              <p className="mt-1 text-xs text-ui-muted">
                Structures bullets as: Accomplished [X] measured by [Y] by doing [Z].
              </p>
            </div>

            <div className="rounded-xl border border-ui-border bg-ui-canvas p-3.5">
              <div className="flex items-center gap-2 text-ui-teal font-semibold text-xs">
                <ShieldCheck className="h-4 w-4" />
                Live ATS Inspector
              </div>
              <p className="mt-1 text-xs text-ui-muted">
                Calculates metric density, recruiter power verbs, and keyword alignment.
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2.5 font-semibold shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4 inline" />
              Create Your First Tailored Draft
            </Button>
          </div>
        </Card>
      )}

      {/* Main Studio View when documents exist */}
      {!loading && docs.length > 0 && activeDoc && draftContent && (
        <div className="flex flex-col gap-4">
          {/* Top Application Command Deck */}
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ui-border bg-white/95 p-3 shadow-xs backdrop-blur-md">
            {/* Left: Document Switcher + New Draft Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[240px] max-w-sm">
                <select
                  value={activeDoc.id}
                  onChange={(e) => {
                    const matched = docs.find((d) => d.id === e.target.value);
                    if (matched) selectDoc(matched);
                  }}
                  className="w-full appearance-none rounded-lg border border-ui-border bg-ui-canvas py-2 pl-3 pr-8 text-xs font-semibold text-ui-ink shadow-xs focus:border-ui-teal focus:outline-none"
                >
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.jobTitle} @ {d.company} ({d.type === "resume" ? "Resume" : "Letter"})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ui-muted" />
              </div>

              <Button
                variant="secondary"
                className="px-2.5 py-1.5 text-xs font-medium"
                onClick={() => setIsCreateModalOpen(true)}
                title="Create a new tailored draft"
              >
                <Plus className="mr-1 inline h-3.5 w-3.5 text-ui-teal" />
                New Draft
              </Button>

              <button
                type="button"
                onClick={() => handleDelete(activeDoc.id)}
                className="rounded-lg p-1.5 text-ui-muted hover:bg-ui-error-soft hover:text-ui-error transition-colors"
                title="Delete this draft"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Center: Studio Layout Switcher (Dual / Canvas / Editor) */}
            <div className="flex items-center rounded-lg border border-ui-border bg-ui-canvas p-0.5">
              <button
                type="button"
                onClick={() => setLayoutMode("split")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  layoutMode === "split"
                    ? "bg-white text-ui-ink shadow-xs font-semibold"
                    : "text-ui-muted hover:text-ui-ink"
                }`}
                title="Dual-Command: Live Canvas + Workbench Side-by-Side"
              >
                <Columns2 className="h-3.5 w-3.5 text-ui-teal" />
                <span className="hidden sm:inline">Split Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("canvas")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  layoutMode === "canvas"
                    ? "bg-white text-ui-ink shadow-xs font-semibold"
                    : "text-ui-muted hover:text-ui-ink"
                }`}
                title="Canvas Focus: Full Screen Artboard & Typography"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Canvas Focus</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("editor")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  layoutMode === "editor"
                    ? "bg-white text-ui-ink shadow-xs font-semibold"
                    : "text-ui-muted hover:text-ui-ink"
                }`}
                title="Editor Focus: Full Screen Content & ATS Optimization"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Editor Focus</span>
              </button>
            </div>

            {/* Right: Export & Save Suite */}
            <div className="flex flex-wrap items-center gap-1.5">
              {activeDoc.type === "resume" && (
                <>
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={handleDownloadJson}
                    title="Export JSON Resume (jsonresume.org standard)"
                  >
                    <FileCode className="mr-1 inline h-3.5 w-3.5 text-ui-teal" />
                    <span className="hidden md:inline">JSON</span>
                  </Button>
                  <Button
                    variant="secondary"
                    className="px-2 py-1 text-xs"
                    onClick={handleDownloadMarkdown}
                    title="Export Markdown (.md)"
                  >
                    <Download className="mr-1 inline h-3.5 w-3.5" />
                    <span className="hidden md:inline">.md</span>
                  </Button>
                </>
              )}

              <Button
                variant="secondary"
                className="px-2 py-1 text-xs"
                onClick={() =>
                  downloadTextFile(
                    `${activeDoc.company}-${activeDoc.jobTitle}-${activeDoc.type}.txt`,
                    activeDoc.type === "resume"
                      ? formatResumeAsText({ ...activeDoc, content: draftContent })
                      : formatCoverLetterAsText({ ...activeDoc, content: draftContent })
                  )
                }
                title="Download Plain Text (.txt)"
              >
                <Download className="mr-1 inline h-3.5 w-3.5" />
                <span className="hidden md:inline">.txt</span>
              </Button>

              <Button
                variant="secondary"
                className="px-2 py-1 text-xs"
                onClick={handleCopy}
                title="Copy formatted text to clipboard"
              >
                <Copy className="mr-1 inline h-3.5 w-3.5" />
                <span className="hidden md:inline">Copy</span>
              </Button>

              <Button
                variant="secondary"
                className="px-2.5 py-1 text-xs font-semibold border-ui-teal text-ui-teal hover:bg-ui-teal-soft"
                loading={previewingPdf}
                onClick={handlePreviewPdf}
                title="Print styled PDF or save via browser print"
              >
                <Printer className="mr-1.5 inline h-3.5 w-3.5" />
                Print / PDF
              </Button>

              <Button
                className="px-3 py-1 text-xs font-semibold shadow-xs"
                loading={saving}
                onClick={handleSaveEdits}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Active Workspace: Resume or Cover Letter */}
          {activeDoc.type === "resume" ? (
            <ResumeDraftEditor
              doc={activeDoc}
              content={draftContent as TailoredResumeContent}
              onChange={(next) => setDraftContent(next)}
              layoutMode={layoutMode}
              onNavigateToDesignTab={() => setLayoutMode("split")}
            />
          ) : (
            <CoverLetterEditor
              doc={activeDoc}
              content={draftContent as CoverLetterContent}
              onChange={(next) => setDraftContent(next)}
              layoutMode={layoutMode}
            />
          )}
        </div>
      )}

      {/* Modal for creating a new tailored draft */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          mode === "cover_letter"
            ? "Create Strategic Cover Letter"
            : mode === "resume"
              ? "Create Tailored Resume"
              : "Create Tailored Application Draft"
        }
        description="Grounded strictly in your verified profile. ApplyFocus never fabricates experience or unverified skills."
      >
        <form onSubmit={handleGenerate} className="flex flex-col gap-4">
          {mode === "all" && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDocType("resume")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  docType === "resume"
                    ? "border-ui-teal bg-ui-teal-soft text-ui-teal font-semibold"
                    : "border-ui-border bg-white text-ui-body hover:bg-ui-canvas"
                }`}
              >
                Tailored Resume
              </button>
              <button
                type="button"
                onClick={() => setDocType("cover_letter")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  docType === "cover_letter"
                    ? "border-ui-teal bg-ui-teal-soft text-ui-teal font-semibold"
                    : "border-ui-border bg-white text-ui-body hover:bg-ui-canvas"
                }`}
              >
                Cover Letter
              </button>
            </div>
          )}

          {docType === "cover_letter" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ui-ink">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as CoverLetterTone)}
                className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-sm text-ui-ink focus:border-ui-teal focus:outline-none"
              >
                <option value="conversational">Conversational</option>
                <option value="formal">Formal</option>
                <option value="concise">Concise</option>
              </select>
            </div>
          )}

          {jobs.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ui-ink">
                Select Discovered Opportunity (optional)
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => handleSelectSavedJob(e.target.value)}
                className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-sm text-ui-ink focus:border-ui-teal focus:outline-none"
              >
                <option value="">Custom job / manual entry</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.company} — {job.title} ({job.match.score}% fit)
                  </option>
                ))}
              </select>
            </div>
          )}

          {applications.length > 0 && !selectedJobId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ui-ink">
                Or Link Tracked Application (optional)
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedAppId(id);
                  const app = applications.find((a) => a.id === id);
                  if (app) {
                    setCompany(app.company);
                    setJobTitle(app.title);
                  }
                }}
                className="w-full rounded-lg border border-ui-border bg-white px-3 py-2 text-sm text-ui-ink focus:border-ui-teal focus:outline-none"
              >
                <option value="">None</option>
                {applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.company} — {app.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Stripe"
              required
            />
            <TextField
              label="Job title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ui-ink">
              Job Description or Requirements
            </label>
            <textarea
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the role requirements, tech stack, or qualifications..."
              className="w-full rounded-lg border border-ui-border p-2.5 text-sm text-ui-ink focus:border-ui-teal focus:outline-none"
            />
          </div>

          <div className="mt-2 flex justify-end gap-2 border-t border-ui-border pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={generating}>
              {docType === "resume" ? "Generate Tailored Resume" : "Draft Cover Letter"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ResumeDraftEditor (Dual-Command Architecture)
// ---------------------------------------------------------------------------

function ResumeDraftEditor({
  doc,
  content,
  onChange,
  layoutMode,
  onNavigateToDesignTab,
}: {
  doc: TailoredDocumentDto;
  content: TailoredResumeContent;
  onChange: (next: TailoredResumeContent) => void;
  layoutMode: StudioLayoutMode;
  onNavigateToDesignTab?: () => void;
}) {
  const [workbenchTab, setWorkbenchTab] = useState<
    "content" | "design" | "audit" | "keywords"
  >("content");
  const [newSkill, setNewSkill] = useState("");

  const currentSettings: ResumeDesignSettings =
    content.designSettings || DEFAULT_RESUME_DESIGN_SETTINGS;

  function handleUpdateSettings(nextSettings: ResumeDesignSettings) {
    onChange({
      ...content,
      designSettings: nextSettings,
    });
  }

  function handleAddSkill() {
    const trimmed = newSkill.trim();
    if (!trimmed || content.highlightedSkills.includes(trimmed)) return;
    onChange({
      ...content,
      highlightedSkills: [...content.highlightedSkills, trimmed],
    });
    setNewSkill("");
  }

  function handleRemoveSkill(skillToRemove: string) {
    onChange({
      ...content,
      highlightedSkills: content.highlightedSkills.filter((s) => s !== skillToRemove),
    });
  }

  // Workbench content view
  const renderWorkbenchPane = () => (
    <div className="flex flex-col gap-4">
      {/* AI Application Copilot Toolbar */}
      <AiWorkflowToolbar
        doc={doc}
        content={content}
        onUpdateContent={onChange}
      />

      {/* Workbench Secondary Navigation Tabs */}
      <div className="flex flex-wrap items-center rounded-lg border border-ui-border bg-ui-canvas p-1 gap-1">
        <button
          type="button"
          onClick={() => setWorkbenchTab("content")}
          className={`flex flex-1 min-w-[110px] items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-medium transition-all ${
            workbenchTab === "content"
              ? "bg-white text-ui-ink shadow-xs font-semibold"
              : "text-ui-muted hover:text-ui-ink"
          }`}
        >
          <Edit3 className="h-3.5 w-3.5 text-ui-teal" />
          Content & Bullets
        </button>
        <button
          type="button"
          onClick={() => setWorkbenchTab("design")}
          className={`flex flex-1 min-w-[110px] items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-medium transition-all ${
            workbenchTab === "design"
              ? "bg-white text-ui-ink shadow-xs font-semibold"
              : "text-ui-muted hover:text-ui-ink"
          }`}
        >
          <Palette className="h-3.5 w-3.5 text-ui-teal" />
          Styling & Archetypes
        </button>
        <button
          type="button"
          onClick={() => setWorkbenchTab("audit")}
          className={`flex flex-1 min-w-[110px] items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-medium transition-all ${
            workbenchTab === "audit"
              ? "bg-white text-ui-ink shadow-xs font-semibold"
              : "text-ui-muted hover:text-ui-ink"
          }`}
        >
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          ATS Diagnostics
        </button>
        <button
          type="button"
          onClick={() => setWorkbenchTab("keywords")}
          className={`flex flex-1 min-w-[110px] items-center justify-center gap-1.5 rounded-md py-1.5 px-2 text-xs font-medium transition-all ${
            workbenchTab === "keywords"
              ? "bg-white text-ui-ink shadow-xs font-semibold"
              : "text-ui-muted hover:text-ui-ink"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5 text-ui-teal" />
          Keywords ({content.keywordsUsed.length + content.missingKeywords.length})
        </button>
      </div>

      {/* TAB 1: Content & Bullets Workbench */}
      {workbenchTab === "content" && (
        <Card className="flex flex-col gap-5">
          {/* Google XYZ Tip */}
          <div className="rounded-lg border border-ui-teal/30 bg-ui-teal-soft/40 p-3 text-xs text-ui-ink">
            <p className="font-semibold text-ui-teal-ink flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-ui-teal" />
              Google XYZ Formula Active
            </p>
            <p className="mt-0.5 text-ui-body">
              Accomplished <strong>[X]</strong> as measured by <strong>[Y]</strong> by doing <strong>[Z]</strong>.
              Quantify outcomes with percentages, scale metrics, or velocity gains.
            </p>
          </div>

          <TextField
            label="Tailored Executive Headline"
            value={content.headline}
            onChange={(e) => onChange({ ...content, headline: e.target.value })}
            placeholder="e.g. Senior Backend Engineer | Distributed Systems & High-Throughput APIs"
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ui-ink">
              Tailored Executive Summary
            </label>
            <textarea
              rows={4}
              value={content.summary}
              onChange={(e) => onChange({ ...content, summary: e.target.value })}
              className="w-full rounded-lg border border-ui-border p-2.5 text-sm text-ui-ink focus:border-ui-teal focus:outline-none"
            />
          </div>

          {/* Highlighted Skills Editor */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ui-ink">
              Core Competencies & Skills ({content.highlightedSkills.length})
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {content.highlightedSkills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 rounded bg-ui-canvas px-2.5 py-1 text-xs font-medium text-ui-ink border border-ui-border shadow-2xs"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(s)}
                    className="text-ui-muted hover:text-ui-error ml-0.5"
                    title={`Remove ${s}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add verified skill (e.g. Distributed Caching)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="rounded-lg border border-ui-border px-3 py-1.5 text-xs text-ui-ink focus:border-ui-teal focus:outline-none flex-1 max-w-xs"
              />
              <Button
                type="button"
                variant="secondary"
                className="px-3 py-1.5 text-xs"
                onClick={handleAddSkill}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Experience Bullets Editor */}
          {content.experience.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-ui-border pt-4">
              <div>
                <h3 className="text-sm font-semibold text-ui-ink">
                  Professional Experience (Original vs. Tailored XYZ)
                </h3>
                <p className="text-xs text-ui-muted mt-0.5">
                  Side-by-side evidence tracking. Edit your tailored bullets below; changes update the live canvas in real time.
                </p>
              </div>

              {content.experience.map((exp, idx) => (
                <div
                  key={`${exp.company}-${exp.title}-${idx}`}
                  className="rounded-xl border border-ui-border p-4 bg-ui-surface"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-1 border-b border-ui-border/60 pb-2">
                    <p className="font-semibold text-ui-ink text-sm">
                      {exp.title} — {exp.company}
                    </p>
                    <p className="text-xs text-ui-muted">
                      {exp.startDate ?? "—"} – {exp.endDate ?? "Present"}
                    </p>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ui-muted">
                        Original Career History
                      </p>
                      <p className="whitespace-pre-line rounded-lg bg-ui-canvas p-2.5 text-xs text-ui-body border border-ui-border/60 max-h-56 overflow-y-auto leading-relaxed">
                        {exp.originalDescription || "No original description recorded."}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ui-teal-ink flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Tailored XYZ Bullets
                      </p>
                      <textarea
                        rows={7}
                        value={exp.tailoredDescription}
                        onChange={(e) => {
                          const updated = content.experience.map((item, i) =>
                            i === idx
                              ? { ...item, tailoredDescription: e.target.value }
                              : item
                          );
                          onChange({ ...content, experience: updated });
                        }}
                        className="w-full rounded-lg border border-ui-border p-2.5 text-xs text-ui-ink focus:border-ui-teal focus:outline-none font-sans leading-relaxed"
                        placeholder="- Accomplished [X] as measured by [Y] by doing [Z]..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 2: Styling & Archetypes */}
      {workbenchTab === "design" && (
        <ResumeDesignPanel
          settings={currentSettings}
          onChange={handleUpdateSettings}
        />
      )}

      {/* TAB 3: ATS Diagnostics */}
      {workbenchTab === "audit" && (
        <AtsAuditCard
          content={content}
          jobDescription={doc.jobTitle}
        />
      )}

      {/* TAB 4: Keywords & Gap Strategy */}
      {workbenchTab === "keywords" && (
        <Card className="flex flex-col gap-5">
          {content.rationale && (
            <div className="rounded-lg border border-ui-teal/30 bg-ui-teal-soft/40 p-3.5 text-xs text-ui-ink">
              <p className="font-semibold text-ui-teal-ink flex items-center gap-1.5 mb-1">
                <Sparkles className="h-4 w-4" />
                AI Tailoring Strategy & Positioning Rationale
              </p>
              <p className="text-ui-body leading-relaxed">{content.rationale}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Matched Target Keywords ({content.keywordsUsed.length})
              </p>
              <span className="text-xs text-ui-muted">Found in your verified profile</span>
            </div>
            {content.keywordsUsed.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {content.keywordsUsed.map((kw) => (
                  <Badge
                    key={kw}
                    className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs"
                  >
                    <Check className="mr-1 inline h-3 w-3 text-emerald-600" />
                    {kw}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ui-muted italic">No matching keywords detected.</p>
            )}
          </div>

          <div className="border-t border-ui-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                Candidate-First Evidence Gaps ({content.missingKeywords.length})
              </p>
              <span className="text-xs text-ui-muted">Strictly uninvented</span>
            </div>
            {content.missingKeywords.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {content.missingKeywords.map((kw) => (
                    <Badge
                      key={kw}
                      className="bg-amber-50 text-amber-800 border-amber-200 text-xs"
                    >
                      {kw}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2.5 text-xs text-ui-muted leading-relaxed">
                  💡 <strong>Recruiter Tip:</strong> These requirements were detected in the target job description. ApplyFocus strictly grounds your resume in authentic background and never invents skills. If you possess adjacent experience with any of these, consider addressing them in your interview or cover letter.
                </p>
              </>
            ) : (
              <p className="text-xs text-emerald-700 font-medium">
                🎉 Fantastic! 100% of detected target keywords are covered in your profile.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );

  // Live Canvas View
  const renderCanvasPane = () => (
    <div className="w-full">
      <ResumeCanvas
        content={content}
        settings={currentSettings}
        onUpdateSettings={handleUpdateSettings}
        fallbackJobTitle={doc.jobTitle}
        fallbackCompany={doc.company}
        onNavigateToDesign={() => {
          setWorkbenchTab("design");
          if (onNavigateToDesignTab) onNavigateToDesignTab();
        }}
      />
    </div>
  );

  // Layout presentation based on layoutMode
  if (layoutMode === "canvas") {
    return (
      <div className="mx-auto max-w-5xl">
        {renderCanvasPane()}
      </div>
    );
  }

  if (layoutMode === "editor") {
    return (
      <div className="mx-auto max-w-4xl">
        {renderWorkbenchPane()}
      </div>
    );
  }

  // Default: "split" (Dual-Command Studio)
  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      {/* Left: Workbench & Copilot (5 cols on large screens, 6 on medium) */}
      <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-4">
        {renderWorkbenchPane()}
      </div>

      {/* Right: Sticky Live Artboard Canvas (6 cols on large screens, 7 on xl) */}
      <div className="lg:col-span-6 xl:col-span-7 sticky top-20">
        {renderCanvasPane()}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CoverLetterEditor (Dual-Command Architecture)
// ---------------------------------------------------------------------------

function CoverLetterEditor({
  doc,
  content,
  onChange,
  layoutMode,
}: {
  doc: TailoredDocumentDto;
  content: CoverLetterContent;
  onChange: (next: CoverLetterContent) => void;
  layoutMode: StudioLayoutMode;
}) {
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");

  const renderEditorPane = () => (
    <Card className="flex flex-col gap-4">
      {content.keyPointsHighlighted.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ui-muted">
            Key Strategic Points Emphasized
          </p>
          <div className="flex flex-wrap gap-1.5">
            {content.keyPointsHighlighted.map((point) => (
              <Badge key={point} className="bg-ui-teal-soft text-ui-teal text-xs">
                {point}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <TextField
        label="Subject line"
        value={content.subjectLine}
        onChange={(e) => onChange({ ...content, subjectLine: e.target.value })}
      />

      <TextField
        label="Greeting"
        value={content.greeting}
        onChange={(e) => onChange({ ...content, greeting: e.target.value })}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ui-ink">
          Body Paragraphs (separated by blank lines)
        </label>
        <textarea
          rows={10}
          value={content.bodyParagraphs.join("\n\n")}
          onChange={(e) =>
            onChange({
              ...content,
              bodyParagraphs: e.target.value
                .split(/\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean),
            })
          }
          className="w-full rounded-lg border border-ui-border p-3 text-sm leading-relaxed text-ui-ink focus:border-ui-teal focus:outline-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Closing"
          value={content.closing}
          onChange={(e) => onChange({ ...content, closing: e.target.value })}
        />
        <TextField
          label="Signature"
          value={content.signature}
          onChange={(e) => onChange({ ...content, signature: e.target.value })}
        />
      </div>
    </Card>
  );

  const renderPreviewPane = () => (
    <div className="relative rounded-xl border border-ui-border bg-stone-100/60 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl rounded-xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-md text-stone-900 font-sans">
        <div className="border-b border-stone-200 pb-4">
          <p className="text-xs uppercase tracking-wider text-stone-500 font-semibold">
            Application for {doc.jobTitle}
          </p>
          <h1 className="mt-1 text-lg font-bold text-stone-900">{doc.company}</h1>
          <p className="mt-2 text-xs font-semibold text-stone-800">
            Re: {content.subjectLine}
          </p>
        </div>

        <div className="mt-6 space-y-4 text-xs sm:text-sm leading-relaxed text-stone-700">
          <p className="font-semibold text-stone-900">{content.greeting}</p>
          {content.bodyParagraphs.map((para, idx) => (
            <p key={idx} className="leading-relaxed">
              {para}
            </p>
          ))}
          <div className="pt-4">
            <p>{content.closing},</p>
            <p className="mt-2 font-semibold text-stone-900">{content.signature}</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (layoutMode === "canvas") {
    return <div className="mx-auto max-w-3xl">{renderPreviewPane()}</div>;
  }

  if (layoutMode === "editor") {
    return <div className="mx-auto max-w-3xl">{renderEditorPane()}</div>;
  }

  // Default: split
  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      <div className="lg:col-span-6">{renderEditorPane()}</div>
      <div className="lg:col-span-6 sticky top-20">{renderPreviewPane()}</div>
    </div>
  );
}
