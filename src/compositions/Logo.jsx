/* ============================================================================
   Logo.jsx — GovernX refined logo system (still assets, render with renderStill)
     variant="wordmark" → 1600×520 transparent  : full GOVERNX + red rule + tagline
     variant="monogram" → 800×800  transparent  : GX mark for watermark / favicon
     variant="profile"  → 800×800  navy          : circle-safe avatar (GX + rule)
   Flat, upright, solid red X — no plate, no outline. Red = signal only.
============================================================================ */

import React from "react";
import { AbsoluteFill } from "remotion";
import { COLOR, FONT } from "../theme";

export const Logo = ({ variant = "wordmark", bg = "" }) => {
  if (variant === "watermark") {
    // Tight GX for the YouTube corner watermark (~40px on screen). Minimal
    // padding so the mark fills the frame and stays legible when shrunk.
    return (
      <AbsoluteFill style={{ backgroundColor: bg || undefined }}>
        <svg viewBox="0 0 600 600" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <text x="300" y="452" textAnchor="middle" fontFamily={FONT.displayHeavy} fontSize="400" letterSpacing="-6">
            <tspan fill={COLOR.white}>G</tspan><tspan fill={COLOR.red}>X</tspan>
          </text>
        </svg>
      </AbsoluteFill>
    );
  }

  if (variant === "monogram") {
    return (
      <AbsoluteFill>
        <svg viewBox="0 0 800 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <text x="400" y="528" textAnchor="middle" fontFamily={FONT.displayHeavy} fontSize="380" letterSpacing="0">
            <tspan fill={COLOR.white}>G</tspan><tspan fill={COLOR.red}>X</tspan>
          </text>
        </svg>
      </AbsoluteFill>
    );
  }

  if (variant === "profile") {
    return (
      <AbsoluteFill style={{ backgroundColor: COLOR.navy }}>
        <svg viewBox="0 0 800 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="pg" cx="50%" cy="42%" r="72%">
              <stop offset="0%" stopColor={COLOR.navy} />
              <stop offset="100%" stopColor={COLOR.navyDeep} />
            </radialGradient>
          </defs>
          <rect width="800" height="800" fill="url(#pg)" />
          <text x="400" y="470" textAnchor="middle" fontFamily={FONT.displayHeavy} fontSize="330" letterSpacing="0">
            <tspan fill={COLOR.white}>G</tspan><tspan fill={COLOR.red}>X</tspan>
          </text>
          <rect x="300" y="512" width="200" height="8" fill={COLOR.red} />
          <text x="400" y="574" textAnchor="middle" fontFamily={FONT.sans} fontWeight="700" fontSize="34" letterSpacing="10" fill={COLOR.mist}>GOVERNX</text>
        </svg>
      </AbsoluteFill>
    );
  }

  // wordmark (transparent by default; bg only used for on-dark proofs)
  return (
    <AbsoluteFill style={{ backgroundColor: bg || undefined }}>
      <svg viewBox="0 0 1600 520" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <text x="800" y="272" textAnchor="middle" fontFamily={FONT.displayHeavy} fontSize="220" letterSpacing="3">
          <tspan fill={COLOR.white}>GOVERN</tspan><tspan fill={COLOR.red}>X</tspan>
        </text>
        <rect x="560" y="306" width="480" height="7" fill={COLOR.red} />
        <text x="800" y="392" textAnchor="middle" fontFamily={FONT.sans} fontWeight="700" fontSize="46" letterSpacing="24" fill={COLOR.white}>WHY SYSTEMS WIN</text>
      </svg>
    </AbsoluteFill>
  );
};
