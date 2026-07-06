/* ============================================================================
   ProgressGauge.jsx  —  GovernX v3
   Circular arc gauge(s) for compliance %, adoption rates, scores, etc.

   Props:
     title   — optional heading
     gauges  — [{
                  label     — metric name
                  value     — number 0–100
                  unit      — display suffix (default "%")
                  context   — small footnote below label
                  highlight — bool, red accent treatment
                  threshold — optional danger threshold (0–100); arc turns red below it
               }]
     variant — "single" (default, one large centred gauge)
              | "multi"  (2–4 smaller gauges in a row)
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
  green: "#00C853",
  amber: "#FF8F00",
  font : "Montserrat, Arial Black, sans-serif"
};

// ── SVG ARC HELPER ────────────────────────────────────────────────────────────
// Arc spans 220° — starts at 200° (bottom-left), sweeps clockwise to 340° (bottom-right)
const ARC_START_DEG = 200;
const ARC_SWEEP_DEG = 220; // 0–100% maps to 0–220°

const polarToXY = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (cx, cy, r, startDeg, sweepDeg) => {
  if (sweepDeg <= 0) return "";
  const clamped  = Math.min(sweepDeg, 359.99);
  const start    = polarToXY(cx, cy, r, startDeg);
  const end      = polarToXY(cx, cy, r, startDeg + clamped);
  const largeArc = clamped > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
};

// ── SINGLE GAUGE ──────────────────────────────────────────────────────────────
const Gauge = ({ gauge, frame, fps, delay, size }) => {
  const isHl      = gauge.highlight === true || gauge.highlight === "true";
  const val       = Math.max(0, Math.min(100, Number(gauge.value) || 0));
  const threshold = gauge.threshold != null ? Number(gauge.threshold) : null;
  const unit      = gauge.unit != null ? gauge.unit : "%";

  // Animated value 0 → val
  const animatedVal = interpolate(
    frame,
    [delay, delay + fps * 1.6],
    [0, val],
    { extrapolateRight: "clamp", easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t }
  );

  const labelOp = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateRight: "clamp" });
  const valueOp = interpolate(frame, [delay + 10, delay + 26], [0, 1], { extrapolateRight: "clamp" });
  const ctxOp   = interpolate(frame, [delay + fps * 1.4, delay + fps * 1.8], [0, 1], { extrapolateRight: "clamp" });

  // Arc color
  const belowThreshold = threshold !== null && val < threshold;
  const arcColor = isHl || belowThreshold ? B.red : (val >= 80 ? B.green : val >= 50 ? B.amber : B.red);

  const CX = size / 2;
  const CY = size / 2;
  const R  = size * 0.38;
  const SW = size * 0.055; // stroke width

  const trackPath = arcPath(CX, CY, R, ARC_START_DEG, ARC_SWEEP_DEG);
  const fillSweep = (animatedVal / 100) * ARC_SWEEP_DEG;
  const fillPath  = arcPath(CX, CY, R, ARC_START_DEG, fillSweep);

  // Display number
  const displayNum = Math.round(animatedVal);
  const fontSize   = size < 300 ? (String(displayNum).length > 2 ? 52 : 64) : (String(displayNum).length > 2 ? 80 : 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

      {/* SVG gauge */}
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track (background arc) */}
          <path
            d={trackPath}
            fill="none"
            stroke={B.faint}
            strokeWidth={SW}
            strokeLinecap="round"
          />
          {/* Fill arc */}
          {fillSweep > 0 && (
            <path
              d={fillPath}
              fill="none"
              stroke={arcColor}
              strokeWidth={SW}
              strokeLinecap="round"
              style={{ filter: isHl ? `drop-shadow(0 0 8px ${arcColor})` : "none" }}
            />
          )}
        </svg>

        {/* Center value */}
        <div style={{
          position      : "absolute",
          inset         : 0,
          display       : "flex",
          flexDirection : "column",
          alignItems    : "center",
          justifyContent: "center",
          paddingBottom : size * 0.08,
          opacity       : valueOp
        }}>
          <div style={{
            fontFamily   : B.font,
            fontSize     : fontSize,
            fontWeight   : 900,
            color        : isHl || belowThreshold ? B.red : B.white,
            lineHeight   : 1,
            letterSpacing: "-0.02em"
          }}>
            {displayNum}{unit}
          </div>
          {threshold !== null && (
            <div style={{
              fontFamily   : B.font,
              fontSize     : size < 300 ? 11 : 14,
              fontWeight   : 600,
              color        : belowThreshold ? B.red : B.dim,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop    : 6
            }}>
              {belowThreshold ? "BELOW TARGET" : "ON TARGET"}
            </div>
          )}
        </div>
      </div>

      {/* Label */}
      <div style={{
        fontFamily   : B.font,
        fontSize     : size < 300 ? 14 : 18,
        fontWeight   : 700,
        color        : isHl ? B.red : B.white,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        textAlign    : "center",
        marginTop    : -size * 0.06,
        opacity      : labelOp,
        maxWidth     : size
      }}>
        {gauge.label}
      </div>

      {/* Context */}
      {gauge.context && (
        <div style={{
          fontFamily   : B.font,
          fontSize     : size < 300 ? 11 : 13,
          fontWeight   : 400,
          color        : "#555",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          textAlign    : "center",
          marginTop    : 8,
          opacity      : ctxOp,
          maxWidth     : size
        }}>
          {gauge.context}
        </div>
      )}

    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const ProgressGauge = ({
  title   = "",
  gauges  = [],
  variant = "single"
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  const items    = gauges.slice(0, 4);
  const isMulti  = variant === "multi" || items.length > 1;
  const count    = items.length || 1;

  // Gauge size: single = 480px, multi scales down with count
  const gaugeSize = isMulti
    ? Math.min(380, Math.floor((1920 - 88 * 2 - 60 * (count - 1)) / count))
    : 480;

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
          top          : 44,
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
        bottom       : 44,
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

      {/* Gauges — centred */}
      <div style={{
        position      : "absolute",
        inset         : 0,
        display       : "flex",
        alignItems    : "center",
        justifyContent: "center",
        gap           : 60,
        paddingTop    : title ? 60 : 0
      }}>
        {items.map((gauge, i) => (
          <Gauge
            key={i}
            gauge={gauge}
            frame={frame}
            fps={fps}
            delay={i * 12}
            size={gaugeSize}
          />
        ))}
      </div>

    </AbsoluteFill>
  );
};
