/* ============================================================================
   statements.jsx — Narrative text scenes in the case-file language.

   The director emits the story spine as "Text" scenes with a REMOTION_DATA
   `type=` of shatter | verdict | default (mainText + subText). Rendered
   literally these are seven identical text cards. StatementCard gives each
   `kind` its own cinematic treatment so the spine never repeats:
     • hook / shatter → editorial serif headline, the opening accusation
     • verdict        → condensed uppercase ruling + stamp
     • default        → a question, held in space
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, Stamp, Vignette, SourceFooter } from "./parts";

const EO = Easing.out(Easing.cubic);
const A = (f, a, b, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });

// A word wrapped in *asterisks* renders red — lets the director mark the signal
// word ("manufactured *fraud*"). No marks → last clause stays white.
const renderEmphasis = (text) => {
  const parts = String(text).split(/(\*[^*]+\*)/g);
  return parts.map((p, i) =>
    p.startsWith("*") && p.endsWith("*")
      ? <span key={i} style={{ color: COLOR.red }}>{p.slice(1, -1)}</span>
      : <span key={i}>{p}</span>
  );
};

export const StatementCard = ({
  mainText = "The metric that manufactured *fraud*.",
  subText = "",
  kind = "hook",                       // hook | shatter | verdict | default
  kicker = "",
  code = "CASE ANALYSIS",
  stampText = "",                      // e.g. CASE CLOSED / VERDICT
  sourceLabel = "", sourceYear = "", footnoteText = ""
}) => {
  const f = useCurrentFrame();
  const k = kind === "shatter" ? "hook" : kind;
  // subtle slow push so a text scene is never truly static
  const zoom = interpolate(f, [0, 300], [1, 1.028], { extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, overflow: "hidden" }}>
      <Vignette />
      <Masthead code={code} delay={0} />

      {k === "hook" && (
        <div style={{ position: "absolute", left: SPACE.margin, right: SPACE.margin, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {kicker && <div style={{ fontFamily: FONT.mono, fontSize: SIZE.kicker, letterSpacing: TRACK.label, color: COLOR.red, opacity: A(f, 6, 20), marginBottom: 24 }}>{kicker}</div>}
          <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 116, lineHeight: 1.03, color: COLOR.white, letterSpacing: "-0.01em", opacity: A(f, 10, 30), transform: `translateY(${A(f, 10, 30, 20, 0)}px) scale(${zoom})`, transformOrigin: "left center" }}>
            {renderEmphasis(mainText)}
          </div>
          <div style={{ width: A(f, 26, 46, 0, 640), maxWidth: "55%", height: 3, backgroundColor: COLOR.red, marginTop: 34, marginBottom: 30 }} />
          {subText && <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: SIZE.h2, lineHeight: 1.4, color: COLOR.mist, opacity: A(f, 40, 58), maxWidth: 1300 }}>{subText}</div>}
        </div>
      )}

      {k === "verdict" && (
        <div style={{ position: "absolute", left: SPACE.margin, right: SPACE.margin, top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ position: "relative" }}>
            {kicker && <div style={{ fontFamily: FONT.mono, fontSize: SIZE.kicker, letterSpacing: TRACK.label, color: COLOR.red, opacity: A(f, 6, 20), marginBottom: 22 }}>{kicker}</div>}
            <div style={{ fontFamily: FONT.displayHeavy, fontSize: 104, lineHeight: 1.02, color: COLOR.white, textTransform: "uppercase", letterSpacing: TRACK.tight, opacity: A(f, 10, 28), transform: `translateY(${A(f, 10, 28, 18, 0)}px) scale(${zoom})`, transformOrigin: "left center", maxWidth: 1500 }}>
              {renderEmphasis(mainText)}
            </div>
            <div style={{ width: A(f, 30, 52, 0, 520), height: 4, backgroundColor: COLOR.red, marginTop: 30, marginBottom: 28 }} />
            {subText && <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: SIZE.h2, color: COLOR.mist, opacity: A(f, 44, 62), letterSpacing: "0.02em" }}>{subText}</div>}
            {stampText && <div style={{ position: "absolute", right: 0, top: -80 }}><Stamp text={stampText} delay={54} rotate={-7} /></div>}
          </div>
        </div>
      )}

      {k === "default" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 220px" }}>
          <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 400, fontSize: 78, lineHeight: 1.22, color: COLOR.white, textAlign: "center", opacity: A(f, 10, 34), transform: `translateY(${A(f, 10, 34, 16, 0)}px) scale(${zoom})` }}>
            {renderEmphasis(mainText)}
          </div>
          {subText && <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: SIZE.body, letterSpacing: TRACK.label, color: COLOR.mist, textTransform: "uppercase", marginTop: 40, opacity: A(f, 40, 58) }}>{subText}</div>}
          <div style={{ width: A(f, 30, 50, 0, 120), height: 3, backgroundColor: COLOR.red, marginTop: 40 }} />
        </div>
      )}

      {sourceLabel && <SourceFooter publisher={sourceLabel} year={sourceYear} docType={footnoteText} delay={50} />}
    </AbsoluteFill>
  );
};
