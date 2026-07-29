/* ============================================================================
   research/discover.js — the MISSING STEP: source DISCOVERY.

   The verified-claims engine (pipeline.js) can only VERIFY URLs it is handed.
   It cannot FIND them. That gap is why every video's sourcing was manual and
   why Research Database column E ("Source Link") ends up holding a
   "Search: '...'" placeholder instead of a real link — Stage 2 had no source
   to fetch, so it wrote down the search it WOULD have run.

   This module closes that gap. Given a company + brief it:
     1. asks Claude (with the web_search server tool) to find PRIMARY,
        publicly-readable sources — regulators, courts, filings, reputable press;
     2. collects every candidate URL the search returned (deterministic — from
        the web_search_tool_result blocks, plus any the model recommends);
     3. AUTO-TESTS each candidate with the SAME fetchDocument() the verify engine
        uses, so a URL is only "fetchable" if the engine can actually read it —
        Cloudflare-walled / paywalled / dead URLs are dropped BEFORE ② runs.

   Output feeds Idea Catalogue → Source_URLs (col P): only reachable URLs, so
   Stage 2 has real documents to verify and column E fills with real links.

   No new dependency: raw fetch to the Messages API (like claude.js), and it
   reuses fetch.js for the fetchability gate. Web search needs a model that
   supports web_search_20260209 (Sonnet 5 / Opus 4.6+); default claude-sonnet-5.

   Env: ANTHROPIC_API_KEY (required), DISCOVER_MODEL (default = RESEARCH_MODEL
        or claude-sonnet-5).
   ============================================================================ */

const { fetchDocument } = require("./fetch");

const API_URL = "https://api.anthropic.com/v1/messages";
const DISCOVER_MODEL =
  process.env.DISCOVER_MODEL || process.env.RESEARCH_MODEL || "claude-sonnet-5";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DISCOVER_SYSTEM = `You are a source-discovery analyst for GovernX, an institutional governance-intelligence firm. Your job is to find PRIMARY, publicly-readable source documents for an investigative video, NOT to summarise the story.

Prefer, in order:
1. Primary records — regulator actions/findings, court filings and judgments, SEC/EDGAR filings, official investigation reports, company 8-Ks / annual reports / press releases.
2. Reputable outlets that quote those records (major newspapers, wire services, established trade press).

AVOID:
- Sources behind hard paywalls or login walls (e.g. WSJ, FT, Bloomberg terminal, most academic journals) — the downstream engine cannot read them.
- Sites known to block automated fetching with bot-challenges when a public mirror exists.
- Aggregators, blogspam, PDFs of PowerPoint decks, and pages that only restate other pages.

Use the web_search tool to actually find current, working URLs. Then report the best candidates — favour a handful of strong primary sources over many weak ones.`;

/**
 * One Messages API call with the web_search server tool. Returns collected
 * candidate URLs and the model's final text. Handles 429/529 backoff and the
 * server-tool pause_turn (re-send to resume). Never throws on "no results" —
 * an empty url list is a valid answer meaning the search found nothing usable.
 *
 * @returns {{ urls: {url:string,title:string}[], finalText: string, usage: object }}
 */
async function runSearch({ system, prompt, model, maxTokens = 6000, maxRounds = 4, maxUses = 8 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set (add it to governx-remotion/.env).");

  const messages = [{ role: "user", content: prompt }];
  const urls = [];
  let finalText = "";
  let usage = {};

  for (let round = 0; round < maxRounds; round++) {
    const payload = {
      model: model || DISCOVER_MODEL,
      max_tokens: maxTokens,
      system,
      // web_search_20260209 has built-in dynamic filtering (code execution under
      // the hood) — do NOT also declare code_execution. Sonnet 5 supports it.
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: maxUses }],
      messages
    };

    let json = null;
    const MAX_TRIES = 3;
    let lastErr = "";
    for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
      try {
        const resp = await fetch(API_URL, {
          method: "POST",
          headers: {
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        if (resp.status === 200) { json = await resp.json(); break; }
        if (resp.status === 429 || resp.status === 529) {
          lastErr = "HTTP " + resp.status;
          await sleep(attempt * 6000);
          continue;
        }
        const body = await resp.text();
        throw new Error("Anthropic error " + resp.status + ": " + body.slice(0, 400));
      } catch (err) {
        lastErr = err.message;
        if (attempt < MAX_TRIES) await sleep(attempt * 4000);
      }
    }
    if (!json) throw new Error("web_search call failed after " + MAX_TRIES + " tries: " + lastErr);

    if (json.stop_reason === "refusal") {
      throw new Error("model refused the discovery request: " + JSON.stringify(json.stop_details || {}));
    }
    if (json.usage) usage = json.usage;

    for (const block of json.content || []) {
      if (block.type === "text" && block.text) {
        finalText += block.text;
      } else if (block.type === "web_search_tool_result") {
        // On success, block.content is a LIST of web_search_result; on error it
        // is a single {error_code} object — guard on Array.isArray before indexing.
        const c = block.content;
        if (Array.isArray(c)) {
          c.forEach((r) => { if (r && r.url) urls.push({ url: r.url, title: r.title || "" }); });
        }
      }
    }

    // Server tool hit its iteration cap — resume by re-sending the turn.
    if (json.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: json.content });
      continue;
    }
    break;
  }

  return { urls, finalText, usage };
}

