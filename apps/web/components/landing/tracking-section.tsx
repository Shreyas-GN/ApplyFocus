import { CheckCircle2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

const STAGES = [
  { label: "Saved", count: 12, color: "bg-slate-100 text-slate-500" },
  { label: "Applied", count: 7, color: "bg-lp-accent-soft text-lp-accent" },
  { label: "Interview", count: 3, color: "bg-amber-50 text-amber-700" },
  { label: "Offer", count: 1, color: "bg-emerald-50 text-emerald-700" },
];

const APPS = [
  { role: "Senior Product Designer", co: "Figma · Remote", stage: "Interview", resume: "v3_figma.pdf", note: "2nd round scheduled — focus on design systems work" },
  { role: "Design Systems Lead", co: "Notion · SF", stage: "Applied", resume: "v2_notion.pdf", note: "Applied 3 days ago — follow up due in 4 days" },
  { role: "Head of Product Design", co: "Linear · Remote", stage: "Saved", resume: "—", note: "Strong match — tailor resume before applying" },
];

const STAGE_STYLE: Record<string, string> = {
  Interview: "bg-amber-50 text-amber-700",
  Applied: "bg-lp-accent-soft text-lp-accent",
  Saved: "bg-slate-100 text-slate-500",
};

export function LandingTracking() {
  return (
    <section id="tracking" className="border-t border-lp-border bg-lp-bg py-20 sm:py-28">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — mockup */}
          <div className="overflow-hidden rounded-2xl border border-lp-border bg-white shadow-[0_4px_32px_rgba(21,94,99,0.08)]">
            {/* Stage strip */}
            <div className="grid grid-cols-4 divide-x divide-lp-border border-b border-lp-border">
              {STAGES.map((s) => (
                <div key={s.label} className="p-4 text-center">
                  <p className={`inline-flex rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${s.color}`}>
                    {s.label}
                  </p>
                  <p className="mt-1 font-ui text-2xl font-semibold text-lp-ink">{s.count}</p>
                </div>
              ))}
            </div>

            {/* App rows */}
            <div className="divide-y divide-lp-border">
              {APPS.map((app) => (
                <div key={app.role} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-ui text-[13px] font-semibold text-lp-ink">{app.role}</p>
                      <p className="font-ui text-[12px] text-lp-muted">{app.co}</p>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium ${STAGE_STYLE[app.stage]}`}>
                      {app.stage}
                    </span>
                  </div>
                  <p className="mt-2 font-ui text-[12px] text-lp-body">{app.note}</p>
                  <div className="mt-2 flex items-center gap-1.5 font-ui text-[11px] text-lp-muted">
                    <FileText className="h-3 w-3" />
                    {app.resume}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — copy */}
          <div>
            <p className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-lp-accent">
              Application tracking
            </p>
            <h2 className="mt-3 font-ui text-[36px] font-bold leading-[1.08] tracking-[-0.03em] text-lp-ink sm:text-[46px]">
              Know where every application stands.
            </h2>
            <p className="mt-5 font-ui text-[16px] leading-[1.7] text-lp-body">
              From the moment you save a job to the day you receive an update, your entire
              search is organized in one place. No spreadsheets. No forgotten follow-ups.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "Track saved and applied opportunities",
                "Link the exact resume version used for each application",
                "Record interview stages and outcomes",
                "Keep company and recruiter notes",
                "Manage follow-up reminders",
                "Review your complete application history",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 font-ui text-[14px] text-lp-ink">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-lp-accent" strokeWidth={2} />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="group mt-8 inline-flex items-center gap-2 font-ui text-[14px] font-semibold text-lp-accent hover:underline"
            >
              Start tracking your search
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
