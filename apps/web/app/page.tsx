import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LandingProblem } from "@/components/landing/problem";
import { LandingBento } from "@/components/landing/bento";
import { LandingProfileSection } from "@/components/landing/profile-section";
import { LandingFitAnalysis } from "@/components/landing/fit-analysis";
import { LandingStrategy } from "@/components/landing/strategy";
import { LandingResume } from "@/components/landing/resume-section";
import { LandingTracking } from "@/components/landing/tracking-section";
import { LandingPhilosophy } from "@/components/landing/philosophy";
import { LandingFaq } from "@/components/landing/faq";
import { LandingCta } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="bg-lp-bg text-lp-ink">
      <LandingNav />
      <LandingHero />
      <LandingProblem />
      <LandingBento />
      <LandingProfileSection />
      <LandingFitAnalysis />
      <LandingStrategy />
      <LandingResume />
      <LandingTracking />
      <LandingPhilosophy />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
