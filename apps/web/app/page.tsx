import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LandingBento } from "@/components/landing/bento";
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
      <LandingBento />
      <LandingResume />
      <LandingTracking />
      <LandingPhilosophy />
      <LandingFaq />
      <LandingCta />
      <LandingFooter />
    </div>
  );
}
