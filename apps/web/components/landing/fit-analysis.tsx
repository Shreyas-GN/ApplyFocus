import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";

const REQUIREMENTS = [
  {
    req: "Python — 3+ years",
    evidence: "Confirmed: 3 years at Tekvine Systems. Used in every documented project.",
    state: "strong",
  },
  {
    req: "FastAPI",
    evidence: "Confirmed: listed as primary framework, 2 documented projects.",
    state: "strong",
  },
  {
    req: "PostgreSQL",
    evidence: "Confirmed: relational database work noted across 2 projects.",
    state: "strong",
  },
  {
    req: "Microservices architecture",
    evidence: "Partial: service-oriented work referenced but not detailed in profile.",
    state: "partial",
  },
  {
    req: "Kafka or event-driven systems",
    evidence: "No direct evidence in profile. Transferable from async task queue work.",
    state: "transferable",
  },
  {
    req: "Team leadership",
    evidence: "Not present in current profile. May be worth addressing in cover letter.",
    state: "gap",
  },
];

type State = "strong" | "partial" | "transferable" | "gap";

function stateStyle(state: State) {
  const map: Record<State, string> = {
    strong: "border-emerald-100 bg-emerald-50/50",
    partial: "border-amber-100 bg-amber-50/40",
    transferable: "border-sky-100 bg-sky-50/40",
    gap: "border-lp-border bg-lp-bg",
  };
  return map[state];
}

function StateIcon({ state }: { state: State }) {
  if (state === "strong") return <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />;
  if (state === "partial") return (
    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-amber-500" />
  );
  if (state === "transferable") return (
    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 border-sky-500 bg-sky-100" />
  );
  return <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-muted" />;
}

function stateBadge(state: State) {
  const map: Record<State, { label: string; style: string }> = {
    strong: { label: "Strong match", style: "bg-emerald-50 text-emerald-700" },
    partial: { label: "Partial evidence", style: "bg-amber-50 text-amber-700" },
    transferable: { label: "Transferable", style: "bg-sky-50 text-sky-700" },
    gap: { label: "Gap identified", style: "bg-lp-bg text-lp-muted border border-lp-border" },
  };
  return map[state];
}

function FitMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-lp-border bg-lp-surface shadow-[0_4px_32px_rgba(32,33,36,0.07)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-lp-border px-5 py-4">
        <div>
          <p className="font-ui text-[14px] font-semibold text-lp-ink">Backend Engineer — Northstar Systems</p>
          <p className="font-ui text-[12px] text-lp-muted">Bengaluru · Hybrid · Full-time</p>
        </div>
        <span className="rounded-full border border-lp-border bg-lp-bg px-2.5 py-0.5 font-mono text-[10px] text-lp-muted">
          Illustrative preview
        </span>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 divide-x divide-lp-border border-b border-lp-border">
        {[
          { label: "Strongly met", n: "3", style: "text-emerald-700" },
          { label: "Partial / transferable", n: "2", style: "text-amber-700" },
          { label: "Gaps", n: "1", style: "text-lp-muted" },
        ].map((s) => (
          <div key={s.label} className="p-3 text-center">
            <p className={`font-ui text-xl font-semibold ${s.style}`}>{s.n}</p>
            <p className="mt-0.5 font-ui text-[11px] text-lp-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Requirements list */}
      <div className="p-5">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
          Requirements reviewed
        </p>
        <div className="space-y-2">
          {REQUIREMENTS.map((item) => {
            const badge = stateBadge(item.state as State);
            return (
              <div
                key={item.req}
                className={`flex items-start gap-3 rounded-xl border p-3 ${stateStyle(item.state as State)}`}
              >
                <StateIcon state={item.state as State} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-ui text-[12px] font-semibold text-lp-ink">{item.req}</p>
                    <span className={`rounded-full px-2 py-0.5 font-ui text-[10px] font-medium ${badge.style}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="mt-0.5 font-ui text-[11px] text-lp-muted">{item.evidence}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function LandingFitAnalysis() {
  return (
    <section id="fit-analysis" className="border-t border-lp-border bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Mockup first on desktop */}
          <div className="order-2 lg:order-1">
            <FitMockup />
          </div>

          {/* Copy */}
          <div className="order-1 lg:order-2">
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
              Job fit analysis
            </p>
            <h2 className="mt-3 font-display text-[34px] leading-[1.08] text-lp-ink sm:text-[46px]">
              Evaluate every opportunity with real evidence.
            </h2>
            <p className="mt-5 font-ui text-[16px] leading-[1.7] text-lp-body">
              ApplyPilot reads the job requirements and maps them against your confirmed profile — not with a percentage score, but with specific evidence.
            </p>
            <div className="mt-7 space-y-5">
              {[
                {
                  head: "Strongly supported requirements",
                  body: "Where your profile provides direct evidence. These are your clearest points of relevance.",
                },
                {
                  head: "Transferable and partial matches",
                  body: "Experience that relates but isn't an exact match. Worth acknowledging honestly in your application.",
                },
                {
                  head: "Gaps identified",
                  body: "Requirements with no matching evidence in your profile. ApplyPilot surfaces these so you can decide whether to address them or proceed.",
                },
              ].map((item) => (
                <div key={item.head} className="border-l-2 border-lp-border pl-4">
                  <p className="font-ui text-[14px] font-semibold text-lp-ink">{item.head}</p>
                  <p className="mt-1 font-ui text-[13px] leading-[1.6] text-lp-body">{item.body}</p>
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="group mt-9 inline-flex items-center gap-2 font-ui text-[14px] font-semibold text-lp-accent hover:underline"
            >
              Evaluate a role for free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
