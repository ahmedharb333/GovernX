/* ============================================================================
   assembled.jsx — AssembledFilm: the Remotion replacement for Shotstack (9B).

   Takes a scene list as inputProps and renders ONE synced video:
     • each scene → its case-file component (via registry)
     • each scene carries its own narration <Audio> (Stage 7B per-scene MP3)
     • each scene's on-screen length = its audio length (frame-accurate sync)
     • optional restyled captions (navy lower-third, red rule — not Shotstack's box)
     • gentle fade at each cut
   No cloud round-trip, no reassembly. Sync is guaranteed by construction:
   a scene is exactly as long as the words spoken over it.

   inputProps schema:
     {
       scenes: [{
         type            : "BAR_CHART" | ... ,   // routed via registry
         props           : { ... },              // component props
         audioSrc        : "audio/GX_..._scene_3.mp3" | "",  // staticFile path
         captionText     : "…",                  // narration line for subtitles
         durationInFrames: 210                    // = ceil(audioSec*fps)+pad
       }, ...],
       showCaptions: true,
       fps         : 30
     }

   Duration is computed by calculateMetadata (below) so the Composition never
   needs a hard-coded length.
   ============================================================================ */

import { AbsoluteFill, Audio, Series, staticFile, interpolate, useCurrentFrame } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { componentForName } from "./registry";

const FALLBACK_SCENE_FRAMES = 150;
const CAPTION_BAND = 150;          // reserved bottom strip for subtitles
const STAGE_H = 1080;

// ── restyled caption: navy lower-third, red rule, GovernX type ────────────────
const Caption = ({ text, durationInFrames }) => {
  const f = useCurrentFrame();
  if (!text) return null;
  const inOp = interpolate(f, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outOp = interpolate(f, [durationInFrames - 10, durationInFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const op = Math.min(inOp, outOp);
  // Captions ride in a reserved band at the very bottom; the scene above is
  // nudged up (see Scene) so nothing — source footer, verdict — sits under them.
  return (
    <div style={{
      position: "absolute", left: 0, right: 0, bottom: 0, height: CAPTION_BAND, opacity: op,
      display: "flex", alignItems: "center",
      // fully opaque band (was 0.96) so nothing behind bleeds through the caption
      backgroundColor: "rgba(8,13,24,1)", borderTop: `1px solid ${COLOR.navyPanel}`
    }}>
      <div style={{
        maxWidth: 1500, margin: "0 auto", padding: "0 60px",
        borderLeft: `4px solid ${COLOR.red}`, paddingLeft: 22,
        // Unified subtitle type: brand sans (Montserrat), BOLD, with a soft
        // drop-shadow so the line stays legible on any frame. One component =
        // every scene's caption is identical.
        fontFamily: FONT.sans, fontWeight: 700, fontSize: 30, lineHeight: 1.3, color: COLOR.white,
        letterSpacing: TRACK.tight, textAlign: "left",
        textShadow: "0 2px 6px rgba(0,0,0,0.6)"
      }}>
        {text}
      </div>
    </div>
  );
};

const Missing = ({ name }) => (
  <AbsoluteFill style={{ backgroundColor: COLOR.navyDeep, alignItems: "center", justifyContent: "center" }}>
    <div style={{ fontFamily: FONT.mono, fontSize: SIZE.body, color: COLOR.red }}>Unknown component: {String(name)}</div>
  </AbsoluteFill>
);

// Render one visual, or — for a split scene — visual[0] then visual[1] over the
// SAME audio clip (no audio surgery). `visuals:[{component,props},…]` + splitFrac.
const Visual = ({ component, type, props, visuals, splitFrac = 0.5, durationInFrames }) => {
  const f = useCurrentFrame();
  if (Array.isArray(visuals) && visuals.length) {
    const cut = Math.round((splitFrac || 0.5) * durationInFrames);
    const idx = f < cut ? 0 : 1;
    const v = visuals[Math.min(idx, visuals.length - 1)];
    const C = componentForName(v.component);
    // key by idx so each visual animates from its own frame 0
    return C ? <C key={idx} {...(v.props || {})} /> : <Missing name={v.component} />;
  }
  const C = componentForName(component) || componentForName(type);
  return C ? <C {...(props || {})} /> : <Missing name={component || type} />;
};

// Components animate their entrance (~2s) then hold. A scene is as long as its
// narration, so a 100s clip = 2s of motion and 98s of a literally frozen frame —
// consecutive frames 48s apart came back pixel-identical in the first Nissan cut.
// Anything past this threshold gets a slow continuous push-in so the image stays
// alive. Kept to 3% so nothing crops out of the safe area, and eased so the
// movement is never perceptible frame-to-frame — only felt over time.
const LONG_SCENE_FRAMES = 15 * 30;
const DRIFT_MAX = 1.03;

const Scene = ({ component, type, props, visuals, splitFrac, audioSrc, captionText, durationInFrames, showCaptions }) => {
  const f = useCurrentFrame();
  const hasCaption = showCaptions && captionText;
  const scale = hasCaption ? (STAGE_H - CAPTION_BAND) / STAGE_H : 1;
  const drift = durationInFrames > LONG_SCENE_FRAMES
    ? interpolate(f, [0, durationInFrames], [1, DRIFT_MAX], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navyDeep }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
        transform: `scale(${scale})`, transformOrigin: "top center" }}>
        {/* drift is its own layer so it composes with the caption matte above */}
        <div style={{ width: "100%", height: "100%", transform: `scale(${drift})`, transformOrigin: "center center" }}>
          <Visual component={component} type={type} props={props} visuals={visuals} splitFrac={splitFrac} durationInFrames={durationInFrames} />
        </div>
      </div>
      {audioSrc ? <Audio src={audioSrc.startsWith("http") ? audioSrc : staticFile(audioSrc)} /> : null}
      {hasCaption ? <Caption text={captionText} durationInFrames={durationInFrames} /> : null}
    </AbsoluteFill>
  );
};

