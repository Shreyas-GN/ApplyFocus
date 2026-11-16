import { FileEdit, Search, ListChecks, UserRound, Sparkles, ShieldCheck } from "lucide-react";

const CARDS = [
  {
    id: "profile",
    span: "lg:col-span-2",
    icon: UserRound,
    eyebrow: "Master profile",
    title: "One profile. Every application.",
    body: "Build a structured professional record from your resume. Skills, experience, education, and projects — organized once, used everywhere. You review every extracted field before it's saved.",
    accent: "bg-lp-accent-soft",
    iconColor: "text-lp-accent",
  },
  {
    id: "match",
    span: "lg:col-span-1",
    icon: Search,
    eyebrow: "Opportunity matching",
    title: "Know your fit before you apply.",
    body: "AI-scored match analysis explains exactly how your background maps to each role — required skills, gaps, and transferable strengths.",
    accent: "bg-lp-copper-soft",
    iconColor: "text-lp-copper",
  },
  {
    id: "ai",
    span: "lg:col-span-1",
    icon: Sparkles,
    eyebrow: "Intelligence",
    title: "Insight, not just search.",
    body: "Understand job requirements in depth: responsibilities, seniority signals, tech stack, and team context — before you spend time applying.",
    accent: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    id: "resume",
    span: "lg:col-span-2",
    icon: FileEdit,
    eyebrow: "Adaptive resume engine",
    title: "A tailored resume for every opportunity.",
    body: "ApplyPilot adapts your resume to each job description — highlighting the right skills and projects. You see the original alongside the suggestion and approve every change before it's used.",
    accent: "bg-lp-accent-soft",
    iconColor: "text-lp-accent",
  },
  {
    id: "tracking",
    span: "lg:col-span-1",
    icon: ListChecks,
    eyebrow: "Application tracking",
    title: "Every application, organized.",
    body: "Track stages, link resume versions, log recruiter notes, and manage follow-up reminders — all in one pipeline.",
    accent: "bg-lp-copper-soft",
    iconColor: "text-lp-copper",
  },
  {
    id: "control",
    span: "lg:col-span-1",
    icon: ShieldCheck,
    eyebrow: "Candidate control",
    title: "Your information. Your decisions.",
    body: "No application is submitted without your review. Every AI suggestion is transparent, editable, and optional.",
    accent: "bg-slate-50",
    iconColor: "text-slate-500",
  },
];

export function LandingBento() {
  return (
    <section id="features" className="bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
            Everything you need
          </p>
          <h2 className="mx-auto mt-3 max-w-[640px] font-ui text-[36px] font-bold leading-[1.1] tracking-[-0.03em] text-lp-ink sm:text-[48px]">
            A complete career workspace.
          </h2>
          <p className="mx-auto mt-4 max-w-[500px] font-ui text-[16px] leading-[1.65] text-lp-body">
            From discovery to offer — every step of your job search in one place, built around your control.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-2xl border border-lp-border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(53,92,255,0.08)] sm:p-7 ${card.span}`}
              >
                <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.accent}`}>
                  <Icon className={`h-[18px] w-[18px] ${card.iconColor}`} strokeWidth={1.75} />
                </div>
                <p className="mt-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-lp-muted">
                  {card.eyebrow}
                </p>
                <h3 className="mt-1.5 font-ui text-[18px] font-bold leading-snug tracking-[-0.02em] text-lp-ink">
                  {card.title}
                </h3>
                <p className="mt-2.5 font-ui text-[14px] leading-relaxed text-lp-body">
                  {card.body}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
