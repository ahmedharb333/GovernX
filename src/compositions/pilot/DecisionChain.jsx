/* ============================================================================
   DecisionChain.jsx — vertical case-file strip showing how KPI/incentive
   pressure moved step by step into a control failure. Nodes reveal top→down
   along a spine; a red arrow draws to the failure node; each factual node can
   carry a source label. Landscape 1920×1080.

   Props (defaults = Wells Fargo):
     company "Wells Fargo"
     nodes: [{ label, sub, source, fail? }]   — last/failing node marked fail:true
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, Vignette, useFade } from "./parts";

/* ⚠ NO EVIDENCE IN DEFAULTS — see EvidenceCard.jsx. This standalone composition
   is NOT in registry.jsx (the assembly uses the DecisionChain in governance.jsx),
   but it IS registered in Root.jsx, so Stage 8D's /render path can reach it. Its
   defaults previously carried Wells Fargo's chain with real source citations. */
const DEFAULT_NODES = [];

export const DecisionChain = ({ company = "", nodes = DEFAULT_NODES }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const titleOp = useFade(4, 18);
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateRight: "clamp" });

  const N        = nodes.length;
  const SPINE_X  = 260;
  const TOP      = 300;
  const rowH     = Math.min(150, (900 - TOP) / N + 30);
  const spineEnd = TOP + rowH * (N - 1);
  const spineP   = interpolate(frame, [18, 18 + 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, opacity: fadeOut, overflow: "hidden" }}>
      <Vignette />
      <Masthead code="DECISION CHAIN" delay={0} />

      <div style={{ position: "absolute", top: 190, left: SPACE.margin, opacity: titleOp,
        fontFamily: FONT.serif, fontSize: 60, fontWeight: 700, color: COLOR.white }}>
        {company}: the chain of decisions
      </div>

      {/* spine + nodes */}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <line x1={SPINE_X} y1={TOP} x2={SPINE_X} y2={TOP + (spineEnd - TOP) * spineP}
          stroke={COLOR.red} strokeWidth={5} strokeLinecap="round" />
      </svg>

      {nodes.map((n, i) => {
        const y      = TOP + i * rowH;
        const delay  = 22 + i * 16;
        const op     = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const x      = interpolate(frame, [delay, delay + 14], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const isFail = !!n.fail;
        return (
          <div key={i}>
            {/* node dot */}
            <div style={{
              position: "absolute", left: SPINE_X - 13, top: y - 13, width: 26, height: 26, borderRadius: "50%",
              backgroundColor: isFail ? COLOR.red : COLOR.navy, border: `4px solid ${COLOR.red}`, opacity: op,
              boxShadow: isFail ? `0 0 20px ${COLOR.red}` : "none"
            }} />
            {/* connector */}
            <div style={{ position: "absolute", left: SPINE_X + 16, top: y - 2, width: 60, height: 4, backgroundColor: isFail ? COLOR.red : "#33415C", opacity: op }} />
            {/* content */}
            <div style={{ position: "absolute", left: SPINE_X + 92, top: y - 44, right: SPACE.margin, opacity: op, transform: `translateX(${x}px)` }}>
              <div style={{
                fontFamily: FONT.display, fontWeight: 900, fontSize: 40, letterSpacing: "0.01em",
                color: isFail ? COLOR.red : COLOR.white, textTransform: "uppercase"
              }}>
                {isFail ? "⚠ " : ""}{n.label}
              </div>
              <div style={{ fontFamily: FONT.sans, fontSize: 24, color: COLOR.mist, marginTop: 6 }}>{n.sub}</div>
              {n.source && (
                <div style={{ fontFamily: FONT.mono, fontSize: 16, letterSpacing: "0.06em", color: COLOR.mistDim, marginTop: 6, textTransform: "uppercase" }}>
                  Source: {n.source}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
