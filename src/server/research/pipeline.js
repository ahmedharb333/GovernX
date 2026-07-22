/* ============================================================================
   research/pipeline.js — the verified-claims engine.

   Flow per source:
     fetch+parse+archive → EXTRACT claims (each with a verbatim quote)
       → CODE GATE 1: quote must literally exist in the fetched text
       → CODE GATE 2: every number in the claim must exist in the quote
       → CODE GATE 3: the claim must not drop the source's hedge
       → ADVERSARIAL VERIFY (separate model pass, wide context, hostile stance)
       → status: Verified | Needs Review | Rejected

   Then across all sources:
       → RELEVANCE scoring vs the brief   (Core | Supporting | Boilerplate)
       → CONFLICT detection               (same quantity, different values)

   A claim is `usable` for script/video only if Verified AND not Boilerplate.
   ============================================================================ */

const { callJsonArray } = require("./claude");
const { fetchDocument } = require("./fetch");
const { edgarSearch }   = require("./edgar");
const assess            = require("./assess");
const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

// ── Extraction/verification cache ─────────────────────────────────────────────
// Keyed on (document hash + brief + model). Re-running the same brief over the
// same documents costs nothing — only relevance + clustering re-run.
const CACHE_DIR = path.join(__dirname, "../../../research_cache");
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const cacheKey = (docHash, brief) => crypto.createHash("sha256")
  .update(docHash + "|" + brief + "|" + (process.env.RESEARCH_MODEL || "claude-sonnet-5"))
  .digest("hex").slice(0, 20);

function readCache(key) {
  const f = path.join(CACHE_DIR, key + ".json");
  if (!fs.existsSync(f)) return null;
  try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return null; }
}
function writeCache(key, pairs) {
  try { fs.writeFileSync(path.join(CACHE_DIR, key + ".json"), JSON.stringify(pairs), "utf8"); } catch (e) {}
}

// ── Response schemas (structured outputs — the API enforces these) ────────────
const CLAIM_SCHEMA = {
  type: "object",
  properties: {
    statement: { type: "string" },
    claimType: { type: "string", enum: ["Number", "Date", "Event", "Legal/Regulatory", "Quote", "Interpretation"] },
    value    : { type: "string" },
    asOf     : { type: "string" },
    quote    : { type: "string" }
  },
  required: ["statement", "claimType", "value", "asOf", "quote"],
  additionalProperties: false
};

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    i            : { type: "integer" },
    verdict      : { type: "string", enum: ["PASS", "FAIL", "UNCERTAIN"] },
    overstatement: { type: "boolean" },
    attribution  : { type: "string", enum: ["Regulator", "Court", "Company self-reported", "Media", "Unclear"] },
    reason       : { type: "string" },
    confidence   : { type: "string", enum: ["High", "Medium", "Low"] }
  },
  required: ["i", "verdict", "overstatement", "attribution", "reason", "confidence"],
  additionalProperties: false
};

// ── Personas ──────────────────────────────────────────────────────────────────
const EXTRACTOR_SYSTEM = `You are a forensic research analyst for GovernX, an institutional governance-intelligence firm. You extract only claims that a document actually supports.
RULES:
- Extract atomic, checkable claims: numbers, dates, penalties, legal/regulatory findings, account counts, direct quotes.
- For EVERY claim you MUST copy a verbatim "quote" EXACTLY as it appears in the document — same words, same digits, same punctuation. Never paraphrase inside "quote". If you cannot find a verbatim quote, do not emit the claim.
- PRESERVE THE SOURCE'S HEDGING. If the document says "potentially unauthorized" or "may not have been authorized" or "approximately", your statement MUST carry the same qualifier. Never upgrade a hedged finding into a flat assertion.
- The "value" you record must appear verbatim inside your "quote". Do not compute, sum, round, or convert figures.
- Attribute correctly: distinguish what the REGULATOR found from what the COMPANY's own analysis concluded.
- Do not infer or combine numbers from different sentences. Never invent a quote or a figure.
Return ONLY a JSON array, no prose.`;

