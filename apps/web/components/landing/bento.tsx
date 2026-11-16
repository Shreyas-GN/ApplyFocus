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

const STEPS = [
  {
    num: "01",
    eyebrow: "Build your profile",
    title: "Tell ApplyPilot who you are. Once.",
    body: "Upload your resume and ApplyPilot extracts your skills, experience and education into a structured profile. You review every field before anything is saved. Your profile becomes the foundation for every application you make.",
    mockup: <ProfileMockup />,
    textLeft: false,
  },
  {
    num: "02",
    eyebrow: "Find roles that fit",
    title: "See where you stand before you click Apply.",
    body: "ApplyPilot surfaces roles that match your background and explains the fit — which skills align, which don't, and what a recruiter would notice first. No more guessing whether it's worth your time.",
    mockup: <OpportunityMockup />,
    textLeft: true,
  },
  {
    num: "03",
    eyebrow: "Tailor your resume",
    title: "A focused resume for each opportunity.",
    body: "For every role you decide to pursue, ApplyPilot suggests targeted edits to your resume — reframing experience to match what the job description asks for. You see the original and the suggestion side-by-side and approve every change.",
    mockup: <DiffMockup />,
    textLeft: false,
  },
  {
    num: "04",
    eyebrow: "Track your search",
    title: "Know exactly where every application stands.",
    body: "From saved to offer, every opportunity lives in one organized view. Link the resume version you used, log interview notes, set follow-up reminders. No spreadsheets. No forgotten threads.",
    mockup: <TrackerMockup />,
    textLeft: true,
  },
];

export function LandingBento() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        {/* Section header */}
        <div className="mb-6 text-center">
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
            How it works
          </p>
          <h2 className="mx-auto mt-3 max-w-[560px] font-display text-[36px] leading-[1.08] text-lp-ink sm:text-[46px]">
            A clearer way to move your job search forward.
          </h2>
        </div>

        {/* Trust strip */}
        <div className="mb-20 flex flex-wrap justify-center gap-6 sm:gap-10">
          {[
            { Icon: User2, label: "You review every AI suggestion" },
            { Icon: Search, label: "Understand fit before applying" },
            { Icon: ListChecks, label: "Every application in one place" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2.5 font-ui text-[13px] text-lp-body">
              <Icon className="h-4 w-4 text-lp-accent" strokeWidth={1.75} />
              {label}
            </div>
          ))}
        </div>

        {/* Steps */}
        <div className="space-y-20 sm:space-y-28">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${step.textLeft ? "" : "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1"}`}
            >
              {/* Copy */}
              <div>
                <div className="mb-4 inline-flex items-center gap-3">
                  <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-lp-accent">{step.num}</span>
                  <span className="h-px w-6 bg-lp-border" />
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-lp-muted">{step.eyebrow}</span>
                </div>
                <h3 className="font-display text-[28px] leading-[1.1] text-lp-ink sm:text-[34px]">
                  {step.title}
                </h3>
                <p className="mt-4 font-ui text-[15px] leading-[1.7] text-lp-body">
                  {step.body}
                </p>
              </div>

              {/* Mockup */}
              <div>{step.mockup}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
