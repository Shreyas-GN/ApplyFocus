import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCta() {
  return (
    <section className="bg-lp-lagoon py-24 sm:py-32">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] px-8 py-20 sm:px-16 sm:py-24">
          {/* Warm glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[640px] -translate-x-1/2 opacity-25"
            style={{ background: "radial-gradient(ellipse at 50% 0%, #C6533B, transparent 70%)" }}
          />

          {/* Subtle grid */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-[0.03]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative text-center">
            {/* Logo mark */}
            <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-lp-accent font-ui text-sm font-bold text-white shadow-lg">
              AF
            </div>

            <h2 className="mx-auto max-w-[640px] font-display text-[40px] leading-[1.06] text-white sm:text-[58px]">
              Know your value.
              <br />
              <span className="text-white/50">Apply with confidence.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-[480px] font-ui text-[17px] leading-[1.7] text-white/40">
              Bring your experience together, find opportunities worth pursuing, and prepare
              every application with intention — not volume.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup"
                className="group inline-flex h-14 items-center gap-2 rounded-full bg-lp-accent px-9 font-ui text-[15px] font-semibold text-white shadow-[0_4px_24px_rgba(198,83,59,0.4)] transition-all hover:bg-lp-accent-hover hover:shadow-[0_4px_32px_rgba(198,83,59,0.5)]"
              >
                Get started — it&apos;s free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-14 items-center rounded-full border border-white/10 px-8 font-ui text-[15px] font-medium text-white/50 transition-colors hover:border-white/20 hover:text-white/80"
              >
                Sign in
              </Link>
            </div>

            <p className="mt-5 font-ui text-[12px] text-white/20">
              Free account · No credit card · Candidate control guaranteed
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