const VERIFIER_SYSTEM = `You are an adversarial verification analyst. You did NOT extract these claims. Your job is to DISPROVE each one using ONLY the document context provided. Assume the extractor was careless or motivated. Look for reasons to FAIL.

Mark FAIL if ANY of these is true:
- The context contradicts the statement.
- The quote is altered, trimmed misleadingly, or absent from the context.
- Any number, date, or scope in the statement does not match the context exactly.
- The statement asserts as established fact something the context only alleges, estimates, or flags as "potential".
- The statement attributes a finding to the wrong party (e.g. presents the company's own self-reported analysis as a regulator's finding).
- The statement generalises beyond the population, time period, or entity the context covers.

Mark UNCERTAIN if the context is related but does not clearly establish the exact claim.
Mark PASS only if the context directly, completely and unambiguously establishes the statement as written.

Also report:
- "overstatement": true if the statement is stronger, broader, or more certain than the context supports (even if you passed it on the raw numbers).
- "attribution": who actually asserts this — "Regulator" | "Court" | "Company self-reported" | "Media" | "Unclear".

A near-miss on a number, date, scope, or certainty level is FAIL, not PASS. Be strict.
Return ONLY a JSON array, no prose.`;

// ── Public: build evidence for a set of sources ───────────────────────────────
async function buildEvidence(req) {
  const company = req.company || "";
  const brief   = req.brief   || "";
  const cap     = req.maxTextReturn || 150000;

  // 1) Resolve EDGAR queries → URLs, merge with direct URLs (dedup).
  const resolved = [];
  for (const eq of (req.edgarQueries || [])) {
    try { (await edgarSearch(eq.q, eq)).forEach(h => resolved.push(h)); }
    catch (e) { /* non-fatal */ }
  }
  const urlList = dedup([...(req.urls || []).map(u => ({ url: u })), ...resolved], x => x.url);

  const sources  = [];
  const claims   = [];
  const warnings = [];
  let sIdx = 0, cIdx = 0;

  for (const item of urlList) {
    sIdx++;
    const doc = await fetchDocument(item.url);
    const source = {
      sourceIndex : sIdx,
      url         : item.url,
      finalUrl    : doc.finalUrl,
      title       : doc.title,
      publisher   : item.publisher  || "",
      sourceType  : item.sourceType || "",
      hash        : doc.hash,
      wordCount   : doc.wordCount,
      archivePath : doc.archivePath,
      ok          : doc.ok,
      error       : doc.error,
      text        : doc.ok ? doc.text.slice(0, cap) : ""
    };
    sources.push(source);
    if (!doc.ok) { warnings.push(`source ${sIdx} fetch failed: ${doc.error}`); continue; }

    const key = cacheKey(doc.hash, brief);
    let pairs = req.noCache ? null : readCache(key);

    if (pairs) {
      console.log(`[Research] cache hit for ${doc.title} (${pairs.length} claims) — no API cost`);
      source.cached = true;
    } else {
      // 2) EXTRACT
      let extracted = [];
      try { extracted = await extractClaims(doc.text, { company, brief, title: doc.title }); }
      catch (e) {
        source.error = "extract failed: " + e.message;
        warnings.push(`source ${sIdx} (${doc.title}) extract failed: ${e.message}`);
        console.error(`[Research] ❌ source ${sIdx} extract failed: ${e.message}`);
        continue;
      }

      // 3) CODE GATES (deterministic — a model cannot argue its way past these)
      extracted.forEach(c => {
        const gate    = locateQuote(doc.text, c.quote);
        c.quoteFound  = gate.found;
        c.context     = gate.context;
        const nums    = assess.numbersSupported(c.value, c.quote);
        c.numbersOk   = nums.ok;
        c.numbersMissing = nums.missing;
        const hedge   = assess.hedgeDropped(c.statement, c.quote);
        c.hedgeDropped  = hedge.dropped;
        c.sourceHedges  = hedge.sourceHedges;
        c.boilerplateHint = assess.boilerplateHint(c.statement, c.quote);
      });

      // 4) ADVERSARIAL VERIFY the claims that cleared the quote gate
      const gated = extracted.filter(c => c.quoteFound);
      let verdicts = [];
      if (gated.length) {
        try { verdicts = await verifyClaims(gated); }
        catch (e) { warnings.push(`source ${sIdx} verify failed: ${e.message}`); }
      }

      // Cache without the bulky `context` field — it is only needed during verify.
      pairs = extracted.map(c => {
        const { context, ...rest } = c;
        return { c: rest, v: c.quoteFound ? (verdicts[gated.indexOf(c)] || {}) : {} };
      });
      writeCache(key, pairs);
    }

    pairs.forEach(({ c, v }) => {
      cIdx++;
      const { status, reason } = decideStatus(c, v);

      claims.push({
        claimId      : "C" + cIdx,
        sourceIndex  : sIdx,
        sourceUrl    : item.url,
        sourceTitle  : doc.title,
        statement    : c.statement || "",
        claimType    : c.claimType || "",
        value        : c.value != null ? String(c.value) : "",
        asOf         : c.asOf || "",
        quote        : c.quote || "",
        // gate results
        quoteFound   : c.quoteFound,
        numbersOk    : c.numbersOk,
        numbersMissing: c.numbersMissing || [],
        hedgeDropped : c.hedgeDropped,
        sourceHedges : c.sourceHedges || [],
        // verifier results
        verdict      : v.verdict || (c.quoteFound ? "UNVERIFIED" : "QUOTE_NOT_FOUND"),
        verifierError: !!v.verifierError,
        overstatement: !!v.overstatement || !!c.hedgeDropped,
        attribution  : v.attribution || "Unclear",
        confidence   : v.confidence  || "",
        // outcome
        status, reason,
        // filled below
        tier: "", relevance: 0, relevanceReason: "", conflictWith: [], conflictNote: "", usable: false
      });
    });
  }

  // 5) RELEVANCE + 6) CONFLICTS (across all sources) — errors surface, never swallowed
  let relevance = [], conflicts = [];
  if (claims.length) {
    try { relevance = await assess.scoreRelevance(claims, brief); }
    catch (e) { warnings.push("relevance scoring failed: " + e.message); console.warn("[Research] ⚠ relevance:", e.message); }
    try { conflicts = await assess.detectConflicts(claims); }
    catch (e) { warnings.push("conflict detection failed: " + e.message); console.warn("[Research] ⚠ conflicts:", e.message); }
  }
  const verifierErrors = claims.filter(c => c.verifierError).length;
  if (verifierErrors) warnings.push(verifierErrors + " claim(s) were never evaluated by the verifier.");
  if (!claims.length) warnings.push("No claims were produced — check sources[].error above.");

  claims.forEach((c, i) => {
    const r = relevance[i] || {};
    let tier = r.tier || "Supporting";
    // deterministic boilerplate wins unless the model rates it highly relevant
    const hint = assess.boilerplateHint(c.statement, c.quote);
    if (hint && (r.relevance || 0) < 4) tier = "Boilerplate";
    c.tier            = tier;
    c.relevance       = r.relevance || 0;
    c.relevanceReason = r.reason || "";
    c.usable          = c.status === "Verified" && tier !== "Boilerplate";
  });

  conflicts.forEach(g => {
    const ids = g.claimIndexes.map(i => claims[i] && claims[i].claimId).filter(Boolean);
    g.claimIndexes.forEach(i => {
      if (!claims[i]) return;
      claims[i].conflictWith = ids.filter(id => id !== claims[i].claimId);
      claims[i].conflictNote = g.note || "";
    });
  });

  const verified = claims.filter(c => c.status === "Verified").length;
  return {
    company, brief,
    generatedAt: new Date().toISOString(),
    stats: {
      sources      : sources.length,
      sourcesOk    : sources.filter(s => s.ok).length,
      claims       : claims.length,
      verified,
      needsReview  : claims.filter(c => c.status === "Needs Review").length,
      rejected     : claims.filter(c => c.status === "Rejected").length,
      verifierErrors,
      overstated   : claims.filter(c => c.overstatement).length,
      core         : claims.filter(c => c.tier === "Core").length,
      supporting   : claims.filter(c => c.tier === "Supporting").length,
      boilerplate  : claims.filter(c => c.tier === "Boilerplate").length,
      usable       : claims.filter(c => c.usable).length,
      conflicts    : conflicts.length,
      verifiedRate : claims.length ? +(100 * verified / claims.length).toFixed(1) : 0
    },
    warnings,
    conflicts,
    sources,
    claims
  };
}

