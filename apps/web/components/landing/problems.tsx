"use client";

import { Reveal, SectionHeader } from "./primitives";

const PROBLEMS = [
  {
    num: "01",
    title: "Applying without knowing if you fit",
    desc: "Job descriptions rarely say which requirements are firm and which are flexible. You submit and hope.",
  },
  {
    num: "02",
    title: "Your strongest experience stays hidden",
    desc: "Relevant work is buried across old roles. Without a structured profile, you cannot surface what matters for each opportunity.",
  },
  {
    num: "03",
    title: "Every resume starts from scratch",
    desc: "Adapting a resume for each role means copying, pasting and second guessing, with no way to know if the changes help.",
  },
  {
    num: "04",
    title: "Positioning skills without guidance",
    desc: "You have transferable skills, but linking them to a job description takes analysis you rarely have time for.",
  },
  {
    num: "05",
    title: "Applications scattered across tabs",
    desc: "Twenty open applications, no follow up system, and no record of which resume version you used.",
  },
];

export function LandingProblems() {
  return (
    <section
      id="problems"
      aria-labelledby="problems-heading"
      className="scroll-mt-24 bg-lp-bg py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <SectionHeader
          id="problems-heading"
          eyebrow="The problem"
          title="The usual job search is frustrating, for good reason"
        >
          These are not personal failings. They are gaps in the process, and ApplyFocus is built to
          close them.
        </SectionHeader>

        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROBLEMS.map((p, i) => (
            <li key={p.num}>
              <Reveal delay={(i % 3) * 0.08} className="h-full">
                <article className="h-full rounded-2xl border border-lp-border bg-lp-surface p-6">
                  <p className="caption-3 text-lp-accent-ink">{p.num}</p>
                  <h3 className="title-1 mt-3 text-lp-ink">{p.title}</h3>
                  <p className="body-3 mt-3 text-lp-body">{p.desc}</p>
                </article>
              </Reveal>
            </li>
          ))}
          <li>
            <Reveal delay={0.16} className="h-full">
              <article className="h-full rounded-2xl border border-lp-border bg-lp-accent-soft p-6">
                <p className="caption-3 text-lp-accent-ink">The fix</p>
                <h3 className="title-1 mt-3 text-lp-ink">One workspace that closes these gaps</h3>
                <p className="body-3 mt-3 text-lp-body">
                  A confirmed profile, evidence behind every fit score, and a tracker that remembers
                  what you sent.
                </p>
              </article>
            </Reveal>
          </li>
        </ul>
      </div>
    </section>
  );
}
