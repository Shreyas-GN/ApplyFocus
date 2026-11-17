"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Minus, Circle } from "lucide-react";
import { motion } from "framer-motion";

type FitStatus = "established" | "transferable" | "gap";

const FIT_REQUIREMENTS: { req: string; status: FitStatus; evidence: string }[] = [
  { req: "Python — 3+ years",    status: "established",  evidence: "Tekvine Systems · 3 yrs confirmed" },
  { req: "FastAPI",              status: "established",  evidence: "2 projects · listed in profile" },
  { req: "PostgreSQL / SQL",     status: "established",  evidence: "Confirmed · used at Tekvine" },
  { req: "System design",        status: "transferable", evidence: "API architecture · transferable" },
  { req: "Team leadership",      status: "gap",          evidence: "Not in profile" },
];

function StatusIcon({ status }: { status: FitStatus }) {
  if (status === "established") {
    return <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />;
  }
  if (status === "transferable") {
    return (
      <span className="mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
        <Minus className="h-2.5 w-2.5 text-amber-600" />
      </span>
    );
  }
  return <Circle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lp-muted/50" />;
}

function StatusPill({ status }: { status: FitStatus }) {
  if (status === "established") {
    return (
      <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
        Established
      </span>
    );
  }
  if (status === "transferable") {
    return (
      <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-700">
        Transferable
      </span>
    );
  }
  return (
    <span className="flex-shrink-0 rounded-full bg-lp-border/60 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-lp-muted">
      Not in profile
    </span>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-lp-lagoon pb-20 pt-32 sm:pb-24 sm:pt-40">
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[1fr_500px] lg:gap-20">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lp-accent" />
              <span className="font-mono text-[10px] font-medium tracking-[0.18em] text-white/45 uppercase">
                Career Intelligence Workspace
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-7 font-display text-[52px] font-normal leading-[1.02] tracking-[-0.01em] text-white sm:text-[68px] lg:text-[76px]">
              Know your value.
              <br />
              <span className="text-white/55">Apply with confidence.</span>
            </h1>

            {/* Body */}
            <p className="mt-7 max-w-[500px] font-ui text-[17px] leading-[1.7] text-white/50 sm:text-[18px]">
              ApplyFocus is a candidate-first workspace that maps your skills to real opportunities — with evidence, not guesswork — so every application you send is grounded in your actual strengths.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-lp-accent px-8 font-ui text-[15px] font-semibold text-white transition-all hover:bg-lp-accent-hover"
                style={{ height: "52px" }}
              >
                Get started — it&apos;s free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-white/15 px-8 font-ui text-[15px] font-medium text-white/60 transition-all hover:border-white/25 hover:text-white/90"
                style={{ height: "52px" }}
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 font-ui text-[12px] text-white/25">
              Free account · No credit card · You decide what to submit
            </p>
          </motion.div>

          {/* Right — Fit Analysis product preview */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
              {/* Card header */}
              <div className="border-b border-lp-border bg-lp-bg px-5 py-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-ui text-[13px] font-semibold text-lp-ink">Backend Engineer — Northstar Systems</p>
                    <p className="font-ui text-[11px] text-lp-muted">Bengaluru · Hybrid · Posted 2 days ago</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-ui text-[11px] font-semibold text-emerald-700">
                    76% fit
                  </span>
                </div>
              </div>

              {/* Fit analysis header */}
              <div className="border-b border-lp-border px-5 py-3">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-lp-muted">
                  Fit analysis · Asha Rao
                </p>
              </div>

              {/* Requirements */}
              <div className="divide-y divide-lp-border/60">
                {FIT_REQUIREMENTS.map((item) => (
                  <div key={item.req} className="flex items-start gap-3 px-5 py-3">
                    <StatusIcon status={item.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className={`font-ui text-[12px] font-medium ${item.status === "gap" ? "text-lp-muted" : "text-lp-ink"}`}>
                          {item.req}
                        </p>
                        <StatusPill status={item.status} />
                      </div>
                      <p className="mt-0.5 font-ui text-[11px] leading-snug text-lp-muted">
                        {item.evidence}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary footer */}
              <div className="border-t border-lp-border bg-lp-bg px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-ui text-[12px] font-semibold text-lp-ink">Strong fit · 3 of 5 established</p>
                    <p className="font-ui text-[11px] text-lp-muted">1 transferable · 1 gap to address in strategy</p>
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 rounded-lg bg-lp-accent px-3 py-1.5 font-ui text-[12px] font-semibold text-white"
                  >
                    View strategy →
                  </button>
                </div>
              </div>
            </div>

            {/* Floating annotation — profile badge */}
            <div className="absolute -bottom-4 -left-3 rounded-xl border border-lp-border bg-white px-4 py-2.5 shadow-lg sm:-left-6">
              <p className="font-ui text-[12px] font-semibold text-lp-ink">Asha Rao · Backend Engineer</p>
              <p className="font-ui text-[11px] text-lp-muted">Profile 100% complete</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
