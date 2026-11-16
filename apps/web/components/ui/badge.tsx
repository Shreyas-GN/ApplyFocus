import * as React from "react";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  uploaded: "bg-ui-linen text-ui-ink border-ui-border",
  extracting: "bg-blue-50 text-blue-700 border-blue-200/80",
  extracted: "bg-blue-50 text-blue-700 border-blue-200/80",
  parsing: "bg-blue-50 text-blue-700 border-blue-200/80",
  parsed: "bg-amber-50 text-amber-800 border-amber-200/80",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  pending_review: "bg-amber-50 text-amber-800 border-amber-200/80",
  failed: "bg-red-50 text-red-700 border-red-200/80",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  queued: "bg-ui-linen text-ui-body border-ui-border",
  processing: "bg-blue-50 text-blue-700 border-blue-200/80",
  saved: "bg-ui-linen text-ui-ink border-ui-border",
  applied: "bg-blue-50 text-blue-700 border-blue-200/80",
  interviewing: "bg-amber-50 text-amber-800 border-amber-200/80",
  offer: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  rejected: "bg-red-50 text-red-700 border-red-200/80",
};

const STATUS_LABEL: Record<string, string> = {
  uploaded: "Uploaded",
  extracting: "Extracting text",
  extracted: "Text extracted",
  parsing: "AI parsing",
  parsed: "Ready for review",
  confirmed: "Confirmed",
  pending_review: "Needs review",
  failed: "Failed",
  completed: "Completed",
  queued: "Queued",
  processing: "Processing",
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] ?? "bg-ui-linen text-ui-body border-ui-border";
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  tone?: "lilac" | "neutral" | "success" | "warning";
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
}

export function Badge({
  children,
  tone = "lilac",
  variant,
  className = "",
  ...props
}: BadgeProps) {
  let styleClass = "";

  if (variant) {
    switch (variant) {
      case "secondary":
        styleClass = "bg-neutral-100 text-neutral-900 border-transparent dark:bg-neutral-800 dark:text-neutral-50";
        break;
      case "destructive":
        styleClass = "bg-red-500 text-white border-transparent hover:bg-red-500/80";
        break;
      case "outline":
        styleClass = "text-neutral-950 border border-neutral-200 dark:text-neutral-50 dark:border-neutral-800";
        break;
      case "default":
      default:
        styleClass = "bg-ui-teal text-white border-transparent";
        break;
    }
  } else {
    styleClass =
      tone === "neutral"
        ? "bg-ui-linen text-ui-body border-ui-border"
        : tone === "success"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
          : tone === "warning"
            ? "bg-amber-50 text-amber-800 border-amber-200/80"
            : "bg-ui-teal-soft text-ui-teal border-ui-teal-soft";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styleClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
