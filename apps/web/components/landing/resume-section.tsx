import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export function LandingResume() {
  return (
    <section id="tailoring" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          {/* Left — copy */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lp-accent">
              Tailoring Studio
            </p>
            <h2 className="mt-4 font-display text-[40px] leading-[1.06] text-lp-ink sm:text-[50px]">
              One profile. A resume tailored for every opportunity.
            </h2>
            <p className="mt-5 font-ui text-[16px] leading-[1.75] text-lp-body">
              Your experience stays the same. How you present it shouldn&apos;t have to.
              ApplyFocus adapts your resume to each role by surfacing the skills,
              projects and experience that matter most — without starting from scratch.
            </p>
            <ul className="mt-7 space-y-3">
              {[
                "Start from your structured career profile",
                "Understand what each role actually requires",
                "Highlight the skills and work that matter most",
                "See original and suggested content side-by-side",
                "Approve every change before it's used",
                "Keep a versioned resume per application",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 font-ui text-[14px] text-lp-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 inline-flex items-center gap-2.5 rounded-xl border border-lp-border bg-lp-bg px-4 py-3">
              <ShieldCheck className="h-4 w-4 flex-shrink-0 text-lp-accent" />
              <p className="font-ui text-[13px] text-lp-body">
                <strong className="font-semibold text-lp-ink">Your experience. Your words. Your approval.</strong>
                {" "}ApplyFocus never fabricates skills or history.
              </p>
            </div>
          </div>

          {/* Right — mockup */}
          <div className="overflow-hidden rounded-2xl border border-lp-border bg-white shadow-[0_4px_40px_rgba(32,33,36,0.07)]">
            <div className="flex items-center justify-between border-b border-lp-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-lp-accent" />
                <span className="font-ui text-[13px] font-semibold text-lp-ink">Resume comparison</span>
                <span className="rounded border border-lp-border bg-lp-bg px-2 py-0.5 font-mono text-[9px] text-lp-muted">diff view</span>
              </div>
              <span className="rounded-full border border-lp-border bg-lp-bg px-2.5 py-0.5 font-mono text-[9px] text-lp-muted">
                Illustrative
              </span>
            </div>

            <div className="grid divide-y divide-lp-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Original */}
              <div className="p-5">
                <p className="font-mono text-[9px] uppercase tracking-wider text-lp-muted">Original</p>
                <div className="mt-3 rounded-xl border border-lp-border bg-lp-bg p-4">
                  <p className="font-ui text-[13px] font-semibold text-lp-ink">Software Intern · Tekvine Systems</p>
                  <p className="mt-0.5 font-ui text-[11px] text-lp-muted">2023 – 2024</p>
                  <p className="mt-3 font-ui text-[13px] leading-relaxed text-lp-body">
                    Built REST APIs using FastAPI and PostgreSQL. Worked on backend services for internal tooling.
                  </p>
                </div>
              </div>

              {/* Suggested */}
              <div className="bg-lp-accent/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-lp-accent">
                    <Sparkles className="h-3 w-3" />
                    Suggested
                  </p>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 font-ui text-[10px] font-medium text-amber-700">
                    Awaiting approval
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-lp-accent/20 bg-white p-4 shadow-sm">
                  <p className="font-ui text-[13px] font-semibold text-lp-ink">Software Intern · Tekvine Systems</p>
                  <p className="mt-0.5 font-ui text-[11px] text-lp-muted">2023 – 2024</p>
                  <p className="mt-3 font-ui text-[13px] leading-relaxed text-lp-ink">
                    Developed and maintained REST APIs using FastAPI and PostgreSQL,{" "}
                    <span className="rounded bg-lp-accent-soft px-0.5">directly relevant to the backend platform requirements of this role.</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex h-8 w-full items-center justify-center rounded-lg bg-lp-accent px-4 font-ui text-[12px] font-semibold text-white"
                >
                  Approve change
                </button>
              </div>
            </div>

            <div className="border-t border-lp-border px-5 py-3.5 font-ui text-[12px] text-lp-muted">
              <strong className="font-medium text-lp-ink">Evidence-backed: </strong>
              Reframed scope to match role requirements. No new claims added.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
