"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const FAQS = [
  {
    q: "What is ApplyFocus?",
    a: "ApplyFocus is a candidate-first career intelligence workspace. It helps you build a structured professional profile, discover relevant opportunities, evaluate your fit with evidence, prepare tailored applications, and manage your entire job search in one place.",
  },
  {
    q: "Who is ApplyFocus best suited for?",
    a: "ApplyFocus is for job seekers who want to be intentional about their search — from fresh graduates to experienced professionals making deliberate career moves. It's especially useful for people who want to understand fit before applying, rather than sending high volumes of generic applications.",
  },
  {
    q: "Do I need to create a new resume?",
    a: "No. You start with your existing resume. ApplyFocus extracts your skills, experience, education and projects into a structured profile. You review and confirm every field before anything is saved.",
  },
  {
    q: "Can I use a different resume version for every job?",
    a: "Yes. ApplyFocus creates job-specific resume versions from your existing professional profile. You review and approve suggested changes before using them — nothing is applied without your explicit decision.",
  },
  {
    q: "Does ApplyFocus submit applications automatically?",
    a: "No. ApplyFocus is not an auto-apply tool. You review every application and decide what to submit and when. Candidate control is a core design principle — ApplyFocus is here to inform your decisions, not make them for you.",
  },
  {
    q: "Can I track jobs I found outside ApplyFocus?",
    a: "Yes. The application tracker works with opportunities from any source. The companion browser extension makes it easy to save roles from external job boards and employer sites without leaving the page.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes, you can create a free account to get started. Usage limits and paid plan details are described in the published pricing information.",
  },
  {
    q: "Does ApplyFocus guarantee ATS compatibility?",
    a: "No platform can guarantee perfect ATS parsing. ApplyFocus creates clear, structured, machine-readable application documents designed to work well with common systems.",
  },
];

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="grid gap-14 lg:grid-cols-[320px_1fr] lg:gap-20">
          {/* Left */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lp-accent">
              FAQ
            </p>
            <h2 className="mt-4 font-display text-[36px] leading-[1.08] text-lp-ink sm:text-[44px]">
              Questions, answered plainly.
            </h2>
            <p className="mt-4 font-ui text-[15px] leading-relaxed text-lp-body">
              Everything you need to know about how ApplyFocus works.
            </p>
            <a
              href="mailto:support@applyfocus.app"
              className="mt-6 inline-flex font-ui text-[14px] font-semibold text-lp-accent hover:underline"
            >
              Still have questions? Contact us →
            </a>
          </div>

          {/* Right — accordion */}
          <div className="divide-y divide-lp-border overflow-hidden rounded-2xl border border-lp-border bg-white">
            {FAQS.map((item, i) => (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-lp-bg/50"
                >
                  <span className="font-ui text-[15px] font-semibold text-lp-ink">{item.q}</span>
                  <span className="flex-shrink-0 text-lp-muted">
                    {open === i ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </span>
                </button>
                {open === i && (
                  <div className="border-t border-lp-border bg-lp-bg px-6 py-5">
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
