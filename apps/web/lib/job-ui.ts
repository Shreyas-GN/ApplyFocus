export function scoreTone(score: number): string {
  if (score >= 75) return "bg-ui-teal-soft text-ui-teal";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-ui-linen text-ui-muted";
}

export function barTone(score: number): string {
  if (score >= 75) return "bg-ui-teal";
  if (score >= 50) return "bg-amber-500";
  return "bg-ui-muted";
}

export function getApplyRecommendation(score: number): {
  verdict: string;
  detail: string;
  classes: string;
} {
  if (score >= 75) {
    return {
      verdict: "Strong fit — go ahead and apply",
      detail: "Your background aligns well with this role.",
      classes: "bg-emerald-50 border-emerald-200 text-emerald-800",
    };
  }
  if (score >= 55) {
    return {
      verdict: "Decent fit — worth applying",
      detail: "You meet most requirements. Use your cover letter to address any gaps.",
      classes: "bg-amber-50 border-amber-200 text-amber-800",
    };
  }
  return {
    verdict: "Partial fit — apply selectively",
    detail: "There are significant gaps. Apply only if this role interests you strongly.",
    classes: "bg-slate-50 border-slate-200 text-slate-700",
  };
}

export function formatFreshness(
  postedAt: string | null,
  createdAt: string
): string {
  const iso = postedAt ?? createdAt;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return "Recently synced";
  const diffDays = Math.max(0, Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24)));
  if (diffDays === 0) return "Posted today";
  if (diffDays === 1) return "Posted 1d ago";
  if (diffDays < 30) return `Posted ${diffDays}d ago`;
  const months = Math.floor(diffDays / 30);
  return months === 1 ? "Posted 1mo ago" : `Posted ${months}mo ago`;
}

