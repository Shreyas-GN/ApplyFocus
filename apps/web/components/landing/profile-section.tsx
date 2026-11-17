import { CheckCircle2, ShieldCheck } from "lucide-react";

function ProfileMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-lp-border bg-lp-surface shadow-[0_4px_32px_rgba(32,33,36,0.07)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-lp-border px-5 py-4">
        <div>
          <p className="font-ui text-[14px] font-semibold text-lp-ink">Asha Rao</p>
          <p className="font-ui text-[12px] text-lp-muted">Backend Software Engineer · Bengaluru / Remote</p>
        </div>
        <span className="rounded-full border border-lp-border bg-lp-bg px-2.5 py-0.5 font-mono text-[10px] text-lp-muted">
          Illustrative preview
        </span>
      </div>

      {/* Skills */}
      <div className="border-b border-lp-border px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">Skills</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "Python", yrs: "3yr" },
            { name: "FastAPI", yrs: "2yr" },
            { name: "PostgreSQL", yrs: "2yr" },
            { name: "REST APIs", yrs: "" },
            { name: "Docker", yrs: "1yr" },
          ].map((s) => (
            <span
              key={s.name}
              className="inline-flex items-center gap-1.5 rounded-full border border-lp-border bg-lp-bg px-3 py-1 font-ui text-[12px] text-lp-body"
            >
              {s.name}
              {s.yrs && (
                <span className="font-mono text-[10px] text-lp-muted">{s.yrs}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {/* Experience */}
      <div className="border-b border-lp-border px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">Experience</p>
        <div className="space-y-2.5">
          {[
            { title: "Software Intern", company: "Tekvine Systems", period: "2023 – 2024", status: "confirmed" },
            { title: "Open Source Contributor", company: "Personal / GitHub", period: "2022 – present", status: "review" },
          ].map((exp) => (
            <div
              key={exp.title}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${
                exp.status === "confirmed"
                  ? "border-emerald-100 bg-emerald-50/40"
                  : "border-amber-100 bg-amber-50/40"
              }`}
            >
              <div>
                <p className="font-ui text-[13px] font-semibold text-lp-ink">{exp.title}</p>
                <p className="font-ui text-[11px] text-lp-muted">
                  {exp.company} · {exp.period}
                </p>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                  exp.status === "confirmed"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {exp.status === "confirmed" ? "Confirmed" : "Review"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-5 py-4">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lp-muted">
          Key achievements extracted
        </p>
        <div className="space-y-2">
          {[
            "Reduced API response time by 40% through query optimisation",
            "Maintained 3 open-source FastAPI libraries with 200+ GitHub stars",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-lp-accent" />
              <p className="font-ui text-[12px] leading-snug text-lp-body">{item}</p>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-lp-accent bg-lp-accent-soft px-4 py-1.5 font-ui text-[12px] font-medium text-lp-accent transition-colors hover:bg-lp-accent/10"
        >
          Review and confirm all data →
        </button>
      </div>
    </div>
  );
}

export function LandingProfileSection() {
  return (
    <section id="profile" className="border-t border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
              Career profile
            </p>
            <h2 className="mt-3 font-display text-[34px] leading-[1.08] text-lp-ink sm:text-[46px]">
              Understand your professional value. Completely.
            </h2>
            <p className="mt-5 font-ui text-[16px] leading-[1.7] text-lp-body">
              Upload your resume and ApplyPilot builds a structured profile from your skills, experience, projects and achievements. You see exactly what was extracted — and you confirm it before it&apos;s used in any evaluation.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "Skills mapped with years of experience",
                "Experience and projects organised by relevance",
                "Key achievements extracted and attributed",
                "Education, certifications and professional interests",
                "Review and confirm every field — nothing is assumed",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 font-ui text-[14px] text-lp-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-3 rounded-xl border border-lp-border bg-lp-surface px-4 py-3">
              <ShieldCheck className="h-5 w-5 flex-shrink-0 text-lp-accent" />
              <p className="font-ui text-[13px] leading-snug text-lp-body">
                <strong className="font-semibold text-lp-ink">Your profile is your foundation.</strong>
                {" "}ApplyPilot only uses what you&apos;ve confirmed.
              </p>
            </div>
          </div>

          {/* Mockup */}
          <ProfileMockup />
        </div>
      </div>
    </section>
  );
}
