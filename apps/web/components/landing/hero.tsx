"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const HERO_JOBS = [
  {
    role: "Backend Engineer",
    company: "Northstar Systems",
    location: "Bengaluru · Hybrid",
    fit: "Strong",
    fitStyle: "bg-emerald-50 text-emerald-700",
    active: true,
  },
  {
    role: "API Platform Engineer",
    company: "Cloudstride",
    location: "Remote",
    fit: "Partial",
    fitStyle: "bg-amber-50 text-amber-700",
    active: false,
  },
  {
    role: "Software Engineer II",
    company: "Vaulted Labs",
    location: "Bengaluru",
    fit: "Explore",
    fitStyle: "bg-lp-surface text-lp-muted border border-lp-border",
    active: false,
  },
];

const FIT_EVIDENCE = [
  { label: "Python", note: "3 years — Tekvine Systems & personal projects", state: "strong" },
  { label: "FastAPI", note: "Primary framework, confirmed in profile", state: "strong" },
  { label: "PostgreSQL", note: "Used in 2 documented projects", state: "strong" },
  { label: "System design", note: "Mentioned in experience, not detailed", state: "partial" },
  { label: "Kafka / event streaming", note: "No evidence in profile", state: "gap" },
];

function FitIcon({ state }: { state: string }) {
  if (state === "strong")
    return <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />;
  if (state === "partial")
    return (
      <span className="mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full border-2 border-amber-500" />
    );
  return <Circle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lp-muted" />;
}

function fitRowStyle(state: string) {
  if (state === "strong") return "border-emerald-100 bg-emerald-50/50";
  if (state === "partial") return "border-amber-100 bg-amber-50/40";
  return "border-lp-border bg-lp-surface";
}

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-lp-bg pt-28 sm:pt-36">
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Centred copy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-[700px] text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-lp-border bg-lp-surface px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lp-accent" />
            <span className="font-mono text-[11px] tracking-[0.14em] text-lp-muted">
              CANDIDATE-FIRST CAREER INTELLIGENCE
            </span>
          </div>

          <h1 className="mt-7 font-display text-[46px] font-normal leading-[1.05] text-lp-ink sm:text-[62px] lg:text-[74px]">
            Know your value.<br />
            <span className="text-lp-accent">Apply with confidence.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-[520px] font-ui text-[17px] leading-[1.65] text-lp-body sm:text-[18px]">
            ApplyPilot connects your professional profile to real job requirements — so you understand exactly where you stand before you apply.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lp-accent px-7 font-ui text-[15px] font-semibold text-white transition-all hover:bg-lp-accent-hover"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-full border border-lp-border bg-lp-surface px-7 font-ui text-[15px] font-medium text-lp-body transition-all hover:border-lp-ink/20 hover:text-lp-ink"
            >
              See how it works
            </a>
          </div>

          <p className="mt-5 font-ui text-[12px] text-lp-muted">
            Free account · No credit card · Candidate control guaranteed
          </p>
        </motion.div>

        {/* Wide product preview */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-14 sm:mt-16"
        >
          <div className="overflow-hidden rounded-2xl border border-lp-border bg-lp-surface shadow-[0_8px_48px_rgba(32,33,36,0.10),0_2px_8px_rgba(32,33,36,0.06)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-3 border-b border-lp-border bg-lp-bg px-4 py-3">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
              </div>
              <div className="flex-1 rounded-md border border-lp-border bg-lp-surface px-3 py-1 font-mono text-[11px] text-lp-muted">
                applypilot.app/discover
              </div>
              <span className="hidden rounded-full border border-lp-border bg-lp-surface px-2.5 py-0.5 font-mono text-[10px] text-lp-muted sm:block">
                Illustrative preview
              </span>
            </div>

            {/* App nav bar */}
            <div className="flex items-center justify-between border-b border-lp-border px-5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-lp-ink font-ui text-[9px] font-bold text-white">
                  AP
                </span>
                <span className="font-ui text-[13px] font-semibold text-lp-ink">ApplyPilot</span>
              </div>
              <div className="hidden items-center gap-5 sm:flex">
                {["Discover", "Profile", "Applications", "Studio"].map((item, i) => (
                  <button
                    key={item}
                    type="button"
                    className={`font-ui text-[12px] transition-colors ${i === 0 ? "font-semibold text-lp-accent" : "text-lp-muted hover:text-lp-ink"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-lp-bg font-ui text-[11px] font-medium text-lp-ink">
                AR
              </div>
            </div>

            {/* Two-pane content */}
            <div className="grid lg:grid-cols-[300px_1fr]">
              {/* Left: job list */}
              <div className="border-b border-lp-border lg:border-b-0 lg:border-r">
                <div className="flex items-center justify-between border-b border-lp-border px-4 py-3">
                  <p className="font-ui text-[12px] font-semibold text-lp-ink">Matched roles</p>
                  <span className="rounded-full bg-lp-bg px-2 py-0.5 font-mono text-[10px] text-lp-muted">
                    3 for you
                  </span>
                </div>
                <div className="divide-y divide-lp-border">
                  {HERO_JOBS.map((job) => (
                    <div
                      key={job.role}
                      className={`cursor-pointer px-4 py-3.5 transition-colors ${
                        job.active
                          ? "border-l-2 border-lp-accent bg-lp-accent/[0.04]"
                          : "hover:bg-lp-bg"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className={`font-ui text-[13px] font-semibold ${job.active ? "text-lp-ink" : "text-lp-body"}`}>
                            {job.role}
                          </p>
                          <p className="font-ui text-[11px] text-lp-muted">{job.company}</p>
                          <div className="mt-1 flex items-center gap-1 font-ui text-[11px] text-lp-muted">
                            <MapPin className="h-3 w-3" />
                            {job.location}
                          </div>
                        </div>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-ui text-[10px] font-medium ${job.fitStyle}`}>
                          {job.fit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: fit analysis */}
              <div className="p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-ui text-[15px] font-semibold text-lp-ink">Backend Engineer</h3>
                    <p className="font-ui text-[12px] text-lp-muted">
                      Northstar Systems · Bengaluru, Hybrid · Full-time
                    </p>
                  </div>
                  <span className="inline-flex flex-shrink-0 items-center rounded-full bg-emerald-50 px-3 py-1 font-ui text-[12px] font-medium text-emerald-700">
                    Strong alignment
                  </span>
                </div>

                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
                  Fit analysis — 5 requirements reviewed
                </p>

                <div className="space-y-2">
                  {FIT_EVIDENCE.map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-start gap-3 rounded-xl border p-3 ${fitRowStyle(item.state)}`}
                    >
                      <FitIcon state={item.state} />
                      <div>
                        <p className="font-ui text-[12px] font-semibold text-lp-ink">{item.label}</p>
                        <p className="font-ui text-[11px] text-lp-muted">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-lp-accent px-4 py-2.5 font-ui text-[13px] font-semibold text-white transition-colors hover:bg-lp-accent-hover sm:w-auto sm:px-6"
                  >
                    Build application strategy →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
