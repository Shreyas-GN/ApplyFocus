import { Check, X } from "lucide-react";

const CONTROL_STEPS = [
  { num: "1", label: "AI suggests, you decide", desc: "Every recommendation is a proposal. Nothing changes without your approval." },
  { num: "2", label: "Full transparency", desc: "You see exactly what was changed and why before you accept anything." },
  { num: "3", label: "No auto-submissions", desc: "ApplyPilot never applies on your behalf. You send every application yourself." },
  { num: "4", label: "Your data, your profile", desc: "Your career profile is yours. Export or delete it at any time." },
];

export function LandingPhilosophy() {
  return (
    <section id="philosophy" className="bg-lp-lagoon py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Top — comparison */}
        <div className="grid gap-10 lg:grid-cols-[1fr_480px] lg:items-center lg:gap-16">
          {/* Left — text */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
              The difference
            </p>
            <h2 className="mt-4 font-display text-[36px] leading-[1.08] text-white sm:text-[50px]">
              More applications aren&apos;t always better.
              <br />
              <span className="text-lp-accent">Better decisions are.</span>
            </h2>
            <p className="mt-5 max-w-[480px] font-ui text-[16px] leading-[1.7] text-white/55">
              A meaningful job search isn&apos;t about volume. It&apos;s about understanding your strengths,
              recognizing opportunities worth pursuing, and presenting your experience honestly.
            </p>
            <p className="mt-5 font-ui text-[15px] font-medium text-white/40">
              You make the decisions. ApplyPilot helps you make them with better information.
            </p>
          </div>

          {/* Right — comparison cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">
                The conventional approach
              </p>
              <ul className="mt-4 space-y-3">
                {["Apply everywhere.", "Reuse the same resume.", "Guess your fit.", "Lose track of applications."].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-ui text-[14px] text-white/50">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/5">
                      <X className="h-3 w-3 text-white/30" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-lp-accent/25 bg-lp-accent/[0.07] p-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-lp-accent/70">
                The ApplyPilot approach
              </p>
              <ul className="mt-4 space-y-3">
                {["Understand your profile.", "Evaluate opportunities.", "Tailor each application.", "Stay in control."].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-ui text-[14px] font-medium text-white">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-lp-accent">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom — candidate control strip */}
        <div className="mt-16 rounded-2xl border border-white/8 bg-white/[0.03] p-8 sm:mt-20">
          <p className="mb-8 font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent/70">
            You stay in control
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {CONTROL_STEPS.map((step) => (
              <div key={step.num}>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-lp-accent/15 font-mono text-[11px] font-semibold text-lp-accent">
                  {step.num}
                </span>
                <p className="mt-3 font-ui text-[14px] font-semibold text-white">{step.label}</p>
                <p className="mt-1.5 font-ui text-[13px] leading-relaxed text-white/45">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
