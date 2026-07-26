/* ============================================================================
   BigNumberPoster.jsx — the HERO scene (investigative-poster energy)
   Mirrors the Wells Fargo reference: navy authority ground, dominant number,
   red arrow drawn to the failure figure, revision strikethrough (old→new),
   yellow date tag, verified/primary badges, source footer.  Landscape 1920×1080.

   Props (all optional): kicker · countTo/countFrom/decimals/prefix/suffix ·
   hedge · bigCaption · oldValue/oldNote/revisedNote (revision strikethrough) ·
   dateTag · bannerText · attribution · source · verified · primary · caseCode.

   ⚠ ALL EVIDENCE DEFAULTS ARE EMPTY BY DESIGN — see EvidenceCard.jsx. This
   component is the one that shipped Wells Fargo's "2.1M → REVISED UPWARD",
   "AUGUST 2017" and "THE BANK'S OWN REVIEW" onto a Nissan film because the
   adapter supplied only countTo. Missing data must render blank, never
   plausible. `caseCode` replaces a formerly hardcoded GX-2606-BIZ-001 masthead.
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, SourceFooter, VerifiedBadge, PrimaryBadge, AttributionTag, RedArrow, Vignette, useFade, useCountUp } from "./parts";

/* `hedge` renders small and grey above the caption so a source's qualifier
   ("potentially", "approximately") is present without shouting; `attribution`
   states who is actually asserting the figure. Both come from the data. */
/* DEFAULTS MUST NEVER CARRY EVIDENCE. adapt.js prunes undefined props, so any
   field the adapter fails to supply falls back to whatever is written here — a
   pilot-specific default silently renders ANOTHER company's sourced figures and
   the ⑥ gate cannot catch it (the text is in the JSX, not the sheet). Every
   evidence-bearing field therefore defaults to empty, and `verified` defaults to
   false so nothing is ever stamped VERIFIED without being told so explicitly. */
export const BigNumberPoster = ({
  kicker      = "",
  countTo     = 0,
  countFrom   = 0,
  decimals    = 1,
  prefix      = "",
  suffix      = "",
  hedge       = "",
  bigCaption  = "",
  oldValue    = "",
  oldNote     = "",
  revisedNote = "",
  dateTag     = "",
  bannerText  = "",
  attribution = "",
  source      = { publisher: "", year: "", docType: "" },
  verified    = false,
  primary     = false,
  caseCode    = "CASE FILE"
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const num       = useCountUp(Number(countTo), Number(countFrom), 14, 46, decimals);
  const kickerOp  = useFade(6, 20);
  const bannerW   = interpolate(frame, [0, 18], [0, 100], { extrapolateRight: "clamp" });
  const capOp     = useFade(52, 66);
  const oldOp     = useFade(64, 76);
  const strike    = interpolate(frame, [72, 84], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dateOp    = useFade(30, 42);
  const fadeOut   = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, opacity: fadeOut, overflow: "hidden" }}>
      <Vignette />
      <Masthead code={caseCode} delay={0} />

      {/* yellow date tag — the ONE emphasis element, top-right */}
      {dateTag && (
        <div style={{
          position: "absolute", top: 150, right: SPACE.margin, opacity: dateOp,
          backgroundColor: COLOR.yellow, color: COLOR.yellowInk, transform: "rotate(2deg)",
          padding: "8px 18px", fontFamily: FONT.sans, fontWeight: 800, fontSize: SIZE.label,
          letterSpacing: "0.14em", boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
        }}>
          {dateTag}
        </div>
      )}

      {/* kicker */}
      <div style={{
        position: "absolute", top: 210, left: SPACE.margin, right: SPACE.margin, opacity: kickerOp,
        fontFamily: FONT.display, fontWeight: 900, fontSize: SIZE.title, color: COLOR.white,
        letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 1.02
      }}>
        {kicker}
      </div>

      {/* Red arrow removed: it was hardcoded to a fixed diagonal (1840,330 → 1452,478),
          so for a short value the number sits far left and the arrow points into empty
          navy — and it always angles DOWN, implying "decline" even when the figure rose.
          The huge red/white number + tag already carry the emphasis; the arrow was noise. */}

      {/* THE NUMBER */}
      <div style={{
        position: "absolute", top: 330, left: SPACE.margin, right: SPACE.margin,
        display: "flex", alignItems: "flex-end"
      }}>
        <div style={{
          fontFamily: FONT.displayHeavy, fontWeight: 900, fontSize: SIZE.hero, lineHeight: 0.85,
          color: COLOR.white, letterSpacing: TRACK.tight
        }}>
          {prefix}{num}<span style={{ color: COLOR.red }}>{suffix}</span>
        </div>
      </div>

      {/* caption under number — the hedge sits above it, small and honest */}
      <div style={{ position: "absolute", top: 618, left: SPACE.margin, opacity: capOp }}>
        {hedge && (
          <div style={{
            fontFamily: FONT.mono, fontSize: SIZE.label, color: COLOR.mistDim,
            letterSpacing: TRACK.label, textTransform: "uppercase", marginBottom: 2
          }}>
            {hedge}
          </div>
        )}
        <div style={{
          fontFamily: FONT.display, fontWeight: 800, fontSize: SIZE.heroSub, color: COLOR.mist,
          letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1
        }}>
          {bigCaption}
        </div>
      </div>

      {/* revision strikethrough: old value → corrected */}
      {oldValue && (
        <div style={{ position: "absolute", top: 770, left: SPACE.margin, opacity: oldOp }}>
          <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.14em", color: COLOR.mistDim, textTransform: "uppercase", marginBottom: 4 }}>
            {oldNote}
          </div>
          <div style={{ position: "relative", display: "inline-block" }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 52, color: COLOR.mistDim }}>{oldValue}</span>
            <div style={{ position: "absolute", top: "52%", left: -4, width: `${strike}%`, height: 5, backgroundColor: COLOR.red }} />
          </div>
          <span style={{ marginLeft: 24, color: COLOR.red, fontSize: 40, fontWeight: 900 }}>→</span>
          <span style={{ marginLeft: 24, fontFamily: FONT.display, fontWeight: 900, fontSize: 52, color: COLOR.white }}>
            {revisedNote}
          </span>
        </div>
      )}

      {/* trust badges — bottom right. Attribution first: it is the load-bearing one. */}
      <div style={{ position: "absolute", bottom: 150, right: SPACE.margin, display: "flex", gap: 12, alignItems: "center" }}>
        <AttributionTag attribution={attribution} delay={36} />
        {primary  && <PrimaryBadge delay={40} />}
        {verified && <VerifiedBadge delay={46} />}
      </div>

      {/* red banner bar */}
      {bannerText && (
        <div style={{ position: "absolute", bottom: 70, left: 0, width: `${bannerW}%`, backgroundColor: COLOR.red, padding: "14px 0" }}>
          <div style={{
            paddingLeft: SPACE.margin, fontFamily: FONT.display, fontWeight: 900, fontSize: 34,
            color: COLOR.white, letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap"
          }}>
            {bannerText}
          </div>
        </div>
      )}

      {/* lifted clear of the red banner (banner occupies bottom 70→~130) */}
      <SourceFooter publisher={source.publisher} year={source.year} docType={source.docType} delay={54} bottom={152} />
    </AbsoluteFill>
  );
};
