import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ui-canvas px-4 text-center">
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ui-teal"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ui-copper text-xs font-semibold text-white">
          AP
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-ui-ink">ApplyPilot</span>
      </Link>

      <div>
        <p className="mb-1 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ui-copper">
          404
        </p>
        <h1 className="text-[28px] font-semibold leading-[1.15] tracking-[-0.022em] text-ui-ink">
          Page not found
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-ui-body">
          This page doesn&apos;t exist or was moved. Head back to your dashboard.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-button)] bg-ui-teal px-4 text-sm font-medium text-white transition-colors hover:bg-ui-teal-hover"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
