/* ============================================================================
   TextImpactScene.jsx  —  GovernX v3
   Props from Stage 8D:
     type      — "default" | "shatter" | "verdict"
     mainText  — primary large text
     subText   — secondary line
     context   — company name (default "GovernX")
     accent    — bool (unused in v3 — color logic handled by type)
   ============================================================================ */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const B = {
  bg   : "#0A0A0A",
  red  : "#FF0000",
  white: "#FFFFFF",
  dim  : "#AAAAAA",
  faint: "#1E1E1E",
  font : "Montserrat, Arial Black, sans-serif"
};

export const TextImpactScene = ({
  type     = "default",
  mainText = "",
  subText  = "",
  context  = "GovernX",
  accent   = true
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const isVerdict = type === "verdict";
  const isShatter = type === "shatter";

  // Gutter bar width
  const gutterW = spring({ frame, fps, from: 0, to: 6,
    config: { damping: 30, stiffness: 300 } });

  // Red accent line under gutter
  const lineW = spring({ frame, fps, from: 0, to: 72,
    config: { damping: 22, stiffness: 200 } });

  // Main text entrance
  const mainDelay = 4;
  const mainOp    = interpolate(frame, [mainDelay, mainDelay + 16], [0, 1], { extrapolateRight: "clamp" });
  const mainScale = spring({ frame: Math.max(0, frame - mainDelay), fps,
    from: isShatter ? 1.1 : 0.9, to: 1,
    config: { damping: isShatter ? 10 : 18 } });

  // Shatter: first text fades, sub explodes in
  const shatterFade = isShatter
    ? interpolate(frame, [20, 34], [1, 0.12], { extrapolateRight: "clamp" })
    : 1;

  const subDelay = isShatter ? 28 : 22;
  const subOp    = interpolate(frame, [subDelay, subDelay + 20], [0, 1], { extrapolateRight: "clamp" });
  const subY     = interpolate(frame, [subDelay, subDelay + 20], [20, 0], { extrapolateRight: "clamp" });
  const subScale = isShatter
    ? spring({ frame: Math.max(0, frame - subDelay), fps,
        from: 1.18, to: 1, config: { damping: 9, stiffness: 150 } })
    : 1;

  const ctxOp = interpolate(frame, [50, 66], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" });

  // Dynamic font sizing
  const mLen     = mainText.length;
  const mainSize = isVerdict
    ? (mLen > 28 ? 64 : mLen > 18 ? 80 : 96)
    : (mLen > 22 ? 88 : mLen > 14 ? 116 : 150);
  const subSize  = isShatter ? Math.round(mainSize * 0.78) : isVerdict ? 68 : 38;

  return (
    <AbsoluteFill style={{ backgroundColor: B.bg, opacity: fadeOut, overflow: "hidden" }}>

      {/* Subtle grid texture */}
      <div style={{
        position       : "absolute",
        inset          : 0,
        backgroundImage: "linear-gradient(rgba(255,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.025) 1px, transparent 1px)",
        backgroundSize : "96px 96px",
        pointerEvents  : "none"
      }} />

      {/* Left red gutter bar */}
      <div style={{
        position       : "absolute",
        left           : 0,
        top            : 0,
        bottom         : 0,
        width          : gutterW,
        backgroundColor: B.red
      }} />

      {/* Top-right corner accent */}
      <div style={{ position: "absolute", top: 44, right: 88, opacity: ctxOp * 0.7 }}>
        <div style={{ width: 44, height: 3, backgroundColor: B.red, marginBottom: 8 }} />
        <div style={{ width: 22, height: 2, backgroundColor: B.faint }} />
      </div>

      {/* Main content */}
      <div style={{
        position : "absolute",
        left     : 104,
        right    : 120,
        top      : "50%",
        transform: "translateY(-50%)"
      }}>

        {/* Slide-in underline */}
        <div style={{
          width          : lineW,
          height         : isVerdict ? 3 : 5,
          backgroundColor: B.red,
          marginBottom   : 40
        }} />

        {/* MAIN TEXT */}
        <div style={{
          fontFamily     : B.font,
          fontSize       : mainSize,
          fontWeight     : 900,
          color          : B.white,
          lineHeight     : 1.0,
          letterSpacing  : mainSize >= 130 ? "-0.01em" : "0.02em",
          opacity        : mainOp * shatterFade,
          transform      : `scale(${mainScale})`,
          transformOrigin: "left center",
          marginBottom   : subText ? 32 : 0,
          textTransform  : "uppercase"
        }}>
          {mainText}
        </div>

        {/* SUB TEXT */}
        {subText && (
          <div style={{
            fontFamily     : B.font,
            fontSize       : subSize,
            fontWeight     : isShatter || isVerdict ? 900 : 300,
            color          : isShatter || isVerdict ? B.red : B.dim,
            lineHeight     : 1.1,
            letterSpacing  : "0.04em",
            opacity        : subOp,
            transform      : `translateY(${subY}px) scale(${subScale})`,
            transformOrigin: "left center",
            textTransform  : "uppercase",
            marginBottom   : 40
          }}>
            {subText}
          </div>
        )}

        {/* Context tag */}
        <div style={{
          display   : "flex",
          alignItems: "center",
          gap       : 20,
          opacity   : ctxOp
        }}>
          <div style={{ width: 36, height: 2, backgroundColor: B.red }} />
          <div style={{
            fontFamily   : B.font,
            fontSize     : 16,
            fontWeight   : 600,
            color        : B.dim,
            letterSpacing: "0.14em",
            textTransform: "uppercase"
          }}>
            {context}
          </div>
        </div>

      </div>

      {/* GOVERNX watermark */}
      <div style={{
        position     : "absolute",
        bottom       : 48,
        right        : 88,
        fontFamily   : B.font,
        fontSize     : 13,
        fontWeight   : 900,
        color        : B.red,
        letterSpacing: "0.28em",
        opacity      : ctxOp * 0.85,
        textTransform: "uppercase"
      }}>
        GOVERNX
      </div>

    </AbsoluteFill>
  );
};
