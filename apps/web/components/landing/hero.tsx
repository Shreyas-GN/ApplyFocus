"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const TAGS = ["Python", "FastAPI", "PostgreSQL"];

const JOBS = [
  {
    role: "Backend Engineer",
    company: "Northstar Systems",
    location: "Bengaluru · Hybrid",
    tags: ["Python", "FastAPI", "PostgreSQL"],
    featured: true,
  },
  {
    role: "API Platform Engineer",
    company: "Cloudstride",
    location: "Remote",
    tags: ["Python", "REST APIs"],
    featured: false,
  },
  {
    role: "Software Engineer II",
    company: "Vaulted Labs",
    location: "Bengaluru",
    tags: ["FastAPI", "Databases"],
    featured: false,
  },
];

const FIT_ITEMS = [
  { text: "Python — matches your 3 yrs experience", matched: true },
  { text: "FastAPI — listed in your profile", matched: true },
  { text: "Relational databases — PostgreSQL confirmed", matched: true },
  { text: "System design — not in profile yet", matched: false },
];

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-lp-lagoon pb-16 pt-28 sm:pt-36">
      <div className="relative mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_480px] lg:gap-16">

          {/* Left — copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-lp-accent" />
              <span className="font-mono text-[11px] tracking-[0.14em] text-white/50">
                YOUR NEXT OPPORTUNITY, WITH A PLAN
              </span>
            </div>

            {/* Headline */}
            <h1 className="mt-7 font-display text-[42px] font-normal leading-[1.05] text-white sm:text-[56px] lg:text-[64px]">
              Find better jobs.<br />
              <span className="text-white/65">Apply smarter.</span>
            </h1>

            {/* Body */}
            <p className="mt-6 max-w-[480px] font-ui text-[17px] leading-[1.65] text-white/55 sm:text-[18px]">
              ApplyPilot brings your job search into one place — helping you understand fit, prepare thoughtful applications and stay on top of every next step.
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lp-accent px-7 font-ui text-[15px] font-semibold text-white transition-all hover:bg-lp-accent-hover"
              >
                Get started — it&apos;s free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/15 px-7 font-ui text-[15px] font-medium text-white/70 transition-all hover:border-white/25 hover:text-white"
              >
                See how it works
              </a>
            </div>

            <p className="mt-5 font-ui text-[12px] text-white/30">
              Free account · No credit card · You stay in control
            </p>
          </motion.div>

          {/* Right — product preview card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-[0_24px_64px_rgba(0,0,0,0.4)]">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-lp-border px-5 py-3.5">
                <div>
                  <p className="font-ui text-[13px] font-semibold text-lp-ink">Opportunities for you</p>
                  <p className="font-ui text-[11px] text-lp-muted">Asha Rao · Backend Software Engineer</p>
                </div>
                <span className="rounded-full border border-lp-border bg-lp-surface px-2.5 py-0.5 font-mono text-[10px] text-lp-muted">
                  Illustrative preview
                </span>
              </div>

              {/* Job rows */}
              <div className="divide-y divide-lp-border">
                {JOBS.map((job) => (
                  <div
                    key={job.role + job.company}
                    className={`px-5 py-3.5 ${job.featured ? "bg-lp-accent/[0.04]" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-ui text-[13px] font-semibold text-lp-ink">
                          {job.featured && <span className="mr-1.5 text-lp-accent">✦</span>}
                          {job.role}
                        </p>
                        <p className="font-ui text-[11px] text-lp-muted">{job.company} · {job.location}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full border border-lp-border bg-white px-2 py-0.5 font-ui text-[11px] text-lp-body"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      {job.featured && (
                        <span className="flex-shrink-0 rounded-full border border-lp-accent/30 bg-lp-accent-soft px-2.5 py-1 font-ui text-[11px] font-medium text-lp-accent">
                          Review fit →
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Fit evidence panel */}
              <div className="border-t border-lp-border bg-lp-surface px-5 py-4">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
                  Why Northstar Systems may fit
                </p>
                <div className="space-y-2">
                  {FIT_ITEMS.map((item) => (
                    <div key={item.text} className="flex items-start gap-2.5">
                      {item.matched ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lp-muted" />
                      )}
                      <p className={`font-ui text-[12px] leading-snug ${item.matched ? "text-lp-body" : "text-lp-muted"}`}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating annotation */}
            <div className="absolute -bottom-3 -right-2 rounded-xl border border-lp-border bg-white px-4 py-2.5 shadow-lg sm:-right-4">
              <p className="font-ui text-[12px] font-semibold text-lp-ink">3 skills matched</p>
              <p className="font-ui text-[11px] text-lp-muted">1 gap to address</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
