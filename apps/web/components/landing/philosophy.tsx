"use client";

import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const CONTROL_STEPS = [
  { num: "1", label: "AI suggests, you decide", desc: "Every recommendation is a proposal. Nothing changes without your explicit approval." },
  { num: "2", label: "Full transparency", desc: "You see exactly what was changed and why before you accept anything." },
  { num: "3", label: "No auto-submissions", desc: "ApplyFocus never applies on your behalf. You send every application yourself." },
  { num: "4", label: "Your data, your profile", desc: "Your career profile is yours. Export or delete it at any time." },
];

export function LandingPhilosophy() {
  return (
    <section id="philosophy" className="bg-lp-lagoon py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        {/* Top — comparison */}
        <div className="grid gap-12 lg:grid-cols-[1fr_460px] lg:items-center lg:gap-20">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lp-accent">
              The difference
            </p>
            <h2 className="mt-4 font-display text-[40px] leading-[1.06] text-white sm:text-[54px]">
              More applications aren&apos;t the answer.
              <br />
              <span className="text-white/50">Better decisions are.</span>
            </h2>
            <p className="mt-6 max-w-[480px] font-ui text-[16px] leading-[1.75] text-white/50">
              A meaningful job search isn&apos;t about volume. It&apos;s about understanding your strengths, recognising opportunities worth pursuing, and presenting your experience with honesty and precision.
            </p>
            <p className="mt-5 font-ui text-[15px] font-medium text-white/35">
              You make the decisions. ApplyFocus gives you the information to make them well.
            </p>
          </motion.div>

          {/* Right — comparison cards */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid gap-4"
          >
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6">
              <p className="font-mono text-[9px] uppercase tracking-wider text-white/25">
                The conventional approach
              </p>
              <ul className="mt-4 space-y-3">
                {["Apply everywhere and hope.", "Reuse the same generic resume.", "Guess whether your skills match.", "Lose track of what you applied to."].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-ui text-[14px] text-white/40">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                      <X className="h-3 w-3 text-white/25" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-lp-accent/30 bg-lp-accent/[0.07] p-6">
              <p className="font-mono text-[9px] uppercase tracking-wider text-lp-accent/60">
                The ApplyFocus approach
              </p>
              <ul className="mt-4 space-y-3">
                {["Understand your professional profile.", "Evaluate each opportunity with evidence.", "Tailor every application with purpose.", "Stay organised from search to offer."].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-ui text-[14px] font-medium text-white">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-lp-accent">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Bottom — candidate control strip */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-20 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 sm:p-10"
        >
          <p className="mb-10 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-lp-accent/60">
            Candidate control — always
          </p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {CONTROL_STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-lp-accent/15 font-mono text-[11px] font-semibold text-lp-accent">
                  {step.num}
                </span>
                <p className="mt-4 font-ui text-[15px] font-semibold text-white">{step.label}</p>
                <p className="mt-2 font-ui text-[13px] leading-relaxed text-white/40">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
