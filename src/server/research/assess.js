/* ============================================================================
   research/assess.js — hardening layer on top of the verified-claims engine.

   Three jobs:
   1. DETERMINISTIC CHECKS (no model, cannot be talked out of):
        • numbersSupported() — every number in the claim's value must appear
          in the verbatim quote. Catches "the quote is real but the figure
          attached to it is not."
        • hedgeDropped()    — the source hedges ("potentially unauthorized",
          "may not have been authorized") but the claim states it flatly.
          This is the #1 credibility killer in financial journalism.
        • boilerplateHint() — "founded in 1852", "Fortune No. 25" etc.
   2. RELEVANCE — scores each claim against the video brief: Core | Supporting
      | Boilerplate. True-but-irrelevant facts never reach the script.
   3. CONFLICTS — finds claims that give different values for the same
      underlying quantity (2.1M vs 3.5M vs 1,534,280 accounts) so the script
      must present source + date rather than forcing false certainty.
   ============================================================================ */

const { callJsonArray } = require("./claude");

// ── Response schemas (structured outputs — the API enforces these) ────────────
const RELEVANCE_SCHEMA = {
  type: "object",
  properties: {
    i        : { type: "integer" },
    tier     : { type: "string", enum: ["Core", "Supporting", "Boilerplate"] },
    relevance: { type: "integer" },
    reason   : { type: "string" }
  },
  required: ["i", "tier", "relevance", "reason"],
  additionalProperties: false
};

const CLUSTER_SCHEMA = {
  type: "object",
  properties: {
    metric      : { type: "string" },
    claimIndexes: { type: "array", items: { type: "integer" } }
  },
  required: ["metric", "claimIndexes"],
  additionalProperties: false
};

// ── 1a. Numbers in the claim must exist in the quote ─────────────────────────
// "3.5 million" / "$100 million" / "1,534,280" / "09/08/2016" / "No. 25"
function numericTokens(s) {
  if (!s) return [];
  const re = /\$?\s?\d[\d,]*\.?\d*\s*(million|billion|trillion|thousand)?/gi;
  const out = [];
  let m;
  while ((m = re.exec(s)) !== null) {
    const tok = m[0].replace(/[$,\s]/g, "").toLowerCase();
    if (tok) out.push(tok);
  }
  return out;
}

function numbersSupported(value, quote) {
  const tokens = numericTokens(value);
  if (!tokens.length) return { ok: true, missing: [] };      // nothing numeric to check
  const qn = (quote || "").toLowerCase().replace(/[$,\s]/g, "");
  const missing = tokens.filter(t => !qn.includes(t));
  return { ok: missing.length === 0, missing };
}

// ── 1b. Did the claim drop the source's hedge? ────────────────────────────────
const HEDGES = [
  "potentially", "may not have been", "may have been", "possibly", "alleged",
  "approximately", "roughly", "about", "estimated", "nearly", "up to",
  "at least", "more than", "as many as", "could have", "likely"
];

function hasHedge(text) {
  const t = (text || "").toLowerCase();
  return HEDGES.filter(h => t.includes(h));
}

function hedgeDropped(statement, quote) {
  const inQuote     = hasHedge(quote);
  const inStatement = hasHedge(statement);
  // Source qualifies the fact; the claim asserts it flatly.
  return { dropped: inQuote.length > 0 && inStatement.length === 0, sourceHedges: inQuote };
}

// ── 1c. Obvious corporate boilerplate ────────────────────────────────────────
const BOILERPLATE = [
  /founded in \d{4}/i,
  /ranked no\.?\s?\d+ on fortune/i,
  /team members/i,
  /\bin assets\b/i,
  /forward-looking statements/i,
  /serves one in three households/i,
  /diversified,? community-based/i,
  /is a diversified/i,
  /news, insights and perspectives/i
];

function boilerplateHint(statement, quote) {
  const hay = (statement || "") + " " + (quote || "");
  return BOILERPLATE.some(re => re.test(hay));
}

