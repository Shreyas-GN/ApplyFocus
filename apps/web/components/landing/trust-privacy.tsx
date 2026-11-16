import { Compass, Eye, FileCheck2, ShieldCheck } from "lucide-react";

const PRINCIPLES = [
  {
    icon: Eye,
    title: "Your information",
    description:
      "Review and manage your professional profile. Every field reviewed and confirmed by you before it’s used.",
  },
  {
    icon: FileCheck2,
    title: "Your applications",
    description:
      "Inspect every suggested change before using it. No content gets applied without your explicit approval.",
  },
  {
    icon: ShieldCheck,
    title: "Your approval",
    description:
      "No consequential application submission without your confirmation. You stay in control at every step.",
  },
  {
    icon: Compass,
    title: "Your decisions",
    description:
      "Choose which opportunities to pursue. ApplyPilot provides intelligence — you make the calls.",
  },
];

export function TrustPrivacy() {
  return (
    <section id="trust" className="border-b border-lp-border bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="inline-flex rounded-full border border-lp-border bg-white px-3.5 py-1 font-mono text-[11px] font-medium tracking-widest text-lp-muted">
            BUILT AROUND YOUR CONTROL
          </p>
          <h2 className="mt-4 font-ui text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-lp-ink sm:text-[42px]">
            Your career information belongs to you.
          </h2>
          <p className="mt-4 font-ui text-[16px] leading-[1.65] text-lp-body">
            Your professional history is personal. ApplyPilot is designed to work with your
            information without taking decisions away from you.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRINCIPLES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-lp-border bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lp-accent/20 bg-lp-accent-soft">
                <Icon className="h-[18px] w-[18px] text-lp-accent" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-ui text-base font-semibold text-lp-ink">{title}</h3>
              <p className="mt-2 font-ui text-sm leading-relaxed text-lp-body">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
