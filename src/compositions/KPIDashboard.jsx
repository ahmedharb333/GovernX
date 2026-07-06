/* ============================================================================
   KPIDashboard.jsx  —  GovernX v3
   Grid of 2–4 KPI metric cards with animated values and trend indicators.

   Props:
     title  — optional heading
     kpis   — [{
                 label     — metric name
                 value     — display value (string, e.g. "94%", "$4.2B")
                 trend     — "up" | "down" | "neutral"
                 change    — change label (e.g. "+12% YoY", "-3 pts")
                 context   — small footnote under the card
                 highlight — bool, red accent treatment
               }]
     layout — "2x2" (default) | "1x3" | "1x4"
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
  card : "#111111",
  green: "#00C853",
  amber: "#FF8F00",
  font : "Montserrat, Arial Black, sans-serif"
};

const TREND_ARROW = { up: "↑", down: "↓", neutral: "→" };

const trendColor = (trend, highlight) => {
  if (highlight) return B.red;
  if (trend === "up")   return B.green;
  if (trend === "down") return B.red;
  return B.dim;
};

// ── SINGLE KPI CARD ───────────────────────────────────────────────────────────
const KPICard = ({ kpi, frame, fps, delay, cardW, cardH }) => {
  const isHl = kpi.highlight === true || kpi.highlight === "true";

  const cardOp  = interpolate(frame, [delay, delay + 14], [0, 1], { extrapolateRight: "clamp" });
  const cardY   = interpolate(frame, [delay, delay + 18], [30, 0], { extrapolateRight: "clamp" });

  const valScale = spring({ frame: Math.max(0, frame - (delay + 8)), fps,
    from: 0.75, to: 1, config: { damping: 16, stiffness: 160 } });
  const valOp   = interpolate(frame, [delay + 8, delay + 22], [0, 1], { extrapolateRight: "clamp" });
  const trendOp = interpolate(frame, [delay + 22, delay + 36], [0, 1], { extrapolateRight: "clamp" });
  const ctxOp   = interpolate(frame, [delay + 32, delay + 46], [0, 1], { extrapolateRight: "clamp" });

  const accentColor = trendColor(kpi.trend, isHl);

  return (
    <div style={{
      width          : cardW,
      height         : cardH,
      backgroundColor: B.card,
      borderTop      : `4px solid ${isHl ? B.red : "#2A2A2A"}`,
      borderLeft     : `1px solid #1E1E1E`,
      borderRight    : `1px solid #1E1E1E`,
      borderBottom   : `1px solid #1E1E1E`,
      padding        : "36px 40px 28px",
      boxSizing      : "border-box",
      display        : "flex",
      flexDirection  : "column",
      justifyContent : "space-between",
      opacity        : cardOp,
      transform      : `translateY(${cardY}px)`
    }}>

      {/* Label */}
      <div style={{
        fontFamily   : B.font,
        fontSize     : 15,
        fontWeight   : 700,
        color        : isHl ? B.red : B.dim,
        letterSpacing: "0.16em",
        textTransform: "uppercase"
      }}>
        {kpi.label}
      </div>

      {/* Value */}
      <div style={{
        fontFamily     : B.font,
        fontSize       : String(kpi.value).length > 8 ? 56 : 72,
        fontWeight     : 900,
        color          : isHl ? B.red : B.white,
        lineHeight     : 1,
        letterSpacing  : "-0.01em",
        opacity        : valOp,
        transform      : `scale(${valScale})`,
        transformOrigin: "left center"
      }}>
        {kpi.value}
      </div>

      {/* Trend + change */}
      <div style={{
        display    : "flex",
        alignItems : "center",
        gap        : 10,
        opacity    : trendOp
      }}>
        {kpi.trend && kpi.trend !== "neutral" && (
          <div style={{
            fontFamily: B.font,
            fontSize  : 22,
            fontWeight: 900,
            color     : accentColor,
            lineHeight: 1
          }}>
            {TREND_ARROW[kpi.trend] || "→"}
          </div>
        )}
        {kpi.change && (
          <div style={{
            fontFamily   : B.font,
            fontSize     : 15,
            fontWeight   : 600,
            color        : accentColor,
            letterSpacing: "0.06em",
            textTransform: "uppercase"
          }}>
            {kpi.change}
          </div>
        )}
      </div>

      {/* Context footnote */}
      {kpi.context && (
        <div style={{
          fontFamily   : B.font,
          fontSize     : 12,
          fontWeight   : 400,
          color        : "#555",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity      : ctxOp,
          marginTop    : 4
        }}>
          {kpi.context}
        </div>
      )}

    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const KPIDashboard = ({
  title  = "",
  kpis   = [],
  layout = "2x2"
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const fadeOut = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" });
  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });

  // Layout config
  const items = kpis.slice(0, 4);
  const cols  = layout === "1x3" ? 3 : layout === "1x4" ? 4 : 2;
  const rows  = layout === "2x2" ? 2 : 1;

  const MARGIN  = 88;
  const GAP     = 20;
  const TOTAL_W = 1920 - MARGIN * 2;
  const TITLE_H = title ? 100 : 0;
  const TOTAL_H = 1080 - 80 - TITLE_H - 80; // top padding + title + bottom padding
  const cardW   = (TOTAL_W - GAP * (cols - 1)) / cols;
  const cardH   = (TOTAL_H - GAP * (rows - 1)) / rows;

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
          left         : MARGIN,
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
        right        : MARGIN,
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

      {/* Card grid */}
      <div style={{
        position  : "absolute",
        top       : 80 + TITLE_H,
        left      : MARGIN,
        right     : MARGIN,
        bottom    : 80,
        display   : "flex",
        flexWrap  : "wrap",
        gap       : GAP,
        alignContent: "flex-start"
      }}>
        {items.map((kpi, i) => (
          <KPICard
            key={i}
            kpi={kpi}
            frame={frame}
            fps={fps}
            delay={i * 10}
            cardW={cardW}
            cardH={cardH}
          />
        ))}
      </div>

    </AbsoluteFill>
  );
};
