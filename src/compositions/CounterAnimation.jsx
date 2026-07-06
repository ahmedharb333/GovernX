/* ============================================================================
   CounterAnimation.jsx  —  GovernX v3
   Standalone count-up animation for dramatic data reveals.

   Props:
     from     — starting number (default 0)
     to       — ending number (required)
     prefix   — display prefix before the number (e.g. "$")
     suffix   — display suffix after the number (e.g. "B", "M", "%")
     label    — description text shown below the number
     context  — secondary footnote text (optional)
     voiceoverSync — voiceover text (used for duration calc in GAS, not rendered)

   REMOTION_DATA format (Visual Library col 19):
     type=COUNTER_ANIMATION | from=0 | to=7.2 | unit=$B | label=Pension Deficit | context=At acquisition

   GAS buildRenderPayload splits unit → prefix + suffix:
     "$B" → prefix="$", suffix="B"
     "%" → prefix="", suffix="%"
     "$"  → prefix="$", suffix=""
   ============================================================================ */

import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const B = {
  bg   : "#0A0A0A",
  red  : "#FF0000",
  white: "#FFFFFF",
  dim  : "#888888",
  faint: "#1C1C1C",
  font : "Montserrat, Arial Black, sans-serif"
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const CounterAnimation = ({
  from         = 0,
  to           = 100,
  prefix       = "",
  suffix       = "",
  label        = "",
  context      = "",
  voiceoverSync = ""
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fromNum = parseFloat(from) || 0;
  const toNum   = parseFloat(to)   || 0;

  // Decide decimal places: match the precision in `to`
  const toStr         = String(to).trim();
  const dotIdx        = toStr.indexOf(".");
  const decimalPlaces = dotIdx >= 0 ? toStr.length - dotIdx - 1 : 0;

  // Count-up timeline: start at frame 8, finish at ~2.2s or 80% of total
  const countStart = 8;
  const countEnd   = Math.min(Math.round(fps * 2.2), Math.round(durationInFrames * 0.78));

  const rawVal = interpolate(
    frame,
    [countStart, countEnd],
    [fromNum, toNum],
    {
      extrapolateLeft : "clamp",
      extrapolateRight: "clamp",
      easing: t => 1 - Math.pow(1 - t, 3)   // ease-out cubic
    }
  );

  // Red glow peaks just as the counter finishes, then settles
  const glowProgress = interpolate(
    frame,
    [countEnd - 4, countEnd + 6, countEnd + fps * 0.6],
    [0, 1, 0.35],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Opacity envelope
  const fadeIn  = interpolate(frame, [0, 16], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);

  // Label / context stagger
  const labelOp   = interpolate(frame, [22, 38], [0, 1], { extrapolateRight: "clamp" });
  const sepOp     = interpolate(frame, [18, 30], [0, 1], { extrapolateRight: "clamp" });
  const contextOp = interpolate(frame, [36, 52], [0, 1], { extrapolateRight: "clamp" });
  const logoOp    = interpolate(frame, [14, 28], [0, 1], { extrapolateRight: "clamp" });

  // Formatted display value
  const displayVal = decimalPlaces > 0
    ? rawVal.toFixed(decimalPlaces)
    : Math.round(rawVal).toLocaleString();

  // Responsive font size based on total character count
  const fullStr   = prefix + displayVal + suffix;
  const charCount = fullStr.replace(/,/g, "").length;  // ignore commas for sizing
  const numFontSize    = charCount <= 4 ? 280 : charCount <= 6 ? 230 : charCount <= 8 ? 185 : 145;
  const affixFontSize  = Math.round(numFontSize * 0.42);
  const affixBaseline  = Math.round(numFontSize * 0.055);   // lift affix to baseline

  const glowFilter = glowProgress > 0.08
    ? `drop-shadow(0 0 ${Math.round(glowProgress * 48)}px rgba(255,0,0,${(glowProgress * 0.65).toFixed(2)}))`
    : "none";

  return (
    <AbsoluteFill style={{ backgroundColor: B.bg, opacity, overflow: "hidden" }}>

      {/* Subtle red grid texture */}
      <div style={{
        position       : "absolute",
        inset          : 0,
        backgroundImage: "linear-gradient(rgba(255,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.025) 1px, transparent 1px)",
        backgroundSize : "96px 96px",
        pointerEvents  : "none"
      }} />

      {/* Red top bar */}
      <div style={{
        position       : "absolute",
        top            : 0,
        left           : 0,
        right          : 0,
        height         : 4,
        backgroundColor: B.red
      }} />

      {/* GOVERNX watermark */}
      <div style={{
        position     : "absolute",
        bottom       : 44,
        right        : 88,
        fontFamily   : B.font,
        fontSize     : 13,
        fontWeight   : 900,
        color        : B.red,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        opacity      : logoOp * 0.85
      }}>
        GOVERNX
      </div>

      {/* Centre content */}
      <div style={{
        position      : "absolute",
        inset         : 0,
        display       : "flex",
        flexDirection : "column",
        alignItems    : "center",
        justifyContent: "center"
      }}>

        {/* Number row */}
        <div style={{
          display   : "flex",
          alignItems: "flex-end",
          lineHeight: 1,
          filter    : glowFilter
        }}>

          {/* Prefix e.g. "$" */}
          {prefix !== "" && (
            <div style={{
              fontFamily   : B.font,
              fontSize     : affixFontSize,
              fontWeight   : 900,
              color        : B.red,
              letterSpacing: "-0.02em",
              lineHeight   : 1,
              marginBottom : affixBaseline,
              userSelect   : "none"
            }}>
              {prefix}
            </div>
          )}

          {/* The animated number */}
          <div style={{
            fontFamily   : B.font,
            fontSize     : numFontSize,
            fontWeight   : 900,
            color        : B.white,
            letterSpacing: "-0.03em",
            lineHeight   : 1,
            userSelect   : "none"
          }}>
            {displayVal}
          </div>

          {/* Suffix e.g. "B", "M", "%" */}
          {suffix !== "" && (
            <div style={{
              fontFamily   : B.font,
              fontSize     : affixFontSize,
              fontWeight   : 900,
              color        : B.red,
              letterSpacing: "-0.02em",
              lineHeight   : 1,
              marginBottom : affixBaseline,
              userSelect   : "none"
            }}>
              {suffix}
            </div>
          )}
        </div>

        {/* Red separator line */}
        {label !== "" && (
          <div style={{
            width          : 72,
            height         : 3,
            backgroundColor: B.red,
            marginTop      : 32,
            marginBottom   : 28,
            opacity        : sepOp
          }} />
        )}

        {/* Label */}
        {label !== "" && (
          <div style={{
            fontFamily   : B.font,
            fontSize     : 28,
            fontWeight   : 700,
            color        : B.white,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textAlign    : "center",
            maxWidth     : 960,
            lineHeight   : 1.3,
            opacity      : labelOp
          }}>
            {label}
          </div>
        )}

        {/* Context */}
        {context !== "" && (
          <div style={{
            fontFamily   : B.font,
            fontSize     : 16,
            fontWeight   : 400,
            color        : B.dim,
            letterSpacing: "0.10em",
            textTransform: "uppercase",
            textAlign    : "center",
            maxWidth     : 720,
            marginTop    : 18,
            lineHeight   : 1.5,
            opacity      : contextOp
          }}>
            {context}
          </div>
        )}

      </div>

    </AbsoluteFill>
  );
};
