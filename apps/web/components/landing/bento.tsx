import { User2, Search, FileEdit, ListChecks } from "lucide-react";

const STEPS = [
  {
    num: "01",
    icon: User2,
    eyebrow: "Understand your value",
    title: "Build a structured career profile",
    body: "Upload your existing resume and ApplyPilot extracts your skills, experience, projects and achievements into a structured profile. You review and confirm every detail before anything is saved.",
    metric: "Your foundation. Built once.",
  },
  {
    num: "02",
    icon: Search,
    eyebrow: "Evaluate opportunities",
    title: "See where you stand before you apply",
    body: "For every role you explore, ApplyPilot maps your experience against the actual requirements — showing which skills align strongly, which transfer partially, and where gaps exist. Evidence-based, not algorithmic.",
    metric: "Fit analysis, not a score.",
  },
  {
    num: "03",
    icon: FileEdit,
    eyebrow: "Prepare better applications",
    title: "Tailor your resume and cover letter",
    body: "ApplyPilot suggests targeted edits to your resume based on the role requirements. You see original content side-by-side with suggestions and approve every change. Your experience, presented at its best.",
    metric: "You approve everything.",
  },
  {
    num: "04",
    icon: ListChecks,
    eyebrow: "Stay in control",
    title: "Track every application in one place",
    body: "From saved to offer, every opportunity lives in one organised view. Link the resume version you used, log interview notes and manage follow-ups. No spreadsheets. No forgotten threads.",
    metric: "Full search visibility.",
  },
];

export function LandingBento() {
  return (
    <section id="how-it-works" className="border-t border-lp-border bg-lp-surface py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-[560px] text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
            How it works
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-[1.08] text-lp-ink sm:text-[48px]">
            One connected experience, not four separate tools.
          </h2>
          <p className="mt-5 font-ui text-[16px] leading-[1.7] text-lp-body">
            ApplyPilot connects every part of your job search — from understanding your profile to evaluating fit to building your application.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.num} className="relative overflow-hidden rounded-2xl border border-lp-border bg-lp-bg p-6">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lp-surface border border-lp-border">
                    <Icon className="h-5 w-5 text-lp-accent" strokeWidth={1.75} />
                  </div>
                  <span className="font-mono text-[22px] font-light text-lp-border">
                    {step.num}
                  </span>
                </div>

                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
                  {step.eyebrow}
                </p>
                <h3 className="mt-2 font-ui text-[15px] font-semibold leading-snug text-lp-ink">
                  {step.title}
                </h3>
                <p className="mt-3 font-ui text-[13px] leading-[1.65] text-lp-body">
                  {step.body}
                </p>

                <div className="mt-5 inline-flex items-center rounded-full border border-lp-border bg-lp-surface px-3 py-1">
                  <span className="font-ui text-[11px] font-medium text-lp-muted">
                    {step.metric}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Connector strip */}
        <div className="mt-14 grid grid-cols-3 divide-x divide-lp-border overflow-hidden rounded-2xl border border-lp-border bg-lp-bg">
          {[
            { label: "AI suggests", sub: "every recommendation is a proposal" },
            { label: "You decide", sub: "approve or dismiss any change" },
            { label: "Your control", sub: "you submit every application yourself" },
          ].map((item) => (
            <div key={item.label} className="p-5 text-center">
              <p className="font-ui text-[14px] font-semibold text-lp-ink">{item.label}</p>
              <p className="mt-1 font-ui text-[12px] text-lp-muted">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