// URLs the model may have written into its prose (belt-and-suspenders on top of
// the deterministic web_search_result set).
function urlsFromText(text) {
  const out = [];
  const re = /\bhttps?:\/\/[^\s"'<>)\]]+/gi;
  let m;
  while ((m = re.exec(text || "")) !== null) {
    out.push({ url: m[0].replace(/[.,;:]+$/, ""), title: "" });
  }
  return out;
}

function normalizeUrl(u) {
  try {
    const url = new URL(u);
    url.hash = "";
    // Strip tracking params that would defeat dedup.
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"]
      .forEach((p) => url.searchParams.delete(p));
    let s = url.toString();
    return s.replace(/\/$/, "");
  } catch { return (u || "").trim(); }
}

// Search-engine and aggregator result pages are not sources — drop them.
const SKIP_HOST = /(^|\.)(google|bing|duckduckgo|yahoo|search)\./i;

function dedupCandidates(list) {
  const seen = new Set();
  const out = [];
  for (const it of list) {
    const key = normalizeUrl(it.url);
    if (!key) continue;
    let host = "";
    try { host = new URL(key).hostname; } catch { continue; }
    if (SKIP_HOST.test(host)) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url: key, title: it.title || "" });
  }
  return out;
}

// Fetch-test with bounded concurrency so we don't hammer hosts or block for
// minutes on a long candidate list.
async function testFetchable(candidates, concurrency = 4) {
  const results = new Array(candidates.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= candidates.length) return;
      const cand = candidates[i];
      let doc;
      try { doc = await fetchDocument(cand.url); }
      catch (e) { doc = { ok: false, error: e.message }; }
      results[i] = {
        url        : cand.url,
        title      : (doc && doc.title) || cand.title || "",
        fetchable  : !!(doc && doc.ok),
        wordCount  : (doc && doc.wordCount) || 0,
        finalUrl   : (doc && doc.finalUrl) || cand.url,
        reason     : doc && doc.ok ? "" : ((doc && doc.error) || "fetch failed")
      };
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));
  return results;
}

/**
 * Discover fetchable primary sources for a video.
 *
 * @param {object} req
 * @param {string} req.company   e.g. "BlackBerry (Research In Motion)"
 * @param {string} req.brief     the video brief / governance angle
 * @param {number} [req.maxTest=15]  cap on how many candidate URLs to fetch-test
 * @param {number} [req.maxUses=8]   web_search tool max_uses per round
 * @returns {Promise<object>} { company, brief, model, fetchable[], blocked[],
 *                              candidates[], sourceUrls, stats, generatedAt }
 */
async function discoverSources(req) {
  const company = (req.company || "").trim();
  const brief   = (req.brief   || "").trim();
  const maxTest = Math.max(1, Math.min(30, req.maxTest || 15));
  if (!company && !brief) throw new Error("discoverSources needs at least a company or a brief.");

  const prompt =
    `COMPANY / SUBJECT: ${company || "(unspecified)"}\n` +
    `VIDEO BRIEF (governance angle): ${brief || "(unspecified)"}\n\n` +
    `Find the strongest PRIMARY, publicly-readable sources for this story. ` +
    `Search the web for current working URLs, then list the best candidates. ` +
    `For each, give the full URL and a short note on what it is (e.g. "SEC 8-K", ` +
    `"regulator press release", "court judgment", "major-outlet report quoting the filing"). ` +
    `Prefer primary records over commentary, and readable pages over paywalled ones.`;

  const { urls, finalText, usage } = await runSearch({
    system: DISCOVER_SYSTEM, prompt, model: DISCOVER_MODEL, maxUses: req.maxUses || 8
  });

  const candidates = dedupCandidates([...urls, ...urlsFromText(finalText)]).slice(0, maxTest);
  if (!candidates.length) {
    return {
      company, brief, model: DISCOVER_MODEL, generatedAt: new Date().toISOString(),
      fetchable: [], blocked: [], candidates: [], sourceUrls: "",
      notes: finalText.slice(0, 2000),
      stats: { candidates: 0, fetchable: 0, blocked: 0 },
      warnings: ["Web search returned no usable candidate URLs for this subject."]
    };
  }

  const tested   = await testFetchable(candidates);
  const fetchable = tested.filter((t) => t.fetchable);
  const blocked   = tested.filter((t) => !t.fetchable);

  return {
    company, brief,
    model: DISCOVER_MODEL,
    generatedAt: new Date().toISOString(),
    fetchable,
    blocked,
    candidates: tested,
    // Ready to paste into Idea Catalogue Source_URLs (col P): reachable only.
    sourceUrls: fetchable.map((f) => f.url).join(", "),
    notes: finalText.slice(0, 2000),
    usage,
    stats: {
      candidates: tested.length,
      fetchable : fetchable.length,
      blocked   : blocked.length
    },
    warnings: fetchable.length ? [] :
      ["No candidate URL was fetchable — every source was paywalled, bot-walled, or dead. See blocked[] for reasons."]
  };
}

module.exports = { discoverSources };
