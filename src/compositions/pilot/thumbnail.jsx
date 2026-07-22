/* ============================================================================
   thumbnail.jsx — ThumbnailPoster: a 1280×720 YouTube thumbnail in the
   case-file poster language, rendered from the SAME verified data as the film.

   Why not an AI image generator: text. Diffusion models still garble headlines
   (a reference poster came back reading "SCCAN DAL"), and every regeneration
   drifts from the design system. Here the type is real type — correct every
   time, identical brand, and driven by the claim data.

   The one thing this cannot invent is a photograph. `texture` renders the
   halftone dot field the reference posters use behind the headline; if a real
   image is ever wanted, pass `photoSrc` and it composites underneath.
   ============================================================================ */

import { AbsoluteFill, Img, useCurrentFrame, interpolate } from "remotion";
import { COLOR, FONT, TRACK } from "../../theme";

const W = 1280, H = 720;

// Halftone field — the dotted texture the poster style leans on, built from the
// data rather than drawn: `filled` of `total` dots are inked.
const Halftone = ({ cols = 44, rows = 26, filled = 0.035, seed = 7 }) => {
  const dots = [];
  const rnd = (i) => ((Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const on = rnd(i) < filled;
      dots.push(
        <circle key={i} cx={18 + c * 28} cy={16 + r * 26} r={on ? 7 : 5}
          fill={on ? COLOR.red : "rgba(255,255,255,0.10)"} />
      );
    }
  }
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{dots}</svg>;
};

/* ThumbnailCinematic — a moodier alternative that borrows the drama of a
   photo-style thumbnail (spotlight, depth, right-stacked headline, audit
   masthead) WITHOUT its liabilities: no trademarked logo, no AI-hallucinated
   "data" — the depth comes from a ghosted courthouse motif (institutional
   weight) and real lighting, and every word is a verified claim. */
export const ThumbnailCinematic = ({
  masthead = "GOVERNANCE AUDIT · GHOSN CASE",
  caseTag  = "CASE FILE Nº GX-2607",
  line1    = "THE $140M",
  line2    = "BLIND SPOT",
  subline  = "NISSAN'S FATAL ERROR",
}) => {
  const cols = [78, 196, 314, 432];   // four column x-positions
  return (
    <AbsoluteFill style={{ backgroundColor: "#080B12", overflow: "hidden" }}>
      <svg width={W} height={H} viewBox="0 0 1280 720" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="spot" cx="24%" cy="48%" r="58%">
            <stop offset="0%" stopColor="#24334F" />
            <stop offset="68%" stopColor="#0D1422" />
            <stop offset="100%" stopColor="#080B12" />
          </radialGradient>
          <radialGradient id="redglow" cx="72%" cy="44%" r="48%">
            <stop offset="0%" stopColor="rgba(200,16,46,0.32)" />
            <stop offset="100%" stopColor="rgba(200,16,46,0)" />
          </radialGradient>
          <linearGradient id="vign" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="28%" stopColor="rgba(0,0,0,0)" />
            <stop offset="72%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </linearGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#spot)" />
        <rect width="1280" height="720" fill="url(#redglow)" />

        {/* ghosted courthouse — institutional depth, not a trademark */}
        <g fill="#1C2A46" opacity="0.8">
          <polygon points="34,150 269,92 504,150" />
          <rect x="34" y="150" width="470" height="26" />
          {cols.map((x, i) => (
            <g key={i}>
              <rect x={x - 8} y="176" width="74" height="18" />
              <rect x={x} y="194" width="58" height="332" />
              <rect x={x - 8} y="526" width="74" height="20" />
            </g>
          ))}
        </g>
        {/* faint audit ledger rules (real texture, no fake numbers) */}
        <g stroke="#AEB9CC" strokeWidth="2" opacity="0.06">
          {[566, 590, 614, 638, 662].map((y, i) => <line key={i} x1="40" y1={y} x2="360" y2={y} />)}
        </g>

        <rect width="1280" height="720" fill="url(#vign)" />
      </svg>

      {/* masthead */}
      <div style={{ position: "absolute", top: 30, left: 44, right: 44, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 34, color: COLOR.white, letterSpacing: 1 }}>
          GOVERN<span style={{ color: COLOR.red }}>X</span>
        </div>
        <div style={{ width: 1, height: 26, backgroundColor: COLOR.mistDim }} />
        <div style={{ fontFamily: FONT.mono, fontSize: 18, letterSpacing: 4, color: COLOR.mist }}>{masthead}</div>
        <div style={{ flex: 1, height: 2, backgroundColor: COLOR.red, opacity: 0.85 }} />
        <div style={{ fontFamily: FONT.mono, fontSize: 15, letterSpacing: 2, color: COLOR.mistDim }}>{caseTag}</div>
      </div>

      {/* right-stacked headline */}
      <div style={{ position: "absolute", right: 48, top: 168, width: 800, textAlign: "right" }}>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 144, lineHeight: 0.92, color: COLOR.white,
          letterSpacing: "-0.02em", textShadow: "0 8px 34px rgba(0,0,0,0.65)" }}>{line1}</div>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 144, lineHeight: 0.92, color: COLOR.white,
          letterSpacing: "-0.02em", textShadow: "0 8px 34px rgba(0,0,0,0.65)" }}>{line2}</div>
        <div style={{ marginTop: 24, display: "inline-block", backgroundColor: COLOR.yellow, color: COLOR.yellowInk,
          fontFamily: FONT.sans, fontWeight: 900, fontSize: 38, letterSpacing: 1, padding: "8px 20px" }}>{subline}</div>
      </div>
    </AbsoluteFill>
  );
};

