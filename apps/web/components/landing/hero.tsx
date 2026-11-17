"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Minus, Circle } from "lucide-react";
import { motion } from "framer-motion";

type FitStatus = "established" | "transferable" | "gap";

const FIT_REQUIREMENTS: { req: string; status: FitStatus; evidence: string }[] = [
  { req: "Python — 3+ years",    status: "established",  evidence: "Tekvine Systems · 3 yrs confirmed" },
  { req: "FastAPI",              status: "established",  evidence: "2 projects · listed in profile" },
  { req: "PostgreSQL / SQL",     status: "established",  evidence: "Confirmed · used at Tekvine" },
  { req: "System design",        status: "transferable", evidence: "API architecture — transferable skill" },
  { req: "Team leadership",      status: "gap",          evidence: "Not in profile · address in strategy" },
];

function StatusIcon({ status }: { status: FitStatus }) {
  if (status === "established") {
    return <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />;
  }
  if (status === "transferable") {
    return (
      <span className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
        <Minus className="h-2.5 w-2.5 text-amber-600" />
      </span>
    );
  }
  return <Circle className="h-3.5 w-3.5 flex-shrink-0 text-lp-muted/40" />;
}

function StatusPill({ status }: { status: FitStatus }) {
  if (status === "established") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-emerald-700">
        Established
      </span>
    );
  }
  if (status === "transferable") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-amber-700">
        Transferable
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-lp-border/70 px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wide text-lp-muted">
      Not in profile
    </span>
  );
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-lp-lagoon pb-0 pt-28 sm:pt-36">
      {/* Subtle grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top radial glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[900px] -translate-x-1/2 opacity-20"
        style={{ background: "radial-gradient(ellipse at 50% 0%, #C6533B, transparent 65%)" }}
      />

      {/* ── CENTER COPY ── */}
      <div className="relative mx-auto max-w-[760px] px-5 text-center sm:px-8">

        {/* Announcement pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lp-accent" />
          <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
            Early access — free to get started
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="font-display text-[58px] font-normal leading-[1.0] tracking-[-0.02em] text-white sm:text-[76px] lg:text-[88px]"
        >
          Know your value.
          <br />
          <span className="text-white/40">Apply with confidence.</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18 }}
          className="mx-auto mt-6 max-w-[500px] font-ui text-[17px] leading-[1.75] text-white/50 sm:text-[18px]"
        >
          A candidate-first workspace that maps your skills to real opportunities — with evidence, not guesswork.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/signup"
            className="group inline-flex h-[52px] items-center gap-2 rounded-full bg-lp-accent px-9 font-ui text-[15px] font-semibold text-white shadow-[0_4px_28px_rgba(198,83,59,0.35)] transition-all hover:bg-lp-accent-hover hover:shadow-[0_4px_36px_rgba(198,83,59,0.5)]"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-[52px] items-center rounded-full border border-white/15 px-9 font-ui text-[15px] font-medium text-white/55 transition-all hover:border-white/25 hover:text-white/85"
          >
            See how it works
          </a>
        </motion.div>

        {/* Micro trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-5 font-ui text-[12px] text-white/22"
        >
          Free account · No credit card · You decide what to submit
        </motion.p>
      </div>

      {/* ── PRODUCT SCREENSHOT — full-width browser frame ── */}
      <motion.div
        initial={{ opacity: 0, y: 56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, delay: 0.38 }}
        className="relative mx-auto mt-16 max-w-[1240px] px-5 sm:px-8"
      >
        {/* Glow behind screenshot */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-[120px] opacity-30"
          style={{ background: "radial-gradient(ellipse at 50% 0%, #C6533B, transparent 70%)" }}
        />

        {/* Browser / app window */}
        <div className="relative overflow-hidden rounded-t-2xl border border-white/[0.12] shadow-[0_-4px_60px_rgba(0,0,0,0.5),0_32px_80px_rgba(0,0,0,0.4)]">

          {/* Window chrome bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] bg-[#1a1c1f] px-4 py-2.5 sm:px-5 sm:py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <div className="mx-auto max-w-[200px] flex-1 rounded-md bg-white/[0.06] px-4 py-1 text-center font-mono text-[10px] text-white/25 sm:max-w-[280px] sm:text-[11px]">
              app.applyfocus.com
            </div>
            <div className="w-12 sm:w-16" />
          </div>

          {/* App sidebar + main content */}
          <div className="flex min-h-[360px] bg-lp-bg sm:min-h-[440px]">

            {/* Sidebar — hidden on mobile */}
            <div className="hidden w-[180px] flex-shrink-0 border-r border-lp-border bg-lp-surface lg:flex lg:flex-col">
              <div className="border-b border-lp-border px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-lp-accent font-ui text-[10px] font-bold text-white">AF</span>
                  <span className="font-ui text-[12px] font-bold text-lp-ink">ApplyFocus</span>
                </div>
              </div>
              <nav className="flex-1 p-2">
                {[
                  { label: "My profile", active: false },
                  { label: "Discover roles", active: false },
                  { label: "Fit analysis", active: true },
                  { label: "Applications", active: false },
                  { label: "Resume drafts", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`mb-0.5 rounded-md px-3 py-2 font-ui text-[11px] ${
                      item.active ? "bg-lp-accent/10 font-semibold text-lp-accent" : "text-lp-muted"
                    }`}
                  >
                    {item.label}
                  </div>
                ))}
              </nav>
              <div className="border-t border-lp-border p-3">
                <p className="font-ui text-[11px] font-semibold text-lp-ink">Asha Rao</p>
                <p className="font-ui text-[10px] text-lp-muted">Backend Engineer</p>
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">

              {/* Page header */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-lp-accent sm:text-[10px]">
                    Fit Analysis
                  </p>
                  <h2 className="mt-1 font-display text-[16px] leading-tight text-lp-ink sm:text-[20px] lg:text-[24px]">
                    Backend Engineer — Northstar Systems
                  </h2>
                  <p className="mt-0.5 font-ui text-[11px] text-lp-muted sm:text-[12px]">Bengaluru · Hybrid · 2 days ago</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-display text-[36px] leading-none text-lp-ink sm:text-[48px]">
                    76<span className="text-[20px] text-lp-muted/60 sm:text-[28px]">%</span>
                  </div>
                  <p className="font-ui text-[10px] text-lp-muted">Fit score</p>
                  <div className="mt-1.5 hidden items-center justify-end gap-1 sm:flex">
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-emerald-700">3 est.</span>
                    <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-amber-700">1 trans.</span>
                    <span className="rounded-full bg-lp-border/70 px-1.5 py-0.5 font-mono text-[8px] font-semibold text-lp-muted">1 gap</span>
                  </div>
                </div>
              </div>

              {/* Requirements table — horizontally scrollable on mobile */}
              <div className="mt-4 overflow-hidden rounded-xl border border-lp-border bg-lp-surface">
                <div className="hidden grid-cols-[1fr_120px_1fr] border-b border-lp-border bg-lp-bg sm:grid">
                  {["Requirement", "Status", "Your evidence"].map((h) => (
                    <div key={h} className="px-4 py-2 font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-lp-muted">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-lp-border/60">
                  {FIT_REQUIREMENTS.map((item) => (
                    <div key={item.req} className="flex items-center gap-3 px-4 py-2.5 sm:grid sm:grid-cols-[1fr_120px_1fr]">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <StatusIcon status={item.status} />
                        <span className={`truncate font-ui text-[11px] font-medium sm:text-[12px] ${item.status === "gap" ? "text-lp-muted" : "text-lp-ink"}`}>
                          {item.req}
                        </span>
                      </div>
                      <div className="flex-shrink-0">
                        <StatusPill status={item.status} />
                      </div>
                      <span className="hidden font-ui text-[11px] text-lp-muted sm:block">{item.evidence}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy strip */}
              <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-lp-border bg-lp-surface px-4 py-3">
                <p className="font-ui text-[11px] font-semibold text-lp-ink sm:text-[12px]">Application strategy ready</p>
                <button type="button" className="flex-shrink-0 rounded-md bg-lp-ink px-3 py-1.5 font-ui text-[11px] font-semibold text-white">
                  View →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating profile badge — top left of screenshot */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
          className="absolute left-2 top-16 hidden rounded-xl border border-lp-border bg-lp-surface px-4 py-3 shadow-lg sm:left-4 md:block"
        >
          <p className="font-ui text-[12px] font-semibold text-lp-ink">Asha Rao</p>
          <p className="font-ui text-[11px] text-lp-muted">Backend Engineer · Bengaluru</p>
          <p className="mt-1 font-mono text-[10px] font-medium text-emerald-600">Profile 100% complete</p>
        </motion.div>

        {/* Floating score badge — top right */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.85 }}
          className="absolute right-2 top-16 hidden rounded-xl border border-lp-border bg-lp-surface px-4 py-3 shadow-lg sm:right-4 md:block"
        >
          <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-lp-muted">Fit score</p>
          <p className="mt-0.5 font-display text-[32px] leading-none text-lp-ink">76<span className="text-[18px] text-lp-muted/60">%</span></p>
          <p className="mt-1 font-ui text-[11px] text-emerald-600">Strong match</p>
        </motion.div>
      </motion.div>
    </section>
  );
}
