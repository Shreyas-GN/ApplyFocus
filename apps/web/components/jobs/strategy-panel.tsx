"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Lightbulb,
  RefreshCw,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Wrench,
  XCircle,
} from "lucide-react";
import type { ApplicationStrategyContent, ApplicationStrategyDto, StrategyRecommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";

function RecommendationBadge({ recommendation }: { recommendation: StrategyRecommendation }) {
  if (recommendation === "strong_opportunity") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-success-soft px-3 py-1 text-xs font-semibold text-ui-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Strong Opportunity
      </span>
    );
  }
  if (recommendation === "worth_pursuing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-warning-soft px-3 py-1 text-xs font-semibold text-ui-warning">
        <TrendingUp className="h-3.5 w-3.5" />
        Worth Pursuing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-border px-3 py-1 text-xs font-semibold text-ui-body">
      <Shield className="h-3.5 w-3.5" />
      Lower Priority
    </span>
  );
}

function EvidenceStrengthDot({ strength }: { strength: string }) {
  const colors: Record<string, string> = {
    direct: "bg-ui-success",
    transferable: "bg-ui-warning",
    weak: "bg-ui-warning",
    none: "bg-ui-border",
  };
  const labels: Record<string, string> = {
    direct: "Direct match",
    transferable: "Transferable",
    weak: "Indirect",
    none: "Not documented",
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${colors[strength] ?? "bg-ui-border"}`} />
      <span className="text-xs text-ui-muted">{labels[strength] ?? strength}</span>
    </span>
  );
}

function SectionToggle({
  title,
  icon: Icon,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-ui-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-ui-muted" />
          <span className="text-sm font-semibold text-ui-ink">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-ui-linen px-1.5 py-0.5 text-xs font-medium text-ui-muted">
              {count}
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-ui-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-ui-muted" />
        )}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

interface StrategyViewProps {
  strategy: ApplicationStrategyDto;
  jobId: string;
  onRegenerate: () => void;
  onApprove: (content: ApplicationStrategyContent) => void;
  approving: boolean;
}

function StrategyView({ strategy, jobId, onRegenerate, onApprove, approving }: StrategyViewProps) {
  const c = strategy.content;
  const isApproved = strategy.status === "approved";

  return (
    <div className="flex flex-col gap-5">
      {/* Recommendation header */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-ui-border bg-ui-canvas p-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <RecommendationBadge recommendation={c.recommendation} />
            {isApproved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ui-teal-soft px-2.5 py-0.5 text-xs font-medium text-ui-teal">
                <CheckCircle2 className="h-3 w-3" />
                Strategy Approved
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ui-ink">{c.recommendationReason}</p>
        </div>
      </div>

      {/* Positioning */}
      <div className="rounded-xl border border-ui-teal-soft bg-ui-teal-soft/50 p-4">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ui-teal-ink">
          <Target className="h-3.5 w-3.5" />
          Your Recommended Positioning
        </p>
        <p className="text-sm leading-relaxed text-ui-ink">{c.positioning}</p>
      </div>

      {/* Why pursue */}
      {c.whyPursue.length > 0 && (
        <SectionToggle title="Why This Job Is Worth Pursuing" icon={Star} count={c.whyPursue.length}>
          <ul className="flex flex-col gap-2">
            {c.whyPursue.map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-sm text-ui-ink">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ui-success" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </SectionToggle>
      )}

      {/* Strongest experiences */}
      {c.strongestExperiences.length > 0 && (
        <SectionToggle
          title="Your Strongest Evidence"
          icon={Briefcase}
          count={c.strongestExperiences.length + c.bestProjects.length}
        >
          <div className="flex flex-col gap-2.5">
            {c.strongestExperiences.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-ui-success/30 bg-ui-success-soft/50 p-3 text-sm"
              >
                <p className="font-semibold text-ui-ink">{item.name}</p>
                <p className="mt-0.5 text-xs text-ui-body">{item.relevanceReason}</p>
              </div>
            ))}
            {c.bestProjects.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-ui-teal/30 bg-ui-teal-soft/50 p-3 text-sm"
              >
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5 text-ui-teal" />
                  <p className="font-semibold text-ui-ink">{item.name}</p>
                </div>
                <p className="mt-0.5 text-xs text-ui-body">{item.relevanceReason}</p>
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Skills to emphasize */}
      {c.skillsToEmphasize.length > 0 && (
        <SectionToggle title="Skills to Emphasize" icon={TrendingUp} count={c.skillsToEmphasize.length}>
          <div className="flex flex-wrap gap-2">
            {c.skillsToEmphasize.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-ui-success/30 bg-ui-success-soft px-2.5 py-1 text-xs font-medium text-ui-success"
              >
                {skill}
              </span>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Achievements */}
      {c.topAchievements.length > 0 && (
        <SectionToggle title="Achievements to Highlight" icon={Sparkles} count={c.topAchievements.length}>
          <ul className="flex flex-col gap-2">
            {c.topAchievements.map((ach) => (
              <li key={ach} className="flex items-start gap-2 text-sm text-ui-ink">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ui-teal" />
                <span>{ach}</span>
              </li>
            ))}
          </ul>
        </SectionToggle>
      )}

      {/* Evidence gaps */}
      {c.evidenceGaps.length > 0 && (
        <SectionToggle
          title="Requirements with Insufficient Evidence"
          icon={AlertTriangle}
          count={c.evidenceGaps.length}
          defaultOpen={false}
        >
          <div className="flex flex-col gap-2.5">
            {c.evidenceGaps.map((gap) => (
              <div
                key={gap.requirement}
                className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft/50 p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ui-ink">{gap.requirement}</p>
                  <EvidenceStrengthDot strength={gap.evidenceStrength} />
                </div>
                <p className="mt-1 text-xs text-ui-body">{gap.note}</p>
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Resume improvements */}
      {c.resumeImprovements.length > 0 && (
        <SectionToggle title="Resume Sections Worth Improving" icon={Wrench} defaultOpen={false}>
          <ul className="flex flex-col gap-2">
            {c.resumeImprovements.map((improvement) => (
              <li key={improvement} className="flex items-start gap-2 text-sm text-ui-ink">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-ui-muted" />
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </SectionToggle>
      )}

      {/* Screening prep */}
      {c.screeningPrep.length > 0 && (
        <SectionToggle title="How to Prepare for Screening" icon={BookOpen} count={c.screeningPrep.length}>
          <ul className="flex flex-col gap-2">
            {c.screeningPrep.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-ui-ink">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-ui-warning" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </SectionToggle>
      )}

      {/* Potential concerns */}
      {c.potentialConcerns.length > 0 && (
        <SectionToggle title="Concerns to Be Ready For" icon={XCircle} defaultOpen={false}>
          <ul className="flex flex-col gap-2">
            {c.potentialConcerns.map((concern) => (
              <li key={concern} className="flex items-start gap-2 text-sm text-ui-ink">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-ui-warning" />
                <span>{concern}</span>
              </li>
            ))}
          </ul>
        </SectionToggle>
      )}

      {/* Next action */}
      <div className="rounded-xl border border-ui-teal/20 bg-ui-teal/5 p-4">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ui-teal">
          <ArrowRight className="h-3.5 w-3.5" />
          Recommended Next Step
        </p>
        <p className="text-sm font-medium text-ui-ink">{c.nextAction}</p>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 border-t border-ui-border pt-4">
        {!isApproved ? (
          <Button
            variant="primary"
            size="md"
            loading={approving}
            onClick={() => onApprove(c)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Strategy
          </Button>
        ) : (
          <Link href={`/studio?tab=tailored&jobId=${jobId}`}>
            <Button variant="primary" size="md">
              <ArrowRight className="h-4 w-4" />
              Continue to Resume Tailoring
            </Button>
          </Link>
        )}
        <Button variant="ghost" size="md" onClick={onRegenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </Button>
        {isApproved && (
          <Link href={`/studio?tab=cover-letters&jobId=${jobId}`}>
            <Button variant="secondary" size="md">
              Draft Cover Letter
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

interface StrategyPanelProps {
  jobId: string;
}

export function StrategyPanel({ jobId }: StrategyPanelProps) {
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [strategy, setStrategy] = useState<ApplicationStrategyDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  async function handleGenerate() {
    setPhase("loading");
    setError(null);
    try {
      // Check for existing first
      let existing: ApplicationStrategyDto | null = null;
      try {
        existing = await api.get<ApplicationStrategyDto>(`/jobs/${jobId}/strategy`);
      } catch {
        // 404 is fine, means no existing strategy
      }
      if (existing) {
        setStrategy(existing);
        setPhase("ready");
        return;
      }
      const created = await api.post<ApplicationStrategyDto>(`/jobs/${jobId}/strategy`, {});
      setStrategy(created);
      setPhase("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to generate strategy. Please try again.");
      setPhase("error");
    }
  }

  async function handleRegenerate() {
    setPhase("loading");
    setError(null);
    try {
      const created = await api.post<ApplicationStrategyDto>(`/jobs/${jobId}/strategy`, {});
      setStrategy(created);
      setPhase("ready");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to regenerate strategy.");
      setPhase("error");
    }
  }

  async function handleApprove(content: ApplicationStrategyContent) {
    if (!strategy) return;
    setApproving(true);
    try {
      const updated = await api.patch<ApplicationStrategyDto>(`/jobs/${jobId}/strategy`, {
        content,
      });
      setStrategy(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to approve strategy.");
    } finally {
      setApproving(false);
    }
  }

  if (phase === "idle") {
    return (
      <Card>
        <div className="flex flex-col items-start gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-ui-teal" />
              <h2 className="text-base font-semibold tracking-[-0.014em] text-ui-ink">
                Application Strategy
              </h2>
            </div>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-ui-body">
              ApplyFocus analyzes this job against your confirmed profile to build a personalized
              strategy — your strongest evidence, what to emphasize, what to prepare for, and a
              clear next step.
            </p>
          </div>
          <Button variant="lilac" size="md" onClick={handleGenerate}>
            <Sparkles className="h-4 w-4" />
            Build My Application Strategy
          </Button>
        </div>
      </Card>
    );
  }

  if (phase === "loading") {
    return (
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ui-teal border-t-transparent" />
            <p className="text-sm font-medium text-ui-ink">Analyzing your profile against this job…</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {["Extracting requirements", "Retrieving your evidence", "Ranking your experience", "Compiling strategy"].map(
              (step, i) => (
                <div key={step} className="flex items-center gap-2 text-xs text-ui-muted">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-ui-muted"
                    style={{ opacity: 0.3 + i * 0.2 }}
                  />
                  {step}
                </div>
              )
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (phase === "error") {
    return (
      <Card>
        <CardHeader title="Application Strategy" />
        <Alert tone="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="secondary" size="md" onClick={handleGenerate}>
            <RefreshCw className="h-3.5 w-3.5" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!strategy) return null;

  return (
    <Card>
      <CardHeader
        title="Application Strategy"
        description="Personalized approach built from your confirmed profile evidence."
        action={
          <span className="text-xs text-ui-muted">
            {new Date(strategy.updatedAt).toLocaleDateString()}
          </span>
        }
      />
      <StrategyView
        strategy={strategy}
        jobId={jobId}
        onRegenerate={handleRegenerate}
        onApprove={handleApprove}
        approving={approving}
      />
    </Card>
  );
}
