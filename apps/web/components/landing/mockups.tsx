import type { ReactNode } from "react";
import { CheckCircle, Circle, MinusCircle } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/* Illustrative product screens. The names and numbers are fictional sample data. */

export type FitStatus = "established" | "transferable" | "gap";

export const FIT_REQUIREMENTS: { req: string; status: FitStatus; evidence: string }[] = [
  { req: "Python, 3 or more years", status: "established", evidence: "3 years at Tekvine Systems" },
  { req: "FastAPI", status: "established", evidence: "2 projects in your profile" },
  { req: "PostgreSQL and SQL", status: "established", evidence: "Used daily at Tekvine" },
  { req: "System design", status: "transferable", evidence: "API architecture work transfers" },
  { req: "Team leadership", status: "gap", evidence: "Not in your profile yet" },
];

const STATUS_LABEL: Record<FitStatus, string> = {
  established: "Established",
  transferable: "Transferable",
  gap: "Not in profile",
};

const STATUS_PILL: Record<FitStatus, string> = {
  established: "bg-lp-success-soft text-lp-success",
  transferable: "bg-lp-warning-soft text-lp-warning",
  gap: "bg-lp-surface-subtle text-lp-muted",
};

export function StatusIcon({ status, className }: { status: FitStatus; className?: string }) {
  const base = cn("size-4 flex-shrink-0", className);
  if (status === "established") {
    return <CheckCircle weight="fill" className={cn(base, "text-lp-success")} aria-hidden="true" />;
  }
  if (status === "transferable") {
    return <MinusCircle weight="fill" className={cn(base, "text-lp-warning")} aria-hidden="true" />;
  }
  return <Circle className={cn(base, "text-lp-muted")} aria-hidden="true" />;
}

