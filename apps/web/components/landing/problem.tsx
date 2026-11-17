import { Search, FileText, Layers, Calendar } from "lucide-react";

const PAIN_POINTS = [
  {
    icon: Search,
    title: "Applying without knowing whether you fit",
    body: "You spend time on applications for roles you're unsure about. The job description lists twenty requirements and you can't tell which ones actually matter.",
  },
  {
    icon: Layers,
    title: "Not knowing which of your skills are relevant",
    body: "Your experience is real, but it doesn't neatly match what the job posting asks for. You have more to offer than your resume makes obvious.",
  },
  {
    icon: FileText,
    title: "Rewriting from scratch every time",
    body: "Each application means reworking your resume and cover letter. You end up with a pile of slightly different documents and no clear sense of which approach works.",
  },
  {
    icon: Calendar,
    title: "Losing track of where everything stands",
    body: "Applications, follow-ups, interview stages and recruiter contacts scatter across your inbox, notes and browser tabs. Something always slips.",
  },
];

export function LandingProblem() {
  return (
    <section className="bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="mx-auto max-w-[620px] text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
            The real problem
          </p>
          <h2 className="mt-3 font-display text-[34px] leading-[1.08] text-lp-ink sm:text-[48px]">
            Most job searches feel like guesswork.
          </h2>
          <p className="mt-5 font-ui text-[16px] leading-[1.7] text-lp-body">
            Not because candidates aren&apos;t capable — but because they lack the tools to understand their own value and evaluate opportunities against it honestly.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2">
          {PAIN_POINTS.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.title}
                className="rounded-2xl border border-lp-border bg-lp-surface p-7"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl border border-lp-border bg-lp-bg">
                  <Icon className="h-5 w-5 text-lp-body" strokeWidth={1.75} />
                </div>
                <h3 className="font-ui text-[16px] font-semibold text-lp-ink">{point.title}</h3>
                <p className="mt-3 font-ui text-[14px] leading-[1.7] text-lp-body">{point.body}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl border border-lp-border bg-lp-surface px-7 py-6">
          <div className="grid gap-6 sm:grid-cols-3 sm:items-center sm:gap-10">
            <div className="sm:col-span-2">
              <p className="font-ui text-[16px] font-semibold text-lp-ink">
                ApplyPilot is built to solve all of this — in one connected experience.
              </p>
              <p className="mt-2 font-ui text-[14px] leading-[1.65] text-lp-body">
                Not another resume builder. Not an ATS checker. Not a job portal. A workspace that connects your professional profile to real opportunities — and helps you act on them with clarity.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-1.5 font-ui text-[14px] font-semibold text-lp-accent hover:underline"
              >
                See how it works →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
