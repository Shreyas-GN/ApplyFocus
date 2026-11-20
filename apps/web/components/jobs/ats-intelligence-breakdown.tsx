"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  AtsAnalysisResult,
  AtsFindingSeverity,
  RequirementResumeAlignmentStatus,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";

interface AtsIntelligenceBreakdownProps {
  analysis: AtsAnalysisResult | null;
  jobId?: string;
  jobTitle?: string;
}

export function AtsIntelligenceBreakdown({
  analysis,
  jobId,
  jobTitle,
}: AtsIntelligenceBreakdownProps) {
  const [activeTab, setActiveTab] = useState<"alignment" | "findings" | "recommendations">("alignment");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  if (!analysis) {
    return (
      <div className="rounded-lg border border-ui-border bg-ui-surface p-6 text-center">
        <p className="text-sm text-ui-muted">
          No ATS intelligence analysis available. Upload a resume to evaluate document readiness and job-specific terminology alignment.
        </p>
      </div>
    );
  }

  const {
    overallReadiness,
    readinessLabel,
    dimensions,
    keywordStuffingDetected,
    findings,
    alignmentItems,
    recommendations,
    limitations,
  } = analysis;

  const severityBadgeClass: Record<AtsFindingSeverity, string> = {
    CRITICAL: "bg-rose-50 text-rose-800 border-rose-200",
    HIGH: "bg-amber-50 text-amber-800 border-amber-200",
    MEDIUM: "bg-blue-50 text-blue-800 border-blue-200",
    LOW: "bg-stone-100 text-stone-700 border-stone-200",
    INFORMATIONAL: "bg-stone-50 text-stone-600 border-stone-200",
  };

  const alignmentStatusBadgeClass: Record<RequirementResumeAlignmentStatus, string> = {
    DEMONSTRATED_AND_COMMUNICATED: "bg-emerald-50 text-emerald-800 border-emerald-200",
    DEMONSTRATED_BUT_POORLY_COMMUNICATED: "bg-amber-50 text-amber-800 border-amber-200",
    RELATED_TERMINOLOGY_PRESENT: "bg-blue-50 text-blue-800 border-blue-200",
    EVIDENCE_EXISTS_TERMINOLOGY_MISSING: "bg-[#C6533B]/10 text-[#C6533B] border-[#C6533B]/30",
    NO_SUPPORTING_CANDIDATE_EVIDENCE: "bg-stone-100 text-stone-700 border-stone-200",
    UNVERIFIED: "bg-purple-50 text-purple-800 border-purple-200",
  };

  const alignmentStatusLabel: Record<RequirementResumeAlignmentStatus, string> = {
    DEMONSTRATED_AND_COMMUNICATED: "Demonstrated and Communicated",
    DEMONSTRATED_BUT_POORLY_COMMUNICATED: "Demonstrated but Poorly Communicated",
    RELATED_TERMINOLOGY_PRESENT: "Related Terminology Present",
    EVIDENCE_EXISTS_TERMINOLOGY_MISSING: "Evidence Exists — Terminology Missing",
    NO_SUPPORTING_CANDIDATE_EVIDENCE: "No Supporting Evidence",
    UNVERIFIED: "Unverified AI Suggestion",
  };

  const filteredItems = alignmentItems.filter((item) => {
    if (filterStatus === "ALL") return true;
    if (filterStatus === "MISSING_TERM") return item.status === "EVIDENCE_EXISTS_TERMINOLOGY_MISSING";
    if (filterStatus === "POORLY_COMM") return item.status === "DEMONSTRATED_BUT_POORLY_COMMUNICATED";
    if (filterStatus === "COMMUNICATED") return item.status === "DEMONSTRATED_AND_COMMUNICATED";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Overview Card */}
      <div className="rounded-xl border border-ui-border bg-ui-surface p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-ui-border pb-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[#202124] text-white">
              <span className="text-2xl font-bold tabular-nums">{overallReadiness}</span>
              <span className="text-[10px] uppercase tracking-wider text-stone-300">Readiness</span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C6533B]">
                ATS Document Intelligence
              </span>
              <h2 className="text-lg font-bold text-ui-ink">{readinessLabel}</h2>
              <p className="text-xs text-ui-muted">
                Evaluates parsing integrity, structure, formatting, and job-specific terminology alignment.
              </p>
            </div>
          </div>

          {jobId && (
            <div className="shrink-0">
              <Link href={`/studio?tab=tailored&jobId=${jobId}`}>
                <Button className="px-4 py-2 text-xs font-semibold">
                  Open Tailoring Studio
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Multi-Dimensional Gauges */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <span className="text-[11px] font-medium text-ui-muted">Parsing</span>
            <p className="mt-0.5 text-base font-bold text-ui-ink tabular-nums">
              {dimensions.parsingReadiness}%
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ui-linen">
              <div
                className="h-full rounded-full bg-stone-700"
                style={{ width: `${dimensions.parsingReadiness}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <span className="text-[11px] font-medium text-ui-muted">Structure</span>
            <p className="mt-0.5 text-base font-bold text-ui-ink tabular-nums">
              {dimensions.structureQuality}%
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ui-linen">
              <div
                className="h-full rounded-full bg-stone-700"
                style={{ width: `${dimensions.structureQuality}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <span className="text-[11px] font-medium text-ui-muted">Terminology</span>
            <p className="mt-0.5 text-base font-bold text-ui-ink tabular-nums">
              {dimensions.terminologyAlignment}%
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ui-linen">
              <div
                className="h-full rounded-full bg-[#C6533B]"
                style={{ width: `${dimensions.terminologyAlignment}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <span className="text-[11px] font-medium text-ui-muted">Evidence Comm.</span>
            <p className="mt-0.5 text-base font-bold text-ui-ink tabular-nums">
              {dimensions.evidenceCommunication}%
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ui-linen">
              <div
                className="h-full rounded-full bg-stone-700"
                style={{ width: `${dimensions.evidenceCommunication}%` }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <span className="text-[11px] font-medium text-ui-muted">Formatting</span>
            <p className="mt-0.5 text-base font-bold text-ui-ink tabular-nums">
              {dimensions.formattingCompatibility}%
            </p>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ui-linen">
              <div
                className="h-full rounded-full bg-stone-700"
                style={{ width: `${dimensions.formattingCompatibility}%` }}
              />
            </div>
          </div>
        </div>

        {/* Keyword Stuffing Warning Banner */}
        {keywordStuffingDetected && (
          <div className="mt-4">
            <Alert tone="error">
              <strong>Keyword stuffing detected:</strong> Repetitive keyword insertion without contextual project or work experience deliverables was identified. Modern ATS platforms and recruiters penalize unstructured keyword dumping.
            </Alert>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ui-border pb-3">
        <div className="inline-flex gap-1 rounded-lg border border-ui-border bg-ui-canvas p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("alignment")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              activeTab === "alignment"
                ? "bg-ui-surface font-semibold text-ui-ink shadow-2xs"
                : "text-ui-muted hover:text-ui-ink"
            }`}
          >
            Requirement-to-Resume Alignment ({alignmentItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("findings")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              activeTab === "findings"
                ? "bg-ui-surface font-semibold text-ui-ink shadow-2xs"
                : "text-ui-muted hover:text-ui-ink"
            }`}
          >
            Structure & Formatting Findings ({findings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recommendations")}
            className={`rounded-md px-3 py-1.5 transition-colors ${
              activeTab === "recommendations"
                ? "bg-ui-surface font-semibold text-ui-ink shadow-2xs"
                : "text-ui-muted hover:text-ui-ink"
            }`}
          >
            Actionable Improvements ({recommendations.length})
          </button>
        </div>

        {activeTab === "alignment" && (
          <div className="flex gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterStatus("ALL")}
              className={`rounded-md px-2 py-1 ${
                filterStatus === "ALL" ? "bg-ui-linen font-semibold text-ui-ink" : "text-ui-muted"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("MISSING_TERM")}
              className={`rounded-md px-2 py-1 ${
                filterStatus === "MISSING_TERM"
                  ? "bg-[#C6533B]/10 font-semibold text-[#C6533B]"
                  : "text-ui-muted"
              }`}
            >
              Evidence Exists (Missing Term)
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("POORLY_COMM")}
              className={`rounded-md px-2 py-1 ${
                filterStatus === "POORLY_COMM"
                  ? "bg-amber-100 font-semibold text-amber-900"
                  : "text-ui-muted"
              }`}
            >
              Poorly Communicated
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Requirement-to-Resume Alignment */}
      {activeTab === "alignment" && (
        <div className="flex flex-col gap-3">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-ui-muted">No alignment items match the selected filter.</p>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.requirementId}
                className="flex flex-col gap-2 rounded-lg border border-ui-border bg-ui-surface p-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-ui-ink text-sm">
                      {item.requirementName}
                    </span>
                    <Badge className="bg-ui-linen text-ui-ink text-[11px]">
                      {item.category}
                    </Badge>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      alignmentStatusBadgeClass[item.status]
                    }`}
                  >
                    {alignmentStatusLabel[item.status]}
                  </span>
                </div>

                <p className="text-xs text-ui-body">{item.rationale}</p>

                {item.candidateEvidenceSummary && (
                  <div className="rounded border border-ui-border bg-ui-canvas px-3 py-2 text-xs">
                    <span className="font-semibold text-ui-ink">Verified Candidate Background: </span>
                    <span className="text-ui-body">{item.candidateEvidenceSummary}</span>
                  </div>
                )}

                {item.resumeExcerpt && (
                  <div className="rounded border border-ui-border bg-ui-canvas px-3 py-2 text-xs">
                    <span className="font-semibold text-ui-ink">Current Resume Excerpt: </span>
                    <span className="text-ui-body italic">&quot;{item.resumeExcerpt}&quot;</span>
                  </div>
                )}

                {item.suggestedImprovement && (
                  <div className="mt-1 text-xs text-[#C6533B]">
                    <span className="font-semibold">Actionable Recommendation: </span>
                    <span>{item.suggestedImprovement}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Structure & Formatting Findings */}
      {activeTab === "findings" && (
        <div className="flex flex-col gap-3">
          {findings.length === 0 ? (
            <p className="text-sm text-ui-muted">No parsing or structural issues detected.</p>
          ) : (
            findings.map((finding) => (
              <div
                key={finding.id}
                className="flex flex-col gap-2 rounded-lg border border-ui-border bg-ui-surface p-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-ui-ink text-sm">{finding.title}</span>
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      severityBadgeClass[finding.severity]
                    }`}
                  >
                    {finding.severity}
                  </span>
                </div>

                <p className="text-xs text-ui-body">{finding.description}</p>

                <div className="rounded border border-ui-border bg-ui-canvas px-3 py-2 text-xs">
                  <span className="font-semibold text-ui-ink">Why this matters: </span>
                  <span className="text-ui-muted">{finding.impact}</span>
                </div>

                {finding.evidence && (
                  <div className="rounded border border-ui-border bg-ui-canvas px-3 py-2 text-xs">
                    <span className="font-semibold text-ui-ink">Inspection Evidence: </span>
                    <span className="text-ui-muted font-mono">{finding.evidence}</span>
                  </div>
                )}

                <div className="mt-1 text-xs text-ui-ink">
                  <span className="font-semibold text-[#C6533B]">Recommendation: </span>
                  <span>{finding.recommendation}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Actionable Improvements */}
      {activeTab === "recommendations" && (
        <div className="flex flex-col gap-3">
          {recommendations.length === 0 ? (
            <p className="text-sm text-ui-muted">All sections and keywords are well-communicated.</p>
          ) : (
            recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col gap-2 rounded-lg border border-ui-border bg-ui-surface p-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                        rec.priority === "HIGH"
                          ? "bg-rose-100 text-rose-800"
                          : rec.priority === "MEDIUM"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {rec.priority} PRIORITY
                    </span>
                    <span className="font-semibold text-ui-ink text-sm">{rec.title}</span>
                  </div>
                  <Badge className="bg-ui-linen text-ui-ink text-[11px]">
                    {rec.targetSection}
                  </Badge>
                </div>

                <p className="text-xs text-ui-body">{rec.rationale}</p>

                {rec.groundedCandidateEvidence && (
                  <div className="rounded border border-ui-border bg-ui-canvas px-3 py-2 text-xs">
                    <span className="font-semibold text-ui-ink">Candidate Evidence Provenance: </span>
                    <span className="text-ui-body">{rec.groundedCandidateEvidence}</span>
                  </div>
                )}

                {rec.suggestedWording && (
                  <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                    <span className="font-semibold">Suggested Action / Wording: </span>
                    <span>{rec.suggestedWording}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Limitations Disclaimer */}
      <div className="mt-2 rounded-lg border border-ui-border bg-ui-canvas p-4 text-[11px] text-ui-muted">
        <span className="font-semibold text-ui-ink">Evaluation Transparency & Boundaries:</span>
        <ul className="mt-1 list-disc pl-4 space-y-0.5">
          {limitations.map((lim, i) => (
            <li key={i}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

