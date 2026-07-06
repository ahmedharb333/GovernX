/* ============================================================================
   RiskMatrix.jsx  —  GovernX v3
   3×3 likelihood vs impact grid. Risks animate in as labeled dots.

   Props:
     title     — optional heading
     xLabel    — x-axis label (default "LIKELIHOOD")
     yLabel    — y-axis label (default "IMPACT")
     risks     — [{label, likelihood, impact, highlight?}]
                  likelihood / impact: 1 (Low) | 2 (Medium) | 3 (High)
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
  dim  : "#888888",
  faint: "#1C1C1C",
  font : "Montserrat, Arial Black, sans-serif"
};

// Cell heat color by (likelihood, impact) — both 1-indexed
const cellColor = (col, row) => {
  const score = col + row; // 2–6
  if (score >= 5) return "rgba(255,0,0,0.22)";       // high — red zone
  if (score === 4) return "rgba(255,140,0,0.16)";    // medium — amber zone
  return "rgba(255,255,255,0.04)";                   // low — dark
};

const cellBorder = (col, row) => {
  const score = col + row;
  if (score >= 5) return "rgba(255,0,0,0.5)";
  if (score === 4) return "rgba(255,140,0,0.35)";
  return "#2A2A2A";
};

const AXIS_LABELS = ["LOW", "MEDIUM", "HIGH"];

export const RiskMatrix = ({
  title   = "",
  xLabel  = "LIKELIHOOD",
  yLabel  = "IMPACT",
  risks   = []
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOut  = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" });
  const titleOp  = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const gridOp   = interpolate(frame, [6, 28], [0, 1], { extrapolateRight: "clamp" });
  const axisOp   = interpolate(frame, [18, 38], [0, 1], { extrapolateRight: "clamp" });

  // Grid dimensions
  const CELL   = 210;
  const GRID_W = CELL * 3;
  const GRID_H = CELL * 3;
  const LEFT   = 160;  // space for Y axis label
  const TOP    = 80;   // space for title

  return (
    <AbsoluteFill style={{ backgroundColor: B.bg, opacity: fadeOut, overflow: "hidden" }}>

      {/* Subtle grid texture */}
      <div style={{
        position       : "absolute",
        inset          : 0,
        backgroundImage: "linear-gradient(rgba(255,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.02) 1px, transparent 1px)",
        backgroundSize : "96px 96px",
        pointerEvents  : "none"
      }} />

      {/* Top red bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, backgroundColor: B.red }} />

      {/* Title */}
      {title && (
        <div style={{
          position     : "absolute",
          top          : 48,
          left         : 88,
          fontFamily   : B.font,
          fontSize     : 24,
          fontWeight   : 700,
          color        : B.white,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          opacity      : titleOp
        }}>
          {title}
        </div>
      )}

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
        textTransform: "uppercase",
        opacity      : titleOp * 0.85
      }}>
        GOVERNX
      </div>

      {/* Matrix container — centered */}
      <div style={{
        position : "absolute",
        top      : "50%",
        left     : "50%",
        transform: `translate(-50%, -50%) translateY(${title ? 24 : 0}px)`
      }}>

        {/* Y-axis label (rotated) */}
        <div style={{
          position     : "absolute",
          left         : -(LEFT - 24),
          top          : GRID_H / 2,
          transform    : "translateY(-50%) rotate(-90deg)",
          fontFamily   : B.font,
          fontSize     : 16,
          fontWeight   : 700,
          color        : B.dim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          whiteSpace   : "nowrap",
          opacity      : axisOp
        }}>
          {yLabel}
        </div>

        {/* X-axis label */}
        <div style={{
          position     : "absolute",
          top          : GRID_H + 48,
          left         : 0,
          width        : GRID_W,
          textAlign    : "center",
          fontFamily   : B.font,
          fontSize     : 16,
          fontWeight   : 700,
          color        : B.dim,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          opacity      : axisOp
        }}>
          {xLabel}
        </div>

        {/* 3×3 grid */}
        <div style={{ position: "relative", width: GRID_W, height: GRID_H, opacity: gridOp }}>

          {/* Y-axis tick labels (High→Low top to bottom) */}
          {[2, 1, 0].map((i) => (
            <div key={i} style={{
              position     : "absolute",
              left         : -96,
              top          : i * CELL,
              width        : 88,
              height       : CELL,
              display      : "flex",
              alignItems   : "center",
              justifyContent: "flex-end",
              fontFamily   : B.font,
              fontSize     : 13,
              fontWeight   : 600,
              color        : B.dim,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity      : axisOp
            }}>
              {AXIS_LABELS[2 - i]}
            </div>
          ))}

          {/* X-axis tick labels */}
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              position     : "absolute",
              left         : i * CELL,
              top          : GRID_H + 12,
              width        : CELL,
              textAlign    : "center",
              fontFamily   : B.font,
              fontSize     : 13,
              fontWeight   : 600,
              color        : B.dim,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity      : axisOp
            }}>
              {AXIS_LABELS[i]}
            </div>
          ))}

          {/* Cells — col = likelihood (1-3 left→right), row = impact (3-1 top→bottom) */}
          {[0, 1, 2].map(rowIdx =>
            [0, 1, 2].map(colIdx => {
              const col = colIdx + 1; // likelihood 1–3
              const row = 3 - rowIdx; // impact 3 at top, 1 at bottom
              return (
                <div key={`${rowIdx}-${colIdx}`} style={{
                  position       : "absolute",
                  left           : colIdx * CELL,
                  top            : rowIdx * CELL,
                  width          : CELL,
                  height         : CELL,
                  backgroundColor: cellColor(col, row),
                  border         : `1px solid ${cellBorder(col, row)}`,
                  boxSizing      : "border-box"
                }} />
              );
            })
          )}

          {/* Risk dots */}
          {risks.map((risk, i) => {
            const lh     = Math.max(1, Math.min(3, Number(risk.likelihood) || 1));
            const imp    = Math.max(1, Math.min(3, Number(risk.impact)     || 1));
            const isHl   = risk.highlight === true || risk.highlight === "true";

            // Center of cell: col=lh maps to x, impact row maps to y (impact 3 = top row)
            const cx = (lh - 1) * CELL + CELL / 2;
            const cy = (3 - imp) * CELL + CELL / 2;

            const dotStart = 32 + i * 8;
            const dotScale = spring({ frame: Math.max(0, frame - dotStart), fps,
              from: 0, to: 1, config: { damping: 12, stiffness: 180 } });
            const labelOp  = interpolate(frame, [dotStart + 10, dotStart + 22], [0, 1],
              { extrapolateRight: "clamp" });

            const dotColor  = isHl ? B.red : B.white;
            const dotR      = isHl ? 22 : 16;

            return (
              <div key={i} style={{ position: "absolute", left: cx, top: cy, transform: "translate(-50%,-50%)" }}>
                {/* Dot */}
                <div style={{
                  width          : dotR * 2,
                  height         : dotR * 2,
                  borderRadius   : "50%",
                  backgroundColor: isHl ? B.red : "transparent",
                  border         : `3px solid ${dotColor}`,
                  transform      : `scale(${dotScale})`,
                  position       : "relative",
                  boxShadow      : isHl ? `0 0 18px rgba(255,0,0,0.6)` : "none"
                }} />

                {/* Label */}
                <div style={{
                  position     : "absolute",
                  top          : dotR * 2 + 8,
                  left         : "50%",
                  transform    : "translateX(-50%)",
                  fontFamily   : B.font,
                  fontSize     : 13,
                  fontWeight   : isHl ? 700 : 400,
                  color        : isHl ? B.red : B.white,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  whiteSpace   : "nowrap",
                  textAlign    : "center",
                  opacity      : labelOp,
                  maxWidth     : CELL - 16,
                  overflow     : "hidden",
                  textOverflow : "ellipsis"
                }}>
                  {risk.label}
                </div>
              </div>
            );
          })}

        </div>
      </div>

    </AbsoluteFill>
  );
};
