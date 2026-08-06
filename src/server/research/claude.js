/* ============================================================================
   research/claude.js — Anthropic Messages client for the research worker.
   No SDK dependency; uses global fetch (Node 18+).

   Two things this file gets right, both learned the hard way:

   1. THINKING IS ON BY DEFAULT on claude-sonnet-5 when `thinking` is omitted,
      and `max_tokens` caps thinking + text TOGETHER. A large prompt could burn
      the whole budget on thinking and return ZERO text blocks — which looked
      like "the model returned nothing" instead of "the model ran out of room".
      These are structured-extraction calls; they don't need thinking. We set
      `thinking: {type: "disabled"}` explicitly and give a generous max_tokens.

   2. STRUCTURED OUTPUTS remove the JSON-parsing failure mode entirely. When a
      schema is supplied, the API guarantees the response is valid JSON matching
      it (output_config.format). No code fences, no prose, no truncated arrays.

   Env: ANTHROPIC_API_KEY (required), RESEARCH_MODEL (default claude-sonnet-5)
   ============================================================================ */

const API_URL = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = process.env.RESEARCH_MODEL || "claude-sonnet-5";

/**
 * @returns {{ text: string, stopReason: string, usage: object }}
 */
async function callClaude({ system, prompt, maxTokens = 8000, model, schema }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set (add it to governx-remotion/.env).");

  const payload = {
    model     : model || DEFAULT_MODEL,
    max_tokens: maxTokens,
    system    : system,
    // Extraction/verification are structured tasks. Thinking would eat the
    // output budget and can leave zero text blocks in the response.
    thinking  : { type: "disabled" },
    messages  : [{ role: "user", content: prompt }]
  };

  // Structured outputs: the API constrains the reply to this exact schema.
  if (schema) payload.output_config = { format: { type: "json_schema", schema } };

  const MAX_TRIES = 3;
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    try {
      const resp = await fetch(API_URL, {
        method : "POST",
        headers: {
          "x-api-key"        : key,
          "anthropic-version": "2023-06-01",
          "content-type"     : "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (resp.status === 200) {
        const json = await resp.json();
        const text = (json.content || [])
          .filter(b => b.type === "text")
          .map(b => b.text)
          .join("");

        // Surface the two silent-failure shapes rather than returning "".
        if (json.stop_reason === "max_tokens" && !text) {
          throw new Error(`response hit max_tokens (${maxTokens}) before emitting any text`);
        }
        if (json.stop_reason === "refusal") {
          throw new Error("model refused the request: " +
            JSON.stringify(json.stop_details || {}));
        }
        return { text, stopReason: json.stop_reason, usage: json.usage || {} };
      }

      if (resp.status === 429 || resp.status === 529) {
        lastErr = "HTTP " + resp.status;
        await sleep(attempt * 6000);
        continue;
      }
      const body = await resp.text();
      // Claude credit exhausted → free Groq fallback so research keeps flowing.
      // Returns { …, fallback:true }; callers route the text through the tolerant
      // JSON parser since Groq can't honour the Anthropic schema.
      if (resp.status === 400 && /credit balance is too low/i.test(body)) {
        const fb = await groqFallback({ system, prompt, maxTokens });
        if (fb) return fb;
      }
      throw new Error("Anthropic error " + resp.status + ": " + body.slice(0, 400));
    } catch (err) {
      lastErr = err.message;
      if (attempt < MAX_TRIES) await sleep(attempt * 4000);
    }
  }
  throw new Error("Claude call failed after " + MAX_TRIES + " tries: " + lastErr);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ── Groq free-tier fallback (Llama 3.3 70B) ────────────────────────────────────
   Fires ONLY when Claude returns "credit balance is too low". Keeps the research
   engine producing while the Anthropic account is at $0. Groq has no structured-
   output/schema mode, so it returns plain text and callJsonArray parses it
   tolerantly. Quality is below Claude — re-run verification on Claude once funded.
   Returns null if GROQ_API_KEY is unset, so the caller raises its normal error. */
async function groqFallback({ system, prompt, maxTokens = 8000 }) {
  const orKey = process.env.OPENROUTER_API_KEY;
  const gqKey = process.env.GROQ_API_KEY;

  // Prefer OpenRouter: it handles large research prompts that Groq's free
  // 12k-tokens/min tier rejects. Groq stays as a secondary. Model overridable
  // via OPENROUTER_MODEL / GROQ_MODEL.
  let url, key, model;
  if (orKey) {
    url = "https://openrouter.ai/api/v1/chat/completions";
    key = orKey;
    model = process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free";
  } else if (gqKey) {
    url = "https://api.groq.com/openai/v1/chat/completions";
    key = gqKey;
    model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  } else {
    return null;
  }

  const resp = await fetch(url, {
    method : "POST",
    headers: { "Authorization": "Bearer " + key, "content-type": "application/json" },
    body   : JSON.stringify({
      model,
      max_tokens: Math.min(maxTokens, 16000),
      messages  : [
        ...(system ? [{ role: "system", content: system }] : []),
        { role: "user", content: prompt }
      ]
    })
  });
  if (resp.status !== 200) {
    throw new Error("LLM fallback (" + model + ") failed " + resp.status + ": " + (await resp.text()).slice(0, 400));
  }
  const json = await resp.json();
  console.warn("⚠ [Research] Claude credit exhausted → " + model + " fallback used. " +
    "Quality below Claude — re-run verification on Claude when the account is funded.");
  return { text: (json.choices && json.choices[0] && json.choices[0].message.content) || "",
    stopReason: "end_turn", usage: json.usage || {}, fallback: true };
}

// ── Tolerant JSON-array parsing (fallback path when no schema is supplied) ────
function parseJsonArray(raw) {
  if (!raw) return [];
  let s = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```$/, "").trim();
  const a = s.indexOf("["), b = s.lastIndexOf("]");
  if (a !== -1 && b !== -1 && b > a) s = s.slice(a, b + 1);
  try { const p = JSON.parse(s); return Array.isArray(p) ? p : []; } catch { return []; }
}

/**
 * Call Claude and get back a JSON array, guaranteed-shaped when `itemSchema` is
 * given. Structured outputs need an object at the top level, so the array is
 * wrapped in `{ items: [...] }` and unwrapped here.
 *
 * Throws (never returns []) when the model produces nothing parseable — an
 * empty array must mean "nothing found", never "nothing parsed".
 */
async function callJsonArray({ system, prompt, maxTokens = 8000, model, label = "json", expect, itemSchema }) {
  const schema = itemSchema ? {
    type: "object",
    properties: { items: { type: "array", items: itemSchema } },
    required: ["items"],
    additionalProperties: false
  } : null;

  let lastRaw = "", lastStop = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const p = attempt === 1 ? prompt
      : prompt + `\n\nIMPORTANT: your previous reply could not be parsed. ` +
                 `Reply with ONLY a JSON array — no prose, no code fences.`;

    const { text, stopReason, fallback } = await callClaude({ system, prompt: p, maxTokens, model, schema });
    lastRaw = text; lastStop = stopReason;

    let arr = [];
    if (schema && !fallback) {         // Groq can't honour the anthropic schema
      try { arr = JSON.parse(text).items || []; } catch { arr = []; }
    } else {
      arr = parseJsonArray(text);      // tolerant parse for Groq / no-schema paths
    }

    const ok = arr.length > 0 && (expect == null || arr.length === expect);
    if (ok) return arr;

    // A schema'd call that returns a valid-but-empty array genuinely found nothing.
    if (schema && expect == null && Array.isArray(arr) && stopReason === "end_turn") return arr;

    console.warn(`[Research] ⚠ ${label}: attempt ${attempt} parsed ${arr.length}` +
      (expect != null ? `/${expect}` : "") + ` items (stop_reason=${stopReason}). ` +
      `Raw starts: ${JSON.stringify((text || "").slice(0, 140))}`);
  }
  throw new Error(`${label}: no usable JSON array after 2 attempts ` +
    `(stop_reason=${lastStop}, raw len ${lastRaw.length})`);
}

module.exports = { callClaude, callJsonArray, parseJsonArray, DEFAULT_MODEL };
