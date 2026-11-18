import Link from "next/link";
import { cn } from "@/lib/utils";
import { FOCUS_RING, T_HOVER } from "./tokens";

const COLS = [
  {
    title: "Product",
    links: [
      { href: "#benefits", label: "Benefits" },
      { href: "#how-it-works", label: "How it works" },
      { href: "#faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "#control", label: "Candidate control" },
      { href: "mailto:hello@applyfocus.app", label: "Contact" },
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
    <footer className="border-t border-lp-border bg-lp-surface">
      <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-12 sm:grid-cols-5">
          <div className="col-span-2">
            <Link href="/" className={cn("inline-flex items-center gap-2 rounded-lg", FOCUS_RING)}>
              <span className="caption-3 flex size-8 items-center justify-center rounded-lg bg-lp-accent text-white">
                AF
              </span>
              <span className="body-1 text-lp-ink">ApplyFocus</span>
            </Link>
            <p className="body-6 mt-3 max-w-[16rem] text-lp-muted">
              A more considered way to navigate your career.
            </p>
          </div>

          {COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="caption-3 text-lp-ink">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className={cn(
                        "body-6 rounded-sm text-lp-muted hover:text-lp-ink",
                        T_HOVER,
                        FOCUS_RING,
                      )}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-lp-border pt-6 sm:flex-row sm:items-center">
          <p className="caption-2 text-lp-muted">© 2026 ApplyFocus</p>
          <p className="caption-2 text-lp-muted">Better career decisions, not more applications.</p>
        </div>
      </div>
    </footer>
  );
}
