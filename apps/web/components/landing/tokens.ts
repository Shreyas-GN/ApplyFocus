/** Base curve for every transition and animation on the landing page. */
export const EASE_CLASS = "ease-[cubic-bezier(0.22,1,0.36,1)]";
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Position and opacity changes. */
export const T_MOVE = `transition-[transform,opacity] duration-500 ${EASE_CLASS}`;
/** Hover colour and opacity shifts. */
export const T_HOVER = `transition-[color,background-color,border-color,transform,opacity] duration-300 ${EASE_CLASS}`;

export const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lp-accent";
