"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { LandingButton, Reveal } from "./primitives";

export function LandingCta() {
  return (
    <section aria-labelledby="cta-heading" className="bg-lp-bg py-20 sm:py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <Reveal>
          <div className="rounded-2xl bg-lp-inverse px-6 py-16 text-center sm:px-12 sm:py-20">
            <h2
              id="cta-heading"
              className="heading-2 mx-auto max-w-[680px] text-lp-inverse-ink"
            >
              Know if you fit before you apply
            </h2>
            <p className="body-3 mx-auto mt-4 max-w-[680px] text-lp-inverse-body">
              Bring your experience together, find roles worth pursuing, and prepare every
              application with evidence.
            </p>
            <div className="mt-8">
              <LandingButton href="/signup">
                Create your free profile
                <ArrowRight className="size-4" weight="bold" aria-hidden="true" />
              </LandingButton>
            </div>
            <p className="caption-2 mt-6 text-lp-inverse-body">
              Free to start. No credit card. You approve every change.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
