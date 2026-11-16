import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export function LandingResume() {
  return (
    <section id="resume" className="border-t border-lp-border bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — copy */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
              Adaptive Resume Engine
            </p>
            <h2 className="mt-3 font-ui text-[36px] font-bold leading-[1.08] tracking-[-0.03em] text-lp-ink sm:text-[46px]">
              One profile. A resume tailored to every opportunity.
            </h2>
            <p className="mt-5 font-ui text-[16px] leading-[1.7] text-lp-body">
              Your experience stays the same. How you present it shouldn&apos;t have to.
              ApplyPilot adapts your resume to each job description by surfacing relevant
              skills, projects, and experience — without starting from scratch every time.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "Start with your master career profile",
                "Understand the requirements of each job",
                "Highlight relevant skills and projects",
                "Compare original and suggested content side-by-side",
                "Review every change before accepting it",
                "Keep a separate resume version for each application",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 font-ui text-[14px] text-lp-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-lp-border bg-white px-4 py-3">
              <ShieldCheck className="h-4 w-4 text-lp-accent" />
              <p className="font-ui text-[13px] text-lp-body">
                <strong className="font-semibold text-lp-ink">Your experience. Your words. Your approval.</strong>
                {" "}Never fabricates skills or history.
              </p>
            </div>
          </div>

          {/* Right — mockup */}
          <div className="overflow-hidden rounded-2xl border border-lp-border bg-white shadow-[0_4px_32px_rgba(21,94,99,0.08)]">
            {/* toolbar */}
            <div className="flex items-center justify-between border-b border-lp-border px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-lp-accent" />
                <span className="font-ui text-[13px] font-semibold text-lp-ink">Resume comparison</span>
                <span className="rounded border border-lp-border bg-lp-surface px-2 py-0.5 font-mono text-[10px] text-lp-muted">diff view</span>
              </div>
            </div>

            <div className="grid divide-y divide-lp-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              {/* Original */}
              <div className="p-5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-lp-muted">Original</p>
                <div className="mt-3 rounded-xl border border-lp-border bg-lp-surface p-4">
                  <p className="font-ui text-[13px] font-semibold text-lp-ink">Senior Engineer, Kaveri Cloud</p>
                  <p className="mt-0.5 font-ui text-[11px] text-lp-muted">2022 – Present</p>
                  <p className="mt-3 font-ui text-[13px] leading-relaxed text-lp-body">
                    Led backend infrastructure projects. Built microservices using Node.js and PostgreSQL.
                    Collaborated with cross-functional teams on product delivery.
                  </p>
                </div>
              </div>

              {/* Tailored */}
              <div className="bg-lp-accent-soft/30 p-5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-lp-accent">
                    <Sparkles className="h-3 w-3" />
                    Tailored
                  </p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-ui text-[10px] font-medium text-amber-800">
                    Awaiting approval
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-lp-accent/20 bg-white p-4 shadow-sm">
                  <p className="font-ui text-[13px] font-semibold text-lp-ink">Senior Engineer, Kaveri Cloud</p>
                  <p className="mt-0.5 font-ui text-[11px] text-lp-muted">2022 – Present</p>
                  <p className="mt-3 font-ui text-[13px] leading-relaxed text-lp-ink">
                    <span className="rounded bg-lp-accent-soft px-0.5">Architected and scaled distributed microservices</span> handling 2M+ daily requests using Node.js, PostgreSQL, and Kubernetes — directly relevant to the platform engineering scope of this role.
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
              Reframed scope to match distributed systems requirement. No new claims added.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
