import type { ReactNode } from "react";

const TONE_CLASSES: Record<string, string> = {
  error: "bg-ui-error-soft text-ui-error border-ui-error/30",
  success: "bg-ui-success-soft text-ui-success border-ui-success/30",
  info: "bg-ui-teal-soft text-ui-ink border-ui-teal-soft",
  warning: "bg-ui-warning-soft text-ui-warning border-ui-warning/30",
};

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${TONE_CLASSES[tone]}`}
    >
      {children}
    </div>
  );
}
