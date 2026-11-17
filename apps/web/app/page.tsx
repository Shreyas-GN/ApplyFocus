import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LandingProblems } from "@/components/landing/problems";
import { LandingBento } from "@/components/landing/bento";
import { LandingFitAnalysis } from "@/components/landing/fit-analysis";
import { LandingPhilosophy } from "@/components/landing/philosophy";
import { LandingResume } from "@/components/landing/resume-section";
import { LandingTracking } from "@/components/landing/tracking-section";
import { LandingFaq } from "@/components/landing/faq";
import { LandingCta } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="bg-white text-lp-ink">
      <LandingNav />
      <LandingHero />
      <LandingProblems />
      <LandingBento />
      <LandingFitAnalysis />
      <LandingPhilosophy />
      <LandingResume />
      <LandingTracking />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
