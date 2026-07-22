/* ============================================================================
   parts.jsx — Shared case-file building blocks for Pilot 001 compositions
   Masthead · SourceFooter · VerifiedBadge · PrimaryBadge · Stamp · RedArrow ·
   PaperTexture · useReveal helpers. Editorial motion only (reveal/draw/stamp).
   ============================================================================ */

import { interpolate, useCurrentFrame } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK, EASE } from "../../theme";

// ── reveal helpers ────────────────────────────────────────────────────────────
export const useFade = (start, end) => {
  const f = useCurrentFrame();
  return interpolate(f, [start, end], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
};
export const useSlide = (start, end, from) => {
  const f = useCurrentFrame();
  return interpolate(f, [start, end], [from, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
};
export const useGrow = (start, end, to) => {
  const f = useCurrentFrame();
  return interpolate(f, [start, end], [0, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
};

// ── GOVERNX case-file masthead (top rule) ────────────────────────────────────
export const Masthead = ({ code = "CASE FILE", delay = 0 }) => {
  const op = useFade(delay, delay + 12);
  const w  = useGrow(delay + 4, delay + 22, 100);
  return (
    <div style={{ position: "absolute", top: SPACE.lg, left: SPACE.margin, right: SPACE.margin, opacity: op }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontFamily: FONT.serif, fontSize: 30, fontWeight: 700, color: COLOR.white, letterSpacing: "0.06em" }}>
          GOVERN<span style={{ color: COLOR.red }}>X</span>
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.stamp, color: COLOR.mist, textTransform: "uppercase" }}>
          {code}
        </div>
      </div>
      <div style={{ height: 3, width: `${w}%`, backgroundColor: COLOR.red, marginTop: 10 }} />
    </div>
  );
};

// ── Source footer: SOURCE: CFPB, 2016 ────────────────────────────────────────
// `bottom` is overridable: scenes with a bottom banner must lift the footer
// clear of it, or the source line prints through the red bar.
export const SourceFooter = ({ publisher, year, docType, delay = 40, right = false, bottom = SPACE.lg }) => {
  const op = useFade(delay, delay + 16);
  if (!publisher) return null;
  return (
    <div style={{
      position: "absolute", bottom, left: right ? "auto" : SPACE.margin, right: right ? SPACE.margin : "auto",
      opacity: op, textAlign: right ? "right" : "left"
    }}>
      <div style={{ width: 40, height: 2, backgroundColor: COLOR.red, marginBottom: 8, marginLeft: right ? "auto" : 0 }} />
      <div style={{ fontFamily: FONT.mono, fontSize: SIZE.source, letterSpacing: "0.08em", color: COLOR.mist, textTransform: "uppercase" }}>
        Source: {publisher}{year ? ", " + year : ""}
      </div>
      {docType && (
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.06em", color: COLOR.mistDim, marginTop: 4, textTransform: "uppercase" }}>
          {docType}
        </div>
      )}
    </div>
  );
};

// ── Verified claim badge (green pill) ────────────────────────────────────────
export const VerifiedBadge = ({ delay = 30 }) => {
  const op = useFade(delay, delay + 12);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8, opacity: op,
      backgroundColor: COLOR.verifiedBg, border: `1px solid ${COLOR.verified}`,
      borderRadius: 999, padding: "6px 14px"
    }}>
      <span style={{ color: COLOR.verified, fontSize: 18, fontWeight: 900 }}>✓</span>
      <span style={{ fontFamily: FONT.sans, fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", color: COLOR.verified, textTransform: "uppercase" }}>
        Verified Claim
      </span>
    </div>
  );
};

// ── Primary-source badge ─────────────────────────────────────────────────────
export const PrimaryBadge = ({ label = "Primary Source", delay = 34 }) => {
  const op = useFade(delay, delay + 12);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8, opacity: op,
      backgroundColor: COLOR.primaryBg, border: `1px solid ${COLOR.primaryInk}`,
      borderRadius: 999, padding: "6px 14px"
    }}>
      <span style={{ fontFamily: FONT.sans, fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", color: COLOR.primaryInk, textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
};

// ── Attribution tag — WHO asserts this figure ────────────────────────────────
// The research engine proved that most of the famous Wells Fargo numbers are the
// bank's own disclosures, not regulator findings. A governance audience checks
// that distinction, so the frame must state it. Regulator/Court = authority
// blue; company self-reported = amber caution.
const ATTRIBUTION_STYLE = {
  "Regulator"            : { bg: COLOR.primaryBg,  ink: COLOR.primaryInk, text: "REGULATOR FINDING" },
  "Court"                : { bg: COLOR.primaryBg,  ink: COLOR.primaryInk, text: "COURT RECORD" },
  "Company self-reported": { bg: COLOR.yellow,     ink: COLOR.yellowInk,  text: "COMPANY SELF-REPORTED" },
  "Media"                : { bg: COLOR.paperShade, ink: COLOR.inkSoft,    text: "PRESS REPORT" },
  "Unclear"              : { bg: COLOR.paperShade, ink: COLOR.inkSoft,    text: "ATTRIBUTION UNCLEAR" }
};

export const AttributionTag = ({ attribution = "Regulator", delay = 38 }) => {
  const op = useFade(delay, delay + 12);
  // An ABSENT attribution (component didn't pass one) renders NOTHING — a loud
  // "ATTRIBUTION UNCLEAR" badge on a scene whose source is obvious from its title
  // ("SEC settlement penalties") reads as a defect. Only a DELIBERATE
  // attribution="Unclear" shows the warning; empty/unknown stays silent.
  const key = String(attribution || "").trim();
  if (!key) return null;
  const s = ATTRIBUTION_STYLE[key] || ATTRIBUTION_STYLE.Unclear;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", opacity: op,
      backgroundColor: s.bg, border: `1px solid ${s.ink}`, borderRadius: 999, padding: "6px 14px"
    }}>
      <span style={{ fontFamily: FONT.sans, fontSize: 15, fontWeight: 800, letterSpacing: "0.12em", color: s.ink }}>
        {s.text}
      </span>
    </div>
  );
};