export const ThumbnailPoster = ({
  company   = "",
  headline  = "",
  bigValue  = "",
  bigUnit   = "",
  caption   = "",
  dateTag   = "",
  bannerText = "",
  hedge     = "",
  photoSrc  = "",
  ground    = "navy",         // "navy" | "paper"
  showCaption = false         // off: unreadable at real thumbnail size
}) => {
  const f = useCurrentFrame();
  const paper = ground === "paper";
  const bg    = paper ? COLOR.paper : COLOR.navyDeep;
  const ink   = paper ? COLOR.navy  : COLOR.white;

  // a slow settle so the same component also works as a motion end-card
  const rise = interpolate(f, [0, 18], [26, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      {photoSrc ? (
        <Img src={photoSrc} style={{ position: "absolute", inset: 0, width: W, height: H,
          objectFit: "cover", opacity: paper ? 0.18 : 0.28, filter: "grayscale(1) contrast(1.2)" }} />
      ) : (
        <Halftone filled={paper ? 0.028 : 0.045} />
      )}

      {/* company rule */}
      <div style={{ position: "absolute", top: 34, left: 44, right: 44,
        display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 34, height: 34, backgroundColor: COLOR.red }} />
        <div style={{ fontFamily: FONT.display, fontSize: 30, letterSpacing: TRACK.wide,
          color: ink, fontWeight: 700 }}>{company}</div>
        <div style={{ flex: 1, height: 3, backgroundColor: COLOR.red }} />
        {dateTag ? (
          <div style={{ fontFamily: FONT.sans, fontSize: 19, fontWeight: 800,
            backgroundColor: COLOR.yellow, color: COLOR.yellowInk, padding: "7px 15px",
            letterSpacing: TRACK.wide }}>{dateTag}</div>
        ) : null}
      </div>

      {/* Headline — deliberately SECONDARY. It used to be set at 76–92px, which
          made it compete with the figure; at the 336px YouTube actually serves,
          two large elements meant neither dominated. On a data-driven channel the
          NUMBER is the hook, so the headline sits back and frames it. */}
      <div style={{ position: "absolute", top: 100, left: 44, right: 300,
        fontFamily: FONT.displayHeavy, fontSize: headline.length > 30 ? 48 : 56,
        lineHeight: 1.02, color: ink, letterSpacing: TRACK.tight, opacity: 0.92,
        transform: `translateY(${rise}px)` }}>{headline}</div>

      {/* The figure — the hero. Sized to fill the frame and scaled down only as
          far as the text length forces, so a short value stays enormous. */}
      <div style={{ position: "absolute", left: 44, right: 44, top: 250,
        display: "flex", alignItems: "baseline", gap: 18, flexWrap: "wrap" }}>
        {hedge ? (
          <div style={{ position: "absolute", top: -40, left: 4, fontFamily: FONT.sans,
            fontSize: 26, fontWeight: 800, letterSpacing: TRACK.wide,
            color: paper ? COLOR.inkSoft : COLOR.mist }}>{hedge}</div>
        ) : null}
        <div style={{ fontFamily: FONT.displayHeavy,
          fontSize: String(bigValue).length <= 5 ? 268 : 208,
          lineHeight: 0.8, color: COLOR.red }}>{bigValue}</div>
        <div style={{ fontFamily: FONT.displayHeavy,
          fontSize: String(bigUnit).length <= 8 ? 132 : 96,
          lineHeight: 0.9, color: paper ? COLOR.navy : COLOR.yellow }}>{bigUnit}</div>
      </div>

      {/* Red arrow INTO the number. The end point is derived from the figure's
          own width — a fixed target landed in empty space to the right of a short
          value like "3.5 MILLION". `refX` sits at the marker's tip so the point
          of the arrowhead is what touches the number, not the middle of it. */}
      {(() => {
        // Land the head ON the figure, not past it. Width is estimated from the
        // text because the value is free-form ("$140" vs "9.078"), and the tip is
        // placed ~55% across the block so it reads as pointing AT the number
        // rather than hovering beside it.
        // The figure now fills the frame, so the arrow must approach from OUTSIDE
        // it — an earlier version aimed at the block's centre and buried its head
        // inside the digits, hiding the number it was meant to point at. It now
        // comes up from the empty lower-right and touches the figure's trailing
        // edge, which also fills the dead space that opened up under the banner.
        const vChars   = String(bigValue).length;
        const uChars   = String(bigUnit).length;
        const vSize    = vChars <= 5 ? 268 : 208;
        const uSize    = uChars <= 8 ? 132 : 96;
        const numTop   = 250;
        const blockEnd = Math.min(44 + vChars * vSize * 0.46 + 18 + uChars * uSize * 0.46, W - 150);
        const tipX     = blockEnd - 30;
        const tipY     = numTop + vSize * 0.58;                // mid-height of the figure
        const len      = 200;
        return (
          <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
            <defs>
              {/* refX = markerWidth → the TIP is the anchor point */}
              <marker id="tip" markerWidth="10" markerHeight="10" refX="10" refY="5"
                orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L10,5 L0,10 z" fill={COLOR.red} />
              </marker>
            </defs>
            <line x1={tipX + len} y1={tipY + len * 0.78} x2={tipX} y2={tipY}
              stroke={COLOR.red} strokeWidth={10} markerEnd="url(#tip)" strokeLinecap="round" />
          </svg>
        );
      })()}

      {/* The caption is OFF by default. At 336px a 50-character grey line is an
          illegible smear that only adds noise — the banner already carries the
          framing. Pass showCaption to bring it back for a large-format use. */}
      {caption && showCaption ? (
        <div style={{ position: "absolute", left: 44, bottom: 92, fontFamily: FONT.sans,
          fontSize: 25, fontWeight: 800, letterSpacing: TRACK.wide,
          color: paper ? COLOR.inkSoft : COLOR.mist }}>{caption}</div>
      ) : null}

      {bannerText ? (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 62,
          backgroundColor: COLOR.red, display: "flex", alignItems: "center", paddingLeft: 44 }}>
          <div style={{ fontFamily: FONT.sans, fontSize: 27, fontWeight: 900,
            letterSpacing: TRACK.wide, color: COLOR.white }}>{bannerText}</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
