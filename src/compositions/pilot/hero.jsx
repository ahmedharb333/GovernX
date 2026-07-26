/* ============================================================================
   hero.jsx — OpeningHook + VerdictCard: the two authority bookends of V3.

   OpeningHook — the first 3 seconds. A scandal case-file poster that ASSEMBLES
   fast (everything essential on screen by ~1s: company, the number, the label,
   red marker, source, badge), then keeps moving (secondary reveal + a slow
   controlled zoom) so it never sits static for the full clip.

   VerdictCard — the closing authority. GOVERNX VERDICT, the one-line ruling,
   the sign-off. Lands the film; never end on a timeline.
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, VerifiedBadge, PrimaryBadge, Vignette } from "./parts";
import { fitValueSize } from "./library";

const EO = Easing.out(Easing.cubic);
const A = (f, a, b, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });
const stampIn = (f, at) => interpolate(f, [at, at + 7], [1.28, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });

/* ── OPENING HOOK ───────────────────────────────────────────────────────────── */
export const OpeningHook = ({
  company = "",
  kicker = "",
  bigValue = "", bigUnit = "",
  caption = "",
  secondary = "",
  sourceLabel = "", sourceYear = "",
  claimId = "",
  caseCode = "GOVERNANCE ALERT"
}) => {
  const f = useCurrentFrame();
  // slow controlled zoom on the number for the tail — motion without a new cut
  const zoom = interpolate(f, [40, 380], [1, 1.035], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  // A source line + "VERIFIED / Primary Source" badges may ONLY show when the
  // data carried a real, external publisher. When the adapter has no publisher
  // it self-cites ("GovernX") — which reads on screen as "SOURCE: GOVERNX, 2024"
  // under a claimed-verified figure, i.e. GovernX citing itself as the primary
  // source. That is a false citation (see THE ONE INVARIANT). Gate on it.
  const hasRealSource = String(sourceLabel || "").trim() && !/govern\s*-?x/i.test(sourceLabel);
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, overflow: "hidden" }}>
      <Vignette />
      <Masthead code={caseCode} delay={0} />

      {/* company tag — snaps in immediately */}
      <div style={{ position: "absolute", top: 150, left: SPACE.margin, opacity: A(f, 2, 8),
        border: `2px solid ${COLOR.red}`, padding: "8px 18px", display: "inline-block" }}>
        <span style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 26, letterSpacing: "0.14em", color: COLOR.white }}>{company}</span>
      </div>
      <div style={{ position: "absolute", top: 158, left: SPACE.margin + 320, fontFamily: FONT.mono, fontSize: SIZE.kicker,
        letterSpacing: TRACK.label, color: COLOR.red, opacity: A(f, 6, 14) }}>{kicker}</div>

      {/* the number — slams in by ~0.5s, then holds with slow zoom */}
      <div style={{ position: "absolute", top: 300, left: SPACE.margin, transform: `scale(${stampIn(f, 8) * zoom})`, transformOrigin: "left top", opacity: A(f, 8, 14) }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontFamily: FONT.displayHeavy, fontSize: 300, lineHeight: 0.85, color: COLOR.red }}>{bigValue}</span>
          <span style={{ fontFamily: FONT.displayHeavy, fontSize: 120, color: COLOR.red, marginLeft: 20 }}>{bigUnit}</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 620, left: SPACE.margin, opacity: A(f, 16, 26) }}>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 76, color: COLOR.white, textTransform: "uppercase", letterSpacing: TRACK.tight }}>{caption}</div>
      </div>

      {/* red failure marker — a slash that draws through */}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <line x1={SPACE.margin} y1={730} x2={SPACE.margin + A(f, 22, 40) * 900} y2={730} stroke={COLOR.red} strokeWidth={6} />
      </svg>

      {/* secondary reveal — keeps motion past 1s */}
      <div style={{ position: "absolute", top: 770, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 60, 88),
        fontFamily: FONT.serif, fontSize: 40, fontStyle: "italic", color: COLOR.mist }}>{secondary}</div>

      {/* evidence cluster — badges grouped with the source, bottom-right.
          Only shown with a real external source; never self-cite as "VERIFIED". */}
      {hasRealSource && (
        <div style={{ position: "absolute", bottom: 130, right: SPACE.margin, display: "flex", gap: 14, transform: `scale(${stampIn(f, 30)})`, transformOrigin: "right bottom" }}>
          <VerifiedBadge delay={30} />
          <PrimaryBadge label="Primary Source" delay={36} />
        </div>
      )}

      {/* prominent source footer — blank when there's no external publisher
          (year alone, or a "GovernX" self-citation, is not a source). */}
      {hasRealSource && (
        <div style={{ position: "absolute", bottom: SPACE.lg, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 40, 56) }}>
          <div style={{ width: 60, height: 3, backgroundColor: COLOR.red, marginBottom: 10 }} />
          <div style={{ fontFamily: FONT.mono, fontSize: 26, letterSpacing: "0.08em", color: COLOR.white, textTransform: "uppercase" }}>
            Source: {sourceLabel}{sourceYear ? `, ${sourceYear}` : ""}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

/* ── STAT POSTER — one clean formatted number + caption + source + badge ─────── */
export const StatPoster = ({
  kicker = "", value = "", caption = "",
  sublabel = "", sourceLabel = "", claimId = "",
  attribution = "", valueColor = COLOR.red
}) => {
  const f = useCurrentFrame();
  const ATT = attribution === "Company self-reported"
    ? { bg: COLOR.yellow, ink: COLOR.yellowInk, t: "COMPANY SELF-REPORTED" }
    : attribution === "Regulator" ? { bg: COLOR.primaryBg, ink: COLOR.primaryInk, t: "REGULATOR FINDING" }
    : { bg: COLOR.primaryBg, ink: COLOR.primaryInk, t: "COURT RECORD" };
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, overflow: "hidden" }}>
      <Vignette />
      <Masthead code="THE FIGURE · SOURCE-BACKED" delay={0} />
      {/* value + caption + sublabel FLOW as a column from a fixed top, so a long
          value ("roughly 35 billion yen or more") wraps and pushes the caption
          down instead of overflowing the frame. The value font scales to its own
          length via the shared fitValueSize — the same fix as DataWall/KPI.
          A short number like "$15M" still renders huge. */}
      <div style={{ position: "absolute", top: 300, left: SPACE.margin, right: SPACE.margin,
        display: "flex", flexDirection: "column", gap: 22 }}>
        {kicker ? <div style={{ fontFamily: FONT.mono, fontSize: SIZE.kicker, letterSpacing: TRACK.label,
          color: COLOR.red, opacity: A(f, 6, 16) }}>{kicker}</div> : null}
        <div style={{ transform: `scale(${stampIn(f, 8)})`, transformOrigin: "left top", opacity: A(f, 8, 16) }}>
          <span style={{ fontFamily: FONT.displayHeavy, fontSize: fitValueSize(value, 300), lineHeight: 0.86,
            color: valueColor, display: "block", maxWidth: 1640 }}>{value}</span>
        </div>
        <div style={{ opacity: A(f, 20, 34), fontFamily: FONT.displayHeavy,
          fontSize: 68, color: COLOR.white, textTransform: "uppercase", letterSpacing: TRACK.tight,
          lineHeight: 1.02 }}>{caption}</div>
        {sublabel ? <div style={{ opacity: A(f, 30, 44), fontFamily: FONT.serif, fontStyle: "italic",
          fontSize: 36, color: COLOR.mist }}>{sublabel}</div> : null}
      </div>
      <div style={{ position: "absolute", bottom: 128, right: SPACE.margin, transform: `scale(${stampIn(f, 36)})`, transformOrigin: "right bottom" }}>
        <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: ATT.bg, borderRadius: 999, padding: "6px 16px" }}>
          <span style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 15, letterSpacing: "0.12em", color: ATT.ink }}>{ATT.t}</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: SPACE.lg, left: SPACE.margin, opacity: A(f, 40, 56) }}>
        <div style={{ width: 60, height: 3, backgroundColor: COLOR.red, marginBottom: 10 }} />
        <div style={{ fontFamily: FONT.mono, fontSize: 24, letterSpacing: "0.08em", color: COLOR.white, textTransform: "uppercase" }}>Source: {sourceLabel}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ── VERDICT CARD ───────────────────────────────────────────────────────────── */
