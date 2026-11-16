"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#resume", label: "Resume Engine" },
  { href: "#tracking", label: "Tracking" },
  { href: "#faq", label: "FAQ" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[60px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-lp-accent font-ui text-xs font-bold text-white">
            AP
          </span>
          <span className={`font-ui text-[16px] font-semibold tracking-tight transition-colors ${scrolled ? "text-lp-ink" : "text-white"}`}>
            ApplyPilot
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`font-ui text-[14px] transition-colors hover:opacity-100 ${
                scrolled ? "text-lp-body opacity-80 hover:text-lp-ink" : "text-white/70 hover:text-white"
              }`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={`hidden font-ui text-[14px] transition-colors md:block ${
              scrolled ? "text-lp-body hover:text-lp-ink" : "text-white/70 hover:text-white"
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className={`inline-flex h-9 items-center rounded-lg px-4 font-ui text-[13px] font-semibold transition-all ${
              scrolled
                ? "bg-lp-accent text-white hover:bg-lp-accent-hover"
                : "bg-white text-lp-lagoon hover:bg-white/90"
            }`}
          >
            Get started free
          </Link>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className={`flex h-9 w-9 flex-col items-center justify-center gap-[5px] rounded-lg md:hidden ${scrolled ? "" : ""}`}
          >
            <span className={`block h-[1.5px] w-5 transition-all ${scrolled ? "bg-lp-ink" : "bg-white"} ${open ? "translate-y-[6.5px] rotate-45" : ""}`} />
            <span className={`block h-[1.5px] w-5 transition-all ${scrolled ? "bg-lp-ink" : "bg-white"} ${open ? "opacity-0" : ""}`} />
            <span className={`block h-[1.5px] w-5 transition-all ${scrolled ? "bg-lp-ink" : "bg-white"} ${open ? "-translate-y-[6.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-lp-lagoon px-5 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 font-ui text-[15px] text-white/70 hover:bg-white/5 hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4">
            <Link href="/login" onClick={() => setOpen(false)} className="py-2.5 text-center font-ui text-sm text-white/70">Sign in</Link>
            <Link href="/signup" onClick={() => setOpen(false)} className="rounded-lg bg-lp-accent py-2.5 text-center font-ui text-sm font-semibold text-white">Get started free</Link>
          </div>
        </div>
      )}
    </header>
  );
}
