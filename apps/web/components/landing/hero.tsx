"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, TrendingUp, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

export function LandingHero() {
  return (
    <section className="relative min-h-screen min-h-[100dvh] overflow-hidden bg-lp-lagoon pt-[60px]">
      {/* Background radial glow */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, #355CFF 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute -right-64 top-1/3 h-[500px] w-[600px] opacity-10"
          style={{
            background:
              "radial-gradient(ellipse, #D8F06A 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Grid texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 pb-0 pt-24 sm:px-8 sm:pt-32">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-[11px] tracking-[0.14em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-lp-accent" />
            CAREER INTELLIGENCE PLATFORM
          </span>
        </motion.div>

        {/* H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.07 }}
          className="mx-auto mt-8 max-w-[860px] text-center font-ui text-[36px] font-bold leading-[1.08] tracking-[-0.03em] text-white sm:text-[56px] sm:leading-[1.04] sm:tracking-[-0.04em] lg:text-[84px]"
        >
          Your next role starts with knowing yourself.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.14 }}
          className="mx-auto mt-5 max-w-[560px] text-center font-ui text-[16px] leading-[1.6] text-white/55 sm:mt-6 sm:text-[20px]"
        >
          One workspace to understand your strengths, discover the right opportunities, and build applications that actually reflect your work.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/signup"
            className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-7 font-ui text-[15px] font-semibold text-lp-lagoon shadow-lg transition-all hover:bg-lp-accent-soft sm:w-auto"
          >
            Get started — it&apos;s free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <a
            href="#features"
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-white/10 px-7 font-ui text-[15px] font-medium text-white/70 transition-all hover:border-white/20 hover:text-white sm:w-auto"
          >
            See how it works
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="mt-4 text-center font-ui text-[13px] text-white/30"
        >
          Free account · No credit card · Full candidate control
        </motion.p>

        {/* Product window — anchored to bottom of dark section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="relative mt-12 sm:mt-20"
        >
          {/* Fade-out gradient at bottom so it blends into white */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-32"
            style={{
              background:
                "linear-gradient(to bottom, transparent, #0F1729)",
            }}
          />

          <div className="overflow-hidden rounded-t-2xl border border-white/10 shadow-[0_-24px_80px_rgba(53,92,255,0.3)]">
            {/* Window chrome */}
            <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-5 py-3.5">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 text-center">
                <span className="rounded border border-white/10 bg-white/5 px-4 py-1 font-mono text-[11px] text-white/30">
                  applypilot.app/dashboard
                </span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-[#0F1729] p-4 sm:p-7">
              {/* Stats row */}
              <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:grid-cols-4 sm:gap-3">
                {[
                  { label: "Matched roles", value: "24", delta: "+6 today", up: true },
                  { label: "Active pipeline", value: "7", delta: "3 interviewing", up: true },
                  { label: "Response rate", value: "34%", delta: "above avg", up: true },
                  { label: "Profile score", value: "91%", delta: "near complete", up: false },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-white/30">{s.label}</p>
                    <p className="mt-1.5 font-ui text-2xl font-semibold text-white">{s.value}</p>
                    <p className={`mt-0.5 font-ui text-[11px] ${s.up ? "text-emerald-400/70" : "text-lp-accent/70"}`}>{s.delta}</p>
                  </div>
                ))}
              </div>

              {/* Two columns */}
              <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
                {/* Job list */}
                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-ui text-[13px] font-semibold text-white/80">Top matches for you</span>
                    <span className="rounded-md bg-lp-accent/20 px-2 py-0.5 font-mono text-[10px] text-lp-accent">AI ranked</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { role: "Senior Product Designer", co: "Figma", loc: "Remote", score: 91, color: "text-emerald-400" },
                      { role: "Design Systems Lead", co: "Notion", loc: "SF / Hybrid", score: 84, color: "text-emerald-400/80" },
                      { role: "Head of Product Design", co: "Linear", loc: "Remote", score: 77, color: "text-amber-400/80" },
                      { role: "Staff Product Designer", co: "Vercel", loc: "Remote", score: 73, color: "text-amber-400/70" },
                    ].map((j) => (
                      <div key={j.role} className="flex items-center justify-between rounded-lg border border-white/5 px-3.5 py-3 hover:bg-white/5">
                        <div>
                          <p className="font-ui text-[13px] font-medium text-white/80">{j.role}</p>
                          <p className="font-ui text-[11px] text-white/30">{j.co} · {j.loc}</p>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className={`font-mono text-sm font-semibold ${j.color}`}>{j.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right panel */}
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-lp-accent" />
                      <span className="font-ui text-[13px] font-semibold text-white/80">Next actions</span>
                    </div>
                    <div className="space-y-2">
                      {["Tailor resume for Figma role", "Follow up — Notion (8d)", "Complete skills section"].map((a) => (
                        <div key={a} className="flex items-start gap-2.5 rounded-lg border border-white/5 px-3 py-2.5">
                          <span className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded border border-white/20" />
                          <p className="font-ui text-[12px] leading-snug text-white/50">{a}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400/70" />
                      <span className="font-ui text-[13px] font-semibold text-white/80">Pipeline</span>
                    </div>
                    <div className="mt-2 flex gap-1">
                      {[
                        { label: "Saved", w: "w-[20%]", color: "bg-white/10" },
                        { label: "Applied", w: "w-[35%]", color: "bg-lp-accent/40" },
                        { label: "Interview", w: "w-[30%]", color: "bg-lp-accent/70" },
                        { label: "Offer", w: "w-[15%]", color: "bg-emerald-500/60" },
                      ].map((b) => (
                        <div key={b.label} className={`${b.w} h-2 rounded-full ${b.color}`} title={b.label} />
                      ))}
                    </div>
                    <div className="mt-2 flex gap-3">
                      {[{ n: "12", l: "Saved" }, { n: "7", l: "Applied" }, { n: "3", l: "Interview" }, { n: "1", l: "Offer" }].map((s) => (
                        <div key={s.l}>
                          <p className="font-ui text-sm font-semibold text-white/70">{s.n}</p>
                          <p className="font-mono text-[10px] text-white/25">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
