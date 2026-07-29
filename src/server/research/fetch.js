/* ============================================================================
   research/fetch.js — fetch + parse + archive a source document.
   Handles HTML (cheerio) and PDF (pdf-parse). Saves a local text archive
   and returns clean text + metadata. This is the part Apps Script cannot do.

   Deps:  npm install cheerio pdf-parse
   ============================================================================ */

const fs     = require("fs");
const path   = require("path");
const crypto = require("crypto");

const ARCHIVE_DIR = path.join(__dirname, "../../../research_archive");
if (!fs.existsSync(ARCHIVE_DIR)) fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

// A bot-identifying UA ("GovernX-Research/1.0 …") gets 403'd by anti-bot layers
// (Cloudflare, academic publishers, news sites) — it turned away INSEAD, SagePub
// and others that are actually freely readable in a browser. Present as a normal
// browser so public pages load; publishers that truly gate content (WSJ → 401)
// still won't serve, and that's correct. EDGAR/SEC keeps its own descriptive UA
// in edgar.js, so this doesn't touch regulator API access. Override via env.
const UA = process.env.RESEARCH_USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
const BROWSER_HEADERS = {
  "User-Agent"     : UA,
  "Accept"         : "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf;q=0.8,*/*;q=0.7",
  "Accept-Language": "en-US,en;q=0.9"
};

// Node's fetch has NO default timeout, so a host that accepts the connection and
// then never responds blocks the caller until the socket eventually dies — which
// stalled discovery for ~15 min on one dead candidate, and could stall a verify
// build the same way. Abort after FETCH_TIMEOUT_MS (default 15s) with a clear
// reason. Override via env for a slow primary source.
const FETCH_TIMEOUT_MS = Math.max(1000, parseInt(process.env.RESEARCH_FETCH_TIMEOUT_MS, 10) || 15000);

async function fetchDocument(url) {
  const out = { ok: false, url, finalUrl: url, contentType: "", title: "",
                text: "", wordCount: 0, hash: "", archivePath: "", error: "" };
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);
  try {
    const resp = await fetch(url, {
      redirect: "follow",
      headers : BROWSER_HEADERS,
      signal  : ac.signal
    });
    out.finalUrl    = resp.url || url;
    out.contentType = (resp.headers.get("content-type") || "").toLowerCase();

    if (!resp.ok) {
      // Distinguish WHY, so the operator knows whether it's fixable. A bare
      // "HTTP 403" hides three very different causes: a Cloudflare JS challenge
      // (needs a real browser — no header fix works), a hard paywall (401), or a
      // dead URL (404). Report the actionable reason.
      const cf = (resp.headers.get("cf-mitigated") || "").toLowerCase() === "challenge"
              || (resp.headers.get("server") || "").toLowerCase().includes("cloudflare") && resp.status === 403;
      if (cf)                    throw new Error(`Blocked by Cloudflare bot-challenge (HTTP ${resp.status}) — page needs a real browser; add its claims manually or use a non-protected mirror`);
      if (resp.status === 401)   throw new Error(`HTTP 401 — paywalled/login-required source`);
      if (resp.status === 404)   throw new Error(`HTTP 404 — URL not found (check the stored link; it may be truncated or moved)`);
      throw new Error("HTTP " + resp.status);
    }

    const isPdf = out.contentType.includes("pdf") || /\.pdf($|\?)/i.test(url);

    if (isPdf) {
      const buf = Buffer.from(await resp.arrayBuffer());
      const { PDFParse } = require("pdf-parse");           // v2 class API
      const parser = new PDFParse({ data: new Uint8Array(buf) });
      let info = {};
      try { info = (await parser.getInfo()).info || {}; } catch (e) {}
      const textRes = await parser.getText();
      try { await parser.destroy(); } catch (e) {}
      out.text  = cleanText(textRes.text || "");
      out.title = info.Title || info.Subject || fileNameFromUrl(url);
    } else {
      const html = await resp.text();
      const parsed = parseHtml(html);
      out.text  = parsed.text;
      out.title = parsed.title || fileNameFromUrl(url);
    }

    out.wordCount = out.text ? out.text.split(/\s+/).length : 0;
    if (out.wordCount < 40) throw new Error("Extracted too little text (" + out.wordCount + " words) — likely blocked or empty");

    out.hash        = crypto.createHash("sha256").update(out.text).digest("hex").slice(0, 16);
    out.archivePath = archive(out);
    out.ok = true;
  } catch (err) {
    out.error = (err && err.name === "AbortError")
      ? `Timed out after ${FETCH_TIMEOUT_MS / 1000}s with no response — host unreachable, hanging, or blocking the fetch`
      : err.message;
  } finally {
    clearTimeout(timer);
  }
  return out;
}

// ── HTML → clean readable text ────────────────────────────────────────────────
function parseHtml(html) {
  const cheerio = require("cheerio");
  const $ = cheerio.load(html);
  const title = ($("title").first().text() ||
                 $('meta[property="og:title"]').attr("content") || "").trim();
  $("script, style, noscript, nav, footer, header, form, svg, iframe").remove();
  // Prefer the main article region when present.
  const scope = $("main").length ? $("main")
              : $("article").length ? $("article")
              : $("body");
  return { title, text: cleanText(scope.text()) };
}

function cleanText(t) {
  return (t || "")
    .replace(/\r/g, "")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n").map(l => l.trim()).join("\n")
    .trim();
}

function fileNameFromUrl(url) {
  try { return decodeURIComponent(new URL(url).pathname.split("/").pop() || url); }
  catch { return url; }
}

// ── Local archive (evidence backup; Drive archive is done by Apps Script) ─────
function archive(doc) {
  const slug = (doc.title || "source").replace(/[^\w]+/g, "_").slice(0, 60);
  const file = path.join(ARCHIVE_DIR, doc.hash + "__" + slug + ".txt");
  const header =
    "URL: " + doc.finalUrl + "\n" +
    "TITLE: " + doc.title + "\n" +
    "FETCHED: " + new Date().toISOString() + "\n" +
    "SHA256(16): " + doc.hash + "\n" +
    "WORDS: " + doc.wordCount + "\n" +
    "----------------------------------------------------------------------\n\n";
  fs.writeFileSync(file, header + doc.text, "utf8");
  return file;
}

module.exports = { fetchDocument, ARCHIVE_DIR };
