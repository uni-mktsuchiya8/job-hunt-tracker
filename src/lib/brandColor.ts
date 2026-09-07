import type { CSSProperties } from "react";

// Defensive inline-style fallback for the primary brand color (emerald
// green, matching bg-emerald-700). This dev environment has
// intermittently failed to serve newly-added Tailwind utility classes
// after a server restart (seen first with the search icon's h-4/w-4,
// then again with bg-green-700 across the app), which silently drops
// the background color and leaves buttons invisible. Setting the color
// via inline style as well guarantees it shows up regardless of that —
// kept alongside the Tailwind classes, not instead of them, so hover/etc
// still work normally when the CSS does load.
export const BRAND_GREEN = "#047857";

export const brandGreenStyle: CSSProperties = {
  backgroundColor: BRAND_GREEN,
  color: "#fff",
};
