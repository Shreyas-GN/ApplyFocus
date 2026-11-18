"use client";

import { Reveal, SectionHeader, Eyebrow } from "./primitives";
import { FitMock, ProfileMock, TailorMock } from "./mockups";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    eyebrow: "Step 1",
    title: "Build your profile once",
    body: "Upload your resume and ApplyFocus extracts your skills, experience and education into a structured profile. You review and confirm every field, and the profile becomes the base for every application.",
    mock: <ProfileMock />,
  },
  {
    eyebrow: "Step 2",
    title: "See your fit with evidence",
    body: "For each role, ApplyFocus maps your profile against every requirement and shows the experience behind each match. No unexplained scores, just reasoning you can act on.",
    mock: <FitMock />,
  },
  {
    eyebrow: "Step 3",
    title: "Prepare, apply and track",
    body: "Review suggested resume edits next to the original and approve only the ones you want. Then save the application and follow it from first send to final answer.",
    mock: <TailorMock />,
  },
];

export function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="scroll-mt-24 bg-lp-surface py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <SectionHeader
          id="how-heading"
          eyebrow="How it works"
          title="From profile to prepared application in three steps"
        />

        <ol className="mt-16 space-y-20 sm:space-y-24">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <Reveal className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                <div className={cn(i % 2 === 1 && "lg:order-last")}>
                  <Eyebrow>{step.eyebrow}</Eyebrow>
                  <h3 className="heading-4 mt-3 text-lp-ink">{step.title}</h3>
                  <p className="body-3 mt-4 max-w-[480px] text-lp-body">{step.body}</p>
                </div>
                <div>{step.mock}</div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
