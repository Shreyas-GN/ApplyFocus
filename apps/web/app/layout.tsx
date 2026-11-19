import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { ThemedToaster } from "@/components/themed-toaster";

// One typeface for the whole site, with Geist Mono for data and numeric UI.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
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
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        {/* Anti-flash: apply stored theme before first paint */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('af-theme')||(window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        <ThemedToaster />
      </body>
    </html>
  );
}
