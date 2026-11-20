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
  HelpCircle,
  Info,
  Lightbulb,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Wrench,
  XCircle,
} from "lucide-react";
import type {
  ApplicationStrategyContent,
  ApplicationStrategyDto,
  DecisionEvaluation,
  DecisionGapCategory,
  DecisionRecommendationTier,
  OpportunityPriorityTier,
  DecisionApplicationReadiness,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";

function DecisionTierBadge({ tier }: { tier: DecisionRecommendationTier | string }) {
  if (tier === "STRONG_OPPORTUNITY" || tier === "strong_opportunity") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-success-soft px-3 py-1 text-xs font-semibold text-ui-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Strong Opportunity
      </span>
    );
  }
  if (tier === "WORTH_PURSUING" || tier === "worth_pursuing") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-warning-soft px-3 py-1 text-xs font-semibold text-ui-warning">
        <TrendingUp className="h-3.5 w-3.5" />
        Worth Pursuing
      </span>
    );
  }
  if (tier === "SELECTIVE_APPLICATION") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-accent-soft px-3 py-1 text-xs font-semibold text-ui-accent">
        <Target className="h-3.5 w-3.5" />
        Selective Application
      </span>
    );
  }
  if (tier === "LOW_PRIORITY" || tier === "lower_priority") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-border px-3 py-1 text-xs font-semibold text-ui-body">
        <Shield className="h-3.5 w-3.5" />
        Low Priority
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ui-border px-3 py-1 text-xs font-semibold text-ui-muted">
      <HelpCircle className="h-3.5 w-3.5" />
      Insufficient Information
    </span>
  );
}

function PriorityBadge({ tier }: { tier: OpportunityPriorityTier }) {
  const styles: Record<OpportunityPriorityTier, string> = {
    HIGH_PRIORITY: "bg-ui-success-soft text-ui-success border-ui-success/30",
    MEDIUM_PRIORITY: "bg-ui-warning-soft text-ui-warning border-ui-warning/30",
    LOW_PRIORITY: "bg-ui-border text-ui-body border-ui-border",
    NEEDS_REVIEW: "bg-ui-accent-soft text-ui-accent border-ui-accent/30",
  };
  const labels: Record<OpportunityPriorityTier, string> = {
    HIGH_PRIORITY: "High Priority",
    MEDIUM_PRIORITY: "Medium Priority",
    LOW_PRIORITY: "Low Priority",
    NEEDS_REVIEW: "Needs Review",
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${styles[tier] ?? styles.NEEDS_REVIEW}`}>
      {labels[tier] ?? tier}
    </span>
  );
}

function ReadinessBadge({ readiness }: { readiness: DecisionApplicationReadiness }) {
  const configs: Record<DecisionApplicationReadiness, { style: string; label: string }> = {
    READY_TO_APPLY: {
      style: "bg-ui-success-soft text-ui-success border-ui-success/30",
      label: "Ready to Apply",
    },
    READY_AFTER_IMPROVEMENTS: {
      style: "bg-ui-warning-soft text-ui-warning border-ui-warning/30",
      label: "Ready After Improvements",
    },
    NEEDS_REVIEW: {
      style: "bg-ui-accent-soft text-ui-accent border-ui-accent/30",
      label: "Needs Review",
    },
    NOT_RECOMMENDED: {
      style: "bg-ui-border text-ui-body border-ui-border",
      label: "Not Recommended",
    },
  };
  const config = configs[readiness] ?? configs.NEEDS_REVIEW;
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${config.style}`}>
      {config.label}
    </span>
  );
}