// ── Status decision: deterministic gates first, then the verifier ─────────────
function decideStatus(c, v) {
  if (!c.quoteFound)  return { status: "Rejected",     reason: "Quote not present in the fetched document." };
  if (!c.numbersOk)   return { status: "Rejected",     reason: "Figure(s) not found in the quote: " + (c.numbersMissing || []).join(", ") };
  if (v.verdict === "FAIL") return { status: "Rejected", reason: v.reason || "Verifier rejected the claim." };
  if (c.hedgeDropped) return { status: "Needs Review",  reason: "Source hedges (" + c.sourceHedges.join(", ") + ") but the claim asserts it flatly." };
  if (v.overstatement)return { status: "Needs Review",  reason: v.reason || "Claim is stronger than the source supports." };
  if (v.verdict === "PASS") return { status: "Verified", reason: v.reason || "" };
  return { status: "Needs Review", reason: v.reason || "Verifier could not confirm the claim." };
}

// ── EXTRACT ───────────────────────────────────────────────────────────────────
async function extractClaims(text, ctx) {
  const prompt =
    `COMPANY: ${ctx.company}\nVIDEO BRIEF: ${ctx.brief}\nDOCUMENT TITLE: ${ctx.title}\n\n` +
    `DOCUMENT TEXT (verbatim — copy quotes from here only):\n"""\n${text.slice(0, 90000)}\n"""\n\n` +
    `Extract up to 15 atomic claims relevant to the brief. Ignore generic corporate profile text ` +
    `(founding year, total assets, headcount, Fortune rankings, forward-looking-statement disclaimers).\n` +
    `Each object:\n` +
    `{ "statement": "... (preserve the source's hedging)", ` +
    `"claimType": "Number|Date|Event|Legal/Regulatory|Quote|Interpretation", ` +
    `"value": "the figure/date exactly as written in the quote", ` +
    `"asOf": "date the fact applies to if stated", ` +
    `"quote": "VERBATIM sentence(s) from the document above" }\n` +
    `Return ONLY the JSON array.`;

  const arr = await callJsonArray({
    system: EXTRACTOR_SYSTEM, prompt, maxTokens: 12000, label: "extract",
    itemSchema: CLAIM_SCHEMA
  });
  // Collapse PDF line-wrapping ("$100\nmillion") — the quote gate normalises
  // whitespace anyway, and these strings end up as on-screen labels.
  return arr.map(c => ({
    ...c,
    statement: squash(c.statement),
    value    : squash(c.value),
    quote    : squash(c.quote)
  }));
}

