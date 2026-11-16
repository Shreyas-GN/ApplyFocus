import { User2, Search, ListChecks } from "lucide-react";

function PreviewBadge() {
  return (
    <span className="rounded-full border border-lp-border bg-lp-surface px-2.5 py-0.5 font-mono text-[10px] text-lp-muted">
      Illustrative preview
    </span>
  );
}

function ProfileMockup() {
  return (
    <div className="rounded-2xl border border-lp-border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-ui text-[13px] font-semibold text-lp-ink">Asha Rao</p>
          <p className="font-ui text-[11px] text-lp-muted">Backend Software Engineer · Bengaluru / Remote</p>
        </div>
        <PreviewBadge />
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["Python", "FastAPI", "PostgreSQL"].map((s) => (
          <span key={s} className="rounded-full border border-lp-border bg-lp-surface px-2.5 py-0.5 font-ui text-[12px] text-lp-body">
            {s}
          </span>
        ))}
      </div>
      <div className="mb-4 rounded-xl border border-lp-border bg-lp-surface px-4 py-3">
        <p className="font-ui text-[12px] font-semibold text-lp-ink">Software Intern · Tekvine Systems</p>
        <p className="font-ui text-[11px] text-lp-muted">2023 – 2024</p>
      </div>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-lp-accent px-4 py-1.5 font-ui text-[12px] font-medium text-lp-accent transition-colors hover:bg-lp-accent-soft"
      >
        Review extracted data
      </button>
    </div>
  );
}

function OpportunityMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-lp-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-3">
        <p className="font-ui text-[13px] font-semibold text-lp-ink">Matched roles</p>
        <PreviewBadge />
      </div>
      <div className="divide-y divide-lp-border">
        <div className="px-5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-ui text-[13px] font-semibold text-lp-ink">Backend Engineer · Northstar Systems</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {["Python", "FastAPI", "PostgreSQL"].map((t) => (
                  <span key={t} className="rounded-full border border-lp-border bg-lp-surface px-2 py-0.5 font-ui text-[11px] text-lp-body">{t}</span>
                ))}
              </div>
            </div>
            <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2.5 py-0.5 font-ui text-[11px] font-medium text-emerald-700">Strong alignment</span>
          </div>
        </div>
        <div className="px-5 py-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-ui text-[13px] font-semibold text-lp-ink">API Platform Engineer · Cloudstride</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {["Python", "REST APIs"].map((t) => (
                  <span key={t} className="rounded-full border border-lp-border bg-lp-surface px-2 py-0.5 font-ui text-[11px] text-lp-body">{t}</span>
                ))}
              </div>
            </div>
            <span className="flex-shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 font-ui text-[11px] font-medium text-amber-700">Partial match</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-lp-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-3">
        <p className="font-ui text-[13px] font-semibold text-lp-ink">Resume comparison</p>
        <PreviewBadge />
      </div>
      <div className="grid divide-y divide-lp-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-lp-muted">Original</p>
          <div className="rounded-xl border border-lp-border bg-lp-surface p-3">
            <p className="font-ui text-[12px] leading-relaxed text-lp-body">
              Built REST APIs using FastAPI and PostgreSQL. Worked on backend services for internal tooling.
            </p>
          </div>
        </div>
        <div className="bg-lp-accent/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wider text-lp-accent">Suggested</p>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-ui text-[10px] font-medium text-amber-700">Awaiting approval</span>
          </div>
          <div className="rounded-xl border border-lp-accent/20 bg-white p-3 shadow-sm">
            <p className="font-ui text-[12px] leading-relaxed text-lp-ink">
              Developed and maintained REST APIs using FastAPI and PostgreSQL,{" "}
              <span className="rounded bg-lp-accent-soft px-0.5">directly relevant to the backend platform requirements of this role.</span>
            </p>
          </div>
          <button
            type="button"
            className="mt-3 inline-flex h-7 w-full items-center justify-center rounded-lg bg-lp-accent px-4 font-ui text-[12px] font-semibold text-white"
          >
            Approve change
          </button>
        </div>
      </div>
    </div>
  );
}

function TrackerMockup() {
  const rows = [
    { role: "Backend Engineer", company: "Northstar Systems", status: "Interview", note: "2nd round scheduled" },
    { role: "API Platform Engineer", company: "Cloudstride", status: "Applied", note: "Follow up in 3 days" },
    { role: "Software Engineer II", company: "Vaulted Labs", status: "Saved", note: "Tailor resume to apply" },
  ];
  const statusColor: Record<string, string> = {
    Interview: "bg-amber-50 text-amber-700",
    Applied: "bg-lp-accent-soft text-lp-accent",
    Saved: "bg-lp-surface text-lp-muted",
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-lp-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-3">
        <p className="font-ui text-[13px] font-semibold text-lp-ink">Application tracker</p>
        <PreviewBadge />
      </div>
      <div className="divide-y divide-lp-border">
        {rows.map((row) => (
          <div key={row.role} className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div className="min-w-0">
              <p className="truncate font-ui text-[12px] font-semibold text-lp-ink">{row.role}</p>
              <p className="font-ui text-[11px] text-lp-muted">{row.company}</p>
            </div>
            <div className="flex flex-shrink-0 flex-col items-end gap-1">
              <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${statusColor[row.status]}`}>
                {row.status}
              </span>
              <p className="font-ui text-[11px] text-lp-muted">{row.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
