/* ============================================================================
   signature.jsx — GovernX signature narrative scenes (reusable, data-driven).

   The cinematic beats that made the hand-authored film feel like a case file,
   rebuilt as components the director can call for any company:
     ScaleField      — X of N, as an igniting dot field   (WF S5: 3.5M of 165M)
     ScopeArrow      — a figure revised up/down            (WF S7: 2.1M → 3.5M)
     ControlPerimeter— what sat outside the control fence  (WF S17–19)
     CaseCheckpoint  — a dated event + governance angle    (WF S3/6/9/17)
     CaseTimeline    — the exposure window, swept          (WF S16/21)

   All share the case-file language (navy ground, red = signal, source footer)
   and the evidence contract (source shown; claimId/confidence in data).
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, Vignette, SourceFooter, AttributionTag, Stamp, useCountUp } from "./parts";

const EO = Easing.out(Easing.cubic);
const A = (f, a, b, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });

const Shell = ({ code, title, titleColor = COLOR.white, children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, overflow: "hidden" }}>
      <Vignette />
      <Masthead code={code} delay={0} />
      {title && (
        <div style={{ position: "absolute", top: 128, left: SPACE.margin, right: SPACE.margin,
          fontFamily: FONT.serif, fontWeight: 700, fontSize: 54, color: titleColor,
          opacity: A(f, 4, 18) }}>{title}</div>
      )}
      {children}
    </AbsoluteFill>
  );
};

/* ── SCALE FIELD — "X of N" as an igniting dot field ─────────────────────────── */
export const ScaleField = ({
  totalLabel = "",
  subLabel = "",
  highlightValue = "", highlightUnit = "",
  highlightLabel = "",
  cols = 46, rows = 22, rate = 0.021,       // ~2.1% of dots ignite red, scattered
  attribution = "",
  sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  const gx0 = SPACE.margin, gy0 = 226, gw = 1920 - SPACE.margin * 2, gh = 470;
  const dx = gw / (cols - 1), dy = gh / (rows - 1);
  return (
    <Shell code="THE SCALE · SELF-REPORTED" title={totalLabel}>
      <div style={{ position: "absolute", top: 196, left: SPACE.margin, fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.1em", color: COLOR.mistDim, opacity: A(f, 8, 20) }}>{subLabel}</div>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: cols * rows }).map((_, i) => {
          const c = i % cols, r = Math.floor(i / cols);
          // integer hash → scattered, deterministic red selection (no grid artifact)
          let h = (i * 374761393 + 668265263) | 0;
          h = (h ^ (h >> 13)) * 1274126177;
          const isRed = ((h >>> 0) % 1000) < rate * 1000;
          const appear = A(f, 12 + (c + r) * 0.4, 26 + (c + r) * 0.4);
          const ignite = isRed ? A(f, 54 + (i % 20), 70 + (i % 20)) : 0;
          return (
            <circle key={i} cx={gx0 + c * dx} cy={gy0 + r * dy}
              r={isRed ? 4 + ignite * 3 : 3.4}
              fill={isRed ? COLOR.red : COLOR.mistDim}
              opacity={isRed ? 0.35 + ignite * 0.65 : appear * 0.5}
              style={isRed && ignite > 0.5 ? { filter: `drop-shadow(0 0 6px ${COLOR.red})` } : undefined} />
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: SPACE.margin, bottom: 150 }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: "0.14em", color: COLOR.red, opacity: A(f, 60, 74) }}>{highlightLabel}</div>
        <div style={{ display: "flex", alignItems: "baseline", opacity: A(f, 64, 78) }}>
          <span style={{ fontFamily: FONT.displayHeavy, fontSize: 168, color: COLOR.red, lineHeight: 0.9 }}>{highlightValue}</span>
          <span style={{ fontFamily: FONT.displayHeavy, fontSize: 72, color: COLOR.red, marginLeft: 14 }}>{highlightUnit}</span>
        </div>
      </div>
      <div style={{ position: "absolute", right: SPACE.margin, bottom: 168 }}><AttributionTag attribution={attribution} delay={70} /></div>
      <SourceFooter publisher={sourceLabel} docType={footnote} delay={74} right bottom={SPACE.lg} />
    </Shell>
  );
};

/* ── SCOPE ARROW — a figure revised up/down ──────────────────────────────────── */
export const ScopeArrow = ({
  title = "",
  leftValue = "", leftLabel = "", leftSub = "",
  rightValue = "", rightLabel = "", rightSub = "",
  footnote = "",
  attribution = "", sourceLabel = ""
}) => {
  const f = useCurrentFrame();
  const cy = 520;
  const arrowP = A(f, 34, 58);
  return (
    <Shell code="THE SCOPE EXPANDED" title={title}>
      {/* left (muted) */}
      <div style={{ position: "absolute", left: SPACE.margin, top: 320, opacity: A(f, 12, 28) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.12em", color: COLOR.mistDim, textTransform: "uppercase" }}>{leftSub}</div>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 150, color: COLOR.mist, lineHeight: 1 }}>{leftValue}</div>
        <div style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.mistDim }}>{leftLabel}</div>
      </div>
      {/* arrow */}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={760} y1={cy} x2={760 + arrowP * 260} y2={cy} stroke={COLOR.red} strokeWidth={12} strokeLinecap="round" />
        {arrowP > 0.9 && <polygon points={`${1020},${cy} ${1020 - 34},${cy - 22} ${1020 - 34},${cy + 22}`} fill={COLOR.red} />}
      </svg>
      {/* right (loud) */}
      <div style={{ position: "absolute", left: 1080, top: 300, opacity: A(f, 40, 58) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.12em", color: COLOR.red, textTransform: "uppercase" }}>{rightSub}</div>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 210, color: COLOR.white, lineHeight: 1 }}>{rightValue}</div>
        <div style={{ fontFamily: FONT.sans, fontSize: SIZE.h2, color: COLOR.mist }}>{rightLabel}</div>
      </div>
      <div style={{ position: "absolute", left: SPACE.margin, bottom: 200, fontFamily: FONT.mono, fontSize: SIZE.source, letterSpacing: "0.08em", color: COLOR.mistDim, textTransform: "uppercase", opacity: A(f, 64, 80) }}>{footnote}</div>
      <div style={{ position: "absolute", right: SPACE.margin, bottom: 168 }}><AttributionTag attribution={attribution} delay={68} /></div>
      <SourceFooter publisher={sourceLabel} docType="expanded account review" delay={72} bottom={SPACE.lg} />
    </Shell>
  );
};

/* ── CONTROL PERIMETER — what sat outside the fence ──────────────────────────── */
export const ControlPerimeter = ({
  title = "",
  perimeterLabel = "RISK GOVERNANCE PERIMETER",
  insideNodes = ["AUDIT", "RISK COMMITTEE", "COMPLIANCE"],
  outsideTitle = "",
  outsideSub = "",
  sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  const bx = 250, by = 300, bw = 900, bh = 520;
  const arrowP = A(f, 44, 64);
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, overflow: "hidden" }}>
      <Vignette />
      <Masthead code="THE ROOT CAUSE" delay={0} />
      <div style={{ position: "absolute", top: 128, left: SPACE.margin, right: SPACE.margin, fontFamily: FONT.serif, fontWeight: 700, fontSize: 54, color: COLOR.white, opacity: A(f, 4, 20) }}>{title}</div>
      <div style={{ position: "absolute", left: bx, top: by - 40, fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.16em", color: COLOR.mistDim, opacity: A(f, 14, 26) }}>{perimeterLabel}</div>
      {/* perimeter box */}
      <div style={{ position: "absolute", left: bx, top: by, width: bw, height: bh, border: `2px solid ${COLOR.mistDim}`, borderRadius: 14, opacity: A(f, 12, 28) }} />
      {insideNodes.map((n, i) => {
        // Pills were a fixed 220×64 with fixed type, so anything longer than
        // "RISK COMMITTEE" wrapped and spilled outside its own border — "BOARD OF
        // DIRECTORS" and "STATUTORY AUDITORS" both broke it. Size the pill to the
        // slot available and step the type down for longer labels, so the label
        // always sits inside its pill however many nodes there are.
        const step  = bw / (insideNodes.length + 1);
        const maxW  = Math.min(step - 24, 300);
        const label = String(n || "");
        const size  = label.length <= 14 ? SIZE.label : label.length <= 22 ? 22 : 18;
        return (
          <div key={i} style={{ position: "absolute", left: bx + step * (i + 1) - maxW / 2,
            top: by + bh / 2 - 34, width: maxW, minHeight: 68,
            display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
            padding: "8px 16px", boxSizing: "border-box",
            border: `1.5px solid ${COLOR.mist}`, borderRadius: 999, color: COLOR.mist,
            fontFamily: FONT.sans, fontWeight: 700, fontSize: size, lineHeight: 1.15,
            letterSpacing: "0.04em", opacity: A(f, 22 + i * 6, 38 + i * 6) }}>{label}</div>
        );
      })}
      {/* red arrow from outside box into perimeter */}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={1560} y1={by + bh / 2} x2={1560 - arrowP * 380} y2={by + bh / 2} stroke={COLOR.red} strokeWidth={11} strokeLinecap="round" />
        {arrowP > 0.9 && <polygon points={`${1180},${by + bh / 2} ${1180 + 34},${by + bh / 2 - 20} ${1180 + 34},${by + bh / 2 + 20}`} fill={COLOR.red} />}
      </svg>
      {/* outside compensation box */}
      <div style={{ position: "absolute", left: 1560, top: by + bh / 2 - 90, width: 300, opacity: A(f, 30, 46),
        border: `2px solid ${COLOR.red}`, backgroundColor: COLOR.redWash, borderRadius: 12, padding: "22px 26px" }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 30, color: COLOR.white, lineHeight: 1.1 }}>{outsideTitle}</div>
        <div style={{ fontFamily: FONT.sans, fontSize: SIZE.label, color: COLOR.red, marginTop: 10 }}>{outsideSub}</div>
      </div>
      <SourceFooter publisher={sourceLabel} docType={footnote} delay={60} bottom={SPACE.lg} />
    </AbsoluteFill>
  );
};

/* ── CASE CHECKPOINT — a dated event + governance angle ──────────────────────── */
export const CaseCheckpoint = ({
  date = "", event = "",
  angle = "",
  num = 1, total = 4, sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  return (
    <Shell code={`CHECKPOINT ${num} / ${total}`} title="">
      <div style={{ position: "absolute", left: SPACE.margin, top: 300, right: SPACE.margin }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: A(f, 8, 22) }}>
          <div style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: COLOR.red }} />
          {/* date + "GOVERNANCE ANGLE" were the two faintest labels in the system
              (thin red-on-navy, and mistDim at the smallest 16px size). Bolder,
              brighter, and one size up so they read on a phone. */}
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: SIZE.kicker, letterSpacing: "0.14em", color: COLOR.red, textTransform: "uppercase" }}>{date}</div>
        </div>
        <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 66, lineHeight: 1.12, color: COLOR.white, marginTop: 26, opacity: A(f, 14, 32), maxWidth: 1500 }}>{event}</div>
        <div style={{ marginTop: 44, borderLeft: `4px solid ${COLOR.red}`, paddingLeft: 24, opacity: A(f, 30, 48) }}>
          <div style={{ fontFamily: FONT.mono, fontWeight: 700, fontSize: SIZE.label, letterSpacing: "0.16em", color: COLOR.mist, marginBottom: 8 }}>GOVERNANCE ANGLE</div>
          <div style={{ fontFamily: FONT.displayHeavy, fontSize: 44, color: COLOR.white, textTransform: "uppercase", letterSpacing: TRACK.tight, maxWidth: 1400 }}>{angle}</div>
        </div>
      </div>
      {sourceLabel && <SourceFooter publisher={sourceLabel} docType={footnote} delay={50} bottom={SPACE.lg} />}
    </Shell>
  );
};

