/* ============================================================================
   adapt.js — REMOTION_DATA (pipe format) → { component, props }.

   Resolves each scene the director emits to the right case-file component AND
   routes by CONTENT so the 21 scenes never repeat a look:
     Text  shatter/verdict/default → StatementCard (kind)
     Checkpoint                     → CaseCheckpoint
     Timeline                       → CaseTimeline
     COUNTER_ANIMATION  (≥10M "of N")→ ScaleField     else BigNumberPoster
     SPLIT_COMPARISON   (scope/grow) → ScopeArrow      else CaseSplit
     LINE_GRAPH  (event labels)      → CaseTimeline     else CaseLineGraph
     BAR_CHART/KPI/GAUGE/RISK/B-A    → Case* data-viz

   Facts are never invented: only fields present in the string are set.
   Returns { component: "<RegisteredName>", props }.
   ============================================================================ */

function parseKV(raw) {
  const kv = {};
  String(raw || "").split("|").forEach(pair => {
    const i = pair.indexOf("=");
    if (i === -1) return;
    const k = pair.slice(0, i).trim().toLowerCase();
    const v = pair.slice(i + 1).trim();
    if (k) kv[k] = v;
  });
  return kv;
}
const num = (s) => { const n = parseFloat(String(s).replace(/[, ]/g, "")); return Number.isFinite(n) ? n : undefined; };
const bool = (s) => String(s).trim().toLowerCase() === "true";
// Split array items on commas — EXCEPT a thousands separator inside a number.
//
// This was originally a whitelist of what may START an item (letter/$, then a
// year, then a year-range). Every widening fixed one case and missed the next:
// "…status,2004: Board…" collapsed a timeline, then "…,2016–2018: …" did, then
// "…Regulator,10 years:…" and "…status,2004 → …" (arrow, not colon) still failed.
// A whitelist can't enumerate every way an item may begin.
//
// Inverted: split on EVERY comma except one that is genuinely a thousands
// separator — a digit before it AND exactly three digits after it not followed
// by a fourth. "130,000" and "5,300" stay whole; "…:true,$15M", ",10 years:",
// ",2004 → ", ",2016–2018:" and "2009:50,2016:1" all split correctly.
const splitItems = (s) => String(s || "")
  .split(/(?<!\d),|,(?!\d{3}(?!\d))/)
  .map(x => x.trim()).filter(Boolean);