export const VerdictCard = ({
  ruling = "",
  punch = "",
  signOff = "Governance · Risk · Compliance"
}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navyDeep, overflow: "hidden" }}>
      <Vignette />
      <div style={{ position: "absolute", top: 200, left: SPACE.margin, opacity: A(f, 4, 16) }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, backgroundColor: COLOR.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 30, color: COLOR.white }}>X</span>
          </div>
          <span style={{ fontFamily: FONT.displayHeavy, fontSize: 54, letterSpacing: TRACK.label, color: COLOR.white }}>GOVERNX VERDICT</span>
        </div>
        <div style={{ width: A(f, 14, 40) * 520, height: 3, backgroundColor: COLOR.red, marginTop: 20 }} />
      </div>
      <div style={{ position: "absolute", top: 380, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 20, 44),
        fontFamily: FONT.serif, fontSize: 58, lineHeight: 1.32, color: COLOR.white, maxWidth: 1500 }}>
        {ruling}
      </div>
      <div style={{ position: "absolute", top: 720, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 56, 78),
        fontFamily: FONT.displayHeavy, fontSize: 60, color: COLOR.red, textTransform: "uppercase", letterSpacing: TRACK.tight, maxWidth: 1500 }}>
        {punch}
      </div>
      <div style={{ position: "absolute", bottom: 110, left: SPACE.margin, opacity: A(f, 80, 100) }}>
        <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 44, color: COLOR.white }}>GOVERN<span style={{ color: COLOR.red }}>X</span></div>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.label, color: COLOR.mist, marginTop: 6, textTransform: "uppercase" }}>{signOff}</div>
      </div>
    </AbsoluteFill>
  );
};