const squash = (s) => (s == null ? "" : String(s).replace(/\s+/g, " ").trim());

// ── ADVERSARIAL VERIFY ────────────────────────────────────────────────────────
// Runs in small batches. A batch that fails to parse is reported as
// VERIFIER_ERROR — never silently downgraded to a normal "unverified" claim.
const VERIFY_BATCH = 4;

// One model call for one batch. Returns an aligned array, or null if unusable.
async function verifyBatch(batch) {
  const payload = batch.map((c, j) => ({
    i        : j,                                 // index WITHIN this batch
    statement: c.statement,
    value    : c.value,
    quote    : c.quote,
    context  : (c.context || "").slice(0, 2600)   // wide window: room to spot scope errors
  }));

  const prompt =
    `Try to disprove each claim using ITS OWN context only.\n\n` +
    `CLAIMS (${batch.length}):\n${JSON.stringify(payload, null, 2)}\n\n` +
    `Return a JSON array of EXACTLY ${batch.length} objects, each:\n` +
    `{ "i": <index 0..${batch.length - 1}>, "verdict": "PASS|FAIL|UNCERTAIN", "overstatement": true|false, ` +
    `"attribution": "Regulator|Court|Company self-reported|Media|Unclear", ` +
    `"reason": "one sentence — if FAIL or overstatement, say exactly what is wrong", ` +
    `"confidence": "High|Medium|Low" }\n` +
    `Keep every "reason" under 20 words and free of double quotes. Return ONLY the JSON array.`;

  let arr = [];
  try {
    arr = await callJsonArray({
      system: VERIFIER_SYSTEM, prompt, maxTokens: 6000, label: "verify",
      expect: batch.length, itemSchema: VERDICT_SCHEMA
    });
  } catch (e) { return null; }
  if (arr.length !== batch.length) return null;
  const byI = {};
  arr.forEach(v => { if (typeof v.i === "number") byI[v.i] = v; });
  return batch.map((_, j) => byI[j] || null);
}

