import { CheckCircle2, Minus, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";

type FitStatus = "established" | "transferable" | "partial" | "gap";

const REQUIREMENTS: {
  req: string;
  status: FitStatus;
  evidence: string;
  detail: string;
}[] = [
  {
    req: "Python — 3+ years",
    status: "established",
    evidence: "Profile · Tekvine Systems internship",
    detail: "3 years confirmed · used in production backend APIs",
  },
  {
    req: "FastAPI",
    status: "established",
    evidence: "Profile · 2 projects listed",
    detail: "Built REST services at Tekvine · side project using FastAPI + SQLAlchemy",
  },
  {
    req: "PostgreSQL / relational databases",
    status: "established",
    evidence: "Profile · confirmed experience",
    detail: "Used PostgreSQL at Tekvine · schema design and query optimisation",
  },
  {
    req: "Microservices / distributed systems",
    status: "transferable",
    evidence: "API architecture work is transferable",
    detail: "Worked on service separation · API contracts · not full microservices at scale",
  },
  {
    req: "Team leadership / mentoring",
    status: "gap",
    evidence: "Not in profile",
    detail: "No leadership experience recorded — address in cover letter strategy",
  },
];

function StatusIcon({ status }: { status: FitStatus }) {
  if (status === "established") {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      </span>
    );
  }
  if (status === "transferable" || status === "partial") {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-50">
        <Minus className="h-3.5 w-3.5 text-amber-500" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lp-bg">
      <Circle className="h-3.5 w-3.5 text-lp-muted/50" />
    </span>
  );
}

function StatusLabel({ status }: { status: FitStatus }) {
  const map: Record<FitStatus, { label: string; cls: string }> = {
    established:  { label: "Established",   cls: "bg-emerald-50 text-emerald-700" },
    transferable: { label: "Transferable",  cls: "bg-amber-50 text-amber-700" },
    partial:      { label: "Partial",       cls: "bg-amber-50 text-amber-700" },
    gap:          { label: "Not in profile", cls: "bg-lp-bg text-lp-muted border border-lp-border" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}

export function LandingFitAnalysis() {
  return (
    <section id="fit-analysis" className="bg-lp-bg py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Header */}
        <div className="mb-14 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lp-accent">
              Evidence-based opportunity assessment
            </p>
            <h2 className="mt-4 font-display text-[40px] leading-[1.06] text-lp-ink sm:text-[54px]">
              Understand your fit before you apply — with evidence.
            </h2>
          </div>
          <p className="font-ui text-[17px] leading-[1.7] text-lp-body">
            ApplyFocus doesn&apos;t give you an unexplained score. It maps every requirement to your actual profile — and tells you exactly why each one is or isn&apos;t covered.
          </p>
        </div>

        {/* Product demo */}
        <div className="overflow-hidden rounded-2xl border border-lp-border bg-lp-surface shadow-[0_8px_48px_rgba(32,33,36,0.08)]">
          {/* Demo header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-lp-border px-6 py-5 sm:px-8">
            <div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-lp-muted">
                Fit Analysis · Asha Rao
              </p>
              <h3 className="mt-1 font-ui text-[18px] font-semibold text-lp-ink">
                Backend Engineer — Northstar Systems
              </h3>
              <p className="font-ui text-[13px] text-lp-muted">Bengaluru · Hybrid · Seniority: Mid-level · 3–5 years experience</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-mono text-[28px] font-bold leading-none text-lp-ink">76%</p>
                <p className="font-ui text-[11px] text-lp-muted">Overall fit</p>
              </div>
              <div className="h-14 w-px bg-lp-border" />
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <p className="font-ui text-[12px] text-lp-body">3 established</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <p className="font-ui text-[12px] text-lp-body">1 transferable</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-lp-border" />
                  <p className="font-ui text-[12px] text-lp-body">1 gap</p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-lp-border bg-lp-bg">
                  <th className="px-6 py-3 text-left font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-lp-muted sm:px-8">
                    Requirement
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-lp-muted">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-lp-muted">
                    Your evidence
                  </th>
                  <th className="px-6 py-3 text-left font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-lp-muted sm:px-8">
                    Detail
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lp-border/60">
                {REQUIREMENTS.map((r) => (
                  <tr key={r.req} className="group transition-colors hover:bg-lp-bg/40">
                    <td className="px-6 py-4 sm:px-8">
                      <div className="flex items-center gap-3">
                        <StatusIcon status={r.status} />
                        <p className={`font-ui text-[13px] font-semibold ${r.status === "gap" ? "text-lp-muted" : "text-lp-ink"}`}>
                          {r.req}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusLabel status={r.status} />
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-ui text-[12px] text-lp-body">{r.evidence}</p>
                    </td>
                    <td className="px-6 py-4 sm:px-8">
                      <p className="font-ui text-[12px] leading-relaxed text-lp-muted max-w-[280px]">{r.detail}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer — strategy prompt */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-lp-border bg-lp-bg px-6 py-5 sm:px-8">
            <div>
              <p className="font-ui text-[14px] font-semibold text-lp-ink">
                Application strategy available
              </p>
              <p className="mt-0.5 font-ui text-[13px] text-lp-muted">
                What to emphasise, how to position your experience, and how to address the team leadership gap.
              </p>
            </div>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-lp-ink px-5 py-2.5 font-ui text-[13px] font-semibold text-white transition-colors hover:bg-lp-ink/80"
            >
              View full strategy
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Bottom callout row */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Evidence-led", desc: "Every match status is backed by your actual profile data — not keyword coincidence." },
            { label: "Transferable skills mapped", desc: "Adjacent skills from your experience are connected to requirements you don't directly meet." },
            { label: "Gaps made actionable", desc: "Missing requirements become preparation tasks, not dead ends." },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-lp-border bg-lp-surface px-5 py-4">
              <p className="font-ui text-[14px] font-semibold text-lp-ink">{item.label}</p>
              <p className="mt-1.5 font-ui text-[13px] leading-relaxed text-lp-body">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