export const AssembledFilm = ({ scenes = [], showCaptions = true, fps = 30 }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navyDeep }}>
      <Series>
        {scenes.map((s, i) => {
          const dur = Number.isInteger(s.durationInFrames) && s.durationInFrames > 0 ? s.durationInFrames : FALLBACK_SCENE_FRAMES;
          return (
            <Series.Sequence key={i} durationInFrames={dur}>
              <Scene {...s} durationInFrames={dur} showCaptions={showCaptions} />
            </Series.Sequence>
          );
        })}
      </Series>
    </AbsoluteFill>
  );
};

// Remotion calls this to size the Composition from the scene list — no hard-coded length.
export const calculateAssembledMetadata = ({ props }) => {
  const scenes = (props && props.scenes) || [];
  const total = scenes.reduce(
    (n, s) => n + (Number.isInteger(s.durationInFrames) && s.durationInFrames > 0 ? s.durationInFrames : FALLBACK_SCENE_FRAMES),
    0
  );
  return { durationInFrames: Math.max(total, 1) };
};

// A small Wells Fargo mock so the composition is previewable/renderable without
// the pipeline. Real runs pass `scenes` via inputProps.
export const ASSEMBLED_MOCK = {
  showCaptions: true,
  fps: 30,
  scenes: [
    { component: "CaseDataWall", props: {}, audioSrc: "", captionText: "Four numbers define this case — and who each one comes from matters as much as the figure itself.", durationInFrames: 210 },
    { component: "CaseBarChart", props: {}, audioSrc: "", captionText: "The regulatory and remediation outlays reached hundreds of millions of dollars.", durationInFrames: 180 },
    { component: "CaseBeforeAfter", props: {}, audioSrc: "", captionText: "Every process had a control — except the incentive that paid the bonus.", durationInFrames: 210 },
    { component: "CaseGauges", props: {}, audioSrc: "", captionText: "Control coverage was near-total everywhere, and almost absent where it counted.", durationInFrames: 180 },
    { component: "CaseRiskMatrix", props: {}, audioSrc: "", captionText: "The gap lived exactly where likelihood and impact were both highest.", durationInFrames: 180 }
  ]
};