/* ── BEAT TIMELINE — 3 big readable beats, swept ─────────────────────────────── */
export const BeatTimeline = ({
  title = "",
  beats = [],
  sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  // y is the timeline rail; 660 centres the label+rail block in the visible area
  // (was 560, which left the whole bottom half empty).
  const y = 660, x0 = SPACE.margin + 200, x1 = 1920 - SPACE.margin - 200;
  const sweep = A(f, 16, 56);
  const n = beats.length;
  return (
    <Shell code="THE TIMELINE" title={title}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke={COLOR.mistDim} strokeWidth={2} />
        <line x1={x0} y1={y} x2={x0 + (x1 - x0) * sweep} y2={y} stroke={COLOR.red} strokeWidth={5} />
        {beats.map((_, i) => {
          const px = x0 + (x1 - x0) * (i / (n - 1));
          const on = sweep >= i / (n - 1) - 0.02;
          return <circle key={i} cx={px} cy={y} r={on ? 15 : 9} fill={on ? COLOR.red : COLOR.mistDim}
            style={on ? { filter: `drop-shadow(0 0 10px ${COLOR.red})` } : undefined} />;
        })}
      </svg>
      {beats.map((b, i) => {
        const px = x0 + (x1 - x0) * (i / (n - 1));
        const d = 22 + i * 10;
        return (
          <div key={i} style={{ position: "absolute", left: px - 200, width: 400, top: y - 240, textAlign: "center",
            opacity: A(f, d, d + 16), transform: `translateY(${A(f, d, d + 16, 18, 0)}px)` }}>
            <div style={{ fontFamily: FONT.displayHeavy, fontSize: 96, color: COLOR.white, lineHeight: 0.9 }}>{b.year}</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 30, color: COLOR.mist, marginTop: 16, lineHeight: 1.3 }}>{b.event}</div>
          </div>
        );
      })}
      <SourceFooter publisher={sourceLabel} docType={footnote} delay={54} bottom={SPACE.lg} />
    </Shell>
  );
};

