"use client";

import { Reveal, SectionHeader } from "./primitives";

const CONTROL = [
  {
    label: "AI suggests, you decide",
    desc: "Every recommendation is a proposal. Nothing changes without your explicit approval.",
  },
  {
    label: "Full transparency",
    desc: "You see exactly what changed and why before you accept anything.",
  },
  {
    label: "No auto submissions",
    desc: "ApplyFocus never applies on your behalf. You send every application yourself.",
  },
  {
    label: "Your data, your profile",
    desc: "Your career profile is yours. Export or delete it at any time.",
  },
];

export function LandingControl() {
  return (
    <section
      id="control"
      aria-labelledby="control-heading"
      className="scroll-mt-24 bg-lp-bg py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <SectionHeader
          id="control-heading"
          eyebrow="Candidate control"
          title="Better decisions, not more applications"
        >
          Starting is free and needs no credit card. You can leave whenever you like and take your
          profile with you.
        </SectionHeader>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTROL.map((c, i) => (
            <li key={c.label}>
              <Reveal delay={i * 0.08} className="h-full">
                <article className="h-full rounded-2xl border border-lp-border bg-lp-surface p-6">
                  <h3 className="title-2 text-lp-ink">{c.label}</h3>
                  <p className="body-3 mt-2 text-lp-body">{c.desc}</p>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
