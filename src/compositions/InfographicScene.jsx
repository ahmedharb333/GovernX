/* ============================================================================
   InfographicScene.jsx  —  GovernX v3
   Reads props from Stage 8D buildInfographicPropsFromData():

   LINE_GRAPH:
     type="line_graph" | title | unit | dataPoints=[{year,value}] | highlight | duration

   SPLIT_COMPARISON:
     type="split_comparison" | leftLabel | leftValues=[{label,value}] |
     rightLabel | rightValues=[{label,value}] | bottomNote | duration

   DATA_CALLOUT:
     type="data_callout" | value | label | context | duration

   COUNTER_ANIMATION:
     type="counter_animation" | from | to | unit | label | duration

   BEFORE_AFTER_CARD:
     type="before_after_card" | beforeLabel | beforeRows=[{item,value}] |
     afterLabel | afterRows=[{item,value}] | verdict | duration

   BAR_CHART:
     type="bar_chart" | title | unit | dataPoints=[{label,value,highlight?}] | duration
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
  faint   : "#1C1C1C",
  card    : "#111111",
  font    : "Montserrat, Arial Black, sans-serif"
};

const fade = (frame, start, end) =>
  interpolate(frame, [start, end], [0, 1], { extrapolateRight: "clamp" });

// ── LINE GRAPH ────────────────────────────────────────────────────────────────
const LineGraph = ({ title, unit, dataPoints, highlight, frame, fps }) => {
  const pts = Array.isArray(dataPoints) ? dataPoints : [];
  if (!pts.length) return null;

  const values  = pts.map(p => Number(p.value) || 0);
  const minV    = Math.min(...values);
  const maxV    = Math.max(...values);
  const range   = maxV - minV || 1;

  const W = 1400, H = 380, PAD = 60;

  // Map to SVG coords
  const coords = pts.map((p, i) => ({
    x: PAD + (i / (pts.length - 1 || 1)) * (W - PAD * 2),
    y: H - PAD - ((Number(p.value) - minV) / range) * (H - PAD * 2),
    ...p
  }));

  // Animated draw progress
  const progress = interpolate(frame, [10, 10 + fps * 1.4], [0, 1], { extrapolateRight: "clamp" });
  const visiblePts = Math.floor(progress * (coords.length - 1));
  const partialProg = (progress * (coords.length - 1)) % 1;

  // Build path
  let d = "";
  coords.forEach((c, i) => {
    if (i === 0) { d += `M ${c.x} ${c.y}`; return; }
    if (i > visiblePts + 1) return;
    if (i === visiblePts + 1) {
      const prev = coords[i - 1];
      const px = prev.x + (c.x - prev.x) * partialProg;
      const py = prev.y + (c.y - prev.y) * partialProg;
      d += ` L ${px} ${py}`;
      return;
    }
    d += ` L ${c.x} ${c.y}`;
  });

  const labelOp = fade(frame, fps * 1.2, fps * 1.6);

  return (
    <div style={{ width: "100%", padding: "0 40px" }}>
      {/* Title */}
      <div style={{
        fontFamily: B.font, fontSize: 28, fontWeight: 700,
        color: B.white, letterSpacing: "0.08em", marginBottom: 32,
        opacity: fade(frame, 0, 16), textTransform: "uppercase"
      }}>
        {title} {unit && <span style={{ color: B.dim, fontWeight: 400 }}>({unit})</span>}
      </div>

      {/* SVG chart */}
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t, i) => (
          <line key={i}
            x1={PAD} y1={H - PAD - t * (H - PAD * 2)}
            x2={W - PAD} y2={H - PAD - t * (H - PAD * 2)}
            stroke="#222" strokeWidth="1" />
        ))}

        {/* Baseline */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD}
          stroke="#333" strokeWidth="1.5" />

        {/* Area fill */}
        {d && (
          <path
            d={`${d} L ${coords[Math.min(visiblePts, coords.length - 1)].x} ${H - PAD} L ${PAD} ${H - PAD} Z`}
            fill="rgba(255,0,0,0.06)" />
        )}

        {/* Line */}
        {d && (
          <path d={d} fill="none" stroke={B.red} strokeWidth="3.5"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Data points + labels */}
        {coords.map((c, i) => {
          if (i > visiblePts) return null;
          const isHl = String(c.year) + ":" + String(c.value) === highlight ||
                       c.value === Math.min(...values);
          const ptOp = labelOp;
          return (
            <g key={i} opacity={ptOp}>
              <circle cx={c.x} cy={c.y} r={isHl ? 10 : 6}
                fill={isHl ? B.red : B.white}
                stroke={B.red} strokeWidth="2" />
              {/* Year label below */}
              <text x={c.x} y={H - PAD + 24} textAnchor="middle"
                fill={isHl ? B.red : B.dim}
                fontFamily={B.font} fontSize="20" fontWeight={isHl ? "700" : "400"}>
                {c.year}
              </text>
              {/* Value label above */}
              <text x={c.x} y={c.y - 18} textAnchor="middle"
                fill={isHl ? B.red : B.white}
                fontFamily={B.font} fontSize={isHl ? "26" : "20"}
                fontWeight={isHl ? "900" : "600"}>
                {c.value}{unit === "%" ? "%" : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ── SPLIT COMPARISON ──────────────────────────────────────────────────────────
const SplitComparison = ({
  leftLabel, leftValues, rightLabel, rightValues, bottomNote, frame, fps
}) => {
  const left  = Array.isArray(leftValues)  ? leftValues  : [];
  const right = Array.isArray(rightValues) ? rightValues : [];

  const leftOp  = fade(frame, 8, 30);
  const rightOp = fade(frame, 24, 46);
  const vsOp    = fade(frame, 16, 36);
  const noteOp  = fade(frame, 50, 68);
  const leftX   = interpolate(frame, [8, 30], [-40, 0], { extrapolateRight: "clamp" });
  const rightX  = interpolate(frame, [24, 46], [40, 0], { extrapolateRight: "clamp" });

  const RowItem = ({ item, value, highlight }) => (
    <div style={{
      display       : "flex",
      justifyContent: "space-between",
      alignItems    : "center",
      padding       : "14px 0",
      borderBottom  : `1px solid ${B.faint}`
    }}>
      <div style={{
        fontFamily: B.font, fontSize: 18, fontWeight: 400,
        color: B.dim, textTransform: "uppercase", letterSpacing: "0.06em"
      }}>
        {item}
      </div>
      <div style={{
        fontFamily  : B.font, fontSize: 20, fontWeight: 700,
        color       : highlight ? B.red : B.white,
        letterSpacing: "0.04em", textTransform: "uppercase"
      }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", padding: "0 20px" }}>
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>

        {/* LEFT panel */}
        <div style={{
          flex: 1, opacity: leftOp,
          transform: `translateX(${leftX}px)`,
          padding: "32px 40px",
          backgroundColor: B.card,
          borderLeft: `4px solid #444`
        }}>
          <div style={{
            fontFamily: B.font, fontSize: 20, fontWeight: 700,
            color: B.dim, letterSpacing: "0.14em", marginBottom: 20,
            textTransform: "uppercase"
          }}>
            {leftLabel}
          </div>
          {left.map((row, i) => (
            <RowItem key={i} item={row.label} value={row.value} highlight={false} />
          ))}
        </div>

        {/* VS divider */}
        <div style={{
          width: 120, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          paddingTop: 80, opacity: vsOp
        }}>
          <div style={{ width: 1, height: 60, backgroundColor: "#333" }} />
          <div style={{
            fontFamily: B.font, fontSize: 32, fontWeight: 900,
            color: B.red, letterSpacing: "0.2em", margin: "16px 0"
          }}>
            VS
          </div>
          <div style={{ width: 1, height: 60, backgroundColor: "#333" }} />
        </div>

        {/* RIGHT panel */}
        <div style={{
          flex: 1, opacity: rightOp,
          transform: `translateX(${rightX}px)`,
          padding: "32px 40px",
          backgroundColor: B.card,
          borderLeft: `4px solid ${B.red}`
        }}>
          <div style={{
            fontFamily: B.font, fontSize: 20, fontWeight: 700,
            color: B.red, letterSpacing: "0.14em", marginBottom: 20,
            textTransform: "uppercase"
          }}>
            {rightLabel}
          </div>
          {right.map((row, i) => (
            <RowItem key={i} item={row.label} value={row.value} highlight={true} />
          ))}
        </div>

      </div>

      {/* Bottom note */}
      {bottomNote && (
        <div style={{
          textAlign: "center", marginTop: 32, opacity: noteOp,
          fontFamily: B.font, fontSize: 20, fontWeight: 700,
          color: B.red, letterSpacing: "0.12em", textTransform: "uppercase"
        }}>
          — {bottomNote} —
        </div>
      )}
    </div>
  );
};

// ── DATA CALLOUT ──────────────────────────────────────────────────────────────
const DataCallout = ({ value, label, context, frame, fps }) => {
  const valScale = spring({ frame: Math.max(0, frame - 6), fps,
    from: 0.7, to: 1, config: { damping: 14, stiffness: 120 } });
  const valOp    = fade(frame, 6, 24);
  const labelOp  = fade(frame, 24, 44);
  const ctxOp    = fade(frame, 40, 58);

  return (
    <div style={{ textAlign: "center" }}>
      {/* Giant value */}
      <div style={{
        fontFamily     : B.font,
        fontSize       : String(value).length > 8 ? 128 : 180,
        fontWeight     : 900,
        color          : B.red,
        lineHeight     : 1,
        letterSpacing  : "-0.01em",
        opacity        : valOp,
        transform      : `scale(${valScale})`,
        transformOrigin: "center"
      }}>
        {value}
      </div>

      {/* Label */}
      {label && (
        <div style={{
          fontFamily   : B.font,
          fontSize     : 32,
          fontWeight   : 700,
          color        : B.white,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop    : 32,
          opacity      : labelOp
        }}>
          {label}
        </div>
      )}

      {/* Context */}
      {context && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 20, marginTop: 24, opacity: ctxOp
        }}>
          <div style={{ width: 36, height: 2, backgroundColor: B.red }} />
          <div style={{
            fontFamily: B.font, fontSize: 18, fontWeight: 400,
            color: B.dim, letterSpacing: "0.12em", textTransform: "uppercase"
          }}>
            {context}
          </div>
          <div style={{ width: 36, height: 2, backgroundColor: B.red }} />
        </div>
      )}
    </div>
  );
};

// ── COUNTER ANIMATION ─────────────────────────────────────────────────────────
const CounterAnimation = ({ from: fromVal, to: toVal, unit, label, frame, fps }) => {
  const start  = Number(String(fromVal).replace(/[^0-9.-]/g, "")) || 0;
  const end    = Number(String(toVal).replace(/[^0-9.-]/g, "")) || 0;
  const prefix = String(unit || "").replace(/[0-9.]/g, "");

  const progress = interpolate(frame, [8, fps * 2.2], [0, 1], {
    extrapolateRight: "clamp",
    easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  });
  const current = start + (end - start) * progress;
  const display = end >= 100
    ? Math.round(current).toLocaleString()
    : current.toFixed(1);

  const labelOp = fade(frame, fps * 1.8, fps * 2.4);
  const glow    = interpolate(progress, [0.8, 1], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily   : B.font,
        fontSize     : 180,
        fontWeight   : 900,
        lineHeight   : 1,
        letterSpacing: "-0.02em",
        color        : B.red,
        textShadow   : `0 0 ${Math.round(glow * 40)}px rgba(255,0,0,${glow * 0.4})`
      }}>
        {prefix}{display}
      </div>
      {label && (
        <div style={{
          fontFamily: B.font, fontSize: 30, fontWeight: 600,
          color: B.white, letterSpacing: "0.12em", textTransform: "uppercase",
          marginTop: 28, opacity: labelOp
        }}>
          {label}
        </div>
      )}
    </div>
  );
};

// ── BEFORE / AFTER CARD ───────────────────────────────────────────────────────
const BeforeAfterCard = ({
  beforeLabel, beforeRows, afterLabel, afterRows, verdict, frame, fps
}) => {
  const before = Array.isArray(beforeRows) ? beforeRows : [];
  const after  = Array.isArray(afterRows)  ? afterRows  : [];

  const headerOp  = fade(frame, 0, 18);
  const beforeOp  = fade(frame, 12, 36);
  const afterOp   = fade(frame, 28, 52);
  const verdictOp = fade(frame, 60, 78);

  const Row = ({ item, value, accent }) => (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "12px 20px",
      borderBottom: `1px solid ${accent ? "rgba(255,0,0,0.2)" : "#1E1E1E"}`
    }}>
      <div style={{
        fontFamily: B.font, fontSize: 16, color: accent ? "#FFaaaa" : B.dim,
        textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 400
      }}>
        {item}
      </div>
      <div style={{
        fontFamily: B.font, fontSize: 17, fontWeight: 700,
        color: accent ? B.red : B.white,
        letterSpacing: "0.06em", textTransform: "uppercase", maxWidth: "55%",
        textAlign: "right"
      }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ width: "100%", padding: "0 20px" }}>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 4, marginBottom: 4, opacity: headerOp
      }}>
        {[
          { label: beforeLabel, accent: false },
          { label: afterLabel, accent: true }
        ].map(({ label, accent }, i) => (
          <div key={i} style={{
            padding: "16px 20px",
            backgroundColor: accent ? "rgba(255,0,0,0.08)" : B.faint,
            borderTop: `3px solid ${accent ? B.red : "#333"}`
          }}>
            <div style={{
              fontFamily: B.font, fontSize: 18, fontWeight: 700,
              color: accent ? B.red : B.dim,
              letterSpacing: "0.1em", textTransform: "uppercase"
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4
      }}>
        <div style={{ opacity: beforeOp }}>
          {before.map((r, i) => (
            <Row key={i} item={r.item} value={r.value} accent={false} />
          ))}
        </div>
        <div style={{ opacity: afterOp }}>
          {after.map((r, i) => (
            <Row key={i} item={r.item} value={r.value} accent={true} />
          ))}
        </div>
      </div>

      {/* Verdict */}
      {verdict && (
        <div style={{
          marginTop: 24, padding: "18px 20px",
          backgroundColor: "rgba(255,0,0,0.1)",
          borderLeft: `4px solid ${B.red}`,
          opacity: verdictOp
        }}>
          <div style={{
            fontFamily: B.font, fontSize: 22, fontWeight: 900,
            color: B.red, letterSpacing: "0.1em", textTransform: "uppercase"
          }}>
            ✕ {verdict}
          </div>
        </div>
      )}
    </div>
  );
};

// ── BAR CHART ─────────────────────────────────────────────────────────────────
const BarChart = ({ title, unit, dataPoints, frame, fps }) => {
  const pts = Array.isArray(dataPoints) ? dataPoints : [];
  if (!pts.length) return null;

  const values = pts.map(p => Number(p.value) || 0);
  const maxV   = Math.max(...values) || 1;

  const BAR_H     = 64;
  const BAR_GAP   = 24;
  const LABEL_W   = 320;
  const VALUE_W   = 140;
  const TRACK_W   = 800;

  return (
    <div style={{ width: "100%", padding: "0 40px" }}>
      {/* Title */}
      {title && (
        <div style={{
          fontFamily   : B.font,
          fontSize     : 26,
          fontWeight   : 700,
          color        : B.white,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom : 44,
          opacity      : fade(frame, 0, 16)
        }}>
          {title}{unit && <span style={{ color: B.dim, fontWeight: 400, fontSize: 20 }}> ({unit})</span>}
        </div>
      )}

      {/* Rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: BAR_GAP }}>
        {pts.map((pt, i) => {
          const ratio    = (Number(pt.value) || 0) / maxV;
          const isHl     = pt.highlight === true || pt.highlight === "true";
          const barColor = isHl ? B.red : "#333333";
          const fillColor= isHl ? B.red : "#555555";

          // Stagger: each bar starts 6 frames after the previous
          const start  = 10 + i * 6;
          const barW   = interpolate(frame, [start, start + fps * 0.7], [0, ratio * TRACK_W], {
            extrapolateRight: "clamp",
            easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
          });
          const rowOp  = interpolate(frame, [start, start + 12], [0, 1], { extrapolateRight: "clamp" });
          const valueOp= interpolate(frame, [start + fps * 0.5, start + fps * 0.8], [0, 1], { extrapolateRight: "clamp" });

          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, opacity: rowOp }}>
              {/* Label */}
              <div style={{
                width        : LABEL_W,
                fontFamily   : B.font,
                fontSize     : 18,
                fontWeight   : isHl ? 700 : 400,
                color        : isHl ? B.white : B.dim,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                textAlign    : "right",
                flexShrink   : 0
              }}>
                {pt.label}
              </div>

              {/* Track + fill */}
              <div style={{
                width          : TRACK_W,
                height         : BAR_H,
                backgroundColor: B.faint,
                position       : "relative",
                flexShrink     : 0
              }}>
                <div style={{
                  position       : "absolute",
                  left           : 0,
                  top            : 0,
                  height         : "100%",
                  width          : barW,
                  backgroundColor: fillColor,
                  borderRight    : barW > 4 ? `4px solid ${isHl ? B.red : "#777"}` : "none"
                }} />
              </div>

              {/* Value */}
              <div style={{
                width        : VALUE_W,
                fontFamily   : B.font,
                fontSize     : 22,
                fontWeight   : 900,
                color        : isHl ? B.red : B.white,
                letterSpacing: "0.04em",
                opacity      : valueOp,
                flexShrink   : 0
              }}>
                {unit === "$" || unit === "€" ? `${unit}${pt.value}` : `${pt.value}${unit === "%" ? "%" : (unit ? " " + unit : "")}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const InfographicScene = (props) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const type = (props.type || "data_callout").toLowerCase()
    .replace(/-/g, "_").replace(/ /g, "_");

  const titleOp = interpolate(frame, [0, 18], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 7, durationInFrames], [1, 0],
    { extrapolateRight: "clamp" });

  const renderChart = () => {
    switch (type) {
      case "line_graph":
        return <LineGraph {...props} frame={frame} fps={fps} />;
      case "split_comparison":
        return <SplitComparison {...props} frame={frame} fps={fps} />;
      case "data_callout":
        return <DataCallout {...props} frame={frame} fps={fps} />;
      case "counter_animation":
        return <CounterAnimation {...props} frame={frame} fps={fps} />;
      case "before_after_card":
        return <BeforeAfterCard {...props} frame={frame} fps={fps} />;
      case "bar_chart":
        return <BarChart {...props} frame={frame} fps={fps} />;
      default:
        return <DataCallout value={props.value || "—"} label={props.label || type}
          context={props.context} frame={frame} fps={fps} />;
    }
  };

  const hasTitle = type === "line_graph" || (props.title && !["data_callout","counter_animation"].includes(type));

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

      {/* Top red bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 4, backgroundColor: B.red
      }} />

      {/* Title block (only when relevant) */}
      {hasTitle && props.title && (
        <div style={{
          position: "absolute", top: 52, left: 88,
          opacity: titleOp
        }}>
          <div style={{
            fontFamily: B.font, fontSize: 22, fontWeight: 800,
            color: B.white, letterSpacing: "0.1em", textTransform: "uppercase"
          }}>
            {props.title}
          </div>
        </div>
      )}

      {/* Chart area */}
      <div style={{
        position      : "absolute",
        top           : hasTitle && props.title ? 120 : 60,
        left          : 88,
        right         : 88,
        bottom        : props.voiceoverSync ? 130 : 60,
        display       : "flex",
        alignItems    : "center",
        justifyContent: "center"
      }}>
        {renderChart()}
      </div>

      {/* Voiceover sync caption */}
      {props.voiceoverSync && (
        <div style={{
          position : "absolute",
          bottom   : 48,
          left     : 88,
          right    : 180,
          opacity  : interpolate(frame, [fps * 0.8, fps * 1.2], [0, 1], { extrapolateRight: "clamp" })
        }}>
          <div style={{
            fontFamily: B.font, fontSize: 18, fontWeight: 400,
            color: "#666", fontStyle: "italic", lineHeight: 1.5
          }}>
            "{props.voiceoverSync}"
          </div>
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
        opacity      : titleOp * 0.85,
        textTransform: "uppercase"
      }}>
        GOVERNX
      </div>

    </AbsoluteFill>
  );
};
