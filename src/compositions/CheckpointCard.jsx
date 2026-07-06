/* ============================================================================
   CheckpointCard.jsx  —  GovernX v3
   Props from Stage 8D:
     date             — "April 2010" or "2007"
     event            — what happened (max ~80 chars)
     angle            — governance angle in CAPS
     checkpointNum    — 1, 2, 3...
     totalCheckpoints — total in this video
     variant          — "standard" | "root" | "outcome"
   ============================================================================ */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const B = {
  bg       : "#0A0A0A",
  red      : "#FF0000",
  white    : "#FFFFFF",
  dim      : "#999999",
  faint    : "#1A1A1A",
  darkRed  : "#8B0000",
  font     : "Montserrat, Arial Black, sans-serif"
};

export const CheckpointCard = ({
  date             = "2007",
  event            = "Decision event goes here",
  angle            = "GOVERNANCE FAILURE",
  checkpointNum    = 1,
  totalCheckpoints = 4,
  variant          = "standard"
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const isRoot    = variant === "root";
  const isOutcome = variant === "outcome";

  // Full-width red reveal bar animates across top
  const topBarW = spring({ frame, fps, from: 0, to: 1920,
    config: { damping: 26, stiffness: 180 } });

  // Left vertical bar grows down
  const vBarH = spring({ frame: Math.max(0, frame - 4), fps, from: 0, to: 340,
    config: { damping: 20, stiffness: 140 } });

  // Horizontal rule under date
  const ruleW = spring({ frame: Math.max(0, frame - 8), fps, from: 0, to: 400,
    config: { damping: 18, stiffness: 120 } });

  // Date punches in
  const dateOp = interpolate(frame, [8, 26], [0, 1], { extrapolateRight: "clamp" });
  const dateY  = interpolate(frame, [8, 26], [28, 0], { extrapolateRight: "clamp" });

  // Event text
  const eventOp = interpolate(frame, [22, 46], [0, 1], { extrapolateRight: "clamp" });
  const eventY  = interpolate(frame, [22, 46], [22, 0], { extrapolateRight: "clamp" });

  // Angle tag
  const angleOp = interpolate(frame, [40, 62], [0, 1], { extrapolateRight: "clamp" });
  const angleX  = interpolate(frame, [40, 62], [32, 0], { extrapolateRight: "clamp" });

  // Counter
  const ctrOp   = interpolate(frame, [55, 72], [0, 1], { extrapolateRight: "clamp" });

  // Fade out
  const fadeOut = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" });

  // Root cause gets a full-bleed dark red tint
  const bgColor = isRoot ? "#0D0404" : B.bg;
  const accentColor = isRoot ? "#FF2222" : B.red;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor, opacity: fadeOut, overflow: "hidden" }}>

      {/* Subtle grid */}
      <div style={{
        position       : "absolute",
        inset          : 0,
        backgroundImage: "linear-gradient(rgba(255,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.02) 1px, transparent 1px)",
        backgroundSize : "80px 80px",
        pointerEvents  : "none"
      }} />

      {/* Top red bar — full width reveal */}
      <div style={{
        position       : "absolute",
        top            : 0,
        left           : 0,
        height         : isRoot ? 6 : 4,
        width          : topBarW,
        backgroundColor: accentColor
      }} />

      {/* Left vertical accent bar */}
      <div style={{
        position       : "absolute",
        left           : 88,
        top            : "50%",
        marginTop      : -170,
        width          : isRoot ? 7 : 5,
        height         : vBarH,
        backgroundColor: accentColor
      }} />

      {/* Main content block */}
      <div style={{
        position: "absolute",
        left    : 128,
        right   : 160,
        top     : "50%",
        transform: "translateY(-50%)"
      }}>

        {/* Rule line under the bar */}
        <div style={{
          width          : ruleW,
          height         : 2,
          backgroundColor: accentColor,
          marginBottom   : 44,
          opacity        : 0.6
        }} />

        {/* DATE — very large */}
        <div style={{
          fontFamily   : B.font,
          fontSize     : isRoot ? 108 : 96,
          fontWeight   : 900,
          color        : isRoot ? accentColor : B.white,
          letterSpacing: "0.02em",
          lineHeight   : 1,
          opacity      : dateOp,
          transform    : `translateY(${dateY}px)`,
          marginBottom : 40,
          textTransform: "uppercase"
        }}>
          {date}
        </div>

        {/* EVENT */}
        <div style={{
          fontFamily  : B.font,
          fontSize    : 38,
          fontWeight  : 400,
          color       : B.white,
          lineHeight  : 1.45,
          maxWidth    : 1200,
          opacity     : eventOp,
          transform   : `translateY(${eventY}px)`,
          marginBottom: 52
        }}>
          {event}
        </div>

        {/* ANGLE TAG */}
        <div style={{
          display    : "inline-flex",
          alignItems : "center",
          gap        : 20,
          opacity    : angleOp,
          transform  : `translateX(${angleX}px)`
        }}>
          <div style={{
            width          : 44,
            height         : 3,
            backgroundColor: accentColor
          }} />
          <div style={{
            fontFamily   : B.font,
            fontSize     : 19,
            fontWeight   : 700,
            color        : accentColor,
            letterSpacing: "0.14em",
            textTransform: "uppercase"
          }}>
            {angle}
          </div>
        </div>

      </div>

      {/* Checkpoint counter — top right */}
      <div style={{
        position  : "absolute",
        top       : 52,
        right     : 88,
        opacity   : ctrOp,
        display   : "flex",
        alignItems: "center",
        gap       : 12
      }}>
        <div style={{
          fontFamily   : B.font,
          fontSize     : 16,
          fontWeight   : 700,
          color        : accentColor,
          letterSpacing: "0.18em",
          textTransform: "uppercase"
        }}>
          {isRoot ? "ROOT CAUSE" : isOutcome ? "OUTCOME" : "CHECKPOINT"}
        </div>
        {!isRoot && !isOutcome && (
          <div style={{
            fontFamily   : B.font,
            fontSize     : 16,
            fontWeight   : 400,
            color        : B.dim,
            letterSpacing: "0.1em"
          }}>
            {checkpointNum} / {totalCheckpoints}
          </div>
        )}
      </div>

      {/* GOVERNX watermark — bottom left */}
      <div style={{
        position     : "absolute",
        bottom       : 48,
        left         : 88,
        fontFamily   : B.font,
        fontSize     : 13,
        fontWeight   : 900,
        color        : accentColor,
        letterSpacing: "0.28em",
        opacity      : ctrOp * 0.85,
        textTransform: "uppercase"
      }}>
        GOVERNX
      </div>

    </AbsoluteFill>
  );
};
