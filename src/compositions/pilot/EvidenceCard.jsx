/* ============================================================================
   EvidenceCard.jsx — an off-white "document" card slides in over navy.
   Shows: claim headline · key number/date · verbatim extract · source label ·
   verified badge · primary-source stamp.  The trust unit of the video.
   Landscape 1920×1080.

   Props: claimId · headline · value · valueLabel · extract (verbatim quote) ·
   attribution · source {publisher, year, docType} · verified · primary.

   ⚠ ALL EVIDENCE DEFAULTS ARE EMPTY BY DESIGN — do not "helpfully" restore
   sample values. adapt.js prunes undefined props, so a default here renders as
   if it were this video's sourced evidence, and the ⑥ scene-number gate cannot
   catch it (the text lives in JSX, not the sheet). A pilot default once put
   Wells Fargo's 8-K attribution on a Nissan film. Missing data must render
   BLANK, never plausible. `verified` defaults false for the same reason.
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK, cardStyle } from "../../theme";
import { Masthead, VerifiedBadge, PrimaryBadge, AttributionTag, Stamp, Vignette, useFade, useSlide } from "./parts";

/* Defaults = data moment DM_4 (claim C8), Verified, attribution Regulator.
   `extract` must be the VERBATIM quote the engine gated against the document —
   never a paraphrase. The old "$185M total penalties" default appeared in no
   verified claim and would be rejected by the evidence gate. */
/* DEFAULTS MUST NEVER CARRY EVIDENCE — see the note in BigNumberPoster.jsx.
   `extract` is a verbatim quote field: a default here would put a real regulator
   quote from another case on screen. It stays empty. */
export const EvidenceCard = ({
  claimId     = "",
  headline    = "",
  value       = "",
  valueLabel  = "",
  extract     = "",
  attribution = "",
  source      = { publisher: "", year: "", docType: "" },
  verified    = false,
  primary     = false
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const cardX   = useSlide(6, 24, 80);
  const cardOp  = useFade(6, 22);
  const headOp  = useFade(20, 34);
  const valOp   = useFade(30, 44);
  const exOp    = useFade(42, 56);
  const ruleW   = interpolate(frame, [24, 40], [0, 100], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, opacity: fadeOut, overflow: "hidden" }}>
      <Vignette />
      <Masthead code={"EXHIBIT · " + claimId} delay={0} />

      {/* the document card */}
      <div style={{
        ...cardStyle, position: "absolute", left: SPACE.margin, right: SPACE.margin,
        top: 170, bottom: 150, padding: "56px 64px",
        opacity: cardOp, transform: `translateX(${cardX}px)`,
        display: "flex", flexDirection: "column"
      }}>
        {/* claim id chip + ruled top line */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 18, fontWeight: 700, color: COLOR.red, letterSpacing: "0.14em" }}>{claimId}</div>
          <div style={{ flex: 1, height: 3, backgroundColor: COLOR.red, width: `${ruleW}%` }} />
        </div>

        {/* headline */}
        <div style={{
          marginTop: 28, opacity: headOp, fontFamily: FONT.serif, fontSize: 56, fontWeight: 700,
          color: COLOR.ink, lineHeight: 1.1
        }}>
          {headline}
        </div>

        {/* big value + label */}
        <div style={{ marginTop: 36, display: "flex", alignItems: "flex-end", gap: 28, opacity: valOp }}>
          <div style={{ fontFamily: FONT.displayHeavy, fontSize: 200, fontWeight: 900, color: COLOR.red, lineHeight: 0.8, letterSpacing: TRACK.tight }}>
            {value}
          </div>
          <div style={{ fontFamily: FONT.sans, fontSize: SIZE.label, fontWeight: 700, letterSpacing: TRACK.label, color: COLOR.inkSoft, textTransform: "uppercase", paddingBottom: 20 }}>
            {valueLabel}
          </div>
        </div>

        {/* verbatim extract (the quote — trust) */}
        <div style={{
          marginTop: "auto", opacity: exOp, borderLeft: `5px solid ${COLOR.red}`,
          paddingLeft: 24, backgroundColor: COLOR.paperShade, padding: "20px 24px"
        }}>
          <div style={{ fontFamily: FONT.mono, fontSize: 14, letterSpacing: "0.16em", color: COLOR.inkSoft, textTransform: "uppercase", marginBottom: 8 }}>
            Verbatim extract
          </div>
          <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 28, color: COLOR.ink, lineHeight: 1.45 }}>
            “{extract}”
          </div>
        </div>

        {/* source line + badges */}
        <div style={{ marginTop: 26, display: "flex", justifyContent: "space-between", alignItems: "center", opacity: exOp }}>
          <div style={{ fontFamily: FONT.mono, fontSize: SIZE.source, letterSpacing: "0.08em", color: COLOR.inkSoft, textTransform: "uppercase" }}>
            Source: {source.publisher}{source.year ? ", " + source.year : ""}
            {source.docType ? "  ·  " + source.docType : ""}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <AttributionTag attribution={attribution} delay={40} />
            {primary  && <PrimaryBadge delay={44} />}
            {verified && <VerifiedBadge delay={48} />}
          </div>
        </div>
      </div>

      {/* regulatory stamp over the card corner */}
      <div style={{ position: "absolute", top: 210, right: 210 }}>
        <Stamp text={"ON THE RECORD"} delay={58} rotate={-9} />
      </div>
    </AbsoluteFill>
  );
};