export function StatusPill({ status }: { status: FitStatus }) {
  return (
    <span className={cn("caption-4 inline-flex rounded-full px-2 py-0.5", STATUS_PILL[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function IllustrativeTag() {
  return (
    <span className="caption-4 rounded-full border border-lp-border bg-lp-bg px-2 py-0.5 text-lp-muted">
      Illustrative
    </span>
  );
}

/**
 * Frame for every product screen.
 * Outer radius 16px with an 8px inset gives the inner window 16 minus 8, so 8px.
 */
export function MockFrame({
  children,
  label,
  className,
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("rounded-2xl border border-lp-border bg-lp-surface-subtle p-2", className)}
    >
      <div className="overflow-hidden rounded-lg border border-lp-border bg-lp-bg text-left">
        {children}
      </div>
    </div>
  );
}

function MockHeader({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-lp-border bg-lp-surface px-4 py-3">
      <div className="min-w-0">
        <p className="body-4 truncate text-lp-ink">{title}</p>
        {subtitle ? <p className="caption-5 truncate text-lp-muted">{subtitle}</p> : null}
      </div>
      {aside}
    </div>
  );
}

/* ───────────── Hero window ───────────── */

const SIDEBAR = ["My profile", "Discover roles", "Fit analysis", "Applications", "Resume drafts"];

export function HeroWindow() {
  return (
    <MockFrame label="Example fit analysis for a backend engineer role. The fit score is 76 percent, with three established requirements, one transferable and one gap.">
      {/* Window chrome */}
      <div className="flex items-center gap-2 border-b border-lp-border bg-lp-surface-subtle px-4 py-2">
        <span className="size-2 rounded-full bg-lp-border" />
        <span className="size-2 rounded-full bg-lp-border" />
        <span className="size-2 rounded-full bg-lp-border" />
        <span className="caption-5 mx-auto rounded-md bg-lp-bg px-3 py-1 text-lp-muted">
          applyfocus.app
        </span>
        <span className="w-12" />
      </div>

      <div className="flex">
        {/* Sidebar, desktop only */}
        <div className="hidden w-48 flex-shrink-0 flex-col border-r border-lp-border bg-lp-surface lg:flex">
          <div className="flex items-center gap-2 border-b border-lp-border px-4 py-3">
            <span className="caption-3 flex size-6 items-center justify-center rounded-md bg-lp-accent text-white">
              AF
            </span>
            <span className="body-4 text-lp-ink">ApplyFocus</span>
          </div>
          <div className="flex-1 p-2">
            {SIDEBAR.map((label) => (
              <div
                key={label}
                className={cn(
                  "caption-1 rounded-md px-3 py-2",
                  label === "Fit analysis"
                    ? "bg-lp-accent-soft text-lp-accent-ink"
                    : "text-lp-muted",
                )}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="border-t border-lp-border p-3">
            <p className="caption-3 text-lp-ink">Asha Rao</p>
            <p className="caption-5 text-lp-muted">Backend engineer</p>
          </div>
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="caption-3 text-lp-accent-ink">Fit analysis</p>
              <p className="title-1 mt-1 text-lp-ink">Backend engineer at Northstar Systems</p>
              <p className="caption-5 mt-1 text-lp-muted">Bengaluru, hybrid, posted 2 days ago</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="heading-3 text-lp-ink">
                76<span className="title-1 text-lp-muted">%</span>
              </p>
              <p className="caption-5 text-lp-muted">Fit score</p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-lp-border bg-lp-surface">
            <div className="hidden grid-cols-[1fr_8rem_1fr] border-b border-lp-border bg-lp-bg sm:grid">
              {["Requirement", "Status", "Your evidence"].map((h) => (
                <div key={h} className="caption-3 px-4 py-2 text-lp-muted">
                  {h}
                </div>
              ))}
            </div>
            <ul className="divide-y divide-lp-border">
              {FIT_REQUIREMENTS.map((item) => (
                <li
                  key={item.req}
                  className="flex items-center justify-between gap-3 px-4 py-2 sm:grid sm:grid-cols-[1fr_8rem_1fr]"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <StatusIcon status={item.status} />
                    <span
                      className={cn(
                        "caption-1 truncate",
                        item.status === "gap" ? "text-lp-muted" : "text-lp-ink",
                      )}
                    >
                      {item.req}
                    </span>
                  </span>
                  <span className="flex-shrink-0">
                    <StatusPill status={item.status} />
                  </span>
                  <span className="caption-5 hidden text-lp-muted sm:block">{item.evidence}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-lp-border bg-lp-surface px-4 py-3">
            <p className="caption-1 text-lp-ink">Application strategy is ready</p>
            <span className="button-xsm flex-shrink-0 rounded-md bg-lp-ink px-3 py-1 text-lp-bg">
              View
            </span>
          </div>
        </div>
      </div>
    </MockFrame>
  );
}

/* ───────────── Step mockups ───────────── */

export function ProfileMock() {
  const skills = ["Python", "FastAPI", "PostgreSQL", "REST APIs", "Git"];
  return (
    <MockFrame label="Example confirmed profile for Asha Rao, a backend engineer, listing five confirmed skills and one role.">
      <MockHeader
        title="Asha Rao"
        subtitle="Backend software engineer, Bengaluru or remote"
        aside={<IllustrativeTag />}
      />
      <div className="p-4">
        <p className="caption-3 text-lp-muted">Confirmed skills</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {skills.map((s) => (
            <li
              key={s}
              className="caption-4 flex items-center gap-1 rounded-full border border-lp-border bg-lp-surface px-2 py-1 text-lp-body"
            >
              <CheckCircle weight="fill" className="size-3 text-lp-success" aria-hidden="true" />
              {s}
            </li>
          ))}
        </ul>
        <p className="caption-3 mt-4 text-lp-muted">Experience</p>
        <div className="mt-2 rounded-lg border border-lp-border bg-lp-surface p-3">
          <p className="caption-1 text-lp-ink">Software intern at Tekvine Systems</p>
          <p className="caption-5 text-lp-muted">Jun 2023 to May 2024, Bengaluru</p>
          <p className="caption-5 mt-2 text-lp-body">
            Built REST APIs with FastAPI and PostgreSQL. Maintained backend services for internal tools.
          </p>
        </div>
        <p className="caption-3 mt-4 inline-flex items-center gap-1 rounded-lg bg-lp-accent-soft px-3 py-1 text-lp-accent-ink">
          <CheckCircle weight="fill" className="size-3" aria-hidden="true" />
          Profile confirmed
        </p>
      </div>
    </MockFrame>
  );
}

export function FitMock() {
  return (
    <MockFrame label="Example requirement by requirement fit analysis with a 76 percent score.">
      <MockHeader
        title="Fit analysis, backend engineer"
        subtitle="Northstar Systems"
        aside={
          <span className="caption-3 rounded-full bg-lp-success-soft px-2 py-1 text-lp-success">
            76%
          </span>
        }
      />
      <ul className="divide-y divide-lp-border">
        {FIT_REQUIREMENTS.map((item) => (
          <li key={item.req} className="flex items-start gap-3 px-4 py-3">
            <StatusIcon status={item.status} className="mt-0.5" />
            <div className="min-w-0">
              <p className={cn("caption-1", item.status === "gap" ? "text-lp-muted" : "text-lp-ink")}>
                {item.req}
              </p>
              <p className="caption-5 text-lp-muted">{item.evidence}</p>
            </div>
          </li>
        ))}
      </ul>
    </MockFrame>
  );
}

export function TailorMock() {
  return (
    <MockFrame label="Example resume edit shown side by side, original text and a suggested change waiting for approval.">
      <MockHeader title="Application preparation" aside={<IllustrativeTag />} />
      <div className="grid sm:grid-cols-2 sm:divide-x sm:divide-lp-border">
        <div className="p-4">
          <p className="caption-3 text-lp-muted">Original</p>
          <div className="mt-2 rounded-lg border border-lp-border bg-lp-surface p-3">
            <p className="caption-5 text-lp-body">
              Built REST APIs using FastAPI and PostgreSQL. Worked on backend services for internal tools.
            </p>
          </div>
        </div>
        <div className="border-t border-lp-border p-4 sm:border-t-0">
          <div className="flex items-center justify-between gap-2">
            <p className="caption-3 text-lp-accent-ink">Suggested</p>
            <span className="caption-4 rounded-full bg-lp-warning-soft px-2 py-0.5 text-lp-warning">
              Awaiting approval
            </span>
          </div>
          <div className="mt-2 rounded-lg border border-lp-border bg-lp-surface p-3">
            <p className="caption-5 text-lp-ink">
              Developed REST APIs using FastAPI and PostgreSQL,{" "}
              <span className="rounded-sm bg-lp-accent-soft">
                directly relevant to the backend platform requirements of this role.
              </span>
            </p>
          </div>
          <span className="button-xsm mt-3 flex w-full items-center justify-center rounded-lg bg-lp-accent px-3 py-2 text-white">
            Approve change
          </span>
        </div>
      </div>
    </MockFrame>
  );
}
