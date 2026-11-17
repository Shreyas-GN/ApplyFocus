import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Serif_Display, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dm-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  metadataBase: new URL("https://applyfocus.app"),
  title: {
    default: "ApplyFocus — Know your value. Apply with confidence.",
    template: "%s | ApplyFocus",
  },
  description:
    "A candidate-first career intelligence workspace. Understand your professional profile, evaluate opportunities with evidence, and prepare applications grounded in your actual experience.",
  keywords: [
    "career intelligence workspace",
    "job fit analysis",
    "candidate profile",
    "job search",
    "resume tailoring",
    "application tracker",
    "ApplyFocus",
  ],
  authors: [{ name: "ApplyFocus" }],
  creator: "ApplyFocus",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://applyfocus.app",
    title: "ApplyFocus — Know your value. Apply with confidence.",
    description:
      "Understand your professional profile, evaluate opportunities with evidence, and prepare better applications.",
    siteName: "ApplyFocus",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApplyFocus — Know your value. Apply with confidence.",
    description:
      "Understand your professional profile, evaluate opportunities with evidence, and prepare better applications.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${dmSerifDisplay.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster position="bottom-right" theme="light" />
      </body>
    </html>
  );
}
