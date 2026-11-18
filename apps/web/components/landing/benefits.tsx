"use client";

import { FileText, ListChecks, ShieldCheck, Target } from "@phosphor-icons/react";
import { Reveal, SectionHeader } from "./primitives";

const BENEFITS = [
  {
    icon: Target,
    title: "Know your fit before you apply",
    desc: "See which requirements you meet, which transfer, and which are gaps, each backed by evidence from your own profile.",
  },
  {
    icon: FileText,
    title: "Tailor a resume for every role",
    desc: "ApplyFocus proposes edits that connect your experience to each job description. You compare them side by side.",
  },
  {
    icon: ListChecks,
    title: "Keep every application in one place",
    desc: "Track saved, applied and interview stages, and see which resume version went to which employer.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control of every decision",
    desc: "Nothing changes without your approval, and ApplyFocus never submits an application for you.",
  },
];

export function LandingBenefits() {
  return (
    <section
      id="benefits"
      aria-labelledby="benefits-heading"
      className="scroll-mt-24 bg-lp-bg py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <SectionHeader
          id="benefits-heading"
          eyebrow="Benefits"
          title="Fewer, better applications"
        >
          Spend your effort on the roles worth pursuing and walk into each one prepared.
        </SectionHeader>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <li key={b.title}>
              <Reveal delay={(i % 2) * 0.08} className="h-full">
                <article className="h-full rounded-2xl border border-lp-border bg-lp-surface p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-lp-accent-soft text-lp-accent-ink">
                    <b.icon className="size-6" weight="regular" aria-hidden="true" />
                  </span>
                  <h3 className="heading-6 mt-6 text-lp-ink">{b.title}</h3>
                  <p className="body-3 mt-2 text-lp-body">{b.desc}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