// ── 2. Relevance to the brief ─────────────────────────────────────────────────
const RELEVANCE_SYSTEM = `You are an editorial analyst for GovernX, which produces institutional governance case analyses for C-level executives and GRC professionals.
Classify each verified claim by how essential it is to the specific video brief.
- "Core": the claim is load-bearing evidence for the story (the failure, the scale, the penalty, the decision chain, the regulator's finding, the control breakdown, key dates).
- "Supporting": true and relevant context that could appear in a line of narration but is not headline evidence.
- "Boilerplate": true but generic corporate/company-profile filler (founding year, total assets, headcount, Fortune ranking, forward-looking-statement disclaimers, marketing language). Never headline material.
Be ruthless. Most press-release "About the company" facts are Boilerplate.
Return ONLY a JSON array, no prose.`;

const RELEVANCE_BATCH = 12;

async function scoreRelevance(claims, brief) {
  if (!claims.length) return [];
  const byI = {};

  for (let start = 0; start < claims.length; start += RELEVANCE_BATCH) {
    const batch = claims.slice(start, start + RELEVANCE_BATCH);
    const payload = batch.map((c, j) => ({
      i: j, statement: c.statement, claimType: c.claimType, value: c.value, source: c.sourceTitle
    }));
    const prompt =
      `VIDEO BRIEF: ${brief}\n\nCLAIMS (${batch.length}):\n${JSON.stringify(payload, null, 2)}\n\n` +
      `For each claim return:\n` +
      `{ "i": <index 0..${batch.length - 1}>, "tier": "Core|Supporting|Boilerplate", "relevance": 0-5, ` +
      `"reason": "under 15 words" }\n` +
      `Return ONLY a JSON array of EXACTLY ${batch.length} objects.`;

    let arr = [];
    try {
      arr = await callJsonArray({
        system: RELEVANCE_SYSTEM, prompt, maxTokens: 6000, label: `relevance@${start}`,
        expect: batch.length, itemSchema: RELEVANCE_SCHEMA
      });
    } catch (e) { console.warn(`[Research] ⚠ relevance batch @${start}: ${e.message}`); }

    arr.forEach(v => { if (typeof v.i === "number" && batch[v.i]) byI[start + v.i] = v; });
  }
  return claims.map((_, i) => byI[i] || { tier: "Supporting", relevance: 2, reason: "Not scored." });
}

// ── 3. Cross-source conflict detection ────────────────────────────────────────
// The model does one thing it is good at — CLUSTER claims by what they measure.
// The code then decides what counts as a conflict (>1 distinct value in a cluster).
// Judgment stays in code; the model never gets to rule "no conflict here".
// The model's ONLY job is to name the noun being measured. It must not reason
// about periods, units, or whether the numbers conflict — code handles all three.
// Giving it those rules too made it over-split (baking the date range into the
// quantity name), which hid the very conflict we need to catch.
const CLUSTER_SYSTEM = `You are a fact-reconciliation analyst. You are given numeric claims drawn from company filings and regulator orders.
Group them by the REAL-WORLD THING being measured — the noun, nothing else.

IGNORE these differences entirely; claims that differ ONLY in these ways belong in the SAME group:
- the time period or date range covered
- which analysis, review, or methodology produced the figure
- who reported it (the regulator, the company, a court)
- whether the figure is a total, a subtotal, a revision, or a component of a larger number

Worked example — ALL of these measure one quantity, "count of potentially unauthorized accounts", and belong in ONE group:
  "1,534,280 deposit accounts that may not have been authorized"
  "approximately 2.1 million potentially unauthorized accounts (original analysis)"
  "approximately 3.5 million potentially unauthorized accounts (expanded analysis)"
  "2.55 million accounts from the original time period"
  "981,000 accounts in the additional periods"
Name that group "count of potentially unauthorized accounts" — do NOT put a date range or an analysis name in the group name.

Every claim must appear in exactly one group. Do not judge whether the numbers conflict — only name the noun and group by it.
Return ONLY a JSON array, no prose.`;

const valueKey = (v) => numericTokens(v).join("|");

