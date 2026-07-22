/* ============================================================================
   router.js — Scene type → case-file composition.

   One place that maps the director's REMOTION_DATA `type` to the composition
   that renders it in the GovernX investigative aesthetic. Previously this
   mapping lived in Apps Script Stage 8D and pointed at the old flat templates;
   moving it here means the look is owned by the renderer, and the pipeline
   just names a type.

   Every target composition accepts an optional `audioSrc` prop (a staticFile
   path) so the scene carries its own narration — see SceneAudio in
   compositions and tts.js for how the clip and its duration are produced.
   ============================================================================ */

// Canonical map. Keys are upper-cased REMOTION_DATA types; values are the
// registered compositionId in Root.jsx.
const TYPE_TO_COMPOSITION = {
  // ── data-viz set (library.jsx) ──────────────────────────────────────────
  BAR_CHART        : "CaseBarChart",
  LINE_GRAPH       : "CaseLineGraph",
  BEFORE_AFTER_CARD: "CaseBeforeAfter",
  KPI_DASHBOARD    : "CaseKPIDashboard",
  PROGRESS_GAUGE   : "CaseGauges",
  RISK_MATRIX      : "CaseRiskMatrix",

  // ── narrative / story set (proven in film.jsx + pilot parts) ────────────
  // These reuse the pilot compositions already registered.
  DATA_CALLOUT     : "BigNumberPoster",
  COUNTER_ANIMATION: "BigNumberPoster",
  SPLIT_COMPARISON : "GovernanceMethod",   // two-register comparison
  CHECKPOINT       : "CheckpointCard",     // TODO: case-file re-skin pass
  TEXT_IMPACT      : "TextImpactScene",    // TODO: case-file re-skin pass
  TIMELINE         : "TimelineReveal",     // TODO: case-file re-skin pass
  EVIDENCE_CARD    : "EvidenceCard",
  OPENING_TITLE    : "OpeningTitle"
};

// Types that already ship in the new aesthetic (safe to route today).
const CASE_READY = new Set([
  "BAR_CHART", "LINE_GRAPH", "BEFORE_AFTER_CARD", "KPI_DASHBOARD",
  "PROGRESS_GAUGE", "RISK_MATRIX", "DATA_CALLOUT", "EVIDENCE_CARD", "SPLIT_COMPARISON"
]);

/** Resolve a scene type to its compositionId. Throws on unknown type — a
 *  silent fallback would ship the wrong look without anyone noticing. */
function resolveComposition(type) {
  const key = String(type || "").trim().toUpperCase();
  const id = TYPE_TO_COMPOSITION[key];
  if (!id) {
    throw new Error(
      `Unknown scene type "${type}". Known: ${Object.keys(TYPE_TO_COMPOSITION).join(", ")}`
    );
  }
  return { compositionId: id, caseReady: CASE_READY.has(key) };
}

module.exports = { TYPE_TO_COMPOSITION, CASE_READY, resolveComposition };
