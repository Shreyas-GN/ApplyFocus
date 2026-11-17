"use client";

import { CheckCircle2, Minus, Circle } from "lucide-react";
import { motion } from "framer-motion";

function PreviewBadge() {
  return (
    <span className="rounded-full border border-lp-border bg-lp-bg px-2.5 py-0.5 font-mono text-[9px] text-lp-muted">
      Illustrative
    </span>
  );
}

function ProfileMockup() {
  const skills = ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Git"];
  return (
    <div className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-3.5">
        <div>
          <p className="font-ui text-[13px] font-semibold text-lp-ink">Asha Rao</p>
          <p className="font-ui text-[11px] text-lp-muted">Backend Software Engineer · Bengaluru / Remote</p>
        </div>
        <PreviewBadge />
      </div>
      <div className="p-5">
        <p className="mb-2.5 font-mono text-[9px] font-medium uppercase tracking-wider text-lp-muted">
          Confirmed skills
        </p>
        <div className="flex flex-wrap gap-1.5 mb-5">
          {skills.map((s) => (
            <span key={s} className="flex items-center gap-1 rounded-full border border-lp-border bg-lp-bg px-2.5 py-1 font-ui text-[12px] text-lp-body">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              {s}
            </span>
          ))}
        </div>
        <p className="mb-2.5 font-mono text-[9px] font-medium uppercase tracking-wider text-lp-muted">
          Experience
        </p>
        <div className="rounded-lg border border-lp-border bg-lp-bg px-4 py-3">
          <p className="font-ui text-[12px] font-semibold text-lp-ink">Software Intern · Tekvine Systems</p>
          <p className="font-ui text-[11px] text-lp-muted mt-0.5">Jun 2023 – May 2024 · Bengaluru</p>
          <p className="mt-2 font-ui text-[12px] leading-relaxed text-lp-body">
            Built REST APIs using FastAPI and PostgreSQL. Maintained backend services for internal tooling.
          </p>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-lp-accent/30 bg-lp-accent-soft px-3 py-1.5 font-ui text-[11px] font-medium text-lp-accent">
          <CheckCircle2 className="h-3 w-3" />
          Profile confirmed · 100% complete
        </div>
      </div>
    </div>
  );
}

