/* ============================================================================
   research/edgar.js — resolve SEC EDGAR full-text search into document URLs.
   Primary-source discovery for filings (10-K, 8-K, consent orders referenced
   in filings, etc.). Free, no key. Requires a descriptive User-Agent.

   Docs: https://efts.sec.gov/LATEST/search-index?q=...
   ============================================================================ */

const UA = process.env.RESEARCH_USER_AGENT ||
  "GovernX-Research/1.0 (research@governx.local)";

/**
 * Full-text search EDGAR. Returns candidate primary-source document URLs.
 * @param {string} query   e.g. '"unauthorized accounts" Wells Fargo'
 * @param {object} opts    { forms?: "10-K,8-K", dateRange?: ["2016-01-01","2017-12-31"], limit?: 5 }
 */
async function edgarSearch(query, opts = {}) {
  const params = new URLSearchParams({ q: query });
  if (opts.forms)     params.set("forms", opts.forms);
  if (opts.dateRange) { params.set("dateRange", "custom");
                        params.set("startdt", opts.dateRange[0]);
                        params.set("enddt",   opts.dateRange[1]); }

  const url = "https://efts.sec.gov/LATEST/search-index?" + params.toString();
  const resp = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!resp.ok) throw new Error("EDGAR search HTTP " + resp.status);

  const json = await resp.json();
  const hits = (json.hits && json.hits.hits) || [];
  const limit = opts.limit || 5;

  return hits.slice(0, limit).map(h => {
    const s = h._source || {};
    // _id looks like "0000072971-17-000428:wfcexhibit99108312017.htm"
    const [adshFromId, file] = (h._id || "").split(":");
    const adsh = s.adsh || adshFromId || "";
    const cik  = (Array.isArray(s.ciks) && s.ciks[0]) || "";
    const adshNoDash = adsh.replace(/-/g, "");
    const docUrl = (cik && adshNoDash && file)
      ? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${adshNoDash}/${file}`
      : "";
    return {
      url        : docUrl,
      form       : s.form || (Array.isArray(s.root_forms) ? s.root_forms[0] : "") || s.file_type || "",
      filedAt    : s.file_date || "",
      company    : (s.display_names && s.display_names[0]) || "",
      publisher  : "SEC EDGAR",
      sourceType : "Company Filing"
    };
  }).filter(x => x.url);
}

module.exports = { edgarSearch };