/* ── CASE TIMELINE — the exposure window, swept ──────────────────────────────── */
/* Pull the DATE off the front of a checkpoint and treat the rest as the event.
   A checkpoint arrives in many shapes: "1999 · event" (adapter added the dot),
   "1999 event", "2009-2017 More…" (a range), "November 2018 Arrest…" (month +
   year), "FY2009–2017: …". The old code only handled an explicit "·"/":" plus a
   bare 4-digit year, so a RANGE or a MONTH-first date fell through and rendered
   with no big year at all — the middle timeline nodes looked empty next to
   "1999"/"2004". Now: an explicit separator wins; otherwise strip a leading date
   token (optional month word, a year, an optional -year range). */
const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
function splitCheckpoint(c) {
  const s = String(c || "").trim();
  const sep = s.match(/^(.{1,24}?)\s*[·:]\s*(.+)$/);
  if (sep) return { yr: sep[1].trim(), ev: sep[2].trim() };
  const date = s.match(new RegExp(
    "^((?:(?:" + MONTHS + ")[a-z]*\\.?\\s+)?(?:FY)?\\d{4}(?:\\s*[\\u2013\\u2014-]\\s*\\d{4})?)\\s+(.+)$", "i"));
  if (date) return { yr: date[1].trim(), ev: date[2].trim() };
  return s.length <= 12 ? { yr: s, ev: "" } : { yr: "", ev: s };
}

