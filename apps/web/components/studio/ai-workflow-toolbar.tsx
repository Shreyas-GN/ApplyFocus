"use client";

import React, { useState } from "react";
import type { TailoredDocumentDto, TailoredResumeContent } from "@/lib/types";
import { api, ApiError } from "@/lib/api-client";
import {
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  FileCheck,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import type {
  BulletEnhancementResult,
  ResumeAiWorkflowAction,
  ResumeAiWorkflowResponse,
} from "@/lib/server/resume-ai-workflow";

interface AiWorkflowToolbarProps {
  doc: TailoredDocumentDto;
  content: TailoredResumeContent;
  onUpdateContent: (updated: TailoredResumeContent) => void;
  onRefreshNotice?: (notice: string) => void;
}

export function AiWorkflowToolbar({
  doc,
  content,
  onUpdateContent,
  onRefreshNotice,
}: AiWorkflowToolbarProps) {
  const [runningAction, setRunningAction] = useState<ResumeAiWorkflowAction | null>(null);
  const [bulletResult, setBulletResult] = useState<BulletEnhancementResult | null>(null);
  const [activeExpIndex, setActiveExpIndex] = useState<number | null>(null);
  const [activeBulletIndex, setActiveBulletIndex] = useState<number | null>(null);

  async function runWorkflow(
    action: ResumeAiWorkflowAction,
    params?: {
      bulletText?: string;
      experienceIndex?: number;
      bulletIndex?: number;
    }
  ) {
    setRunningAction(action);
    try {
      const res = await api.post<ResumeAiWorkflowResponse>(
        `/tailor/${doc.id}/ai-workflow`,
        {
          action,
          ...params,
        }
      );

      onUpdateContent(res.updatedContent);

      if (res.bulletEnhancement) {
        setBulletResult(res.bulletEnhancement);
        setActiveExpIndex(params?.experienceIndex ?? null);
        setActiveBulletIndex(params?.bulletIndex ?? null);
      }

      const summaryText = res.changesSummary.join(" • ");
      if (onRefreshNotice) {
        onRefreshNotice(summaryText);
      }
      toast.success(
        res.newAtsScore > res.previousAtsScore
          ? `ATS Score boosted from ${res.previousAtsScore}% to ${res.newAtsScore}%!`
          : "AI Optimization complete!"
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.detail : "AI Workflow encountered an error.";
      toast.error(msg);
    } finally {
      setRunningAction(null);
    }
  }

  function handleApplyBulletVariation(text: string) {
    if (activeExpIndex === null || activeBulletIndex === null) return;
    const expCopy = [...content.experience];
    const targetExp = expCopy[activeExpIndex];
    if (!targetExp) return;

    const bullets = targetExp.tailoredDescription.split("\n").filter(Boolean);
    bullets[activeBulletIndex] = text;
    targetExp.tailoredDescription = bullets.join("\n");

    onUpdateContent({
      ...content,
      experience: expCopy,
    });

    setBulletResult(null);
    setActiveExpIndex(null);
    setActiveBulletIndex(null);
    toast.success("Applied Google XYZ bullet point!");
  }

  return (
    <div className="flex flex-col gap-3">
      {/* AI Assistant Banner */}
      <div className="rounded-xl border border-ui-teal/30 bg-gradient-to-r from-ui-teal-soft/60 via-white to-amber-50/40 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ui-teal/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ui-teal text-white shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-ui-ink">
                  ApplyFocus AI Application Copilot
                </span>
                <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-semibold text-emerald-800 border border-emerald-300">
                  Zero Hallucination
                </span>
              </div>
              <p className="text-[11px] text-ui-muted">
                Intelligent, evidence-grounded operations tailored specifically for {doc.company}.
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-ui-muted hidden sm:block">
            Target Role: <strong className="text-ui-ink">{doc.jobTitle}</strong>
          </div>
        </div>

        {/* Quick Action Buttons Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            disabled={runningAction !== null}
            onClick={() => runWorkflow("auto_optimize_ats")}
            className="flex items-center gap-2 rounded-lg border border-ui-teal/40 bg-white p-2.5 text-left text-xs font-semibold text-ui-teal shadow-2xs hover:bg-ui-teal-soft/40 transition-all disabled:opacity-50"
          >
            <Zap className={`h-4 w-4 shrink-0 text-ui-teal ${runningAction === "auto_optimize_ats" ? "animate-spin" : ""}`} />
            <div>
              <div className="font-bold">1-Click ATS Boost</div>
              <div className="text-[10px] font-normal text-ui-muted">Full intelligent pass</div>
            </div>
          </button>

          <button
            type="button"
            disabled={runningAction !== null}
            onClick={() => runWorkflow("bridge_keywords")}
            className="flex items-center gap-2 rounded-lg border border-ui-border bg-white p-2.5 text-left text-xs font-semibold text-ui-ink shadow-2xs hover:border-ui-teal hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            <TrendingUp className={`h-4 w-4 shrink-0 text-emerald-600 ${runningAction === "bridge_keywords" ? "animate-spin" : ""}`} />
            <div>
              <div className="font-bold">Bridge Keywords</div>
              <div className="text-[10px] font-normal text-ui-muted">Map missing job terms</div>
            </div>
          </button>

          <button
            type="button"
            disabled={runningAction !== null}
            onClick={() => runWorkflow("elevate_action_verbs")}
            className="flex items-center gap-2 rounded-lg border border-ui-border bg-white p-2.5 text-left text-xs font-semibold text-ui-ink shadow-2xs hover:border-ui-teal hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            <ShieldCheck className={`h-4 w-4 shrink-0 text-purple-600 ${runningAction === "elevate_action_verbs" ? "animate-spin" : ""}`} />
            <div>
              <div className="font-bold">Power Verb Upgrade</div>
              <div className="text-[10px] font-normal text-ui-muted">Remove passive phrases</div>
            </div>
          </button>

          <button
            type="button"
            disabled={runningAction !== null}
            onClick={() => runWorkflow("synthesize_summary")}
            className="flex items-center gap-2 rounded-lg border border-ui-border bg-white p-2.5 text-left text-xs font-semibold text-ui-ink shadow-2xs hover:border-ui-teal hover:bg-stone-50 transition-all disabled:opacity-50"
          >
            <FileCheck className={`h-4 w-4 shrink-0 text-amber-600 ${runningAction === "synthesize_summary" ? "animate-spin" : ""}`} />
            <div>
              <div className="font-bold">Align Summary</div>
              <div className="text-[10px] font-normal text-ui-muted">Target role narrative</div>
            </div>
          </button>
        </div>
      </div>

      {/* Bullet Enhancement Variations Modal / Drawer */}
      {bulletResult && (
        <Card className="border-ui-teal bg-ui-teal-soft/20 p-4">
          <div className="flex items-center justify-between border-b border-ui-teal/30 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-ui-teal" />
              <span className="font-bold text-xs text-ui-ink">
                Google XYZ Bullet Enhancer Results
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBulletResult(null)}
              className="text-xs text-ui-muted hover:text-ui-ink"
            >
              Dismiss
            </button>
          </div>

          <p className="mt-2 text-xs text-stone-600">
            <strong>Original:</strong> {bulletResult.original}
          </p>

          <div className="mt-3 flex flex-col gap-2">
            {bulletResult.variations.map((v, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 rounded-lg border border-ui-border bg-white p-3 shadow-2xs hover:border-ui-teal"
              >
                <div>
                  <span className="rounded bg-ui-canvas px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ui-teal">
                    {v.label}
                  </span>
                  <p className="mt-1 text-xs text-stone-900 font-medium leading-relaxed">
                    {v.text}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="shrink-0 text-xs px-2.5 py-1"
                  onClick={() => handleApplyBulletVariation(v.text)}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Use This
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

