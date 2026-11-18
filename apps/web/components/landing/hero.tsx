"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { EASE, LandingButton } from "./primitives";
import { HeroWindow } from "./mockups";

const ASSURANCES = ["Free to start", "No credit card", "You approve every change"];

export function LandingHero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: reduce ? 0 : 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE, delay },
  });

  return (
    <section aria-labelledby="hero-heading" className="bg-lp-bg pb-16 pt-24 sm:pb-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <div className="mx-auto flex max-w-[680px] flex-col items-center text-center">
          <motion.p
            {...rise(0)}
            className="caption-4 inline-flex items-center gap-2 rounded-full border border-lp-border bg-lp-surface px-3 py-1 text-lp-body"
          >
            <span className="size-2 rounded-full bg-lp-accent" aria-hidden="true" />
            Early access, free to get started
          </motion.p>

          <motion.h1
            id="hero-heading"
            {...rise(0.08)}
            className="hero-gradient-text heading-1 mt-6 block w-full"
          >
            Know if you fit
            <br /> before you apply
          </motion.h1>

          <motion.p {...rise(0.16)} className="title-2 mt-6 max-w-[680px] text-lp-body">
            ApplyFocus maps your skills to each job description with evidence from your own
            experience, so you apply to roles that fit and prepare every application with purpose.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-8">
            <LandingButton href="/signup">
              Create your free profile
              <ArrowRight className="size-4" weight="bold" aria-hidden="true" />
            </LandingButton>
          </motion.div>

          <motion.ul
            {...rise(0.32)}
            className="caption-1 mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-lp-muted"
          >
            {ASSURANCES.map((item) => (
              <li key={item} className="inline-flex items-center gap-1">
                <Check className="size-4 text-lp-success" weight="bold" aria-hidden="true" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div {...rise(0.4)} className="mx-auto mt-16 max-w-[1040px]">
          <HeroWindow />
        </motion.div>
      </div>
    </section>
  );
}