// ── Regulatory stamp (rotated, mono, red border — "stamped" onto the frame) ──
export const Stamp = ({ text = "ON THE RECORD", delay = 46, rotate = -8, x = 0, y = 0 }) => {
  const f = useCurrentFrame();
  const scale = interpolate(f, [delay, delay + 8], [1.35, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const op    = interpolate(f, [delay, delay + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      transform: `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`,
      opacity: op, display: "inline-block",
      border: `3px solid ${COLOR.redDeep}`, color: COLOR.redDeep,
      padding: "8px 18px", borderRadius: 4,
      fontFamily: FONT.mono, fontSize: 22, fontWeight: 700, letterSpacing: TRACK.stamp, textTransform: "uppercase"
    }}>
      {text}
    </div>
  );
};

// ── Red signal arrow that DRAWS ON diagonally toward a target ────────────────
// Draws from (x1,y1) → (x2,y2) in SVG viewBox 1920×1080.
export const RedArrow = ({ x1, y1, x2, y2, delay = 24, dur = 20, width = 12 }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [delay, delay + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  const cx = x1 + (x2 - x1) * p;
  const cy = y1 + (y2 - y1) * p;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = 34;
  const hx1 = cx - head * Math.cos(ang - Math.PI / 7);
  const hy1 = cy - head * Math.sin(ang - Math.PI / 7);
  const hx2 = cx - head * Math.cos(ang + Math.PI / 7);
  const hy2 = cy - head * Math.sin(ang + Math.PI / 7);
  return (
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <line x1={x1} y1={y1} x2={cx} y2={cy} stroke={COLOR.red} strokeWidth={width} strokeLinecap="round" />
      {p > 0.94 && <polygon points={`${cx},${cy} ${hx1},${hy1} ${hx2},${hy2}`} fill={COLOR.red} />}
    </svg>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// EVIDENCE CONTRACT — every data component accepts these props and renders them
// through one shared footer, so source visibility is universal, not per-component.
//   { claimId, sourceLabel, verificationStatus, confidence, sourceType, footnoteText }
// verificationStatus: "Verified" | "Partial" | "Disputed" | "Unverified"
// confidence:         "High" | "Medium" | "Low"
// sourceType:         "Regulator" | "Court" | "Company self-reported" | "Media" | "Unclear"
// ══════════════════════════════════════════════════════════════════════════════

const VERIF_STYLE = {
  "Verified"  : { ink: COLOR.verified, bg: COLOR.verifiedBg, mark: "✓", text: "VERIFIED" },
  "Partial"   : { ink: COLOR.yellowInk, bg: COLOR.yellow,    mark: "◐", text: "PARTIAL" },
  "Disputed"  : { ink: "#8E0E20",       bg: COLOR.redWash,   mark: "!", text: "DISPUTED" },
  "Unverified": { ink: COLOR.mistDim,   bg: COLOR.paperShade, mark: "?", text: "UNVERIFIED" }
};

export const VerificationBadge = ({ status = "Verified", delay = 34 }) => {
  const op = useFade(delay, delay + 12);
  const s = VERIF_STYLE[status] || VERIF_STYLE.Unverified;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8, opacity: op,
      backgroundColor: s.bg, border: `1px solid ${s.ink}`, borderRadius: 999, padding: "6px 14px"
    }}>
      <span style={{ color: s.ink, fontSize: 16, fontWeight: 900 }}>{s.mark}</span>
      <span style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 800, letterSpacing: "0.12em", color: s.ink }}>
        {s.text} CLAIM
      </span>
    </div>
  );
};

