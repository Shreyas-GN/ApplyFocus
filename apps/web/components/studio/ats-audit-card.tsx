"use client";

import React from "react";
import type { TailoredResumeContent } from "@/lib/types";
import { analyzeResumeAts } from "@/lib/resume/ats-inspector";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  Zap,
  TrendingUp,
  Award,
  Sparkles,
} from "lucide-react";

interface AtsAuditCardProps {
  content: TailoredResumeContent;
  jobDescription?: string;
}

export function AtsAuditCard({ content, jobDescription }: AtsAuditCardProps) {
  const report = analyzeResumeAts(content, jobDescription);

  const gradeColors = {
    "A+": "bg-emerald-500 text-white",
    A: "bg-emerald-600 text-white",
    B: "bg-ui-teal text-white",
    C: "bg-amber-500 text-white",
    D: "bg-rose-500 text-white",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Score Card */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-ui-border pb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-stone-900 text-white shadow-md">
              <span className="text-3xl font-black">{report.overallScore}</span>
              <span className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full text-xs font-black shadow-sm ring-2 ring-white font-mono uppercase bg-emerald-500 text-white">
                {report.grade}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ui-teal">
                  ATS & Recruiter Intelligence
                </span>
              </div>
              <h3 className="text-xl font-bold text-ui-ink">
                {report.overallScore >= 90
                  ? "Recruiter-Ready Elite Tier (Top 5%)"
                  : report.overallScore >= 80
                  ? "Strong Competitive Fit"
                  : report.overallScore >= 70
                  ? "Good Foundation — Needs Optimization"
                  : "Requires Critical Structural Adjustments"}
              </h3>
              <p className="mt-0.5 text-xs text-ui-muted">
                Evaluated against enterprise ATS parsing standards, Google XYZ impact formula, and target role criteria.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <div className="flex flex-col rounded-lg border border-ui-border bg-ui-canvas px-3 py-2 text-center min-w-[90px]">
              <span className="text-stone-500 text-[11px]">Impact</span>
              <span className="font-bold text-ui-ink text-sm">{report.breakdown.impactScore}%</span>
            </div>
            <div className="flex flex-col rounded-lg border border-ui-border bg-ui-canvas px-3 py-2 text-center min-w-[90px]">
              <span className="text-stone-500 text-[11px]">Structure</span>
              <span className="font-bold text-ui-ink text-sm">{report.breakdown.structureScore}%</span>
            </div>
            <div className="flex flex-col rounded-lg border border-ui-border bg-ui-canvas px-3 py-2 text-center min-w-[90px]">
              <span className="text-stone-500 text-[11px]">Keywords</span>
              <span className="font-bold text-ui-ink text-sm">{report.breakdown.keywordScore}%</span>
            </div>
            <div className="flex flex-col rounded-lg border border-ui-border bg-ui-canvas px-3 py-2 text-center min-w-[90px]">
              <span className="text-stone-500 text-[11px]">Contact</span>
              <span className="font-bold text-ui-ink text-sm">{report.breakdown.contactScore}%</span>
            </div>
          </div>
        </div>

        {/* Metric Diagnostics Bar */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <p className="text-[11px] font-medium text-ui-muted flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600" />
              Quantified Metrics
            </p>
            <p className="mt-1 text-lg font-bold text-ui-ink">
              {report.metrics.quantifiedBulletPercent}%{" "}
              <span className="text-xs font-normal text-ui-muted">
                ({report.metrics.quantifiedBulletCount}/{report.metrics.totalBulletPoints})
              </span>
            </p>
            <p className="text-[10px] text-ui-muted mt-0.5">Bullets with $, %, or metrics</p>
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <p className="text-[11px] font-medium text-ui-muted flex items-center gap-1">
              <Zap className="h-3 w-3 text-emerald-600" />
              Action Power Verbs
            </p>
            <p className="mt-1 text-lg font-bold text-ui-ink">
              {report.metrics.actionVerbCount}
            </p>
            <p className="text-[10px] text-ui-muted mt-0.5">High-impact verbs detected</p>
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <p className="text-[11px] font-medium text-ui-muted flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-ui-teal" />
              Keywords Matched
            </p>
            <p className="mt-1 text-lg font-bold text-ui-ink">
              {report.metrics.keywordsMatchedCount}{" "}
              <span className="text-xs font-normal text-ui-muted">
                / {report.metrics.keywordsMatchedCount + report.metrics.keywordsMissingCount}
              </span>
            </p>
            <p className="text-[10px] text-ui-muted mt-0.5">Target job requirements</p>
          </div>

          <div className="rounded-lg border border-ui-border bg-ui-canvas p-3">
            <p className="text-[11px] font-medium text-ui-muted flex items-center gap-1">
              <Award className="h-3 w-3 text-purple-600" />
              Core Competencies
            </p>
            <p className="mt-1 text-lg font-bold text-ui-ink">
              {report.metrics.skillsCount}
            </p>
            <p className="text-[10px] text-ui-muted mt-0.5">Highlighted technical skills</p>
          </div>
        </div>

        {/* Action Verbs Pills */}
        {report.recognizedActionVerbs.length > 0 && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <p className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Recognized Decisive Power Verbs:
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {report.recognizedActionVerbs.map((v) => (
                <span
                  key={v}
                  className="rounded bg-white px-2 py-0.5 text-xs font-medium text-emerald-800 border border-emerald-200 capitalize shadow-2xs"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Weak Verbs Warning */}
        {report.weakVerbsFound.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <p className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Weak or Passive Phrasing Detected:
            </p>
            <p className="mt-1 text-xs text-amber-800">
              Replace passive expressions like {report.weakVerbsFound.map((v) => `"${v}"`).join(", ")} with power verbs that emphasize initiative.
            </p>
          </div>
        )}
      </Card>

      {/* Actionable Findings & Fixes */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-ui-ink">
          Diagnostic Audit Findings ({report.findings.length})
        </h4>

        {report.findings.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            Zero issues detected. This resume strictly adheres to high-conversion recruiter and ATS standards.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {report.findings.map((f) => {
              const isError = f.severity === "error";
              const isWarning = f.severity === "warning";
              const Icon = isError
                ? AlertCircle
                : isWarning
                ? AlertTriangle
                : Lightbulb;

              const borderClass = isError
                ? "border-rose-200 bg-rose-50/40"
                : isWarning
                ? "border-amber-200 bg-amber-50/30"
                : "border-sky-200 bg-sky-50/30";

              const badgeClass = isError
                ? "bg-rose-100 text-rose-800 border-rose-300"
                : isWarning
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-sky-100 text-sky-800 border-sky-300";

              return (
                <div
                  key={f.id}
                  className={`rounded-lg border p-3.5 transition-all ${borderClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <Icon
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          isError
                            ? "text-rose-600"
                            : isWarning
                            ? "text-amber-600"
                            : "text-sky-600"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ui-ink">
                            {f.title}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold uppercase border ${badgeClass}`}
                          >
                            {f.category}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-stone-700">
                          {f.description}
                        </p>
                        <p className="mt-1.5 text-xs font-medium text-stone-900 bg-white/70 rounded p-2 border border-stone-200/60">
                          <span className="font-semibold text-ui-teal">Action:</span> {f.recommendation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

