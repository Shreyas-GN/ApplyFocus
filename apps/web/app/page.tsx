import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/nav";
import { LandingHero } from "@/components/landing/hero";
import { LandingProblems } from "@/components/landing/problems";
import { LandingTagline } from "@/components/landing/tagline";
import { LandingBenefits } from "@/components/landing/benefits";
import { LandingHowItWorks } from "@/components/landing/how-it-works";
import { LandingControl } from "@/components/landing/control";
import { LandingFaq } from "@/components/landing/faq";
import { LandingCta } from "@/components/landing/cta";
import { LandingFooter } from "@/components/landing/footer";
import { FAQS } from "@/components/landing/faq-data";

export const metadata: Metadata = {
  title: { absolute: "ApplyFocus | Know if you fit before you apply" },
  description:
    "ApplyFocus maps your skills to each job description with evidence from your own experience, so you apply to roles that fit and prepare every application with purpose.",
  alternates: { canonical: "/" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-lp-bg font-sans text-lp-ink">
      <a
        href="#main"
        className="body-4 fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-lp-ink px-3 py-2 text-lp-bg transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent"
      >
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <LandingHero />
        <LandingProblems />
        <LandingTagline />
        <LandingBenefits />
        <LandingHowItWorks />
        <LandingControl />
        <LandingFaq />
        <LandingCta />
      </main>
      <LandingFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
