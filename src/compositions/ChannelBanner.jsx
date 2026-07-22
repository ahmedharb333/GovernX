/* ============================================================================
   ChannelBanner.jsx — GovernX YouTube channel banner (2048×1152 still)
   Rendered with renderStill() so the fonts/colours are pixel-identical to the
   films. All critical content lives inside the centred 1235×338 mobile-safe
   area; the wide margins carry only faint case-file texture for TV/desktop.
   Design law kept: red = signal only (the X, the rule, the period).
============================================================================ */

import React from "react";
import { AbsoluteFill } from "remotion";
import { COLOR, FONT } from "../theme";

export const ChannelBanner = ({
  kicker  = "REVERSE-ENGINEERING CORPORATE GOVERNANCE",
  tagline = "EVERY COLLAPSE — AND EVERY WIN — HAS AN ARCHITECTURE",
  cadence = "NEW CASE FILES · DROPPING REGULARLY"
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy }}>
      <svg viewBox="0 0 2048 1152" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bg" cx="50%" cy="46%" r="75%">
            <stop offset="0%"   stopColor={COLOR.navy} />
            <stop offset="100%" stopColor={COLOR.navyDeep} />
          </radialGradient>
          <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0V64" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.035" />
          </pattern>
        </defs>

        {/* ground */}
        <rect width="2048" height="1152" fill="url(#bg)" />
        <rect width="2048" height="1152" fill="url(#grid)" />

        {/* case-file texture — only seen on wide TV/desktop crops. Kept faint so
            it reads as atmosphere, not clutter, but lifted enough to register. */}
        <g fill={COLOR.mist} opacity="0.20" fontFamily={FONT.mono} fontSize="16" letterSpacing="3">
          <text x="70" y="300">CASE FILE Nº GX-26</text>
          <text x="70" y="820">EVIDENCE · VERIFIED</text>
          <text x="1978" y="300" textAnchor="end">CORPORATE GOVERNANCE</text>
          <text x="1978" y="820" textAnchor="end">ON THE RECORD</text>
        </g>
        <g opacity="0.12" fill={COLOR.mist}>
          <rect x="70" y="320" width="250" height="12" /><rect x="70" y="344" width="200" height="12" /><rect x="70" y="368" width="230" height="12" />
          <rect x="1728" y="320" width="250" height="12" /><rect x="1778" y="344" width="200" height="12" /><rect x="1748" y="368" width="230" height="12" />
        </g>

        {/* ===== centred masthead — all inside the 1235×338 mobile-safe area ===== */}
        <g textAnchor="middle">
          <text x="1024" y="474" fontFamily={FONT.mono} fontSize="24" letterSpacing="8" fill={COLOR.mist}>{kicker}</text>

          <text x="1024" y="612" fontFamily={FONT.displayHeavy} fontSize="158" letterSpacing="2">
            <tspan fill={COLOR.white}>GOVERN</tspan><tspan fill={COLOR.red}>X</tspan>
          </text>

          <rect x="762" y="648" width="524" height="4" fill={COLOR.red} />

          <text x="1024" y="706" fontFamily={FONT.display} fontWeight="bold" fontSize="36" letterSpacing="4" fill={COLOR.white}>
            {tagline}<tspan fill={COLOR.red}>.</tspan>
          </text>

          <text x="1024" y="740" fontFamily={FONT.mono} fontSize="17" letterSpacing="6" fill={COLOR.yellow}>{cadence}</text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