// ── Deterministic sub-keys: a second guard against over-grouping ──────────────
// The model clusters semantically; this splits any cluster that still mixes
// incompatible measurements. A dollar figure can never conflict with a count.
function unitOf(value) {
  const v = String(value || "");
  if (/\$/.test(v))                                        return "money";
  if (/%/.test(v))                                         return "percent";
  if (/\b(19|20)\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(v))
                                                           return "date";
  if (/\d/.test(v))                                        return "count";
  return "other";
}

// "reviewed 93.5 million accounts" (the population) vs "identified 2.1 million
// potentially unauthorized" (the finding). Different quantities, same units.
function roleOf(statement) {
  const s = String(statement || "").toLowerCase();
  const isFinding = /identified|unauthorized|may not have been authorized|potentially/.test(s);
  if (/\breview(ed)?\b|\banaly[sz]ed\b/.test(s) && !isFinding) return "population";
  return "finding";
}

const subKey = (c) => unitOf(c.value) + "|" + roleOf(c.statement);

async function detectConflicts(claims) {
  const numeric = claims
    .map((c, i) => ({ i, statement: (c.statement || "").slice(0, 150), value: c.value, asOf: c.asOf, source: c.sourceTitle }))
    .filter(c => c.value && /\d/.test(c.value));
  if (numeric.length < 2) return [];

  const prompt =
    `CLAIMS (${numeric.length}):\n${JSON.stringify(numeric, null, 2)}\n\n` +
    `Group every claim by the real-world thing it measures. Return:\n` +
    `{ "metric": "the noun this group measures — no dates, no analysis names", ` +
    `"claimIndexes": [the "i" values in this group] }\n` +
    `Prefer FEWER, BROADER groups. If two claims count the same kind of thing, they go together ` +
    `even when the periods, sources, or totals differ.\n` +
    `Every "i" above must appear in exactly one group. Return ONLY the JSON array.`;

  const clusters = (await callJsonArray({
    system: CLUSTER_SYSTEM, prompt, maxTokens: 8000, label: "cluster", itemSchema: CLUSTER_SCHEMA
  })).filter(g => Array.isArray(g.claimIndexes));

  const valid = new Set(numeric.map(n => n.i));
  const byIndex = {}; numeric.forEach(n => { byIndex[n.i] = n; });

  // CODE decides. Each model cluster is first split by unit+role, so a dollar
  // figure can never "conflict" with a count, nor a population with a finding.
  const conflicts = [];
  let split = 0;
  for (const g of clusters) {
    const idx = [...new Set(g.claimIndexes.filter(i => valid.has(i)))];
    if (idx.length < 2) continue;

    const buckets = {};
    idx.forEach(i => { const k = subKey(byIndex[i]); (buckets[k] = buckets[k] || []).push(i); });
    if (Object.keys(buckets).length > 1) split++;

    for (const [key, group] of Object.entries(buckets)) {
      if (group.length < 2) continue;
      const distinct = new Set(group.map(i => valueKey(byIndex[i].value)));
      if (distinct.size < 2) continue;                     // same figure repeated — not a conflict

      const [unit, role] = key.split("|");
      const values = group.map(i => `${byIndex[i].value}${byIndex[i].asOf ? ` (${byIndex[i].asOf})` : ""}`);
      conflicts.push({
        // The "population examined" label only makes sense for a count of things
        // examined — never for a dollar amount or a date.
        metric      : (g.metric || "unnamed quantity") +
                      (role === "population" && unit === "count" ? " — population examined (denominator)" : ""),
        unit, role,
        claimIndexes: group,
        note        : `${distinct.size} different figures reported for this quantity: ${values.join("; ")}. ` +
                      `Present each with its source and date — do not merge or pick one.`
      });
    }
  }
  if (clusters.length) {
    console.log(`[Research] clustered into ${clusters.length} quantities; ` +
      `${split} split by unit/role → ${conflicts.length} conflict(s)`);
  }
  return conflicts;
}

module.exports = {
  numericTokens, numbersSupported, hasHedge, hedgeDropped, boilerplateHint,
  scoreRelevance, detectConflicts
};
