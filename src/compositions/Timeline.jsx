/* ============================================================================
   Timeline.jsx  —  GovernX v3
   Final scene — reverse-engineering chain revealed top to bottom
   Props from Stage 8D:
     checkpoints — array of strings, each a checkpoint label
                   e.g. ["Texas City explosion 2005",
                         "Baker Panel warning 2007",
                         "Macondo blowout April 2010",
                         "Federal court gross negligence 2014"]
     company     — company name
     voiceoverSync — closing sentence
   ============================================================================ */

import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const B = {
  bg      : "#0A0A0A",
  red     : "#FF0000",
  white   : "#FFFFFF",
  dim     : "#888888",
  faint   : "#1A1A1A",
  card    : "#0F0F0F",
  font    : "Montserrat, Arial Black, sans-serif"
};

export const Timeline = ({
  checkpoints   = [],
  company       = "GovernX",
  voiceoverSync = ""
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const pts = Array.isArray(checkpoints) ? checkpoints : [];

  // ── Overall fade ────────────────────────────────────────────────────────────
  const fadeOut = interpolate(
    frame, [durationInFrames - 8, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" }
  );

  // ── Header slides down ──────────────────────────────────────────────────────
  const headerOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const headerY  = interpolate(frame, [0, 18], [-20, 0], { extrapolateRight: "clamp" });

  // ── Spine line grows down — reveals the full chain ──────────────────────────
  const spineDelay   = 16;
  const spineDuration = fps * 1.6;
  const spineH = interpolate(
    frame, [spineDelay, spineDelay + spineDuration], [0, 1],
    { extrapolateRight: "clamp" }
  );

  // ── Each checkpoint node appears staggered ──────────────────────────────────
  // Nodes appear as the spine passes through them
  const totalH    = 560; // rough SVG height of spine area
  const nodeDelay = (i) => spineDelay + (i / (pts.length || 1)) * spineDuration;

  // ── ROOT CAUSE label pulses at the end ──────────────────────────────────────
  const rootDelay  = spineDelay + spineDuration + 8;
  const rootOp     = interpolate(frame, [rootDelay, rootDelay + 20], [0, 1],
    { extrapolateRight: "clamp" });
  const rootScale  = spring({ frame: Math.max(0, frame - rootDelay), fps,
    from: 0.85, to: 1, config: { damping: 14 } });

  // ── Footer caption ──────────────────────────────────────────────────────────
  const ctxOp = interpolate(frame, [rootDelay + 10, rootDelay + 28], [0, 1],
    { extrapolateRight: "clamp" });

  // Layout constants
  const SPINE_X    = 88;
  const LABEL_X    = 136;
  const NODE_R     = 10;
  const ROW_H      = pts.length > 6 ? 72 : pts.length > 4 ? 86 : 100;
  const TOP_Y      = 180;
  const SPINE_FULL = ROW_H * (pts.length - 1);

  return (
    <AbsoluteFill style={{ backgroundColor: B.bg, opacity: fadeOut, overflow: "hidden" }}>

      {/* Subtle grid */}
      <div style={{
        position       : "absolute",
        inset          : 0,
        backgroundImage: "linear-gradient(rgba(255,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.02) 1px, transparent 1px)",
        backgroundSize : "96px 96px",
        pointerEvents  : "none"
      }} />

      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 4, backgroundColor: B.red
      }} />

      {/* HEADER */}
      <div style={{
        position : "absolute",
        top      : 52,
        left     : 88,
        opacity  : headerOp,
        transform: `translateY(${headerY}px)`
      }}>
        <div style={{
          fontFamily   : B.font,
          fontSize     : 18,
          fontWeight   : 700,
          color        : B.red,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          marginBottom : 8
        }}>
          Reverse Engineering — {company}
        </div>
        <div style={{
          width: 280, height: 2, backgroundColor: B.red, opacity: 0.5
        }} />
      </div>

      {/* TIMELINE SVG */}
      <svg
        style={{
          position: "absolute",
          top: TOP_Y,
          left: 0,
          width: "100%",
          height: SPINE_FULL + 120
        }}
        viewBox={`0 0 1920 ${SPINE_FULL + 120}`}
      >
        {/* Spine line — grows downward */}
        <line
          x1={SPINE_X} y1={0}
          x2={SPINE_X} y2={SPINE_FULL * spineH}
          stroke={B.red}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Checkpoint nodes */}
        {pts.map((label, i) => {
          const y       = i * ROW_H;
          const isRoot  = i === pts.length - 1;
          const nDelay  = nodeDelay(i);
          const nodeOp  = interpolate(frame, [nDelay, nDelay + 14], [0, 1],
            { extrapolateRight: "clamp" });
          const nodeX   = interpolate(frame, [nDelay, nDelay + 14], [-20, 0],
            { extrapolateRight: "clamp" });

          // Split label into date part (last word if it looks like a year) and text
          const words    = label.trim().split(" ");
          const lastWord = words[words.length - 1];
          const hasYear  = /^\d{4}$/.test(lastWord);
          const datePart = hasYear ? lastWord : null;
          const textPart = hasYear ? words.slice(0, -1).join(" ") : label;

          return (
            <g key={i} opacity={nodeOp} transform={`translate(${nodeX}, 0)`}>
              {/* Horizontal connector */}
              <line
                x1={SPINE_X + NODE_R}
                y1={y}
                x2={LABEL_X + 12}
                y2={y}
                stroke={isRoot ? B.red : "#333"}
                strokeWidth="1.5"
              />

              {/* Node circle */}
              <circle
                cx={SPINE_X}
                cy={y}
                r={isRoot ? NODE_R + 4 : NODE_R}
                fill={isRoot ? B.red : B.bg}
                stroke={isRoot ? B.red : "#555"}
                strokeWidth={isRoot ? 3 : 2}
              />
              {isRoot && (
                <circle cx={SPINE_X} cy={y} r={5} fill={B.white} />
              )}

              {/* Label background pill */}
              <rect
                x={LABEL_X}
                y={y - (isRoot ? 26 : 22)}
                width={isRoot ? 1100 : 1000}
                height={isRoot ? 52 : 44}
                rx="4"
                fill={isRoot ? "rgba(255,0,0,0.1)" : B.faint}
                stroke={isRoot ? "rgba(255,0,0,0.3)" : "transparent"}
                strokeWidth="1"
              />

              {/* Checkpoint text */}
              <text
                x={LABEL_X + 20}
                y={y + (isRoot ? 6 : 5)}
                fill={isRoot ? B.red : B.white}
                fontFamily={B.font}
                fontSize={isRoot ? 22 : 19}
                fontWeight={isRoot ? "900" : "500"}
                dominantBaseline="middle"
                textAnchor="start"
              >
                {textPart.toUpperCase()}
              </text>

              {/* Date tag */}
              {datePart && (
                <text
                  x={LABEL_X + 1040}
                  y={y + 5}
                  fill={isRoot ? B.red : B.dim}
                  fontFamily={B.font}
                  fontSize="18"
                  fontWeight="700"
                  dominantBaseline="middle"
                  textAnchor="end"
                >
                  {datePart}
                </text>
              )}

              {/* ROOT CAUSE label for last node */}
              {isRoot && (
                <text
                  x={LABEL_X + 20}
                  y={y - 40}
                  fill={B.red}
                  fontFamily={B.font}
                  fontSize="14"
                  fontWeight="900"
                  letterSpacing="0.2em"
                  opacity={rootOp}
                  transform={`scale(${rootScale})`}
                  transformOrigin={`${LABEL_X + 20} ${y - 40}`}
                >
                  ↓ ROOT CAUSE
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Footer */}
      <div style={{
        position : "absolute",
        bottom   : 56,
        left     : 88,
        right    : 200,
        opacity  : ctxOp
      }}>
        {voiceoverSync && (
          <div style={{
            fontFamily: B.font,
            fontSize  : 17,
            fontWeight: 400,
            color     : "#555",
            fontStyle : "italic",
            lineHeight: 1.5
          }}>
            "{voiceoverSync}"
          </div>
        )}
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