// "Accounts Reviewed:93.5 million,Potentially Unauthorized:~2.1 million" → [[k,v],…]
const pairs = (s) => splitItems(s).map(it => { const i = it.indexOf(":"); return i === -1 ? [it, ""] : [it.slice(0, i).trim(), it.slice(i + 1).trim()]; });
function shortNum(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(n % 1e9 ? 1 : 0) + " BILLION";
  if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 ? 1 : 0) + " MILLION";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return String(n);
}
function prune(o) {
  const out = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

// ── narrative ─────────────────────────────────────────────────────────────────
function statement(kv, subType) {
  const kind = ["shatter", "hook", "verdict", "default"].includes(subType) ? (subType === "shatter" ? "shatter" : subType) : "default";
  return { component: "StatementCard", props: prune({
    mainText: kv.maintext, subText: kv.subtext, kind,
    code: kind === "verdict" ? "THE RULING" : kind === "default" ? "THE QUESTION" : "CASE ANALYSIS",
    stampText: kind === "verdict" ? "ON THE RECORD" : ""
  }) };
}
function checkpoint(kv) {
  // num/total are NOT defaulted here: a per-scene adapter cannot know a scene's
  // position, and defaulting to 1/4 stamped "CHECKPOINT 1 / 4" on every card.
  // Left undefined (pruned) so buildScenes can number them in film order.
  return { component: "CaseCheckpoint", props: prune({
    date: kv.date, event: kv.event, angle: kv.angle,
    num: num(kv.num), total: num(kv.total)
  }) };
}
function timeline(kv) {
  const cps = splitItems(kv.checkpoints).map(c => c.replace(/^(\d{4})\s+/, "$1 · "));
  return { component: "CaseTimeline", props: prune({ title: kv.title, checkpoints: cps }) };
}

// ── numbers ───────────────────────────────────────────────────────────────────
// A unit like "$M", "¥B+" or "%" carries a leading currency symbol that belongs
// in FRONT of the number and a magnitude that belongs after it. Passing the raw
// string as `suffix` rendered "35 ¥B+" as an overlapping block; split it so the
// poster shows "¥35B+".
function splitUnit(unit) {
  const u = String(unit || "").trim();
  if (!u) return { prefix: "", suffix: "" };
  const m = u.match(/^([$¥€£])\s*(.*)$/);
  if (m) return { prefix: m[1], suffix: m[2].trim() };
  return { prefix: "", suffix: u };
}

function counter(kv) {
  const to = num(kv.to || kv.value);
  const { prefix, suffix } = splitUnit(kv.unit);
  if (to !== undefined && to >= 1e7) {   // huge "of N" → dot field
    return { component: "ScaleField", props: prune({
      totalLabel: (shortNum(to) + " " + (kv.unit || "") + " reviewed").toUpperCase().replace(/\s+/g, " ").trim(),
      subLabel: kv.label
    }) };
  }
  // `kicker` and `bigCaption` are two SEPARATE lines on the poster — setting both
  // to kv.label printed the caption twice, overlapping itself. The label is the
  // caption; the kicker only carries a distinct short lead-in if one is supplied.
  return { component: "BigNumberPoster", props: prune({
    kicker: kv.kicker && kv.kicker !== kv.label ? kv.kicker : "",
    countTo: to, countFrom: num(kv.from) || 0,
    decimals: to !== undefined && to % 1 === 0 ? 0 : 1,   // whole numbers lose the ".0"
    prefix, suffix, bigCaption: kv.label, dateTag: kv.context
  }) };
}

// ── comparisons ───────────────────────────────────────────────────────────────
const GROWTH = /original|expanded|scope|estimate|before|after|prior|revised/i;
// NO FABRICATED FALLBACK. This was once the pilot's source ledger
// ("Wells Fargo · CFPB · Court") so that no data scene rendered sourceless — but
// that put one company's attribution under another company's figures. A scene
// with no source in its data now renders with NO source line: an obviously
// missing footer is a fixable defect, a wrong one is a false citation.
const FALLBACK_SOURCE = "";
// "~2.1 million" → "~2.1M"; "$7.0 million" → "$7.0M" — short enough for big display
const shortVal = (v) => String(v).replace(/\s*million\b/gi, "M").replace(/\s*billion\b/gi, "B").replace(/\s+/g, " ").trim();
// drop a leading "$7.0M " that already repeats in the value
const cleanKey = (k) => String(k).replace(/^\$[\d.,]+\s*[MBK]?\s+/i, "").trim();
function pickHeadline(rows) {
  if (!rows.length) return "";
  // the STORY value is the unauthorized/fee count — never the "accounts reviewed" denominator
  const r = rows.find(x => /unauthor|potential/i.test(x[0])) || rows.find(x => /fee/i.test(x[0])) || rows[rows.length - 1];
  return r[1];
}
function split(kv) {
  const lRows = pairs(kv.left_values), rRows = pairs(kv.right_values);
  const growth = GROWTH.test(kv.left_label || "") || GROWTH.test(kv.right_label || "");
  const lVal = shortVal(pickHeadline(lRows)), rVal = shortVal(pickHeadline(rRows));
  if (growth && lVal && rVal) {   // same metric growing → scope arrow
    return { component: "ScopeArrow", props: prune({
      title: (kv.title || "The scope expanded").toUpperCase(),
      leftValue: lVal, leftLabel: "", leftSub: kv.left_label,
      rightValue: rVal, rightLabel: "", rightSub: kv.right_label,
      footnote: kv.bottom_note
    }) };
  }
  const dedupe = (rows) => rows.map(([k, v]) => [cleanKey(k), shortVal(v)]);
  // no data scene may be sourceless — fall back to the case source ledger
  return { component: "CaseSplit", props: prune({
    title: kv.title, leftLabel: kv.left_label, leftRows: dedupe(lRows),
    rightLabel: kv.right_label, rightRows: dedupe(rRows), bottomNote: kv.bottom_note,
    sourceLabel: kv.source_publisher || kv.source || FALLBACK_SOURCE
  }) };
}

// ── data-viz ──────────────────────────────────────────────────────────────────
// Attribution the director may state directly, or infer from a source publisher
// (SEC/CFPB/court → Regulator/Court). Returned undefined when truly unknown, so
// the tag stays silent rather than showing "ATTRIBUTION UNCLEAR".
function attributionFrom(kv) {
  const a = String(kv.attribution || "").trim();
  if (a) return a;
  const s = String(kv.source_publisher || kv.source || "").toLowerCase();
  if (/sec\b|cfpb|occ|regulat|prosecut/.test(s)) return "Regulator";
  if (/court|judg|settlement/.test(s)) return "Court";
  if (/compan|self|internal|nissan|issuer/.test(s)) return "Company self-reported";
  return undefined;
}
function barChart(kv) {
  const bars = splitItems(kv.points).map(it => { const [l, v, h] = it.split(":"); return { label: (l || "").trim(), value: num(v), highlight: bool(h) }; }).filter(b => b.value !== undefined);
  return { component: "CaseBarChart", props: prune({ title: kv.title, unit: kv.unit, bars, attribution: attributionFrom(kv) }) };
}
function lineGraph(kv) {
  const pts = splitItems(kv.points).map(it => { const i = it.indexOf(":"); return { x: it.slice(0, i).trim(), y: num(it.slice(i + 1)), raw: it.slice(i + 1).trim() }; });
  const numeric = pts.every(p => p.y !== undefined);
  if (!numeric) {   // event-labelled "line" is really a timeline
    return { component: "CaseTimeline", props: prune({ title: (kv.label || kv.title || "").toUpperCase(),
      checkpoints: pts.map(p => p.x + " · " + p.raw) }) };
  }
  if (pts.length) pts[pts.length - 1].highlight = true;
  return { component: "CaseLineGraph", props: prune({ title: kv.label || kv.title, unit: kv.unit,
    points: pts.map(p => ({ x: p.x, y: p.y, highlight: p.highlight })) }) };
}
function kpi(kv) {
  const kpis = splitItems(kv.kpis).map(it => { const [l, v, , , c, h, t] = it.split(":"); return prune({ label: (l || "").trim(), value: (v || "").trim(), context: (c || "").trim(), highlight: bool(h), tag: t ? t.trim() : undefined }); }).filter(k => k.value);
  return { component: "CaseKPIDashboard", props: prune({ title: kv.title, kpis }) };
}
function gauges(kv) {
  const g = splitItems(kv.gauges).map(it => { const [l, v, u, , h] = it.split(":"); return prune({ label: (l || "").trim(), value: num(v), unit: (u || "%").trim(), highlight: bool(h) }); }).filter(x => x.value !== undefined);
  return { component: "CaseGauges", props: prune({ title: kv.title, gauges: g,
    sourceLabel: kv.source_publisher || kv.source, sourceYear: kv.source_year }) };
}
function riskMatrix(kv) {
  const risks = splitItems(kv.risks).map(it => { const [l, a, b, h] = it.split(":"); return prune({ label: (l || "").trim(), likelihood: num(a), impact: num(b), highlight: bool(h) }); }).filter(r => r.likelihood !== undefined);
  return { component: "CaseRiskMatrix", props: prune({ title: kv.title, risks }) };
}
function beforeAfter(kv) {
  const rows = (s) => String(s || "").split(";;").map(r => r.trim()).filter(Boolean).map(r => { const [k, v] = r.split("→"); return [(k || "").trim(), (v || "").trim()]; });
  return { component: "CaseBeforeAfter", props: prune({ beforeLabel: kv.before_label, beforeRows: kv.before_rows ? rows(kv.before_rows) : undefined,
    afterLabel: kv.after_label, afterRows: kv.after_rows ? rows(kv.after_rows) : undefined, verdict: kv.verdict }) };
}
// DATA_CALLOUT carries its whole figure in one string ("$77.5M", "¥18,318M",
// "94%") with no separate unit= key, so num() saw "$77.5M" → NaN, countTo was
// pruned away, and BigNumberPoster fell back to 0 — the poster rendered "0"
// while the director had supplied the figure correctly. Split the string into
// currency prefix / number / magnitude suffix.
function parseValueString(v) {
  const s = String(v == null ? "" : v).trim();
  const m = s.match(/^([$¥€£]?)\s*([\d.,]+)\s*(.*)$/);
  if (!m) return { prefix: "", value: undefined, suffix: "" };
  return { prefix: m[1] || "", value: num(m[2]), suffix: (m[3] || "").trim() };
}

function dataCallout(kv) {
  // same rule as counter(): label is the caption, never also the kicker
  const fromUnit = splitUnit(kv.unit);
  const parsed   = parseValueString(kv.value);
  return { component: "BigNumberPoster", props: prune({
    bigCaption: kv.label, dateTag: kv.context,
    countTo: parsed.value,
    // an explicit unit= wins; otherwise take what was embedded in the value
    prefix: fromUnit.prefix || parsed.prefix,
    suffix: fromUnit.suffix || parsed.suffix,
    decimals: parsed.value !== undefined && parsed.value % 1 === 0 ? 0 : 1
  }) };
}

/* ── TIER 2 ────────────────────────────────────────────────────────────────────
   These components were registered and rendering but UNREACHABLE from
   REMOTION_DATA — they existed only in the hand-authored V3 manifest, so the
   pipeline could never choose them and every film fell back to the same handful
   of looks. Each now has a type the director can emit.
   Rows/lists reuse `splitItems` (comma-separated) and "→" for label→value, the
   same conventions the director already knows from before_rows/after_rows.
   ---------------------------------------------------------------------------- */

// "A → B → C" or "A,B,C" → node labels for a causal chain
const arrow = (s) => String(s || "").split(/→|->/).map(x => x.trim()).filter(Boolean);
// "label → value" pairs, comma-separated
const labelled = (s) => splitItems(s).map(it => {
  const [k, v] = String(it).split(/→|->/);
  return { label: (k || "").trim(), value: (v || "").trim() };
}).filter(x => x.label);

function evidenceCard(kv) {   // the trust unit: verbatim quote + source
  return { component: "EvidenceCard", props: prune({
    claimId: kv.claim_id, headline: kv.headline, value: kv.value, valueLabel: kv.value_label,
    extract: kv.extract || kv.quote, attribution: kv.attribution,
    source: (kv.source_publisher || kv.source_year || kv.source_doc)
      ? { publisher: kv.source_publisher || "", year: kv.source_year || "", docType: kv.source_doc || "" }
      : undefined,
    verified: kv.verified === undefined ? undefined : bool(kv.verified),
    primary: kv.primary === undefined ? undefined : bool(kv.primary)
  }) };
}
function dataWall(kv) {       // 3–4 figures, each with its own attribution tag
  const rows = splitItems(kv.rows).map(it => {
    const [value, label, sourceType, hl] = String(it).split(":");
    return prune({ value: (value || "").trim(), label: (label || "").trim(),
      sourceType: (sourceType || "").trim(), highlight: bool(hl) });
  }).filter(r => r.value);
  return { component: "CaseDataWall", props: prune({ title: kv.title, rows,
    sourceLabel: kv.source_publisher || kv.source, footnoteText: kv.footnote }) };
}
function verdictCard(kv) {
  return { component: "VerdictCard", props: prune({ ruling: kv.ruling || kv.maintext, punch: kv.punch, signOff: kv.sign_off }) };
}
function openingHook(kv) {
  const { prefix } = splitUnit(kv.unit);
  return { component: "OpeningHook", props: prune({
    company: kv.company, kicker: kv.kicker, bigValue: (prefix || "") + (kv.value || ""),
    bigUnit: kv.big_unit || splitUnit(kv.unit).suffix, caption: kv.label || kv.caption,
    secondary: kv.secondary, sourceLabel: kv.source_publisher || kv.source, sourceYear: kv.source_year,
    caseCode: kv.case_code
  }) };
}
function statPoster(kv) {
  return { component: "StatPoster", props: prune({ kicker: kv.kicker, value: kv.value,
    caption: kv.label || kv.caption, sublabel: kv.sublabel,
    sourceLabel: kv.source_publisher || kv.source, attribution: kv.attribution }) };
}
function decisionChain(kv) {
  const nodes = (kv.nodes ? arrow(kv.nodes) : splitItems(kv.steps)).map(label => ({ label, claimId: "" }));
  return { component: "DecisionChain", props: prune({ title: kv.title, nodes,
    outcome: kv.outcome, sourceLabel: kv.source_publisher || kv.source, footnote: kv.footnote }) };
}
function controlGap(kv) {
  // "Board Risk Oversight:ok,Incentive Design:gap:no board visibility"
  const layers = splitItems(kv.layers).map(it => {
    const [label, state, note] = String(it).split(":");
    return prune({ label: (label || "").trim(),
      ok: !/gap|fail|missing|none/i.test(state || ""), note: (note || "").trim() || undefined });
  }).filter(l => l.label);
  return { component: "ControlGapMap", props: prune({ title: kv.title, layers, outcome: kv.outcome,
    sourceLabel: kv.source_publisher || kv.source, footnote: kv.footnote }) };
}
function controlPerimeter(kv) {
  return { component: "ControlPerimeter", props: prune({ title: kv.title,
    perimeterLabel: kv.perimeter_label, insideNodes: kv.inside ? splitItems(kv.inside) : undefined,
    outsideTitle: kv.outside, outsideSub: kv.outside_note,
    sourceLabel: kv.source_publisher || kv.source, footnote: kv.footnote }) };
}
function claimLedger(kv) {
  const rows = splitItems(kv.rows).map(it => {
    const [claim, source, id] = String(it).split(/→|->/);
    return prune({ claim: (claim || "").trim(), source: (source || "").trim(), id: (id || "").trim() });
  }).filter(r => r.claim);
  return { component: "ClaimLedger", props: prune({ title: kv.title, rows }) };
}
function beatTimeline(kv) {
  const beats = labelled(kv.beats).map(b => ({ year: b.label, event: b.value }));
  return { component: "BeatTimeline", props: prune({ title: kv.title, beats,
    sourceLabel: kv.source_publisher || kv.source, footnote: kv.footnote }) };
}
function governanceMethod(kv) {
  const steps = splitItems(kv.steps).map(it => {
    const [tag, title, detail] = String(it).split(":");
    return prune({ tag: (tag || "").trim(), title: (title || "").trim(), detail: (detail || "").trim() });
  }).filter(s => s.tag);
  return { component: "GovernanceMethod", props: prune({ steps: steps.length ? steps : undefined,
    failureIndex: num(kv.failure_index) }) };
}

// ── resolver ──────────────────────────────────────────────────────────────────
// Every type the director may name explicitly. Kept as one table so the resolver
// and the "explicit wins" rule cannot drift apart.
const EXPLICIT_TYPES = {
  COUNTER_ANIMATION: counter,      DATA_CALLOUT: dataCallout,
  SPLIT_COMPARISON : split,        LINE_GRAPH  : lineGraph,
  BAR_CHART        : barChart,     KPI_DASHBOARD: kpi,
  PROGRESS_GAUGE   : gauges,       RISK_MATRIX : riskMatrix,
  BEFORE_AFTER_CARD: beforeAfter,
  EVIDENCE_CARD    : evidenceCard, DATA_WALL   : dataWall,
  VERDICT_CARD     : verdictCard,  OPENING_HOOK: openingHook,
  STAT_POSTER      : statPoster,   DECISION_CHAIN: decisionChain,
  CONTROL_GAP      : controlGap,   CONTROL_PERIMETER: controlPerimeter,
  CLAIM_LEDGER     : claimLedger,  BEAT_TIMELINE: beatTimeline,
  GOVERNANCE_METHOD: governanceMethod,
  CHECKPOINT       : checkpoint,   TIMELINE    : timeline
};
function dispatchExplicit(sub, kv) { return EXPLICIT_TYPES[sub](kv); }

function adaptScene(sceneType, remotionData) {
  const kv = parseKV(remotionData);
  const sub = String(kv.type || "").trim().toUpperCase();
  const st = String(sceneType || "").trim().toUpperCase();

  // Text scenes carry the kind in kv.type (shatter/verdict/default)
  if (["SHATTER", "HOOK", "VERDICT", "DEFAULT"].includes(sub)) return statement(kv, sub.toLowerCase());

  // AN EXPLICIT type= WINS OVER THE SCENE TYPE COLUMN.
  // The Scene Type check used to come first, so a scene typed "Checkpoint" in the
  // sheet but carrying `type=STAT_POSTER` was routed to CaseCheckpoint — which
  // then found no date/event/angle and rendered COMPLETELY EMPTY. It cost a real
  // scene in the first 27-scene review. The director naming a type is a stronger
  // signal than a column that was filled one stage earlier, so honour it.
  if (EXPLICIT_TYPES[sub]) return dispatchExplicit(sub, kv);

  // No explicit type — fall back to the Scene Type column.
  if (st === "CHECKPOINT" || kv.angle) return checkpoint(kv);
  if (st === "TIMELINE" || kv.checkpoints) return timeline(kv);

  switch (sub) {
    case "COUNTER_ANIMATION": return counter(kv);
    case "DATA_CALLOUT":      return dataCallout(kv);
    case "SPLIT_COMPARISON":  return split(kv);
    case "LINE_GRAPH":        return lineGraph(kv);
    case "BAR_CHART":         return barChart(kv);
    case "KPI_DASHBOARD":     return kpi(kv);
    case "PROGRESS_GAUGE":    return gauges(kv);
    case "RISK_MATRIX":       return riskMatrix(kv);
    case "BEFORE_AFTER_CARD": return beforeAfter(kv);
    // Tier 2 — previously unreachable from REMOTION_DATA
    case "EVIDENCE_CARD":     return evidenceCard(kv);
    case "DATA_WALL":         return dataWall(kv);
    case "VERDICT_CARD":      return verdictCard(kv);
    case "OPENING_HOOK":      return openingHook(kv);
    case "STAT_POSTER":       return statPoster(kv);
    case "DECISION_CHAIN":    return decisionChain(kv);
    case "CONTROL_GAP":       return controlGap(kv);
    case "CONTROL_PERIMETER": return controlPerimeter(kv);
    case "CLAIM_LEDGER":      return claimLedger(kv);
    case "BEAT_TIMELINE":     return beatTimeline(kv);
    case "GOVERNANCE_METHOD": return governanceMethod(kv);
  }
  // Fallback: a plain text scene
  return statement(kv, "default");
}

module.exports = { adaptScene, parseKV };
