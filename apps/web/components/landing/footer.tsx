import Link from "next/link";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "Features" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#profile", label: "Career profile" },
      { href: "#fit-analysis", label: "Fit analysis" },
      { href: "#tailoring", label: "Tailoring Studio" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#philosophy", label: "About" },
      { href: "mailto:hello@applypilot.app", label: "Contact" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-lp-border bg-lp-bg">
      <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-5 md:gap-10">
          <div className="col-span-2 sm:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-ink font-ui text-xs font-bold text-white">
                AP
              </span>
              <span className="font-ui text-[16px] font-semibold tracking-tight text-lp-ink">ApplyPilot</span>
            </Link>
            <p className="mt-3 max-w-[220px] font-ui text-[13px] leading-relaxed text-lp-muted">
              Know your value. Apply with confidence.
            </p>
            <div className="mt-5">
              <p className="font-ui text-[12px] text-lp-muted">
                Career intelligence for candidates.
              </p>
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-lp-ink">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="font-ui text-[13px] text-lp-muted transition-colors hover:text-lp-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-lp-border pt-6 font-ui text-[12px] text-lp-muted sm:flex-row sm:items-center">
          <p>© 2026 ApplyPilot. All rights reserved.</p>
          <p>Candidate-first. Evidence-based. You stay in control.</p>
        </div>
      </div>
    </footer>
  );
}
