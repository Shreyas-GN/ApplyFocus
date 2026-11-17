import Link from "next/link";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "#how-it-works", label: "Features" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#fit-analysis",  label: "Fit Analysis" },
      { href: "#faq",           label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#philosophy",              label: "About" },
      { href: "mailto:hello@applyfocus.app", label: "Contact" },
      { href: "/privacy",                 label: "Privacy" },
      { href: "/terms",                   label: "Terms" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login",  label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-lp-border bg-white">
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-8 sm:py-16">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-lp-accent font-ui text-xs font-bold text-white">
                AF
              </span>
              <span className="font-ui text-[17px] font-bold tracking-[-0.02em] text-lp-ink">ApplyFocus</span>
            </Link>
            <p className="mt-3 max-w-[220px] font-ui text-[13px] leading-relaxed text-lp-muted">
              A more considered way to navigate your career.
            </p>
            <p className="mt-5 font-ui text-[12px] italic text-lp-muted/70">
              Know your value. Apply with confidence.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-lp-ink">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="font-ui text-[13px] text-lp-muted transition-colors hover:text-lp-ink"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-lp-border pt-6 font-ui text-[12px] text-lp-muted sm:flex-row sm:items-center">
          <p>© 2026 ApplyFocus</p>
          <p>Better career decisions, not more applications.</p>
        </div>
      </div>
    </footer>
  );
}
