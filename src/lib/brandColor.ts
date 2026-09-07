import type { CSSProperties } from "react";

// Defensive inline-style fallback for the primary brand color (green,
// matching bg-green-600). This dev environment has intermittently failed
// to serve newly-added Tailwind utility classes after a server restart
// (seen first with the search icon's h-4/w-4, then again with a color
// rename across the app), which silently drops the background color and
// leaves buttons invisible. Setting the color via inline style as well
// guarantees it shows up regardless of that — kept alongside the
// Tailwind classes, not instead of them, so hover/etc still work
// normally when the CSS does load.
//
// Named generically (not e.g. BRAND_TEAL) since this has already
// changed color twice by request — keeping the identifier stable saves
// a repo-wide rename next time the shade changes again.
export const BRAND_COLOR = "#00a544";

export const brandButtonStyle: CSSProperties = {
  backgroundColor: BRAND_COLOR,
  color: "#fff",
};
