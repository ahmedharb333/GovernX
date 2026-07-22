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

// SEC and most regulators require a descriptive UA with contact info.
const UA = process.env.RESEARCH_USER_AGENT ||
  "GovernX-Research/1.0 (research@governx.local)";

async function fetchDocument(url) {
  const out = { ok: false, url, finalUrl: url, contentType: "", title: "",
                text: "", wordCount: 0, hash: "", archivePath: "", error: "" };
  try {
    const resp = await fetch(url, {
      redirect: "follow",
      headers : { "User-Agent": UA, "Accept": "*/*" }
    });
    out.finalUrl    = resp.url || url;
    out.contentType = (resp.headers.get("content-type") || "").toLowerCase();

    if (!resp.ok) throw new Error("HTTP " + resp.status);

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
    out.error = err.message;
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
