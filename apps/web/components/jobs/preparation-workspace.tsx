"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Lightbulb,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type {
  ApplicationStrategyContent,
  ApplicationStrategyDto,
  CoverLetterContent,
  CoverLetterTone,
  JobDetailDto,
  RankedEvidenceItem,
  ScreeningAnswerEntry,
  ScreeningAnswerResult,
  TailoredDocumentDto,
  TailoredResumeContent,
} from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";

// ─── Status helpers ────────────────────────────────────────────────────────

type PrepStatus =
  | "not_started"
  | "generating"
  | "ready_for_review"
  | "approved"
  | "failed";

function StatusChip({ status }: { status: PrepStatus }) {
  const map: Record<PrepStatus, { label: string; classes: string }> = {
    not_started: { label: "Not started", classes: "bg-ui-linen text-ui-muted" },
    generating: { label: "Generating…", classes: "bg-amber-50 text-amber-700" },
    ready_for_review: { label: "Ready for review", classes: "bg-sky-50 text-sky-700" },
    approved: { label: "Approved", classes: "bg-emerald-50 text-emerald-700" },
    failed: { label: "Failed", classes: "bg-red-50 text-red-700" },
  };
  const { label, classes } = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${classes}`}>
      {status === "generating" && (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      )}
      {status === "approved" && (
        <CheckCircle2 className="mr-1 h-3 w-3" />
      )}
      {label}
    </span>
  );
}

// ─── Section toggle ────────────────────────────────────────────────────────

function SectionRow({
  icon,
  title,
  status,
  expanded,
  onToggle,
  children,
  optional,
}: {
  icon: React.ReactNode;
  title: string;
  status: PrepStatus;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ui-border bg-white">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        onClick={onToggle}
      >
        <span className="shrink-0 text-ui-violet">{icon}</span>
        <span className="flex-1 font-medium text-ui-ink">{title}</span>
        {optional && (
          <span className="mr-2 text-xs text-ui-muted">Optional</span>
        )}
        <StatusChip status={status} />
        <span className="ml-2 shrink-0 text-ui-muted">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-ui-border px-4 pb-4 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Strategy section ──────────────────────────────────────────────────────

function StrategySection({
  job,
  strategy,
  strategyStatus,
  onGenerate,
  onApprove,
}: {
  job: JobDetailDto;
  strategy: ApplicationStrategyDto | null;
  strategyStatus: PrepStatus;
  onGenerate: () => Promise<void>;
  onApprove: () => Promise<void>;
}) {
  const content = strategy?.content as ApplicationStrategyContent | undefined;

  if (strategyStatus === "not_started" || strategyStatus === "failed") {
    return (
      <div className="flex flex-col gap-3">
        {strategyStatus === "failed" && (
          <Alert tone="error">Strategy generation failed. Please retry.</Alert>
        )}
        <p className="text-sm text-ui-body">
          Generate a job-specific strategy to guide your resume tailoring, cover letter, and screening answers.
        </p>
        <Button loading={false} onClick={onGenerate}>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Application Strategy
        </Button>
      </div>
    );
  }

  if (strategyStatus === "generating") {
    return (
      <div className="flex items-center gap-3 py-4 text-sm text-ui-muted">
        <Loader2 className="h-4 w-4 animate-spin text-ui-violet" />
        Analysing your profile against {job.company} requirements…
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-ui-border bg-ui-canvas p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ui-violet mb-1">
          Recommended Positioning
        </p>
        <p className="text-sm text-ui-ink leading-relaxed">{content.positioning}</p>
      </div>

      {content.topEvidence.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-muted">
            Top Evidence to Highlight
          </p>
          <div className="flex flex-col gap-2">
            {content.topEvidence.slice(0, 6).map((ev: RankedEvidenceItem) => (
              <div
                key={`${ev.type}-${ev.id}`}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-ui-canvas px-3 py-2 text-xs"
              >
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
                    ${ev.type === "experience" ? "bg-violet-100 text-violet-700" : ev.type === "skill" ? "bg-emerald-100 text-emerald-700" : ev.type === "project" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {ev.relevanceScore}
                </span>
                <div>
                  <p className="font-medium text-ui-ink">{ev.label}</p>
                  <p className="text-ui-muted">{ev.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.coveringStrengths.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Covering Strengths
          </p>
          <ul className="flex flex-col gap-1 text-sm text-ui-ink">
            {content.coveringStrengths.map((s) => (
              <li key={s} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.gaps.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-700">
            Gaps to Acknowledge
          </p>
          <div className="flex flex-wrap gap-1.5">
            {content.gaps.map((g) => (
              <Badge key={g} className="bg-amber-50 text-amber-800">
                {g}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {content.recommendations.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ui-violet">
            Recommendations
          </p>
          <ul className="flex flex-col gap-1.5 text-sm text-ui-ink">
            {content.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ui-violet" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!content.approved && (
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <Button onClick={onApprove}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve Strategy
          </Button>
          <Button variant="ghost" onClick={onGenerate}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate
          </Button>
        </div>
      )}
      {content.approved && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Strategy approved — resume tailoring and cover letter will use this strategy.
        </div>
      )}
    </div>
  );
}

// ─── Tailored resume section ────────────────────────────────────────────────

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatResumeText(doc: TailoredDocumentDto): string {
  const c = doc.content as TailoredResumeContent;
  return [
    `# ${doc.jobTitle} — ${doc.company}`,
    "",
    `## ${c.headline}`,
    c.summary,
    "",
    "### Highlighted Skills",
    c.highlightedSkills.join(", "),
    "",
    "### Experience",
    ...c.experience.flatMap((exp) => [
      `**${exp.title}** — ${exp.company} (${exp.startDate ?? ""} – ${exp.endDate ?? "Present"})`,
      exp.tailoredDescription,
      "",
    ]),
  ].join("\n");
}