export const CaseTimeline = ({
  title = "",
  checkpoints = [],
  sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  const y = 560, x0 = SPACE.margin + 30, x1 = 1920 - SPACE.margin - 30;
  const sweep = A(f, 18, 60);
  const n = checkpoints.length;
  // Guard n===1: i/(n-1) is 0/0 → NaN → the dot and label vanish.
  const at = (i) => (n <= 1 ? 0.5 : i / (n - 1));
  return (
    <Shell code="THE TIMELINE" title={title}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={y} x2={x1} y2={y} stroke={COLOR.mistDim} strokeWidth={2} />
        <line x1={x0} y1={y} x2={x0 + (x1 - x0) * sweep} y2={y} stroke={COLOR.red} strokeWidth={4} />
        {checkpoints.map((_, i) => {
          const px = x0 + (x1 - x0) * at(i);
          const on = sweep >= at(i) - 0.02;
          return <circle key={i} cx={px} cy={y} r={on ? 11 : 7} fill={on ? COLOR.red : COLOR.mistDim}
            style={on ? { filter: `drop-shadow(0 0 8px ${COLOR.red})` } : undefined} />;
        })}
      </svg>
      {checkpoints.map((c, i) => {
        const px = x0 + (x1 - x0) * at(i);
        const up = i % 2 === 0;
        const { yr, ev } = splitCheckpoint(c);
        // `up` labels are anchored by their BOTTOM so they grow away from the
        // line instead of through it; both sides are height-capped so a long
        // event can never run off the frame (it clips instead).
        // The first/last labels would otherwise start at x≈10 and the long-scene
        // drift push-in (assembled.jsx, ~3%) crops roughly 29px per side — enough
        // to slice them off. Clamp into the safe area; edge labels lose perfect
        // centring over their dot, which is far cheaper than losing the words.
        const left = Math.max(40, Math.min(px - 140, 1920 - 280 - 40));
        return (
          <div key={i} style={{
            position: "absolute", left, width: 280, textAlign: "center",
            ...(up ? { bottom: 1080 - y + 34 } : { top: y + 34 }),
            maxHeight: 150, overflow: "hidden",
            display: "flex", flexDirection: "column", justifyContent: up ? "flex-end" : "flex-start",
            opacity: A(f, 24 + i * 6, 40 + i * 6)
          }}>
            {yr ? <div style={{ fontFamily: FONT.displayHeavy,
              fontSize: yr.length <= 6 ? 38 : yr.length <= 10 ? 30 : 24,
              color: COLOR.white, lineHeight: 1.05, whiteSpace: "nowrap" }}>{yr}</div> : null}
            {ev ? <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 17, color: COLOR.mist, marginTop: 4, lineHeight: 1.25 }}>{ev}</div> : null}
          </div>
        );
      })}
      <SourceFooter publisher={sourceLabel} docType={footnote} delay={58} bottom={SPACE.lg} />
    </Shell>
  );
};
