import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCta() {
  return (
    <section className="bg-lp-bg py-16 sm:py-24">
      <div className="mx-auto max-w-[1040px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-lp-lagoon px-6 py-16 text-center shadow-[0_20px_60px_rgba(21,94,99,0.25)] sm:px-12 sm:py-20">
          {/* Subtle blob */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(ellipse, #155e63 0%, transparent 70%)" }}
          />

          <div className="relative">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-lp-accent font-ui text-sm font-bold text-white shadow-sm">
              AP
            </div>
            <h2 className="mx-auto mt-6 max-w-[640px] font-ui text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-white sm:text-[46px]">
              Make your next move a considered one.
            </h2>
            <p className="mx-auto mt-4 max-w-[500px] font-ui text-[16px] leading-[1.65] text-white/70">
              Bring your experience together. Find opportunities worth pursuing. Prepare every
              application with intention.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 font-ui text-[14px] font-semibold text-lp-lagoon shadow-sm transition-all hover:bg-lp-accent-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Get started with ApplyPilot
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/20 px-6 font-ui text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/10"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-5 font-ui text-xs text-white/40">
              Free account creation · No credit card required · Candidate control guaranteed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
