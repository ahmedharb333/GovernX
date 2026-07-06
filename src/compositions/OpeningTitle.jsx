/* ============================================================================
   OpeningTitle.jsx
   GovernX branded opening title card per video
   4 seconds | 1920x1080 | 30fps

   Props:
     company    — company name
     discipline — "GRC" | "BPR" | "Both"
     hook       — the hook sentence
     contentId  — GX-2605-TECH-001
   ============================================================================ */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const BRAND = {
  bg       : "#0A0A0A",
  red      : "#FF0000",
  white    : "#FFFFFF",
  gray     : "#888888",
  fontEn   : "Montserrat, Arial, sans-serif"
};

export const OpeningTitle = ({
  company    = "Nokia",
  discipline = "GRC",
  hook       = "The hidden governance failure behind the collapse",
  contentId  = "GX-0000-TECH-001"
}) => {
  const frame  = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ── Top bar slides down ─────────────────────────────────────────────────────
  const barHeight = spring({ frame, fps, from: 0, to: 6, config: { damping: 25 } });

  // ── GOVERNX logo fade in ────────────────────────────────────────────────────
  const logoOpacity = interpolate(frame, [5, 25], [0, 1], { extrapolateRight: "clamp" });

  // ── Discipline tag ──────────────────────────────────────────────────────────
  const tagOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const tagX       = interpolate(frame, [15, 35], [-30, 0], { extrapolateRight: "clamp" });

  // ── Company name slams in ───────────────────────────────────────────────────
  const companyScale   = spring({ frame: Math.max(0, frame - 20), fps, from: 1.1, to: 1, config: { damping: 14 } });
  const companyOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });

  // ── Hook line ───────────────────────────────────────────────────────────────
  const hookOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const hookY       = interpolate(frame, [35, 55], [16, 0], { extrapolateRight: "clamp" });

  // ── Content ID ──────────────────────────────────────────────────────────────
  const idOpacity = interpolate(frame, [55, 75], [0, 1], { extrapolateRight: "clamp" });

  // ── Fade out ────────────────────────────────────────────────────────────────
  const fadeOut = interpolate(frame, [95, 120], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.bg, opacity: fadeOut }}>

      {/* ── Top red bar ──────────────────────────────────────────────────────── */}
      <div style={{
        position       : "absolute",
        top            : 0, left: 0, right: 0,
        height         : barHeight,
        backgroundColor: BRAND.red
      }} />

      {/* ── Bottom red bar ───────────────────────────────────────────────────── */}
      <div style={{
        position       : "absolute",
        bottom         : 0, left: 0, right: 0,
        height         : barHeight / 2,
        backgroundColor: BRAND.red,
        opacity        : 0.5
      }} />

      {/* ── GOVERNX logo top left ─────────────────────────────────────────────── */}
      <div style={{
        position     : "absolute",
        top          : 56,
        left         : 120,
        fontFamily   : BRAND.fontEn,
        fontSize     : 22,
        fontWeight   : 900,
        color        : BRAND.red,
        letterSpacing: "0.3em",
        opacity      : logoOpacity
      }}>
        GOVERNX
      </div>

      {/* ── Discipline tag ───────────────────────────────────────────────────── */}
      <div style={{
        position  : "absolute",
        top       : 52,
        right     : 120,
        display   : "flex",
        alignItems: "center",
        gap       : 12,
        opacity   : tagOpacity,
        transform : `translateX(${tagX}px)`
      }}>
        <div style={{
          backgroundColor: BRAND.red,
          padding        : "8px 20px",
          fontFamily     : BRAND.fontEn,
          fontSize       : 18,
          fontWeight     : 800,
          color          : BRAND.white,
          letterSpacing  : "0.15em"
        }}>
          {discipline}
        </div>
        <div style={{
          fontFamily   : BRAND.fontEn,
          fontSize     : 16,
          fontWeight   : 400,
          color        : BRAND.gray,
          letterSpacing: "0.1em"
        }}>
          ANALYSIS
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div style={{
        position      : "absolute",
        left          : 120,
        right         : 120,
        top           : "50%",
        transform     : "translateY(-55%)"
      }}>

        {/* Thin red line above company name */}
        <div style={{
          width          : interpolate(frame, [15, 35], [0, 120], { extrapolateRight: "clamp" }),
          height         : 3,
          backgroundColor: BRAND.red,
          marginBottom   : 32
        }} />

        {/* COMPANY NAME */}
        <div style={{
          fontFamily     : BRAND.fontEn,
          fontSize       : 136,
          fontWeight     : 900,
          color          : BRAND.white,
          letterSpacing  : "0.04em",
          lineHeight     : 0.9,
          opacity        : companyOpacity,
          transform      : `scale(${companyScale})`,
          transformOrigin: "left center",
          marginBottom   : 48
        }}>
          {company.toUpperCase()}
        </div>

        {/* HOOK */}
        <div style={{
          fontFamily : BRAND.fontEn,
          fontSize   : 32,
          fontWeight : 300,
          color      : BRAND.gray,
          lineHeight : 1.5,
          maxWidth   : 1200,
          opacity    : hookOpacity,
          transform  : `translateY(${hookY}px)`
        }}>
          {hook}
        </div>
      </div>

      {/* ── Content ID bottom right ───────────────────────────────────────────── */}
      <div style={{
        position     : "absolute",
        bottom       : 56,
        right        : 120,
        fontFamily   : BRAND.fontEn,
        fontSize     : 16,
        fontWeight   : 400,
        color        : BRAND.gray,
        letterSpacing: "0.15em",
        opacity      : idOpacity
      }}>
        {contentId}
      </div>

    </AbsoluteFill>
  );
};
