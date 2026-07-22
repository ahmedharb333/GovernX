/* ============================================================================
   theme.js — GovernX Design Tokens (Pilot 001 MVP)
   Art direction extracted from the Wells Fargo investigative-poster reference:
     • Navy authority background, off-white "document" cards
     • Red used ONLY as signal (arrows, stamps, rules, the failure marker)
     • Yellow ONLY for one critical date/emphasis tag
     • Huge condensed number hierarchy, small tracked caps for labels
     • Case-file language: masthead rule, stamp, source footer, verified badge

   Used by the pilot/* compositions. Existing compositions are untouched.
   Fonts are system-safe (render machine is Windows): Georgia (masthead/serif),
   Arial Narrow / Impact (condensed display), Courier New (stamps/source lines),
   Montserrat/Arial (UI). To upgrade later: @remotion/google-fonts Anton+Oswald.
   ============================================================================ */

export const COLOR = {
  // Authority grounds
  navy      : "#111B2E",   // primary background
  navyDeep  : "#0B1220",   // vignette / darker band
  navyPanel : "#1A2740",   // raised panel on navy

  // Document / paper
  paper     : "#F4F0E4",   // off-white evidence card
  paperEdge : "#DED7C2",   // card border
  paperShade: "#E9E3D2",   // ruled area / footer strip on paper
  ink       : "#16233B",   // navy text on paper (brand ink)
  inkSoft   : "#5C5A4E",   // secondary text on paper

  // Signal (RED = meaning, never decoration)
  red       : "#C8102E",   // GovernX signal red (arrows, rules, failure marker)
  redDeep   : "#8E0E20",   // pressed / stamp border
  redWash   : "rgba(200,16,46,0.10)",

  // Critical emphasis (sparingly)
  yellow    : "#F2C230",   // one date/emphasis tag per scene, max
  yellowInk : "#3A2E05",

  // Text on navy
  white     : "#FFFFFF",
  mist      : "#AEB9CC",   // muted label on navy
  mistDim   : "#6E7A90",

  // Trust
  verified  : "#1E7A46",   // verified claim badge
  verifiedBg: "#E4F1E9",
  primaryBg : "#EEF2F8",
  primaryInk: "#1F3A5F"
};

export const FONT = {
  // Condensed heavy display — numbers, poster titles (Impact is the reliable
  // Windows heavy-condensed; Arial Narrow the fallback body-condensed)
  display : '"Arial Narrow", "Helvetica Neue", Arial, sans-serif',
  displayHeavy : 'Impact, "Haettenschweiler", "Arial Narrow", sans-serif',
  // Editorial masthead / verdicts
  serif   : 'Georgia, "Times New Roman", serif',
  // UI / labels
  sans    : 'Montserrat, "Helvetica Neue", Arial, sans-serif',
  // Stamps, source lines, case-file codes
  mono    : '"Courier New", "Consolas", monospace'
};

// Type scale (px @ 1920×1080)
export const SIZE = {
  hero      : 300,  // the dominant number
  heroSub   : 96,
  title     : 64,
  kicker    : 30,
  h2        : 40,
  body      : 28,
  label     : 20,  // tracked caps labels
  source    : 22,  // source footer
  micro     : 16
};

export const SPACE = { xs: 8, sm: 16, md: 28, lg: 48, xl: 80, margin: 120 };

export const RADIUS = { card: 6, pill: 999, none: 0 };

export const TRACK = { tight: "-0.02em", label: "0.18em", stamp: "0.24em" };

// Reusable style fragments -----------------------------------------------------

// Off-white evidence/document card
export const cardStyle = {
  backgroundColor: COLOR.paper,
  border         : `1.5px solid ${COLOR.paperEdge}`,
  borderRadius   : RADIUS.card,
  boxShadow      : "0 24px 60px rgba(0,0,0,0.45)",
  boxSizing      : "border-box"
};

// Small tracked-caps label (analyst label)
export const labelStyle = (color) => ({
  fontFamily   : FONT.sans,
  fontSize     : SIZE.label,
  fontWeight   : 700,
  letterSpacing: TRACK.label,
  textTransform: "uppercase",
  color        : color || COLOR.mist
});

// Source footer line: "SOURCE: CFPB, 2016"
export const sourceLineStyle = {
  fontFamily   : FONT.mono,
  fontSize     : SIZE.source,
  letterSpacing: "0.08em",
  color        : COLOR.mist,
  textTransform: "uppercase"
};

// Motion tokens — editorial, NOT bouncy (linear/quart eases, short)
export const EASE = {
  out  : (t) => 1 - Math.pow(1 - t, 3),      // reveal
  inOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t)
};

export default { COLOR, FONT, SIZE, SPACE, RADIUS, TRACK, cardStyle, labelStyle, sourceLineStyle, EASE };
