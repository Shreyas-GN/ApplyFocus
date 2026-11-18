"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { EASE, FOCUS_RING, Reveal, SectionHeader, T_HOVER, T_MOVE } from "./primitives";
import { FAQS } from "./faq-data";

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-24 bg-lp-surface py-20 sm:py-24"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[20rem_1fr] lg:gap-16">
          <div>
            <SectionHeader id="faq-heading" eyebrow="FAQ" title="Questions, answered plainly">
              Everything you need to know about how ApplyFocus works.
            </SectionHeader>
            <a
              href="mailto:support@applyfocus.app"
              className={cn(
                "body-1 mt-6 inline-flex rounded-lg text-lp-accent-ink hover:underline",
                T_HOVER,
                FOCUS_RING,
              )}
            >
              Still have questions? Contact us
            </a>
          </div>

          <Reveal>
            <ul className="divide-y divide-lp-border overflow-hidden rounded-2xl border border-lp-border bg-lp-bg">
              {FAQS.map((item, i) => {
                const isOpen = open === i;
                return (
                  <li key={item.q}>
                    <h3>
                      <button
                        type="button"
                        id={`faq-q-${i}`}
                        aria-expanded={isOpen}
                        aria-controls={`faq-a-${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className={cn(
                          "title-3 flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-lp-ink hover:bg-lp-surface",
                          T_HOVER,
                          FOCUS_RING,
                          "focus-visible:-outline-offset-2",
                        )}
                      >
                        {item.q}
                        <Plus
                          className={cn("size-4 flex-shrink-0 text-lp-muted", T_MOVE, isOpen && "rotate-45")}
                          weight="bold"
                          aria-hidden="true"
                        />
                      </button>
                    </h3>
                    {isOpen && (
                      <motion.div
                        id={`faq-a-${i}`}
                        role="region"
                        aria-labelledby={`faq-q-${i}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="px-6 pb-6"
                      >
                        <p className="body-3 max-w-[680px] text-lp-body">{item.a}</p>
                      </motion.div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