function formatCoverLetterText(doc: TailoredDocumentDto): string {
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

function TailoredResumeSection({
  job,
  strategyApproved,
  resumeDoc,
  resumeStatus,
  onGenerate,
  onSave,
}: {
  job: JobDetailDto;
  strategyApproved: boolean;
  resumeDoc: TailoredDocumentDto | null;
  resumeStatus: PrepStatus;
  onGenerate: () => Promise<void>;
  onSave: (content: TailoredResumeContent) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TailoredResumeContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (resumeDoc) {
      setDraft(resumeDoc.content as TailoredResumeContent);
    }
  }, [resumeDoc]);

  if (resumeStatus === "not_started" || resumeStatus === "failed") {
    return (
      <div className="flex flex-col gap-3">
        {!strategyApproved && (
          <Alert tone="info">Approve your application strategy first for best results.</Alert>
        )}
        {resumeStatus === "failed" && (
          <Alert tone="error">Resume generation failed. Please retry.</Alert>
        )}
        <Button onClick={onGenerate}>
          <FileText className="mr-2 h-4 w-4" />
          Generate Tailored Resume
        </Button>
      </div>
    );
  }

  if (resumeStatus === "generating") {
    return (
      <div className="flex items-center gap-3 py-4 text-sm text-ui-muted">
        <Loader2 className="h-4 w-4 animate-spin text-ui-violet" />
        Tailoring resume for {job.title} at {job.company}…
      </div>
    );
  }

  if (!resumeDoc || !draft) return null;
  const content = draft as TailoredResumeContent;

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {content.keywordsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.keywordsUsed.slice(0, 8).map((kw) => (
              <Badge key={kw} className="bg-emerald-50 text-emerald-700">{`✓ ${kw}`}</Badge>
            ))}
          </div>
        )}
        {content.missingKeywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {content.missingKeywords.slice(0, 5).map((kw) => (
              <Badge key={kw} className="bg-amber-50 text-amber-800">{kw}</Badge>
            ))}
          </div>
        )}
      </div>

      {content.rationale && (
        <div className="rounded-lg bg-ui-canvas p-3 text-xs text-ui-ink">
          <span className="font-semibold">Tailoring rationale: </span>
          {content.rationale}
        </div>
      )}

      <div className="rounded-lg border border-ui-border p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-semibold text-ui-ink">{content.headline}</p>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="text-xs text-ui-violet hover:underline"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
        {editing ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ui-ink">Headline</label>
              <input
                type="text"
                value={content.headline}
                onChange={(e) => setDraft({ ...content, headline: e.target.value })}
                className="w-full rounded border border-ui-border px-2 py-1.5 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ui-ink">Summary</label>
              <textarea
                rows={4}
                value={content.summary}
                onChange={(e) => setDraft({ ...content, summary: e.target.value })}
                className="w-full rounded border border-ui-border p-2 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
              />
            </div>
            {content.experience.map((exp, idx) => (
              <div key={`${exp.company}-${idx}`} className="rounded-lg border border-ui-border p-3">
                <p className="text-xs font-semibold text-ui-ink mb-2">
                  {exp.title} — {exp.company}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs text-ui-muted">Original</p>
                    <p className="rounded bg-ui-canvas p-2 text-xs text-ui-body whitespace-pre-line">
                      {exp.originalDescription ?? "No original description."}
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium text-ui-violet">Tailored (editable)</p>
                    <textarea
                      rows={5}
                      value={exp.tailoredDescription}
                      onChange={(e) => {
                        const updated = content.experience.map((item, i) =>
                          i === idx ? { ...item, tailoredDescription: e.target.value } : item
                        );
                        setDraft({ ...content, experience: updated });
                      }}
                      className="w-full rounded border border-ui-border p-2 text-xs text-ui-ink focus:border-ui-violet focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Button loading={saving} onClick={handleSave}>Save edits</Button>
              <Button variant="ghost" onClick={() => { setEditing(false); setDraft(resumeDoc.content as TailoredResumeContent); }}>
                Discard
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ui-body leading-relaxed line-clamp-3">{content.summary}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          className="text-xs px-3 py-1.5"
          onClick={() => downloadText(`${job.company}-${job.title}-resume.txt`, formatResumeText(resumeDoc))}
        >
          Download .txt
        </Button>
        <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={onGenerate}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

// ─── Cover letter section ───────────────────────────────────────────────────

function CoverLetterSection({
  job,
  strategyApproved,
  coverDoc,
  coverStatus,
  onGenerate,
  onSave,
}: {
  job: JobDetailDto;
  strategyApproved: boolean;
  coverDoc: TailoredDocumentDto | null;
  coverStatus: PrepStatus;
  onGenerate: (tone: CoverLetterTone) => Promise<void>;
  onSave: (content: CoverLetterContent) => Promise<void>;
}) {
  const [tone, setTone] = useState<CoverLetterTone>("conversational");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CoverLetterContent | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (coverDoc) setDraft(coverDoc.content as CoverLetterContent);
  }, [coverDoc]);

  if (coverStatus === "not_started" || coverStatus === "failed") {
    return (
      <div className="flex flex-col gap-3">
        {!strategyApproved && (
          <Alert tone="info">Approve your strategy first for a more targeted cover letter.</Alert>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ui-ink">Tone</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as CoverLetterTone)}
            className="rounded-lg border border-ui-border bg-white px-3 py-2 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
          >
            <option value="conversational">Conversational</option>
            <option value="formal">Formal</option>
            <option value="concise">Concise</option>
          </select>
        </div>
        <Button onClick={() => onGenerate(tone)}>
          <FileText className="mr-2 h-4 w-4" />
          Draft Cover Letter
        </Button>
      </div>
    );
  }

  if (coverStatus === "generating") {
    return (
      <div className="flex items-center gap-3 py-4 text-sm text-ui-muted">
        <Loader2 className="h-4 w-4 animate-spin text-ui-violet" />
        Drafting cover letter…
      </div>
    );
  }

  if (!coverDoc || !draft) return null;
  const content = draft as CoverLetterContent;

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {content.keyPointsHighlighted.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {content.keyPointsHighlighted.map((kp) => (
            <Badge key={kp} className="bg-ui-lilac-soft text-ui-violet">{kp}</Badge>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-ui-border p-4 text-sm text-ui-ink space-y-3">
        <p className="font-semibold">Subject: {content.subjectLine}</p>
        <p>{content.greeting}</p>
        {content.bodyParagraphs.map((p, i) => (
          <p key={i} className="leading-relaxed">{p}</p>
        ))}
        <p>{content.closing}</p>
        <p className="font-medium">{content.signature}</p>
      </div>

      {editing && (
        <div className="flex flex-col gap-3 rounded-lg border border-ui-border p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ui-ink">Subject</label>
            <input
              type="text"
              value={content.subjectLine}
              onChange={(e) => setDraft({ ...content, subjectLine: e.target.value })}
              className="w-full rounded border border-ui-border px-2 py-1.5 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ui-ink">Body</label>
            <textarea
              rows={10}
              value={content.bodyParagraphs.join("\n\n")}
              onChange={(e) =>
                setDraft({
                  ...content,
                  bodyParagraphs: e.target.value.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
                })
              }
              className="w-full rounded border border-ui-border p-2 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <Button loading={saving} onClick={handleSave}>Save</Button>
            <Button variant="ghost" onClick={() => { setEditing(false); setDraft(coverDoc.content as CoverLetterContent); }}>
              Discard
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!editing && (
          <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
        <Button
          variant="secondary"
          className="text-xs px-3 py-1.5"
          onClick={() => downloadText(`${job.company}-${job.title}-cover-letter.txt`, formatCoverLetterText(coverDoc))}
        >
          Download .txt
        </Button>
        <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => onGenerate(coverDoc.tone ?? "conversational")}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Regenerate
        </Button>
      </div>
    </div>
  );
}

// ─── Screening answers section ──────────────────────────────────────────────

function ScreeningSection({
  job,
  answers,
  onAdd,
  onGenerate,
  onUpdate,
  onRemove,
}: {
  job: JobDetailDto;
  answers: ScreeningAnswerEntry[];
  onAdd: () => void;
  onGenerate: (index: number) => Promise<void>;
  onUpdate: (index: number, patch: Partial<ScreeningAnswerEntry>) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-ui-body">
        Prepare answers to common screening questions. Each answer is grounded in your verified profile.
      </p>

      {answers.map((entry, idx) => (
        <div key={idx} className="rounded-lg border border-ui-border p-4">
          <div className="flex items-start gap-2 mb-3">
            <input
              type="text"
              value={entry.question}
              onChange={(e) => onUpdate(idx, { question: e.target.value })}
              placeholder="Enter screening question…"
              className="flex-1 rounded border border-ui-border px-2 py-1.5 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="shrink-0 rounded p-1.5 text-ui-muted hover:bg-red-50 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {entry.answer ? (
            <div className="flex flex-col gap-2">
              <textarea
                rows={4}
                value={entry.answer}
                onChange={(e) => onUpdate(idx, { answer: e.target.value })}
                className="w-full rounded border border-ui-border p-2 text-sm text-ui-ink focus:border-ui-violet focus:outline-none"
              />
              {entry.groundedFacts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {entry.groundedFacts.map((f) => (
                    <span key={f} className="rounded-full bg-ui-canvas px-2 py-0.5 text-xs text-ui-muted">
                      {f}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                {entry.approved ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onUpdate(idx, { approved: true })}
                    className="text-xs font-medium text-ui-violet hover:underline"
                  >
                    Approve answer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onGenerate(idx)}
                  disabled={entry.generating || !entry.question.trim()}
                  className="text-xs text-ui-muted hover:text-ui-ink disabled:opacity-40"
                >
                  {entry.generating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="text-xs px-3 py-1.5"
              loading={entry.generating}
              onClick={() => onGenerate(idx)}
              // disabled when question is empty
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Generate Answer
            </Button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 rounded-lg border border-dashed border-ui-border px-4 py-3 text-sm text-ui-muted hover:border-ui-violet hover:text-ui-violet"
      >
        <Plus className="h-4 w-4" />
        Add screening question
      </button>
    </div>
  );
}

// ─── Ready to apply ─────────────────────────────────────────────────────────

function ReadySection({
  strategyApproved,
  resumeReady,
  coverReady,
  job,
  onMarkApplied,
  applying,
}: {
  strategyApproved: boolean;
  resumeReady: boolean;
  coverReady: boolean;
  job: JobDetailDto;
  onMarkApplied: () => Promise<void>;
  applying: boolean;
}) {
  const checklist = [
    { label: "Application strategy approved", done: strategyApproved },
    { label: "Tailored resume generated", done: resumeReady },
    { label: "Cover letter drafted (optional)", done: coverReady, optional: true },
  ];
  const required = checklist.filter((c) => !c.optional);
  const allRequired = required.every((c) => c.done);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs
                ${item.done ? "bg-emerald-100 text-emerald-700" : "bg-ui-linen text-ui-muted"}`}
            >
              {item.done ? "✓" : "·"}
            </span>
            <span className={`text-sm ${item.done ? "text-ui-ink" : "text-ui-muted"}`}>
              {item.label}
            </span>
            {item.optional && (
              <span className="text-xs text-ui-muted">(optional)</span>
            )}
          </div>
        ))}
      </div>

      {!allRequired && (
        <Alert tone="info">
          Complete the required steps above before marking as applied.
        </Alert>
      )}

      <div className="flex gap-3">
        {job.applicationId ? (
          <a
            href="/applications"
            className="inline-flex items-center gap-2 rounded-lg bg-ui-violet px-4 py-2 text-sm font-medium text-white hover:bg-ui-violet/90"
          >
            View in Application Tracker
          </a>
        ) : (
          <Button loading={applying} onClick={onMarkApplied}>
            Mark as Applied
          </Button>
        )}
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-ui-border bg-white px-4 py-2 text-sm font-medium text-ui-ink hover:bg-ui-canvas"
        >
          Open Job Posting ↗
        </a>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export function PreparationWorkspace({ job }: { job: JobDetailDto }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    strategy: true,
    resume: false,
    cover: false,
    screening: false,
    ready: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // Strategy
  const [strategy, setStrategy] = useState<ApplicationStrategyDto | null>(null);
  const [strategyStatus, setStrategyStatus] = useState<PrepStatus>("not_started");

  // Documents
  const [resumeDoc, setResumeDoc] = useState<TailoredDocumentDto | null>(null);
  const [resumeStatus, setResumeStatus] = useState<PrepStatus>("not_started");
  const [coverDoc, setCoverDoc] = useState<TailoredDocumentDto | null>(null);
  const [coverStatus, setCoverStatus] = useState<PrepStatus>("not_started");

  // Screening answers
  const [screeningAnswers, setScreeningAnswers] = useState<ScreeningAnswerEntry[]>([]);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Load existing data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [strategies, docs] = await Promise.all([
          api.get<ApplicationStrategyDto[]>(`/strategy?jobId=${job.id}`),
          api.get<TailoredDocumentDto[]>(`/tailor?jobId=${job.id}`),
        ]);
        if (cancelled) return;

        const latestStrategy = strategies[0] ?? null;
        if (latestStrategy) {
          setStrategy(latestStrategy);
          setStrategyStatus(
            latestStrategy.content.approved ? "approved" : "ready_for_review"
          );
        }

        const latestResume = docs.find((d) => d.type === "resume") ?? null;
        if (latestResume) {
          setResumeDoc(latestResume);
          setResumeStatus("ready_for_review");
        }

        const latestCover = docs.find((d) => d.type === "cover_letter") ?? null;
        if (latestCover) {
          setCoverDoc(latestCover);
          setCoverStatus("ready_for_review");
        }
      } catch {
        // non-fatal
      }
    }
    load();
    return () => { cancelled = true; };
  }, [job.id]);

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Strategy actions ──

  async function handleGenerateStrategy() {
    setStrategyStatus("generating");
    setError(null);
    try {
      const created = await api.post<ApplicationStrategyDto>("/strategy", { jobId: job.id });
      if (!mounted.current) return;
      setStrategy(created);
      setStrategyStatus("ready_for_review");
    } catch (err) {
      if (!mounted.current) return;
      setStrategyStatus("failed");
      setError(err instanceof ApiError ? err.detail : "Failed to generate strategy.");
    }
  }

  async function handleApproveStrategy() {
    if (!strategy) return;
    try {
      const updated = await api.patch<ApplicationStrategyDto>(`/strategy/${strategy.id}`, {});
      if (!mounted.current) return;
      setStrategy(updated);
      setStrategyStatus("approved");
      setExpanded((prev) => ({ ...prev, resume: true }));
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to approve strategy.");
    }
  }

  // ── Resume actions ──

  async function handleGenerateResume() {
    setResumeStatus("generating");
    setError(null);
    try {
      const created = await api.post<TailoredDocumentDto>("/tailor", {
        type: "resume",
        jobId: job.id,
      });
      if (!mounted.current) return;
      setResumeDoc(created);
      setResumeStatus("ready_for_review");
      setExpanded((prev) => ({ ...prev, resume: true }));
    } catch (err) {
      if (!mounted.current) return;
      setResumeStatus("failed");
      setError(err instanceof ApiError ? err.detail : "Failed to generate resume.");
    }
  }

  async function handleSaveResume(content: TailoredResumeContent) {
    if (!resumeDoc) return;
    const updated = await api.patch<TailoredDocumentDto>(`/tailor/${resumeDoc.id}`, { content });
    if (mounted.current) setResumeDoc(updated);
  }

  // ── Cover letter actions ──

  async function handleGenerateCover(tone: CoverLetterTone) {
    setCoverStatus("generating");
    setError(null);
    try {
      const created = await api.post<TailoredDocumentDto>("/tailor", {
        type: "cover_letter",
        tone,
        jobId: job.id,
      });
      if (!mounted.current) return;
      setCoverDoc(created);
      setCoverStatus("ready_for_review");
      setExpanded((prev) => ({ ...prev, cover: true }));
    } catch (err) {
      if (!mounted.current) return;
      setCoverStatus("failed");
      setError(err instanceof ApiError ? err.detail : "Failed to draft cover letter.");
    }
  }

  async function handleSaveCover(content: CoverLetterContent) {
    if (!coverDoc) return;
    const updated = await api.patch<TailoredDocumentDto>(`/tailor/${coverDoc.id}`, { content });
    if (mounted.current) setCoverDoc(updated);
  }

  // ── Screening actions ──

  function addScreeningQuestion() {
    setScreeningAnswers((prev) => [
      ...prev,
      { question: "", answer: "", groundedFacts: [], source: "grounded_fallback", generating: false, approved: false },
    ]);
    setExpanded((prev) => ({ ...prev, screening: true }));
  }

  function updateScreeningAnswer(index: number, patch: Partial<ScreeningAnswerEntry>) {
    setScreeningAnswers((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    );
  }

  function removeScreeningAnswer(index: number) {
    setScreeningAnswers((prev) => prev.filter((_, i) => i !== index));
  }

  async function generateScreeningAnswer(index: number) {
    const entry = screeningAnswers[index];
    if (!entry?.question.trim()) return;
    updateScreeningAnswer(index, { generating: true });
    try {
      const result = await api.post<ScreeningAnswerResult>("/tailor/screening", {
        question: entry.question,
        jobId: job.id,
      });
      updateScreeningAnswer(index, {
        answer: result.answer,
        groundedFacts: result.groundedFacts,
        source: result.source,
        generating: false,
      });
    } catch (err) {
      updateScreeningAnswer(index, { generating: false });
      setError(err instanceof ApiError ? err.detail : "Failed to generate answer.");
    }
  }

  // ── Mark applied ──

  async function handleMarkApplied() {
    setApplying(true);
    setError(null);
    try {
      await api.post("/applications", {
        jobId: job.id,
        company: job.company,
        title: job.title,
        location: job.location,
        url: job.url,
        status: "applied",
        matchScore: job.match.score,
      });
      window.location.href = "/applications";
    } catch (err) {
      setApplying(false);
      setError(err instanceof ApiError ? err.detail : "Failed to track application.");
    }
  }

  const strategyApproved = strategy?.content.approved ?? false;

  const completedCount = [
    strategyApproved,
    resumeStatus === "ready_for_review" || resumeStatus === "approved",
    coverStatus === "ready_for_review" || coverStatus === "approved",
    screeningAnswers.some((a) => a.approved),
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ui-muted">
          {completedCount} / 4 steps started
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <SectionRow
        icon={<Sparkles className="h-4 w-4" />}
        title="Application Strategy"
        status={strategyStatus}
        expanded={expanded.strategy ?? true}
        onToggle={() => toggle("strategy")}
      >
        <StrategySection
          job={job}
          strategy={strategy}
          strategyStatus={strategyStatus}
          onGenerate={handleGenerateStrategy}
          onApprove={handleApproveStrategy}
        />
      </SectionRow>

      <SectionRow
        icon={<FileText className="h-4 w-4" />}
        title="Tailored Resume"
        status={resumeStatus}
        expanded={expanded.resume ?? false}
        onToggle={() => toggle("resume")}
      >
        <TailoredResumeSection
          job={job}
          strategyApproved={strategyApproved}
          resumeDoc={resumeDoc}
          resumeStatus={resumeStatus}
          onGenerate={handleGenerateResume}
          onSave={handleSaveResume}
        />
      </SectionRow>

      <SectionRow
        icon={<FileText className="h-4 w-4" />}
        title="Cover Letter"
        status={coverStatus}
        expanded={expanded.cover ?? false}
        onToggle={() => toggle("cover")}
        optional
      >
        <CoverLetterSection
          job={job}
          strategyApproved={strategyApproved}
          coverDoc={coverDoc}
          coverStatus={coverStatus}
          onGenerate={handleGenerateCover}
          onSave={handleSaveCover}
        />
      </SectionRow>

      <SectionRow
        icon={<MessageSquare className="h-4 w-4" />}
        title="Screening Answers"
        status={screeningAnswers.some((a) => a.approved) ? "approved" : screeningAnswers.length > 0 ? "ready_for_review" : "not_started"}
        expanded={expanded.screening ?? false}
        onToggle={() => toggle("screening")}
        optional
      >
        <ScreeningSection
          job={job}
          answers={screeningAnswers}
          onAdd={addScreeningQuestion}
          onGenerate={generateScreeningAnswer}
          onUpdate={updateScreeningAnswer}
          onRemove={removeScreeningAnswer}
        />
      </SectionRow>

      <SectionRow
        icon={<CheckCircle2 className="h-4 w-4" />}
        title="Ready to Apply"
        status={strategyApproved && (resumeStatus !== "not_started") ? "ready_for_review" : "not_started"}
        expanded={expanded.ready ?? false}
        onToggle={() => toggle("ready")}
      >
        <ReadySection
          strategyApproved={strategyApproved}
          resumeReady={resumeStatus !== "not_started"}
          coverReady={coverStatus !== "not_started"}
          job={job}
          onMarkApplied={handleMarkApplied}
          applying={applying}
        />
      </SectionRow>
    </div>
  );
}