function DiscoverMockup() {
  const jobs = [
    { role: "Backend Engineer", co: "Northstar Systems", loc: "Bengaluru · Hybrid", score: 76, scoreColor: "bg-emerald-50 text-emerald-700", tags: ["Python", "FastAPI"] },
    { role: "API Platform Engineer", co: "Cloudstride", loc: "Remote", score: 61, scoreColor: "bg-amber-50 text-amber-700", tags: ["Python", "REST APIs"] },
    { role: "Software Engineer II", co: "Vaulted Labs", loc: "Bengaluru", score: 54, scoreColor: "bg-lp-bg text-lp-body", tags: ["FastAPI"] },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-3.5">
        <p className="font-ui text-[13px] font-semibold text-lp-ink">Matched opportunities</p>
        <PreviewBadge />
      </div>
      <div className="divide-y divide-lp-border">
        {jobs.map((job) => (
          <div key={job.role} className="flex items-start justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0">
              <p className="font-ui text-[13px] font-semibold text-lp-ink">{job.role}</p>
              <p className="font-ui text-[11px] text-lp-muted">{job.co} · {job.loc}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {job.tags.map((t) => (
                  <span key={t} className="rounded-full border border-lp-border bg-lp-bg px-2 py-0.5 font-ui text-[11px] text-lp-body">{t}</span>
                ))}
              </div>
            </div>
            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${job.scoreColor}`}>
              {job.score}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FitMockup() {
  const items = [
    { label: "Python — 3+ years",  status: "established" as const, note: "3 yrs at Tekvine Systems" },
    { label: "FastAPI",            status: "established" as const, note: "2 projects, confirmed" },
    { label: "PostgreSQL",         status: "established" as const, note: "Confirmed in profile" },
    { label: "System design",      status: "transferable" as const, note: "API architecture — transferable" },
    { label: "Team leadership",    status: "gap" as const, note: "Not in profile" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-3.5">
        <div>
          <p className="font-ui text-[13px] font-semibold text-lp-ink">Fit Analysis · Backend Engineer</p>
          <p className="font-ui text-[11px] text-lp-muted">Northstar Systems</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-700">
          76%
        </span>
      </div>
      <div className="divide-y divide-lp-border/60">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3 px-5 py-2.5">
            {item.status === "established" && <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />}
            {item.status === "transferable" && (
              <span className="mt-0.5 flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Minus className="h-2.5 w-2.5 text-amber-600" />
              </span>
            )}
            {item.status === "gap" && <Circle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lp-muted/40" />}
            <div>
              <p className={`font-ui text-[12px] font-medium ${item.status === "gap" ? "text-lp-muted" : "text-lp-ink"}`}>
                {item.label}
              </p>
              <p className="font-ui text-[11px] text-lp-muted">{item.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TailorMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-lp-border bg-lp-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-3.5">
        <p className="font-ui text-[13px] font-semibold text-lp-ink">Application preparation</p>
        <PreviewBadge />
      </div>
      <div className="grid divide-lp-border sm:grid-cols-2 sm:divide-x">
        <div className="p-5">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-wider text-lp-muted">Original</p>
          <div className="rounded-lg border border-lp-border bg-lp-bg p-3.5">
            <p className="font-ui text-[12px] leading-relaxed text-lp-body">
              Built REST APIs using FastAPI and PostgreSQL. Worked on backend services for internal tooling.
            </p>
          </div>
        </div>
        <div className="bg-lp-accent/[0.025] p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-wider text-lp-accent">Suggested</p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-ui text-[9px] font-medium text-amber-700">Awaiting approval</span>
          </div>
          <div className="rounded-lg border border-lp-accent/20 bg-lp-surface p-3.5 shadow-sm">
            <p className="font-ui text-[12px] leading-relaxed text-lp-ink">
              Developed REST APIs using FastAPI and PostgreSQL,{" "}
              <span className="rounded bg-lp-accent-soft px-0.5">directly relevant to the backend platform requirements of this role.</span>
            </p>
          </div>
          <button
            type="button"
            className="mt-2.5 inline-flex h-7 w-full items-center justify-center rounded-lg bg-lp-accent px-4 font-ui text-[11px] font-semibold text-white"
          >
            Approve change
          </button>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  {
    num: "01",
    eyebrow: "Build your profile",
    title: "Tell ApplyFocus who you are. Once.",
    body: "Upload your resume and ApplyFocus extracts your skills, experience and education into a structured profile. You review and confirm every field. Your profile becomes the foundation for every application you make.",
    mockup: <ProfileMockup />,
    flip: false,
  },
  {
    num: "02",
    eyebrow: "Discover relevant roles",
    title: "See where you stand before you apply.",
    body: "ApplyFocus surfaces roles matched against your confirmed skills, target titles and preferences — with a personalized fit score showing which requirements you meet and which you don't.",
    mockup: <DiscoverMockup />,
    flip: true,
  },
  {
    num: "03",
    eyebrow: "Evaluate fit with evidence",
    title: "Know exactly why a role fits — or doesn't.",
    body: "For each opportunity, ApplyFocus maps your profile against every requirement with supporting evidence from your actual experience. No unexplained scores. No black-box AI. Clear reasoning you can act on.",
    mockup: <FitMockup />,
    flip: false,
  },
  {
    num: "04",
    eyebrow: "Prepare and apply",
    title: "A focused application for every opportunity.",
    body: "ApplyFocus suggests targeted edits to your resume for each role — connecting your experience to what the job description actually asks for. You see original and suggested side by side and approve every change.",
    mockup: <TailorMockup />,
    flip: true,
  },
];

export function LandingBento() {
  return (
    <section id="how-it-works" className="bg-lp-surface py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mb-20 max-w-[640px]"
        >
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lp-accent">
            How it works
          </p>
          <h2 className="mt-4 font-display text-[40px] leading-[1.06] text-lp-ink sm:text-[54px]">
            From profile to prepared application, in one workspace.
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="space-y-24 sm:space-y-32">
          {STEPS.map((step) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className={`grid items-center gap-12 lg:grid-cols-2 lg:gap-16 ${
                step.flip ? "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1" : ""
              }`}
            >
              {/* Copy */}
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="font-mono text-[12px] font-bold tracking-[0.12em] text-lp-accent">{step.num}</span>
                  <span className="h-px w-8 bg-lp-border" />
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-lp-muted">{step.eyebrow}</span>
                </div>
                <h3 className="font-display text-[30px] leading-[1.1] text-lp-ink sm:text-[38px]">
                  {step.title}
                </h3>
                <p className="mt-5 font-ui text-[16px] leading-[1.75] text-lp-body">
                  {step.body}
                </p>
              </div>

              {/* Mockup */}
              <div>{step.mockup}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