function GapCategoryBadge({ category }: { category: DecisionGapCategory }) {
  const labels: Record<DecisionGapCategory, { label: string; style: string }> = {
    QUALIFICATION_GAP: { label: "Qualification Gap", style: "bg-ui-accent-soft text-ui-accent border-ui-accent/30" },
    EXPERIENCE_GAP: { label: "Experience Duration", style: "bg-ui-warning-soft text-ui-warning border-ui-warning/30" },
    EVIDENCE_GAP: { label: "Documentation Gap", style: "bg-ui-teal-soft text-ui-teal border-ui-teal/30" },
    RESUME_COMMUNICATION_GAP: { label: "Resume Communication", style: "bg-ui-purple-soft text-ui-purple border-ui-purple/30" },
    UNKNOWN_INFORMATION: { label: "Information Missing", style: "bg-ui-border text-ui-muted border-ui-border" },
  };
  const c = labels[category] ?? { label: category, style: "bg-ui-border text-ui-muted border-ui-border" };
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium ${c.style}`}>
      {c.label}
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
            <span className="rounded-full bg-ui-border px-2 py-0.5 text-xs font-medium text-ui-muted">
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
  const d: DecisionEvaluation | undefined = c.decisionEvaluation;
  const isApproved = strategy.status === "approved";

  return (
    <div className="flex flex-col gap-6">
      {/* Primary Recommendation Card */}
      <div className="rounded-xl border border-ui-border bg-ui-canvas p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <DecisionTierBadge tier={d?.recommendationTier ?? c.recommendation} />
              {d && <PriorityBadge tier={d.priorityTier} />}
              {d && <ReadinessBadge readiness={d.applicationReadiness} />}
              {isApproved && (
                <span className="inline-flex items-center gap-1 rounded-full bg-ui-teal-soft px-2.5 py-0.5 text-xs font-medium text-ui-teal">
                  <CheckCircle2 className="h-3 w-3" />
                  Strategy Approved
                </span>
              )}
            </div>
            <p className="mt-3 text-base font-medium leading-relaxed text-ui-ink">
              {d?.recommendationReason ?? c.recommendationReason}
            </p>
            {d && (
              <p className="mt-1 text-xs text-ui-body">
                {d.readinessReason}
              </p>
            )}
          </div>

          {/* Quick Metrics Badge Group */}
          {d?.summaryMetrics && (
            <div className="flex flex-wrap gap-2 border-t sm:border-t-0 sm:border-l border-ui-border pt-3 sm:pt-0 sm:pl-4">
              <div className="text-center px-2">
                <span className="block text-lg font-bold text-ui-ink">
                  {d.summaryMetrics.mandatoryCoveragePercent}%
                </span>
                <span className="text-[11px] text-ui-muted uppercase tracking-wider">Mandatory</span>
              </div>
              <div className="text-center px-2">
                <span className="block text-lg font-bold text-ui-ink">
                  {d.summaryMetrics.overallMatchScore}%
                </span>
                <span className="text-[11px] text-ui-muted uppercase tracking-wider">Fit Score</span>
              </div>
              {d.summaryMetrics.atsReadinessScore !== null && d.summaryMetrics.atsReadinessScore !== undefined && (
                <div className="text-center px-2">
                  <span className="block text-lg font-bold text-ui-ink">
                    {d.summaryMetrics.atsReadinessScore}
                  </span>
                  <span className="text-[11px] text-ui-muted uppercase tracking-wider">ATS Health</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recommended Positioning Statement */}
      <div className="rounded-xl border border-ui-teal-soft bg-ui-teal-soft/40 p-4">
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ui-teal-ink">
          <Target className="h-3.5 w-3.5 text-ui-teal" />
          Recommended Positioning Angle
        </p>
        <p className="text-sm leading-relaxed text-ui-ink">
          {d?.positioning.headlineAngle ?? c.positioning}
        </p>
        {d?.positioning.differentiators && d.positioning.differentiators.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {d.positioning.differentiators.map((diff) => (
              <span key={diff} className="rounded bg-ui-surface border border-ui-teal/30 px-2 py-0.5 text-xs text-ui-teal-ink font-medium">
                {diff}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action Plan */}
      {d?.actionPlan && d.actionPlan.length > 0 && (
        <SectionToggle title="Personalized Application Action Plan" icon={Wrench} count={d.actionPlan.length}>
          <div className="flex flex-col gap-3">
            {d.actionPlan.map((action) => (
              <div
                key={action.id}
                className="rounded-lg border border-ui-border bg-ui-surface p-3.5 transition-colors hover:border-ui-ink/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        action.priority === "CRITICAL"
                          ? "bg-ui-accent"
                          : action.priority === "HIGH"
                          ? "bg-ui-warning"
                          : "bg-ui-teal"
                      }`}
                    />
                    <p className="text-sm font-semibold text-ui-ink">{action.actionTitle}</p>
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-ui-muted">
                    {action.isRequiredBeforeApplying ? "Required Before Applying" : "Recommended"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ui-body">{action.reason}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-ui-muted">
                  <span>Impact: {action.expectedImprovement}</span>
                  {action.destinationUrl && (
                    <Link
                      href={action.destinationUrl}
                      className="inline-flex items-center gap-1 font-semibold text-ui-ink hover:underline"
                    >
                      Resolve <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Why Pursue & Why Caution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Why Pursue */}
        <div className="rounded-lg border border-ui-success/30 bg-ui-success-soft/30 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ui-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Why Pursue
          </p>
          <ul className="flex flex-col gap-2">
            {(d?.whyPursue ?? c.whyPursue).map((reason) => (
              <li key={reason} className="flex items-start gap-2 text-xs leading-relaxed text-ui-ink">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ui-success" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Why Caution */}
        <div className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft/30 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ui-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            Important Caveats & Risks
          </p>
          <ul className="flex flex-col gap-2">
            {(d?.whyCaution && d.whyCaution.length > 0 ? d.whyCaution : c.potentialConcerns).map((caution) => (
              <li key={caution} className="flex items-start gap-2 text-xs leading-relaxed text-ui-ink">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ui-warning" />
                <span>{caution}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Strongest Evidence (Experience vs Projects) */}
      <SectionToggle
        title="Your Strongest Evidence"
        icon={Briefcase}
        count={c.strongestExperiences.length + c.bestProjects.length}
      >
        <div className="flex flex-col gap-3">
          {c.strongestExperiences.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-ui-success/30 bg-ui-success-soft/40 p-3.5 text-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ui-ink">{item.name}</p>
                <span className="text-[11px] font-medium text-ui-success">Professional Employment</span>
              </div>
              <p className="mt-1 text-xs text-ui-body">{item.relevanceReason}</p>
            </div>
          ))}
          {c.bestProjects.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-ui-teal/30 bg-ui-teal-soft/40 p-3.5 text-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5 text-ui-teal" />
                  <p className="font-semibold text-ui-ink">{item.name}</p>
                </div>
                <span className="text-[11px] font-medium text-ui-teal">Technical Project</span>
              </div>
              <p className="mt-1 text-xs text-ui-body">{item.relevanceReason}</p>
            </div>
          ))}
        </div>
      </SectionToggle>

      {/* Categorized Gap Analysis */}
      {d?.categorizedGaps && d.categorizedGaps.length > 0 && (
        <SectionToggle
          title="Gap Diagnostics & Communication Shortfalls"
          icon={AlertTriangle}
          count={d.categorizedGaps.length}
          defaultOpen={false}
        >
          <div className="flex flex-col gap-2.5">
            {d.categorizedGaps.map((gap) => (
              <div
                key={gap.requirement}
                className="rounded-lg border border-ui-border bg-ui-canvas p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ui-ink">{gap.requirement}</p>
                    {gap.isHardConstraint && (
                      <span className="rounded bg-ui-accent-soft px-1.5 py-0.5 text-[10px] font-bold text-ui-accent uppercase">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <GapCategoryBadge category={gap.category} />
                </div>
                <p className="mt-1.5 text-xs text-ui-body">{gap.note}</p>
                <p className="mt-1 text-xs font-medium text-ui-ink">
                  Guidance: <span className="font-normal text-ui-body">{gap.actionGuidance}</span>
                </p>
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Positioning Risks & Claims to Avoid */}
      {d?.positioning.claimsToAvoid && d.positioning.claimsToAvoid.length > 0 && (
        <SectionToggle title="Claims to Avoid on Your Resume" icon={ShieldAlert} defaultOpen={false}>
          <div className="rounded-lg border border-ui-accent/30 bg-ui-accent-soft/30 p-3.5">
            <p className="text-xs font-semibold text-ui-accent mb-1.5">
              Do not make unverified assertions:
            </p>
            <ul className="flex flex-col gap-1.5">
              {d.positioning.claimsToAvoid.map((claim) => (
                <li key={claim} className="flex items-start gap-2 text-xs text-ui-ink">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-ui-accent" />
                  <span>{claim}</span>
                </li>
              ))}
            </ul>
          </div>
        </SectionToggle>
      )}

      {/* Candidate Constraint Evaluation */}
      {d?.constraintsEvaluation && d.constraintsEvaluation.length > 0 && (
        <SectionToggle title="Candidate Preferences & Constraints" icon={Shield} defaultOpen={false}>
          <div className="flex flex-col gap-2">
            {d.constraintsEvaluation.map((con) => (
              <div key={con.name} className="flex items-start justify-between rounded-md border border-ui-border p-2.5 text-xs">
                <div>
                  <p className="font-semibold text-ui-ink">{con.name}</p>
                  <p className="text-ui-body mt-0.5">{con.detail}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    con.status === "SATISFIED"
                      ? "bg-ui-success-soft text-ui-success"
                      : con.status === "VIOLATED"
                      ? "bg-ui-accent-soft text-ui-accent"
                      : "bg-ui-border text-ui-muted"
                  }`}
                >
                  {con.status}
                </span>
              </div>
            ))}
          </div>
        </SectionToggle>
      )}

      {/* Job Information Quality */}
      {d?.jobInformationQuality && (
        <SectionToggle title="Job Posting Information Quality" icon={Info} defaultOpen={false}>
          <div className="rounded-lg border border-ui-border p-3 text-xs flex flex-col gap-2 text-ui-body">
            <div className="flex items-center justify-between">
              <span>Description Completeness</span>
              <span className="font-semibold text-ui-ink">{d.jobInformationQuality.descriptionCompletenessScore}/100</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Posting Freshness</span>
              <span className="font-semibold text-ui-ink">{d.jobInformationQuality.freshnessLabel}</span>
            </div>
            {d.jobInformationQuality.missingEmployerDetails.length > 0 && (
              <p className="text-[11px] text-ui-muted">
                Unstated by employer: {d.jobInformationQuality.missingEmployerDetails.join(" ")}
              </p>
            )}
          </div>
        </SectionToggle>
      )}

      {/* Next Step Banner */}
      <div className="rounded-xl border border-ui-ink bg-ui-ink p-4 text-white">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ui-canvas/70">
          <ArrowRight className="h-3.5 w-3.5 text-white" />
          Recommended Next Step
        </p>
        <p className="text-sm font-medium leading-relaxed">{d?.nextAction ?? c.nextAction}</p>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-wrap items-center gap-3 border-t border-ui-border pt-4">
        {!isApproved ? (
          <Button
            variant="primary"
            size="md"
            loading={approving}
            onClick={() => onApprove(c)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve Decision Strategy
          </Button>
        ) : (
          <Link href={`/tailor?jobId=${jobId}`}>
            <Button variant="primary" size="md">
              <ArrowRight className="h-4 w-4" />
              Continue to Resume Tailoring
            </Button>
          </Link>
        )}
        <Button variant="ghost" size="md" onClick={onRegenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate Decision
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

export function StrategyPanel({ jobId }: { jobId: string }) {
  const [strategy, setStrategy] = useState<ApplicationStrategyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadStrategy() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<ApplicationStrategyDto>(`/jobs/${jobId}/strategy`);
      setStrategy(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setStrategy(null);
      } else {
        setError("Could not load application decision intelligence.");
      }
    } finally {
      setLoading(false);
    }
  }

  useState(() => {
    loadStrategy();
  });

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post<ApplicationStrategyDto>(`/jobs/${jobId}/strategy`, {});
      setStrategy(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Failed to generate decision strategy."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove(content: ApplicationStrategyContent) {
    setApproving(true);
    try {
      const data = await api.patch<ApplicationStrategyDto>(`/jobs/${jobId}/strategy`, { content });
      setStrategy(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Failed to approve decision strategy."
      );
    } finally {
      setApproving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-5 w-5 animate-spin text-ui-muted" />
        <span className="ml-2 text-sm text-ui-muted">Loading Decision Intelligence...</span>
      </div>
    );
  }

  if (!strategy) {
    return (
      <Card>
        <CardHeader
          title="ApplyFocus Decision Intelligence"
          description="Evaluate whether this opportunity is worth pursuing, diagnose qualification gaps vs. resume presentation issues, and receive an evidence-backed application action plan."
        />
        <div className="p-6 pt-0">
          {error && (
            <div className="mb-4">
              <Alert tone="error">{error}</Alert>
            </div>
          )}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ui-border bg-ui-canvas py-10 text-center">
            <Target className="h-10 w-10 text-ui-muted" />
            <h3 className="mt-3 text-base font-semibold text-ui-ink">
              Ready to Evaluate This Opportunity
            </h3>
            <p className="mt-1 max-w-sm text-sm text-ui-muted">
              Synthesizes Phase 2 candidate intelligence, Phase 3 requirement matching, and Phase 4 ATS diagnostics into an actionable decision plan.
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-5"
              loading={generating}
              onClick={handleGenerate}
            >
              <Sparkles className="h-4 w-4" />
              Generate Decision Evaluation
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="ApplyFocus Decision Intelligence"
        description="Evidence-backed opportunity evaluation, gap diagnostics, and personalized application plan."
      />
      <div className="p-6 pt-0">
        {error && (
          <div className="mb-4">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        <StrategyView
          strategy={strategy}
          jobId={jobId}
          onRegenerate={handleGenerate}
          onApprove={handleApprove}
          approving={approving}
        />
      </div>
    </Card>
  );
}
