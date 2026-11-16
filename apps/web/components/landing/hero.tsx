"use client";

import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

const TRUST_ITEMS = [
  "Free to start",
  "No credit card required",
  "Candidate control guaranteed",
];

const FEATURE_PILLS = [
  { label: "Verified Master Profile", color: "bg-lp-accent-soft text-lp-accent" },
  { label: "AI Match Scoring", color: "bg-lp-copper-soft text-lp-copper" },
  { label: "Adaptive Resume Engine", color: "bg-emerald-50 text-emerald-700" },
  { label: "Application Tracking", color: "bg-slate-100 text-slate-600" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-lp-bg pt-16 pb-24 sm:pt-24 sm:pb-32">
      {/* Gradient blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #c8e8e9 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-16 -right-64 h-[400px] w-[500px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #f0d4c3 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 -left-48 h-[350px] w-[500px] rounded-full opacity-15 blur-3xl"
          style={{ background: "radial-gradient(ellipse, #c8e8e9 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-lp-border bg-white px-4 py-1.5 font-mono text-[11px] font-medium tracking-widest text-lp-muted shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-lp-accent" aria-hidden="true" />
            CAREER INTELLIGENCE PLATFORM
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.07 }}
          className="mx-auto mt-7 max-w-[820px] text-center font-ui text-[44px] font-bold leading-[1.06] tracking-[-0.04em] text-lp-ink sm:text-[60px] lg:text-[72px]"
        >
          Your next opportunity deserves a better approach.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.13 }}
          className="mx-auto mt-6 max-w-[580px] text-center font-ui text-[17px] leading-[1.7] text-lp-body sm:text-[19px]"
        >
          Understand your strengths. Find opportunities that fit. Build an application that
          reflects your best work — from one career workspace.
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.19 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/signup"
            className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-lp-accent px-8 font-ui text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-lp-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent sm:w-auto"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-13 w-full items-center justify-center rounded-xl border border-lp-border bg-white px-7 font-ui text-[15px] font-semibold text-lp-ink shadow-sm transition-colors hover:bg-lp-surface sm:w-auto"
          >
            See how it works
          </a>
        </motion.div>

        {/* Trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5"
        >
          {TRUST_ITEMS.map((item) => (
            <span key={item} className="flex items-center gap-1.5 font-ui text-[13px] text-lp-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-lp-accent" aria-hidden="true" />
              {item}
            </span>
          ))}
        </motion.div>

        {/* Product window mockup */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32 }}
          className="mt-16 overflow-hidden rounded-2xl border border-lp-border bg-white shadow-[0_24px_80px_rgba(21,94,99,0.10),0_4px_16px_rgba(0,0,0,0.04)]"
        >
          {/* Window chrome */}
          <div className="flex items-center justify-between border-b border-lp-border bg-lp-surface px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-lp-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-lp-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-lp-border" />
              </div>
              <span className="font-ui text-[13px] font-medium text-lp-muted">
                ApplyPilot · Career Workspace
              </span>
            </div>
            <span className="rounded border border-lp-border bg-white px-2 py-0.5 font-mono text-[10px] text-lp-muted">
              applypilot.app/dashboard
            </span>
          </div>

          {/* Dashboard preview */}
          <div className="grid gap-px bg-lp-border lg:grid-cols-3">
            {/* Stat cards */}
            <div className="col-span-3 grid grid-cols-2 gap-px bg-lp-border sm:grid-cols-4">
              {[
                { label: "Matched roles", value: "24", sub: "this week" },
                { label: "Active pipeline", value: "7", sub: "applications" },
                { label: "Response rate", value: "32%", sub: "above average" },
                { label: "Interviews", value: "3", sub: "scheduled" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-lp-muted">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-ui text-3xl font-semibold tracking-tight text-lp-ink">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 font-ui text-xs text-lp-muted">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Job cards col */}
            <div className="col-span-2 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-ui text-sm font-semibold text-lp-ink">Top matches</span>
                <span className="rounded-md bg-lp-accent-soft px-2 py-0.5 font-mono text-[10px] text-lp-accent">
                  For you
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { role: "Senior Product Designer", co: "Figma · Remote", score: 91, tag: "Strong match" },
                  { role: "Design Systems Lead", co: "Notion · Hybrid", score: 84, tag: "Good match" },
                  { role: "Head of Product Design", co: "Linear · Remote", score: 77, tag: "Match" },
                ].map((job) => (
                  <div
                    key={job.role}
                    className="flex items-center justify-between rounded-xl border border-lp-border px-4 py-3"
                  >
                    <div>
                      <p className="font-ui text-sm font-medium text-lp-ink">{job.role}</p>
                      <p className="font-ui text-xs text-lp-muted">{job.co}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-lp-accent">
                        {job.score}%
                      </span>
                      <span className="rounded-md bg-lp-accent-soft px-2 py-0.5 font-ui text-[10px] font-medium text-lp-accent">
                        {job.tag}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI insight col */}
            <div className="bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-lp-accent" aria-hidden="true" />
                <span className="font-ui text-sm font-semibold text-lp-ink">Next actions</span>
              </div>
              <div className="space-y-2.5">
                {[
                  "Tailor resume for Figma role",
                  "Follow up on Notion application",
                  "Complete portfolio section",
                ].map((action) => (
                  <div
                    key={action}
                    className="flex items-start gap-2.5 rounded-lg border border-lp-border p-3"
                  >
                    <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-2 border-lp-border" aria-hidden="true" />
                    <p className="font-ui text-xs text-lp-body">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature pills below window */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2.5"
        >
          {FEATURE_PILLS.map((pill) => (
            <span
              key={pill.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-ui text-[12px] font-medium ${pill.color}`}
            >
              {pill.label}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
