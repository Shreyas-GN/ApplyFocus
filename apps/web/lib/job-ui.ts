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

export function formatSalary(
  min?: number | null,
  max?: number | null,
  currency?: string | null
): string | null {
  if (!min && !max) return null;
  const curr = currency === "INR" ? "₹" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : "$";
  const formatNum = (num: number) => {
    if (curr === "₹") {
      if (num >= 100000) return `${(num / 100000).toFixed(0)}L`;
      return `${(num / 1000).toFixed(0)}k`;
    }
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toLocaleString();
  };
  if (min && max) return `${curr}${formatNum(min)} - ${curr}${formatNum(max)}`;
  if (min) return `From ${curr}${formatNum(min)}`;
  if (max) return `Up to ${curr}${formatNum(max)}`;
  return null;
}

export function getPlatformBadgeConfig(platform?: string | null): {
  label: string;
  badgeClass: string;
  isExternalBoard: boolean;
} {
  const p = (platform || "").toLowerCase();
  if (p.includes("naukri")) {
    return {
      label: "Naukri.com",
      badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
      isExternalBoard: true,
    };
  }
  if (p.includes("indeed")) {
    return {
      label: "Indeed",
      badgeClass: "bg-indigo-50 text-indigo-800 border-indigo-200",
      isExternalBoard: true,
    };
  }
  if (p.includes("linkedin")) {
    return {
      label: "LinkedIn",
      badgeClass: "bg-blue-50 text-blue-800 border-blue-200",
      isExternalBoard: true,
    };
  }
  if (p.includes("glassdoor")) {
    return {
      label: "Glassdoor",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      isExternalBoard: true,
    };
  }
  if (p.includes("ashby")) {
    return {
      label: "Ashby ATS",
      badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
      isExternalBoard: false,
    };
  }
  if (p.includes("greenhouse")) {
    return {
      label: "Greenhouse ATS",
      badgeClass: "bg-emerald-50 text-emerald-800 border-emerald-200",
      isExternalBoard: false,
    };
  }
  if (p.includes("lever")) {
    return {
      label: "Lever ATS",
      badgeClass: "bg-teal-50 text-teal-800 border-teal-200",
      isExternalBoard: false,
    };
  }
  if (platform && platform.trim()) {
    return {
      label: platform,
      badgeClass: "bg-stone-50 text-stone-800 border-stone-200",
      isExternalBoard: true,
    };
  }
  return {
    label: "Direct Career Portal",
    badgeClass: "bg-ui-teal-soft text-ui-teal border-ui-teal/20",
    isExternalBoard: false,
  };
}
