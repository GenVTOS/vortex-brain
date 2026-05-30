// Vortex design tokens — every color has exactly ONE meaning (spec §7.4).
// Mirrors the `T` object in the vortex-final.jsx prototype so ported screens
// stay pixel-faithful. Use these in inline styles; Tailwind class equivalents
// live in tailwind.config.ts.

export const T = {
  bg: "#0B0C10",
  glass: "rgba(255,255,255,0.035)",
  border: "rgba(255,255,255,0.055)",
  green: "#4ECDC4", // healthy / on-track / high confidence
  amber: "#F0AD4E", // needs attention / watch / medium
  red: "#FF6B6B", // critical / overdue / low confidence
  blue: "#7EB8DA", // informational / neutral / bot-generated
  plum: "#B8A0D2", // wisdom / AI insight / pattern
  rose: "#E8849A", // personal / wife / family (never in business context)
  white: "#E8E6E1", // primary text
  sub: "rgba(255,255,255,0.35)", // secondary text
  muted: "rgba(255,255,255,0.14)", // tertiary / labels
  gradient:
    "linear-gradient(135deg, rgba(78,205,196,0.06), rgba(184,160,210,0.06))",
} as const;

// Company pills are NOT brand-colored — their color reflects HEALTH status.
export const healthColor = (h: number): string =>
  h >= 80 ? T.green : h >= 60 ? T.amber : T.red;

// Confidence uses the same three-band scale.
export const confColor = (c: number): string =>
  c >= 85 ? T.green : c >= 60 ? T.amber : T.red;

// Urgency → color (used by shimmer bars on Glass cards).
export const urgencyColor = (u: "high" | "medium" | "low" | string): string =>
  u === "high" ? T.red : u === "medium" ? T.amber : T.green;
