import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="bg-lp-surface py-16 sm:py-20">
      <div className="mx-auto max-w-[900px] px-5 text-center sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-lp-lagoon px-8 py-16 sm:px-16 sm:py-20">
          {/* glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[600px] -translate-x-1/2 opacity-30"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #355CFF, transparent 70%)" }}
          />
          <div className="relative">
            <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-lp-accent font-ui text-sm font-bold text-white">
              AP
            </div>
            <h2 className="mx-auto max-w-[560px] font-display text-[32px] leading-[1.1] text-white sm:text-[46px]">
              Make your next move a considered one.
            </h2>
            <p className="mx-auto mt-4 max-w-[460px] font-ui text-[16px] leading-[1.65] text-white/50">
              Bring your experience together, find roles worth pursuing, and prepare
              every application with intention — not volume.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-white px-7 font-ui text-[14px] font-semibold text-lp-lagoon transition-all hover:bg-lp-accent-soft"
              >
                Get started with ApplyPilot
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center rounded-xl border border-white/10 px-6 font-ui text-[14px] font-medium text-white/60 transition-colors hover:border-white/20 hover:text-white"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-5 font-ui text-[12px] text-white/25">
              Free account · No credit card · Candidate control guaranteed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
