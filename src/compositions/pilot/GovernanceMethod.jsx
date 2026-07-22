/* ============================================================================
   GovernanceMethod.jsx — the GovernX signature analytical frame.
   Outcome → Decision Chain → Governance Failure → Control Lesson
   Four cards reveal left-to-right with red connector arrows drawing between.
   The failure card is marked red (the signal). Landscape 1920×1080.

   Props (defaults = Wells Fargo):
     steps: [{ tag, title, detail }]  — exactly 4 recommended
     failureIndex: 2                  — which card is the red "failure" marker
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, Vignette, useFade } from "./parts";

/* Structural scaffold only — the four tags are this component's own framing and
   carry no evidence. Titles/details MUST come from the data: a sample figure
   here would render as if it were this video's sourced claim. See the warning
   in EvidenceCard.jsx. */
const DEFAULT_STEPS = [
  { tag: "OUTCOME",            title: "", detail: "" },
  { tag: "DECISION CHAIN",     title: "", detail: "" },
  { tag: "GOVERNANCE FAILURE", title: "", detail: "" },
  { tag: "CONTROL LESSON",     title: "", detail: "" }
];

export const GovernanceMethod = ({ steps = DEFAULT_STEPS, failureIndex = 2 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const titleOp = useFade(4, 18);
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateRight: "clamp" });

  const N       = steps.length;
  const MARGIN  = SPACE.margin;
  const GAP     = 40;
  const totalW  = 1920 - MARGIN * 2;
  const cardW   = (totalW - GAP * (N - 1)) / N;
  const cardH   = 470;
  const cardTop = 380;

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, opacity: fadeOut, overflow: "hidden" }}>
      <Vignette />
      <Masthead code="GOVERNX METHOD" delay={0} />

      {/* section title */}
      <div style={{
        position: "absolute", top: 190, left: MARGIN, right: MARGIN, opacity: titleOp,
        fontFamily: FONT.serif, fontSize: 68, fontWeight: 700, color: COLOR.white, letterSpacing: "0.01em"
      }}>
        How a sales target became a control failure
      </div>
      <div style={{ position: "absolute", top: 300, left: MARGIN, opacity: titleOp,
        fontFamily: FONT.sans, fontSize: SIZE.label, letterSpacing: TRACK.label, color: COLOR.mist, textTransform: "uppercase" }}>
        Outcome → Decision Chain → Governance Failure → Control Lesson
      </div>

      {/* connector arrows behind the cards */}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {steps.slice(0, N - 1).map((_, i) => {
          const startX = MARGIN + (i + 1) * cardW + i * GAP;
          const endX   = startX + GAP;
          const y      = cardTop + cardH / 2;
          const delay  = 26 + i * 22;
          const p      = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const cx     = startX + (endX - startX) * p;
          return (
            <g key={i}>
              <line x1={startX} y1={y} x2={cx} y2={y} stroke={COLOR.red} strokeWidth={8} strokeLinecap="round" />
              {p > 0.9 && <polygon points={`${endX},${y} ${endX - 18},${y - 12} ${endX - 18},${y + 12}`} fill={COLOR.red} />}
            </g>
          );
        })}
      </svg>

      {/* the four cards */}
      {steps.map((s, i) => {
        const delay   = 20 + i * 22;
        const op      = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const y       = interpolate(frame, [delay, delay + 16], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const isFail  = i === failureIndex;
        const left    = MARGIN + i * (cardW + GAP);
        return (
          <div key={i} style={{
            position: "absolute", top: cardTop, left, width: cardW, height: cardH,
            opacity: op, transform: `translateY(${y}px)`,
            backgroundColor: isFail ? COLOR.red : COLOR.paper,
            border: `2px solid ${isFail ? COLOR.redDeep : COLOR.paperEdge}`,
            borderTop: `8px solid ${isFail ? COLOR.redDeep : COLOR.red}`,
            borderRadius: 6, boxSizing: "border-box", padding: "32px 28px",
            display: "flex", flexDirection: "column", boxShadow: "0 18px 44px rgba(0,0,0,0.4)"
          }}>
            <div style={{
              fontFamily: FONT.mono, fontSize: 16, fontWeight: 700, letterSpacing: "0.14em",
              color: isFail ? "rgba(255,255,255,0.85)" : COLOR.red, textTransform: "uppercase"
            }}>
              {String(i + 1).padStart(2, "0")} · {s.tag}
            </div>
            <div style={{
              marginTop: 22, fontFamily: FONT.display, fontWeight: 900, fontSize: 40, lineHeight: 1.05,
              color: isFail ? COLOR.white : COLOR.ink, textTransform: "uppercase"
            }}>
              {s.title}
            </div>
            <div style={{
              marginTop: "auto", fontFamily: FONT.sans, fontSize: 22, lineHeight: 1.4,
              color: isFail ? "rgba(255,255,255,0.92)" : COLOR.inkSoft
            }}>
              {s.detail}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
