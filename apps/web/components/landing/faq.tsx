"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "What is ApplyPilot?",
    a: "ApplyPilot is a career intelligence workspace that helps you organize your professional profile, discover relevant job opportunities, prepare tailored applications, and manage your job search.",
  },
  {
    q: "Who is ApplyPilot best suited for?",
    a: "ApplyPilot is designed for job seekers who want to be intentional about their search — from fresh graduates and early-career professionals to experienced candidates making deliberate career moves. It is especially useful for people who want to understand fit before applying, rather than sending high volumes of generic applications.",
  },
  {
    q: "Do I need to create a new resume?",
    a: "No. You can start with your existing resume and build a structured professional profile from your experience, skills, education, and projects. ApplyPilot extracts the data; you review and confirm it.",
  },
  {
    q: "Can I use a different resume for every job?",
    a: "Yes. ApplyPilot's Adaptive Resume Engine creates job-specific resume versions using your existing professional information. You review and approve suggested changes before using them.",
  },
  {
    q: "Does ApplyPilot apply to jobs automatically?",
    a: "No. ApplyPilot is not an auto-apply tool. It helps you understand roles, prepare tailored applications, and stay organized — but you review every application and decide what to submit and when. Candidate control is a core design principle.",
  },
  {
    q: "Can I track jobs I found outside ApplyPilot?",
    a: "Yes. The application tracker is designed to work with opportunities from any source, including external employer websites and job boards.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes, you can create a free account to get started. Usage limits and paid features are described in the published pricing information.",
  },
  {
    q: "Does ApplyPilot guarantee ATS compatibility?",
    a: "No platform can guarantee perfect ATS parsing. ApplyPilot creates clear, structured, machine-readable application documents designed to work well with common systems.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[300px_1fr] lg:gap-16">
          {/* Left */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
              FAQ
            </p>
            <h2 className="mt-3 font-display text-[32px] leading-[1.1] text-lp-ink sm:text-[40px]">
              Questions, answered plainly.
            </h2>
            <p className="mt-4 font-ui text-[15px] leading-relaxed text-lp-body">
              Everything you need to know about how ApplyPilot works.
            </p>
            <a
              href="mailto:support@applypilot.app"
              className="mt-6 inline-flex font-ui text-[14px] font-semibold text-lp-accent hover:underline"
            >
              Still have questions? Contact us →
            </a>
          </div>

          {/* Right — accordion */}
          <div className="divide-y divide-lp-border rounded-2xl border border-lp-border bg-white overflow-hidden">
            {FAQS.map((item, i) => (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-ui text-[15px] font-semibold text-lp-ink">{item.q}</span>
                  <span className="flex-shrink-0 text-lp-muted">
                    {open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {open === i && (
                  <div className="border-t border-lp-border bg-lp-surface px-6 py-5">
                    <p className="font-ui text-[15px] leading-relaxed text-lp-body">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