// Claim id chip — the audit handle back to the Source Ledger.
export const ClaimChip = ({ claimId, delay = 30 }) => {
  const op = useFade(delay, delay + 10);
  if (!claimId) return null;
  return (
    <span style={{
      opacity: op, fontFamily: FONT.mono, fontSize: 14, letterSpacing: "0.14em",
      color: COLOR.mist, border: `1px solid ${COLOR.mistDim}`, borderRadius: 4, padding: "3px 9px"
    }}>
      {claimId}
    </span>
  );
};

// Confidence read-out — three ticks, filled by level.
export const ConfidenceMeter = ({ confidence = "High", delay = 32 }) => {
  const op = useFade(delay, delay + 10);
  const n = confidence === "High" ? 3 : confidence === "Medium" ? 2 : 1;
  const col = confidence === "High" ? COLOR.verified : confidence === "Medium" ? COLOR.yellow : COLOR.mistDim;
  return (
    <span style={{ opacity: op, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontFamily: FONT.mono, fontSize: 12, letterSpacing: "0.12em", color: COLOR.mistDim }}>CONF</span>
      {[0, 1, 2].map(i => (
        <span key={i} style={{ width: 16, height: 5, borderRadius: 2, backgroundColor: i < n ? col : COLOR.navyPanel }} />
      ))}
    </span>
  );
};

// The one evidence footer every serious data claim rides on. Composes source
// line + claim id + verification + confidence into the bottom strip.
// `audit` off (default, published cut): shows only viewer-facing evidence —
// the source line + VERIFIED badge. `audit` on (internal/compliance cut): also
// prints the claim id + confidence meter, the analyst handles back to the ledger.
// claimId/confidence are always ACCEPTED (locked to the number) but not painted
// on the published frame.
export const EvidenceFooter = ({
  claimId, sourceLabel, footnoteText, verificationStatus, confidence, sourceType,
  delay = 44, bottom = SPACE.lg, showBadge = true, audit = false
}) => {
  const op = useFade(delay, delay + 16);
  if (!sourceLabel && !claimId) return null;
  return (
    <div style={{ position: "absolute", left: SPACE.margin, right: SPACE.margin, bottom, opacity: op }}>
      <div style={{ width: 40, height: 2, backgroundColor: COLOR.red, marginBottom: 8 }} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20 }}>
        <div>
          {sourceLabel && (
            <div style={{ fontFamily: FONT.mono, fontSize: SIZE.source, letterSpacing: "0.08em", color: COLOR.mist, textTransform: "uppercase" }}>
              {sourceLabel.toLowerCase().startsWith("source") ? sourceLabel : "Source: " + sourceLabel}
            </div>
          )}
          {footnoteText && (
            <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.06em", color: COLOR.mistDim, marginTop: 4, textTransform: "uppercase" }}>
              {footnoteText}
            </div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 2 }}>
          {audit && <ConfidenceMeter confidence={confidence || "High"} delay={delay + 4} />}
          {audit && <ClaimChip claimId={claimId} delay={delay + 2} />}
          {showBadge && verificationStatus && <VerificationBadge status={verificationStatus} delay={delay + 6} />}
        </div>
      </div>
    </div>
  );
};

// ── Subtle paper grain / ruled document texture (opt-in, low key) ────────────
export const PaperTexture = ({ opacity = 0.05 }) => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none", opacity,
    backgroundImage: `repeating-linear-gradient(0deg, ${COLOR.mistDim} 0px, ${COLOR.mistDim} 1px, transparent 1px, transparent 44px)`
  }} />
);

// ── Vignette for authority depth (replaces the old red grid) ─────────────────
export const Vignette = () => (
  <div style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    background: `radial-gradient(120% 90% at 50% 40%, transparent 55%, ${COLOR.navyDeep} 100%)`
  }} />
);

// ── Animated count-up number (quart ease, no bounce) ─────────────────────────
export const useCountUp = (to, from = 0, start = 8, dur = 46, decimals = 0) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [start, start + dur], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE.out });
  return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
};
