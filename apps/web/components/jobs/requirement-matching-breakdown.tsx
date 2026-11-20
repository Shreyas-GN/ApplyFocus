"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode,
  FolderGit2,
  HelpCircle,
  Info,
  Layers,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import type {
  CandidateGapAnalysis,
  JobRequirementImportance,
  RequirementMatch,
  RequirementMatchResult,
  RequirementMatchStatus,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface RequirementMatchingBreakdownProps {
  matchResult: RequirementMatchResult | null | undefined;
  jobTitle: string;
}

export function RequirementMatchingBreakdown({
  matchResult,
  jobTitle,
}: RequirementMatchingBreakdownProps) {
  const [filter, setFilter] = useState<"all" | "must_have" | "preferred" | "gaps">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showScoreFactors, setShowScoreFactors] = useState(false);

  if (!matchResult) {
    return (
      <div className="rounded-lg border border-ui-border bg-ui-canvas p-6 text-center text-xs text-ui-muted">
        Requirement matching analysis is generating or not yet available for this job.
      </div>
    );
  }

  const {
    overallScore,
    mustHaveCoverage,
    preferredCoverage,
    hardConstraintCoverage,
    matches,
    gaps,
    criticalGapsCount,
    scoringBreakdown,
  } = matchResult;

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    if (expandedIds.size === matches.length) {
      setExpandedIds(new Set());
    } else {
      setExpandedIds(new Set(matches.map((m) => m.requirement.id)));
    }
  }

  const filteredMatches = matches.filter((m) => {
    if (filter === "must_have") return m.requirement.importance === "MUST_HAVE";
    if (filter === "preferred")
      return (
        m.requirement.importance === "PREFERRED" ||
        m.requirement.importance === "OPTIONAL"
      );
    if (filter === "gaps") return m.status !== "DIRECT_MATCH";
    return true;
  });

  const directCount = matches.filter((m) => m.status === "DIRECT_MATCH").length;
  const relatedCount = matches.filter((m) => m.status === "RELATED_MATCH").length;
  const partialCount = matches.filter((m) => m.status === "PARTIAL_MATCH").length;
  const missingCount = matches.filter((m) => m.status === "MISSING").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Coverage Score Metrics */}
      <div className="rounded-xl border border-ui-border bg-ui-surface p-4 shadow-2xs">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-ui-border pb-3">
          <div>
            <h3 className="text-sm font-semibold text-ui-ink">
              Requirement-Level Match Engine
            </h3>
            <p className="text-xs text-ui-muted">
              Evidence-backed evaluation against your confirmed skills, employment history, and projects.
            </p>
          </div>
          <div className="flex items-baseline gap-1 text-right">
            <span className="text-2xl font-bold tracking-tight text-ui-ink">
              {overallScore}%
            </span>
            <span className="text-xs font-medium text-ui-muted">Overall Match</span>
          </div>
        </div>

        {/* Score Cap Notification */}
        {scoringBreakdown?.scoreCapApplied && scoringBreakdown.scoreCapReason && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#C6533B]/30 bg-[#C6533B]/5 p-2.5 text-xs text-[#C6533B]">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Mandatory Requirement Gating Applied</p>
              <p className="mt-0.5 text-ui-body leading-relaxed">
                {scoringBreakdown.scoreCapReason}
              </p>
            </div>
          </div>
        )}

        {/* Coverage Bars */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ui-ink">Must-Have Requirements</span>
              <span className="font-bold text-ui-ink tabular-nums">
                {mustHaveCoverage}% Met
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ui-linen">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  mustHaveCoverage >= 80
                    ? "bg-emerald-600"
                    : mustHaveCoverage >= 50
                      ? "bg-amber-500"
                      : "bg-[#C6533B]"
                }`}
                style={{ width: `${mustHaveCoverage}%` }}
              />
            </div>
            {criticalGapsCount > 0 ? (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-[#C6533B]">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>
                  {criticalGapsCount} mandatory requirement{criticalGapsCount > 1 ? "s" : ""}{" "}
                  missing proof
                </span>
              </p>
            ) : (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>All mandatory requirements satisfied</span>
              </p>
            )}
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ui-ink">Preferred & Optional</span>
              <span className="font-bold text-ui-ink tabular-nums">
                {preferredCoverage}% Met
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ui-linen">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  preferredCoverage >= 70 ? "bg-ui-teal" : "bg-amber-500"
                }`}
                style={{ width: `${preferredCoverage}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-ui-muted">
              {preferredCoverage >= 70
                ? "Strong competitive alignment on bonus qualifications."
                : "Secondary requirements can be addressed through resume tailoring."}
            </p>
          </div>
        </div>

        {/* Status Count Pills */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-medium text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              <span>{directCount} Direct</span>
            </span>
            {relatedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-2 py-1 font-medium text-teal-800 border border-teal-200">
                <Sparkles className="h-3 w-3 text-teal-600" />
                <span>{relatedCount} Related</span>
              </span>
            )}
            {partialCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 font-medium text-amber-800 border border-amber-200">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                <span>{partialCount} Partial</span>
              </span>
            )}
            {missingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 font-medium text-red-800 border border-red-200">
                <AlertCircle className="h-3 w-3 text-red-600" />
                <span>{missingCount} Missing</span>
              </span>
            )}
          </div>

          {scoringBreakdown && (
            <button
              type="button"
              onClick={() => setShowScoreFactors((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-ui-teal hover:underline"
            >
              <Info className="h-3.5 w-3.5" />
              <span>{showScoreFactors ? "Hide score breakdown" : "How score is calculated"}</span>
            </button>
          )}
        </div>

        {/* Expandable Score Factors Accordion */}
        {showScoreFactors && scoringBreakdown && (
          <div className="mt-3 border-t border-ui-border pt-3 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-emerald-50/50 border border-emerald-200 p-2.5">
                <p className="font-semibold text-emerald-900 mb-1.5 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Positive Factors
                </p>
                <ul className="flex flex-col gap-1 text-ui-ink text-[11px]">
                  {scoringBreakdown.positiveFactors.map((f) => (
                    <li key={f} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-md bg-red-50/40 border border-red-200 p-2.5">
                <p className="font-semibold text-red-900 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                  Negative Factors
                </p>
                <ul className="flex flex-col gap-1 text-ui-ink text-[11px]">
                  {scoringBreakdown.negativeFactors.map((f) => (
                    <li key={f} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Expand All */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ui-border pb-2">
        <div className="inline-flex gap-1 rounded-lg border border-ui-border bg-ui-canvas p-0.5">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === "all"
                ? "bg-ui-surface text-ui-ink shadow-2xs font-semibold"
                : "text-ui-body hover:text-ui-ink"
            }`}
          >
            All ({matches.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("must_have")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === "must_have"
                ? "bg-ui-surface text-ui-ink shadow-2xs font-semibold"
                : "text-ui-body hover:text-ui-ink"
            }`}
          >
            Must-Have ({matches.filter((m) => m.requirement.importance === "MUST_HAVE").length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("preferred")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === "preferred"
                ? "bg-ui-surface text-ui-ink shadow-2xs font-semibold"
                : "text-ui-body hover:text-ui-ink"
            }`}
          >
            Preferred (
            {
              matches.filter(
                (m) =>
                  m.requirement.importance === "PREFERRED" ||
                  m.requirement.importance === "OPTIONAL"
              ).length
            }
            )
          </button>
          <button
            type="button"
            onClick={() => setFilter("gaps")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              filter === "gaps"
                ? "bg-ui-surface text-[#C6533B] shadow-2xs font-semibold"
                : "text-ui-body hover:text-ui-ink"
            }`}
          >
            Gaps ({matches.filter((m) => m.status !== "DIRECT_MATCH").length})
          </button>
        </div>

        <button
          type="button"
          onClick={toggleAll}
          className="text-xs font-medium text-ui-teal hover:underline"
        >
          {expandedIds.size === matches.length ? "Collapse all" : "Expand all evidence"}
        </button>
      </div>

      {/* Requirement List */}
      <div className="flex flex-col gap-2.5">
        {filteredMatches.map((m) => {
          const isExpanded = expandedIds.has(m.requirement.id);
          const statusStyle = getStatusBadgeStyle(m.status);

          return (
            <div
              key={m.requirement.id}
              className={`rounded-lg border transition-all ${
                m.status === "DIRECT_MATCH"
                  ? "border-ui-border bg-ui-surface"
                  : m.requirement.importance === "MUST_HAVE"
                    ? "border-red-200 bg-red-50/20"
                    : "border-ui-border bg-ui-surface"
              }`}
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => toggleExpand(m.requirement.id)}
                className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-ui-canvas/50"
              >
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold ${statusStyle.badgeClass}`}
                  >
                    {statusStyle.label}
                  </span>

                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      m.requirement.importance === "MUST_HAVE"
                        ? "bg-[#202124] text-white"
                        : "bg-ui-linen text-ui-ink"
                    }`}
                  >
                    {m.requirement.importance.replace("_", " ")}
                  </span>

                  <span className="text-xs font-semibold text-ui-ink">{m.requirement.name}</span>

                  {m.requirement.domain && (
                    <span className="rounded bg-ui-linen px-1.5 py-0.5 text-[10px] text-ui-ink font-medium">
                      {m.requirement.domain}
                    </span>
                  )}

                  <span className="text-[11px] text-ui-muted">
                    ({m.requirement.category.toLowerCase()})
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2 text-ui-muted">
                  {m.sourceExperience && (
                    <span className="hidden items-center gap-1 text-[11px] font-medium sm:inline-flex text-emerald-800 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">
                      <Briefcase className="h-3 w-3" />
                      <span>{m.sourceExperience}</span>
                    </span>
                  )}
                  {m.sourceProject && (
                    <span className="hidden items-center gap-1 text-[11px] font-medium sm:inline-flex text-blue-800 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                      <FolderGit2 className="h-3 w-3" />
                      <span>{m.sourceProject}</span>
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-ui-border bg-ui-canvas/60 p-3.5 text-xs text-ui-ink flex flex-col gap-3">
                  {/* Employer Expectation */}
                  <div>
                    <p className="font-semibold text-ui-muted uppercase text-[10px] tracking-wider">
                      Employer Expectation
                    </p>
                    <p className="mt-0.5 text-ui-ink leading-relaxed italic border-l-2 border-ui-border pl-2.5">
                      &ldquo;{m.requirement.evidenceSentence}&rdquo;
                    </p>
                  </div>

                  {/* Supporting Candidate Evidence */}
                  <div>
                    <p className="font-semibold text-ui-muted uppercase text-[10px] tracking-wider">
                      Supporting Candidate Evidence
                    </p>
                    {m.status === "DIRECT_MATCH" || m.status === "PARTIAL_MATCH" ? (
                      <div className="mt-1 flex flex-col gap-1.5 rounded-md border border-ui-border bg-white p-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ui-ink">
                            {m.candidateSkill ?? m.requirement.normalizedSkill}
                          </span>
                          {m.evidenceCategory && (
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                m.evidenceCategory === "USER_CONFIRMED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {m.evidenceCategory.replace("_", " ")}
                            </span>
                          )}
                          {m.sourceExperience && (
                            <span className="inline-flex items-center gap-1 text-ui-muted">
                              <Briefcase className="h-3 w-3 text-ui-ink" />
                              Employment: <strong className="text-ui-ink">{m.sourceExperience}</strong>
                            </span>
                          )}
                          {m.sourceProject && (
                            <span className="inline-flex items-center gap-1 text-ui-muted">
                              <FolderGit2 className="h-3 w-3 text-ui-ink" />
                              Personal Project: <strong className="text-ui-ink">{m.sourceProject}</strong>
                            </span>
                          )}
                        </div>
                        {m.evidenceSentence && (
                          <p className="text-ui-body italic leading-relaxed">
                            &ldquo;{m.evidenceSentence}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : m.status === "RELATED_MATCH" ? (
                      <div className="mt-1 rounded-md border border-teal-200 bg-teal-50/60 p-2.5 text-teal-900">
                        <p className="flex items-center gap-1.5 font-semibold">
                          <span>{m.candidateSkill}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-teal-600" />
                          <span>{m.requirement.normalizedSkill}</span>
                        </p>
                        <p className="mt-1 text-teal-800 leading-relaxed">
                          {m.transferableReason}
                        </p>
                      </div>
                    ) : m.status === "UNVERIFIED" ? (
                      <p className="mt-1 text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
                        Skill listed in profile as an unconfirmed AI suggestion or self-reported tag, but lacks verifiable resume proof or confirmed project execution.
                      </p>
                    ) : (
                      <p className="mt-1 text-ui-muted">
                        No direct or transferable experience documented in your profile.
                      </p>
                    )}
                  </div>

                  {/* Matching Rationale */}
                  <div>
                    <p className="font-semibold text-ui-muted uppercase text-[10px] tracking-wider">
                      Assessment Rationale
                    </p>
                    <p className="mt-0.5 leading-relaxed text-ui-body">{m.rationale}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actionable Gap Analysis Section */}
      {gaps.length > 0 && (
        <div className="mt-4 rounded-xl border border-ui-border bg-ui-surface p-4 shadow-2xs">
          <div className="mb-3 flex items-center justify-between border-b border-ui-border pb-2.5">
            <div>
              <h4 className="text-sm font-semibold text-ui-ink flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-[#C6533B]" />
                <span>Actionable Gap Analysis ({gaps.length})</span>
              </h4>
              <p className="text-xs text-ui-muted">
                Distinguishes between genuine qualification gaps and missing resume evidence with honest next steps.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {gaps.map((gap) => (
              <div
                key={gap.requirementId}
                className="rounded-lg border border-ui-border bg-ui-canvas p-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ui-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getGapBadgeStyle(
                        gap.classification
                      )}`}
                    >
                      {gap.classification.replace("_", " ")}
                    </span>

                    {gap.gapType && (
                      <span className="rounded bg-ui-linen px-1.5 py-0.5 text-[10px] text-ui-ink font-semibold uppercase tracking-wider">
                        {gap.gapType === "EVIDENCE_GAP" ? "Missing Documentation" : "Qualification Shortfall"}
                      </span>
                    )}

                    <span className="font-semibold text-ui-ink">{gap.requirementName}</span>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <span className="font-semibold text-ui-muted uppercase text-[10px]">
                      Employer Expectation:
                    </span>
                    <p className="mt-0.5 text-ui-ink leading-relaxed">{gap.employerExpectation}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-ui-muted uppercase text-[10px]">
                      Your Current Demonstration:
                    </span>
                    <p className="mt-0.5 text-ui-body leading-relaxed">
                      {gap.candidateDemonstration}
                    </p>
                  </div>
                </div>

                {gap.transferableSkillContext && (
                  <div className="mt-2 rounded bg-teal-50 border border-teal-200 p-2 text-teal-800">
                    <span className="font-semibold">Transferable alternative: </span>
                    <span>{gap.transferableSkillContext}</span>
                  </div>
                )}

                <div className="mt-2.5 rounded bg-white border border-ui-border p-2.5">
                  <span className="font-semibold text-ui-ink flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-ui-teal" />
                    Recommended Next Action:
                  </span>
                  <p className="mt-1 leading-relaxed text-ui-body">{gap.actionableImprovement}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadgeStyle(status: RequirementMatchStatus) {
  switch (status) {
    case "DIRECT_MATCH":
      return {
        label: "Direct Match",
        badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-300",
      };
    case "RELATED_MATCH":
      return {
        label: "Related Match",
        badgeClass: "bg-teal-50 text-teal-800 border-teal-300",
      };
    case "PARTIAL_MATCH":
      return {
        label: "Partial Match",
        badgeClass: "bg-amber-50 text-amber-800 border-amber-300",
      };
    case "UNVERIFIED":
      return {
        label: "Unverified",
        badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
      };
    case "MISSING":
    default:
      return {
        label: "Missing",
        badgeClass: "bg-red-50 text-[#C6533B] border-red-300",
      };
  }
}

function getGapBadgeStyle(classification: string) {
  switch (classification) {
    case "CRITICAL_GAP":
      return "bg-[#C6533B] text-white";
    case "EXPERIENCE_GAP":
      return "bg-amber-100 text-amber-900 border border-amber-300";
    case "SKILL_GAP":
      return "bg-slate-100 text-slate-800 border border-slate-300";
    case "EVIDENCE_GAP":
      return "bg-purple-100 text-purple-900 border border-purple-300";
    case "MINOR_GAP":
    default:
      return "bg-ui-linen text-ui-ink";
  }
}
