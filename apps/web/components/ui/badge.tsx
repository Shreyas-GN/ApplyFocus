import * as React from "react";
import { cn } from "@/lib/utils";

const STATUS_TONE: Record<string, string> = {
  uploaded: "bg-ui-linen text-ui-ink border-ui-border",
  extracting: "bg-ui-teal-soft text-ui-teal border-ui-teal/30",
  extracted: "bg-ui-teal-soft text-ui-teal border-ui-teal/30",
  parsing: "bg-ui-teal-soft text-ui-teal border-ui-teal/30",
  parsed: "bg-ui-warning-soft text-ui-warning border-ui-warning/30",
  confirmed: "bg-ui-success-soft text-ui-success border-ui-success/30",
  pending_review: "bg-ui-warning-soft text-ui-warning border-ui-warning/30",
  failed: "bg-ui-error-soft text-ui-error border-ui-error/30",
  completed: "bg-ui-success-soft text-ui-success border-ui-success/30",
  queued: "bg-ui-linen text-ui-body border-ui-border",
  processing: "bg-ui-teal-soft text-ui-teal border-ui-teal/30",
  saved: "bg-ui-linen text-ui-ink border-ui-border",
  applied: "bg-ui-teal-soft text-ui-teal border-ui-teal/30",
  interviewing: "bg-ui-warning-soft text-ui-warning border-ui-warning/30",
  offer: "bg-ui-success-soft text-ui-success border-ui-success/30",
  rejected: "bg-ui-error-soft text-ui-error border-ui-error/30",
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
        styleClass = "bg-ui-border text-ui-ink border-transparent";
        break;
      case "destructive":
        styleClass = "bg-ui-error text-white border-transparent hover:bg-ui-error/80";
        break;
      case "outline":
        styleClass = "text-ui-ink border border-ui-border";
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
          ? "bg-ui-success-soft text-ui-success border-ui-success/30"
          : tone === "warning"
            ? "bg-ui-warning-soft text-ui-warning border-ui-warning/30"
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
