import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

function StrategyMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-lp-border bg-lp-surface shadow-[0_4px_32px_rgba(32,33,36,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-4">
        <div>
          <p className="font-ui text-[13px] font-semibold text-lp-ink">Application strategy</p>
          <p className="font-ui text-[11px] text-lp-muted">Backend Engineer · Northstar Systems</p>
        </div>
        <span className="rounded-full border border-lp-border bg-lp-bg px-2.5 py-0.5 font-mono text-[10px] text-lp-muted">
          Illustrative preview
        </span>
      </div>

      {/* Emphasise */}
      <div className="border-b border-lp-border px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
          Lead with these strengths
        </p>
        <div className="space-y-2">
          {[
            "FastAPI expertise — matches the core technical requirement exactly",
            "PostgreSQL work — directly relevant to their backend platform",
            "Open-source contribution — demonstrates independent initiative",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
              <p className="font-ui text-[12px] leading-snug text-lp-body">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Position */}
      <div className="border-b border-lp-border px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
          How to position your experience
        </p>
        <div className="rounded-xl border border-lp-border bg-lp-bg px-4 py-3">
          <p className="font-ui text-[12px] leading-relaxed text-lp-body">
            Your internship at Tekvine is recent and directly relevant. Lead with specific outcomes — API response time reduction and service reliability — rather than broad responsibilities. Frame your open-source work as demonstrated backend depth.
          </p>
        </div>
      </div>

      {/* Gaps to address */}
      <div className="border-b border-lp-border px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
          Gaps to acknowledge or prepare
        </p>
        <div className="space-y-2">
          {[
            { item: "Kafka / event streaming", action: "Brief mention of async task queue work may suffice" },
            { item: "Team leadership", action: "Consider omitting unless you can support it" },
          ].map((g) => (
            <div key={g.item} className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2.5">
              <p className="font-ui text-[12px] font-semibold text-lp-ink">{g.item}</p>
              <p className="mt-0.5 font-ui text-[11px] text-lp-muted">{g.action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Prep */}
      <div className="px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
          Prepare before applying
        </p>
        <div className="space-y-2">
          {[
            "Review Northstar Systems' engineering blog and product context",
            "Prepare a concrete system design example using your FastAPI experience",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lp-accent" />
              <p className="font-ui text-[12px] leading-snug text-lp-body">{item}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-lp-accent px-4 py-1.5 font-ui text-[12px] font-semibold text-white transition-colors hover:bg-lp-accent-hover"
        >
          Tailor my resume for this role →
        </button>
      </div>
    </div>
  );
}

export function LandingStrategy() {
  return (
    <section id="strategy" className="border-t border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
              Application strategy
            </p>
            <h2 className="mt-3 font-display text-[34px] leading-[1.08] text-lp-ink sm:text-[46px]">
              Know exactly how to position yourself.
            </h2>
            <p className="mt-5 font-ui text-[16px] leading-[1.7] text-lp-body">
              After analysing your fit, ApplyFocus builds a clear strategy for your application — what to lead with, how to frame your experience, where gaps exist, and what you should prepare.
            </p>
            <div className="mt-7 space-y-5">
              {[
                {
                  head: "Lead with what matters most",
                  body: "ApplyFocus identifies which of your strengths are most relevant to this specific role — not a generic best-of summary.",
                },
                {
                  head: "Understand your positioning",
                  body: "Get a plain-language explanation of how to frame your experience for this role, based on what the hiring context actually requires.",
                },
                {
                  head: "Face gaps honestly",
                  body: "ApplyFocus surfaces requirements you can't support. You decide whether to address them, acknowledge them or move on to a better-matched opportunity.",
                },
                {
                  head: "Prepare with intention",
                  body: "Specific preparation suggestions — research, examples, questions — grounded in the role and your own background.",
                },
              ].map((item) => (
                <div key={item.head} className="flex gap-4">
                  <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-lp-accent" />
                  <div>
                    <p className="font-ui text-[14px] font-semibold text-lp-ink">{item.head}</p>
                    <p className="mt-1 font-ui text-[13px] leading-[1.6] text-lp-body">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/signup"
              className="group mt-9 inline-flex items-center gap-2 font-ui text-[14px] font-semibold text-lp-accent hover:underline"
            >
              Build your strategy
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mockup */}
          <StrategyMockup />
        </div>
      </div>
    </section>
  );
}
