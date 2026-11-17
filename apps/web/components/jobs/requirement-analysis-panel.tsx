"use client";

import type { RequirementAnalysis, RequirementAssessment, RequirementAssessmentItem } from "@/lib/types";

const ASSESSMENT_LABELS: Record<RequirementAssessment, string> = {
  demonstrated: "Demonstrated",
  strongly_supported: "Strongly Supported",
  transferable: "Transferable",
  partial: "Partial",
  not_established: "Not Established",
};

const ASSESSMENT_COLORS: Record<RequirementAssessment, string> = {
  demonstrated: "bg-emerald-50 text-emerald-700 border-emerald-200",
  strongly_supported: "bg-teal-50 text-teal-700 border-teal-200",
  transferable: "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-orange-50 text-orange-700 border-orange-200",
  not_established: "bg-slate-50 text-slate-500 border-slate-200",
};

const ASSESSMENT_DOT: Record<RequirementAssessment, string> = {
  demonstrated: "bg-emerald-500",
  strongly_supported: "bg-teal-500",
  transferable: "bg-amber-400",
  partial: "bg-orange-400",
  not_established: "bg-slate-300",
};

function AssessmentBadge({ assessment }: { assessment: RequirementAssessment }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${ASSESSMENT_COLORS[assessment]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ASSESSMENT_DOT[assessment]}`} />
      {ASSESSMENT_LABELS[assessment]}
    </span>
  );
}

function RequirementRow({ item }: { item: RequirementAssessmentItem }) {
  return (
    <tr className="border-b border-ui-border last:border-0">
      <td className="py-3 pr-3 align-top">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ui-ink">{item.requirement}</span>
          {item.importance === "preferred" && (
            <span className="rounded-full border border-ui-border px-2 py-px text-[10px] font-medium text-ui-muted">
              preferred
            </span>
          )}
        </div>
      </td>
      <td className="py-3 pr-3 align-top">
        <AssessmentBadge assessment={item.assessment} />
      </td>
      <td className="py-3 align-top">
        <p className="text-xs leading-relaxed text-ui-body">{item.evidence}</p>
        {item.evidenceSource && (
          <p className="mt-0.5 text-[11px] text-ui-muted">{item.evidenceSource}</p>
        )}
      </td>
    </tr>
  );
}

interface RequirementAnalysisPanelProps {
  analysis: RequirementAnalysis;
}

export function RequirementAnalysisPanel({ analysis }: RequirementAnalysisPanelProps) {
  const { items, demonstratedCount, transferableCount, notEstablishedCount } = analysis;

  if (items.length === 0) {
    return (
      <p className="text-xs text-ui-muted">
        No specific requirements could be extracted from this job description.
      </p>
    );
  }

  const totalMandatory = items.filter((i) => i.importance === "mandatory").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {demonstratedCount} Demonstrated
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          {transferableCount} Transferable / Partial
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          {notEstablishedCount} Not Established
        </div>
        {totalMandatory > 0 && (
          <span className="ml-auto text-[11px] text-ui-muted">
            {totalMandatory} mandatory · {items.length - totalMandatory} preferred
          </span>
        )}
      </div>

      {/* Requirement table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-ui-border">
              <th className="pb-2 pr-3 text-[11px] font-semibold uppercase tracking-wide text-ui-muted">
                Requirement
              </th>
              <th className="pb-2 pr-3 text-[11px] font-semibold uppercase tracking-wide text-ui-muted whitespace-nowrap">
                Assessment
              </th>
              <th className="pb-2 text-[11px] font-semibold uppercase tracking-wide text-ui-muted">
                Evidence
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Mandatory first */}
            {items
              .filter((i) => i.importance === "mandatory")
              .map((item) => (
                <RequirementRow key={`req-${item.requirement}`} item={item} />
              ))}
            {/* Preferred after */}
            {items
              .filter((i) => i.importance === "preferred")
              .map((item) => (
                <RequirementRow key={`pref-${item.requirement}`} item={item} />
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-ui-muted">
        Assessment is based on your confirmed profile data only. AI-extracted items pending your
        review are excluded.
      </p>
    </div>
  );
}
