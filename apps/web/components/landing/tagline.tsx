"use client";

import * as React from "react";
import { EASE_CLASS } from "./primitives";

const TAGLINE = "Know your value. Apply with confidence. Spend your time on the roles that fit you.";

/**
 * Tagline reveal (B11). Words start muted at 30% opacity and switch to full colour one at a time
 * as each crosses a trigger line 35% up from the bottom of the viewport. One IntersectionObserver
 * watches every word, so there is no scroll listener. Reduced motion shows final colour from CSS.
 */
export function LandingTagline() {
  const ref = React.useRef<HTMLParagraphElement>(null);
  const words = TAGLINE.split(" ");

  React.useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-word]"));
    const observer = new IntersectionObserver(
      (entries) => {
        let step = 0;
        for (const entry of entries) {
          // Words already scrolled past the top also count as reached.
          if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) continue;
          const el = entry.target as HTMLElement;
          el.style.transitionDelay = `${Math.min(step++ * 50, 400)}ms`;
          el.dataset.active = "true";
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -35% 0px", threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-label="Our promise" className="bg-lp-surface py-24">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-8">
        <p ref={ref} className="heading-2 mx-auto max-w-[680px] text-center text-lp-ink">
          {words.map((word, i) => (
            <React.Fragment key={i}>
              <span
                data-word
                className={`inline-block opacity-30 transition-opacity duration-500 ${EASE_CLASS} data-[active=true]:opacity-100`}
              >
                {word}
              </span>
              {i < words.length - 1 ? " " : null}
            </React.Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}