// Batch → retry → fall back to one-claim-at-a-time. Nothing goes unevaluated silently.
async function verifyClaims(claims) {
  const results = new Array(claims.length).fill(null);

  for (const [start, batch] of chunk(claims, VERIFY_BATCH)) {
    let out = null;
    for (let attempt = 1; attempt <= 2 && !out; attempt++) {
      try { out = await verifyBatch(batch); }
      catch (e) { console.warn(`[Research] ⚠ verify batch @${start} attempt ${attempt}: ${e.message}`); }
    }

    // Fall back: verify each claim on its own before giving up on any of them.
    if (!out && batch.length > 1) {
      console.warn(`[Research] ⚠ verify batch @${start} unparseable — retrying claim-by-claim`);
      out = [];
      for (const c of batch) {
        let one = null;
        try { one = await verifyBatch([c]); } catch (e) { /* recorded below */ }
        out.push(one ? one[0] : null);
      }
    }

    batch.forEach((_, j) => {
      const v = out && out[j];
      results[start + j] = v || {
        verdict      : "VERIFIER_ERROR",
        reason       : "Verifier did not evaluate this claim.",
        confidence   : "Low",
        attribution  : "Unclear",
        verifierError: true
      };
      if (!v) console.warn(`[Research] ⚠ claim @${start + j} left unverified`);
    });
  }
  return results;
}

// [start, items] pairs
function* chunk(arr, size) {
  for (let i = 0; i < arr.length; i += size) yield [i, arr.slice(i, i + size)];
}

// ── CODE GATE 1: is this quote physically in the document? ────────────────────
function locateQuote(docText, quote) {
  if (!quote || quote.length < 8) return { found: false, context: "" };
  const nDoc = norm(docText);
  const nQ   = norm(quote);
  let idx = nDoc.indexOf(nQ);

  if (idx === -1) {
    const words = nQ.split(" ");
    if (words.length >= 12) idx = nDoc.indexOf(words.slice(0, 12).join(" "));
  }
  if (idx === -1) return { found: false, context: "" };

  const start = Math.max(0, idx - 1200);
  const end   = Math.min(nDoc.length, idx + nQ.length + 1200);
  return { found: true, context: nDoc.slice(start, end) };
}

const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ")
  .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();

function parseJsonArray(raw) {
  if (!raw) return [];
  let s = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a !== -1 && b !== -1 && b > a) s = s.slice(a, b + 1);
  try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
}

function dedup(arr, keyFn) {
  const seen = new Set(); const out = [];
  for (const x of arr) { const k = keyFn(x); if (k && !seen.has(k)) { seen.add(k); out.push(x); } }
  return out;
}

module.exports = { buildEvidence, fetchDocument, extractClaims, verifyClaims, locateQuote };
