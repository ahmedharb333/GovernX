# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies (one-time)
npm install

# Start the render server (port 3000)
npm start

# Open Remotion Studio for visual preview
npm run studio

# Bundle the Remotion project
npm run build
```

## Architecture

This is a **GovernX Remotion Renderer** — an Express server that renders branded MP4 video scenes from structured JSON data, designed to be called by Google Apps Script.

---

## ⭐ CURRENT SYSTEM — Case-File Visual System + Remotion Assembly (V3, 2026-07-21)

The video output was overhauled from the old flat templates into a premium
**investigative case-file** look, and the final-video assembly was moved from
Shotstack into Remotion. The compositions listed further below under
"Compositions" are now **legacy utilities** — the current pilot renders through
the components and assembly described here. Pilot 001 = Wells Fargo fake-accounts;
second full-pipeline test = **GX-2607-BIZ-001 (Nissan / Carlos Ghosn)**, which
drove the component-hardening and pacing work in the "Built since" list below.

### Design system
- `src/theme.js` — tokens: navy #111B2E ground, paper #F4F0E4 cards, red #C8102E = signal only, yellow = one emphasis/attribution tag; Impact/Arial-Narrow condensed numbers, Georgia serif verdicts, Courier mono source lines.
- `src/compositions/pilot/parts.jsx` — shared case-file blocks + the **evidence contract**: `EvidenceFooter`, `VerificationBadge`, `ClaimChip`, `ConfidenceMeter`, `AttributionTag`, `Masthead`, `SourceFooter`, `Stamp`, `RedArrow`, `Vignette`, `useCountUp`. Rule: **facts locked to a `claimId` in the data; only source + VERIFIED shown on screen** — `claimId`/confidence render only with `audit={true}`.

### Component library (`src/compositions/pilot/`)
- `statements.jsx` — **StatementCard** (narrative spine; kinds hook/shatter/verdict/default; `*word*` → red).
- `signature.jsx` — **ScaleField** (X-of-N dot field), **ScopeArrow** (figure revised), **ControlPerimeter**, **CaseCheckpoint**, **CaseTimeline**, **BeatTimeline** (compact 3-beat).
- `hero.jsx` — **OpeningHook** (fast-assembling scandal poster), **VerdictCard** (GOVERNX VERDICT close), **StatPoster** (one clean formatted number).
- `governance.jsx` — **DecisionChain**, **ControlGapMap**, **ClaimLedger** (the analysis scenes).
- `library.jsx` — data-viz: **CaseBarChart, CaseLineGraph, CaseBeforeAfter, CaseKPIDashboard, CaseGauges, CaseRiskMatrix, CaseDataWall, CaseSplit**.
- `EvidenceCard.jsx`, `BigNumberPoster.jsx`, `GovernanceMethod.jsx` — pilot utilities (EvidenceCard = the $100M consent-order hero).
- `thumbnail.jsx` — **ThumbnailPoster** (1280×720 YouTube thumbnail; rendered via `renderStill`, not part of the film).
- `library.jsx` also exports the shared helper **`fitValueSize(value, max)`** — the single fix for "free-text value in a fixed-size slot" overflow; reused by StatPoster, CaseKPIDashboard, CaseDataWall, ThumbnailPoster.
- `film.jsx` — original hand-authored Wells Fargo film (reference; superseded by the assembly path).

### ⛔ THE ONE INVARIANT: NO EVIDENCE IN DEFAULTS

**A component default must never contain a figure, source, date, quote, claim id, or
`verified: true`.** `adapt.js` prunes undefined props, so any field the adapter fails to
supply falls back to whatever is written as the default — and a pilot-specific default
renders as if it were *this* video's sourced evidence.

This is not hypothetical. Every pilot component once defaulted to the Wells Fargo case, and
the first Nissan film shipped with `CASE FILE · GX-2606-BIZ-001`, `SOURCE: WELLS FARGO, 2017
/ FORM 8-K EXHIBIT 99.1`, "THE BANK'S OWN REVIEW" and a green ✓ VERIFIED badge on screen —
under Nissan's narration. **Gate ⑥ cannot catch this**: the fabricated text lives in JSX, not
in the sheet, so the evidence gate passed clean while the video lied.

Rules that follow from it:
- Evidence-bearing defaults are `""` / `[]`. `verified` and `primary` default **false**.
- Missing data must render **blank**. A visibly empty scene is a fixable defect; a
  plausible wrong one is a false citation.
- Never hardcode a case id, source, or banner in JSX — pass it as a prop (`caseCode`).
- `film.jsx` is the exception: it IS the hand-authored Wells Fargo film, so its data is correct.

### Routing (data → component)
- `src/server/adapt.js` — `adaptScene(sceneType, remotionData)` → `{ component, props }`.
  Routes **by content**: Text shatter/hook/verdict/default→StatementCard; Checkpoint→CaseCheckpoint;
  Timeline→CaseTimeline; COUNTER ≥10M→ScaleField else BigNumberPoster; SPLIT with growth-keywords→ScopeArrow
  else CaseSplit; LINE event-labels→CaseTimeline else CaseLineGraph; BAR_CHART / KPI_DASHBOARD /
  PROGRESS_GAUGE / RISK_MATRIX / BEFORE_AFTER_CARD → the matching `Case*` component.
- **Tier-2 types** (added 2026-07-20; previously these components were registered but
  UNREACHABLE from REMOTION_DATA and only ran from the hand-authored V3 manifest):
  `EVIDENCE_CARD` `DATA_WALL` `VERDICT_CARD` `OPENING_HOOK` `STAT_POSTER` `DECISION_CHAIN`
  `CONTROL_GAP` `CONTROL_PERIMETER` `CLAIM_LEDGER` `BEAT_TIMELINE` `GOVERNANCE_METHOD`.
  **All 24 registered components are now reachable.** Field shapes: `GovernX/DIRECTOR_SPEC.md` §6.
- `splitUnit()` puts a currency symbol in `prefix` and the magnitude in `suffix` ("¥B+" → `¥`/`B+`),
  and `parseValueString()` does the same for a one-string figure (`value=$77.5M`) — without it
  `num("$77.5M")` was `NaN` and BigNumberPoster silently rendered **0**.
- `splitItems` splits on **every** comma EXCEPT a true thousands separator —
  `/(?<!\d),|,(?!\d{3}(?!\d))/`. It was originally a whitelist of what may *start* an item; each
  widening (letter/$ → year → year-range) fixed one case and missed the next (`,10 years:`,
  `,2004 → `). `130,000` and `5,300` stay whole.
- `FALLBACK_SOURCE` is **`""`** — deliberately. It used to be the pilot ledger
  ("Wells Fargo · CFPB · Court") so no data scene rendered sourceless, which put one company's
  attribution under another's figures. A missing source line is a defect; a wrong one is a lie.
- `src/compositions/pilot/registry.jsx` — `BY_NAME` map + `componentForName`; the client-side twin of adapt.js.

### Pacing (assembled.jsx / assemble.js)
- A scene's on-screen length **is** its Stage-7B clip length — duration is decided in Stage 4 by
  how finely the voiceover is chunked, not here.
- Scenes over 15s get a slow 3% push-in (`DRIFT_MAX`) so nothing is literally frozen; the first
  Nissan cut had frames 48s apart that were **byte-identical**.
- `buildScenes` numbers CaseCheckpoints in film order (adapt.js cannot know a scene's position;
  it used to default every card to "1 / 4") and **warns** for any scene holding one visual >35s.

### Assembly — replaces Shotstack / Stage 9B
- `src/compositions/pilot/assembled.jsx` — **AssembledFilm**: data-driven `scenes[]` inputProps, each scene → its component (or `visuals:[{component,props}]` + `splitFrac` = two visuals over ONE audio clip), per-scene `<Audio>`, captions OFF by default, duration from `calculateAssembledMetadata`.
- `src/server/assemble.js` — `buildScenes` (download each scene's public Stage-7B MP3 by Drive id via `uc?export=download`, ffprobe → scene frames, adapt), then `renderAssembled` (**copy audio into the bundle's `public/audio` before render** — Remotion bakes `public/` at bundle time), render one synced MP4. Exposed as `POST /assemble/job` + `GET /assemble/job/:id` (async, mirrors `/research/job`).
- **Audio/sync**: Stage 7 = one full VO; Stage 7B = per-scene MP3s (col 23, already public); each scene's on-screen length = its clip's real ffprobe length → frame-accurate sync. No word-count estimate, no Shotstack.

### Curated V3 edit
- The pilot's premium cut is a hand-authored manifest (`_render_v3.js` scratch): reuses the 21 Stage-7B clips, drops redundant ones, splits two clips across visuals (bill-pay 528K→$910K, settlement→beat-timeline), trims the long S16 clip with `ffmpeg -t`, silent ClaimLedger, final `loudnorm=I=-16:TP=-1` pass. Output ~4:19, captions off. Latest: `Desktop/GovernX_WellsFargo_V3_FULL.mp4` (V3.1).

### Built since (2026-07-19 → 21)
1. ✅ Apps Script **"🎬 Assemble Film (Remotion)"** menu — `Stage_9C_Remotion_Assembly.gs`,
   2-step submit/check (GAS 6-min cap vs ~23-min render), saves `{id}_final_video.mp4` to
   `getOrCreateContentFolder` + Publishing Tracker **SCENES_FOLDER** col. Stage 9B/Shotstack
   kept in parallel. Now also `downloadRenderedFile_` (chunked HTTP Range + byte-verify — a
   52 MB render was silently truncated 419 bytes under UrlFetchApp's 50 MB cap) and
   `writeSceneTimestamps_` (writes each scene's `M:SS` start into the TIMESTAMP column as text).
2. ✅ **Director upgrade** (`GovernX/DIRECTOR_SPEC.md`) — Stage 4 targets 26–30 scenes at
   11–14s, checkpoints capped at 4; Stage 4B documents all 9 infographic variants + the 11
   case-file components, batches director-review in groups of 8 (was timing out at 27 scenes),
   and enforces ONE-SENTENCE-ONE-SCENE + NO-DUPLICATE-VOICEOVER (a cut once narrated the same
   line across 13 of 27 scenes). **Stage 4B prompt now verified end-to-end** via `verify4b.js`
   (routes every REMOTION_DATA block through the REAL adapter + simulated gate ⑥ before spending
   ElevenLabs credits).
3. ✅ **Component hardening** (from the Nissan render review) — the recurring
   *free-text-value-in-a-fixed-slot* overflow is now one shared helper `fitValueSize(value,max)`
   (`library.jsx`, used by StatPoster/KPI/DataWall/thumbnail). Fixed: StatPoster reflows to a
   flex column ("roughly 35 billion yen" no longer clips the frame); CaseRiskMatrix uses a
   numbered legend + fanned dots for same-cell risks (labels no longer overlap); CaseTimeline
   `splitCheckpoint` extracts a leading bare-year / year-range / month+year (nodes 3-5 were blank);
   ControlPerimeter pills auto-size. **CaseBarChart unit rendering** was hardcoded to the literal
   `"$M"` — every other unit (`¥B`, `$B`, `€M`, `%`) silently dropped its symbol and drew a bare
   number; now parsed generically (currency → prefix, magnitude/percent → suffix).
4. ✅ **THE ONE INVARIANT enforced everywhere** — every pilot component's evidence-bearing
   defaults blanked, `verified`/`primary` default `false`, `AttributionTag` returns `null` when
   empty (was defaulting to "ATTRIBUTION UNCLEAR"). See the invariant section above.
5. ✅ **Min-duration floor** (`assemble.js`) — `MIN_TEXT_FRAMES` (~4.2s) / `MIN_ANY_FRAMES` (~3.0s)
   via `minFramesFor(component)`, so a punch-line card can't flash past in ~2s. Plus
   `verifyRender()` (throws if decoded frames < timeline-2) and `sceneTimings` (cumulative
   `M:SS` start per scene) returned from the assemble job.
6. ✅ **Remotion thumbnail** — `thumbnail.jsx` **ThumbnailPoster** (1280×720, arrow-into-figure,
   `fitValueSize`, `showCaption` default off) rendered via `renderStill` at `POST /thumbnail`;
   replaces the AI-image thumbnail so the number on the poster can't disagree with the video.
   Apps Script side: `Stage_8E_Thumbnail_Remotion.gs`, set on upload by `stage_11_youtube_upload`.
7. ✅ **Stage 10 / 11 fixes** — `buildYouTubeChapters_` builds chapters from real scene
   timestamps (drops garbage serial-date timestamps, splits titles only on sentence punctuation
   so "9.078 billion yen" survives, obeys YouTube's ≥3-chapters / 0:00-first / ≥10s rules);
   removed the silent auto-`uploadToYouTube` call; Stage 11 sets the Remotion thumbnail and its
   stale "Stage 9B" copy now reads "Assemble Film (Remotion)".
8. ✅ **Video Economics tab** (`Video_Economics.gs`) — per-video cost vs revenue. Cost is
   auto-estimated from usage (ElevenLabs exact chars × passes, Claude output-chars estimate +
   per-stage input allowance, editable rate cells); revenue pulled from YouTube Analytics
   `estimatedRevenue`; formulas for RPM / NET / ROI / Status. Nissan verified ≈ $3.42.
9. ✅ **Menu merged** (`menu.txt`) — the standalone Research menu folded into the main GovernX
   menu as one linear workflow; manual "Generate ID" retired (auto `getActiveIdeaRow` +
   `resolveDomainCode_`); Stage 8D-All-Scenes and Stage 9B removed from the menu; CTA (Idea
   Catalogue col K) auto-appended to the spoken script; research inputs (brief / URLs / EDGAR)
   auto-filled, ②b `suggestClaims` caps claims by video format.
10. ✅ **TTS number pronunciation** (`pipeline.txt` `speakNumbers_`) — runs on the ElevenLabs-bound
   text only (screen text unchanged) at Stage 7 & 7B: `$140 million`→"140 million dollars",
   `¥4.4 billion`→"4.4 billion yen" (the `¥`/`€` symbols aren't TTS tokens), `36%`→"36 percent",
   plus quarters/multipliers/numeric-ranges. Only transforms what the TTS gets *wrong* (no full
   digit-to-words engine — that would risk a wrong spoken number). Dates/years left alone.
11. ✅ **"Preview One Scene" now faithful** — old handler rendered the LEGACY compositions
   (`CheckpointCard`/`InfographicScene`/…) via `/render`; the film uses `adapt.js`. New
   `POST /preview-scene` routes ONE scene's REMOTION_DATA through the same `adaptScene` → the real
   case-file component → a settled still. GAS: `previewOneScene` in `Stage_9C`. Verified: all 21
   Nissan scenes render through it, 0 failures. Required registering **`CaseSplit`** (the one
   adapter output that lacked a standalone composition).
12. ✅ **Thumbnail workflow** — the menu button now prompts `style | headline | value | unit | banner`
   (style = `dark`|`paper`|`cinematic`, all editable) so a re-run can differ. `POST /thumbnail`
   takes `compositionId` + `variant`; each style saves as `{id}_thumbnail_{variant}.png` into a
   **Thumbnails** subfolder so the three sit side by side. New `ThumbnailCinematic` composition
   (spotlight + ghosted-courthouse depth, real data — the on-brand answer to an AI-image thumbnail).
   Download gate fixed (checked bytes, not the case-flaky `Content-Type` header). AI-image
   (Ideogram) menu item **retired**.
13. ✅ **Brand assets** — `ChannelBanner.jsx` (2048×1152, mobile-safe center), `Logo.jsx`
   (wordmark / GX monogram / profile / watermark variants), refined flat wordmark (solid red X,
   no plate/outline). Rendered by `render_banner.js` / `render_logos.js` / `render_thumbnail.js`
   (bundle + `renderStill`); outputs on `Desktop/GovernX_*.png`. Tagline lock: "Why systems win"
   on the logo, the fuller thesis on the banner.
14. ✅ **Publishing controls** (`stage_11_youtube_upload.txt`) — three end-states: **Upload**
   (private, or scheduled-at-upload via `publishAt`), **🚀 Publish Video** (public now), and new
   **🗓️ Schedule Publish** (`schedulePublishYouTubeVideo`) — sets `publishAt` on an already-uploaded
   *private* video, with pre-checks (video not-found / already-public / shows an existing schedule
   before replacing it). All three read the video id from Publishing Tracker col R. Also the
   description **references were de-walled** (`buildFullDescription_` groups by URL, ≤6 sources ×
   ≤3 quotes — the Nissan 15-quote SEC repeat collapsed to one entry).
15. ✅ **Dashboard rebuilt** (`dashboard.txt`) — tracker extended to the last mile
   (**S10 metadata / Thumb / S11 upload**); Status now progresses 🎨 Scened → 🎬 Assembled →
   ⬆ Uploaded → 🚀 Published (was hard-wired to the stale Shotstack "Assembly Guide" col); **dynamic
   row count** (`N = max(12, ideas+6)`, no more hard-coded 10); **economics cards** (Total Cost /
   Revenue / Net / Portfolio ROI from the Video Economics tab); metric cards split into **Uploaded**
   (col R) vs **Published-public** (col B). The **About dialog** (`menu.txt`) was refreshed to the
   real pipeline (dropped 8D / 8E-brief / 9B / Cleanup; added 9C, Preview One Scene, gate ⑥).

### Pending
1. **Auto `visuals[]` split** for any scene >25s — deferred; with ~27 scenes it may be
   unnecessary. Decide from real Stage-7B clip lengths, not estimates.
2. **`ASSEMBLED_MOCK`** renders blank (its props are `{}` and defaults are empty by design),
   so Remotion Studio preview of AssembledFilm shows empty scenes. Cosmetic.
3. **Audio quality** — voice/A-V sync is now frame-accurate by construction, but ElevenLabs
   voice quality on the cloned voice still wants a human listen per film.
4. **Apps Script is copy-paste, not deployed** — the `.gs`/`.txt` files in
   `Desktop/New folder/` are the working copies; the user must paste changed files into the
   live bound script for them to take effect (no `clasp`/git sync in this project).

### Verifying a render (no API needed)
Extract frames with the bundled ffmpeg (`node_modules/@remotion/compositor-win32-x64-msvc/`,
a **minimal build — no `fps`/`tile` filters**, so seek per frame with `-ss`), then `md5sum` them:
identical hashes across a span mean a frozen scene. Read the stills to check content. This is
how the Wells Fargo contamination, the 48s freeze, and the off-frame timeline were all caught.

### ▶ Next-video workflow (per-video checklist)

**Two sync steps first — nothing takes effect without them:**
1. **Re-paste changed Apps Script files** into the live bound editor (no `clasp`/git — copy-paste
   from `Desktop/New folder/`). Currently ahead of the live script:
   `pipeline.txt` (TTS `speakNumbers_` + Stage 10), `Stage_8E_Thumbnail_Remotion.gs`
   (thumbnail styles + folder + byte-gate), `Stage_9C_Remotion_Assembly.gs` (`previewOneScene`),
   `stage_11_youtube_upload.txt` (references de-walled — group by URL, ≤6 sources × ≤3 quotes),
   `dashboard.txt` (tracker extended to S10/Thumb/S11, dynamic row count, economics cards),
   `menu.txt` (Ideogram removed, preview repointed). Then reload the sheet so the menu rebuilds.
2. **Restart the Remotion server** (`Ctrl+C`, `npm start`) so it re-bundles — the render server
   **caches the bundle on first request**, so source edits (`library.jsx` ¥B, `CaseSplit`
   registration, `ThumbnailCinematic`, the new endpoints) are invisible until restart. First
   assemble/preview after restart logs `[GovernX] Bundling…` = confirmation.

**Run order (the sequence matters):**
1. Company/Idea → Research (② → ③) → Script (3 / 3B) → Scenes (4 / 4B).
2. **Preview One Scene** (optional) — now shows the *real* case-file component.
3. Validate ⑥ (gate) → Stage 5 → Stage 6.
4. **Stage 7 / 7B** voiceover — numbers now pronounced correctly.
5. Validate ④ → **Stage 9C Assemble** (needs the server restart above; writes scene timestamps).
6. **Stage 10 metadata *after* assembly** — chapters need the timestamps or you get a lone
   "0:00 Introduction" stub (the Note column will warn you if you run it too early).
7. **Generate Thumbnail (Remotion)** — pick `dark`/`paper`/`cinematic`, edit copy in the prompt;
   saves to the content folder's **Thumbnails** subfolder (one file per style).
8. Stage 11 upload (or manual). Custom thumbnail needs a phone-verified channel.

**Metadata tips:** keep tags under 500 chars (auto-capped now); don't paste a 15-quote citation
wall — one SEC link + a few pull-quotes; outro should echo "every collapse … has an architecture",
not "every satisfactory outcome".

### Entry points

- `src/index.jsx` — Remotion entry point; calls `registerRoot(RemotionRoot)`
- `src/Root.jsx` — Registers all compositions in two layout variants: landscape (1920×1080) and vertical (1080×1920). Each composition has a `{Name}` and `{Name}-Vertical` ID.
- `src/server/index.js` — Express server; bundles the Remotion project on first request (cached), then renders via `renderMedia()`.

### Compositions (`src/compositions/`)

| File | compositionId | Duration | Purpose |
|------|--------------|----------|---------|
| `TextImpactScene.jsx` | `TextImpactScene` | 5s (150f) | Large-type stat callouts, hook text |
| `CheckpointCard.jsx` | `CheckpointCard` | 5s (150f) | Date / event / governance angle cards |
| `InfographicScene.jsx` | `InfographicScene` | 6s (180f) | Multi-type data visualisations (see below) |
| `Timeline.jsx` | `TimelineReveal` | 10s (300f) | Sequential checkpoint reveal |
| `OpeningTitle.jsx` | `OpeningTitle` | 4s (120f) | Branded title card per content ID |
| `RiskMatrix.jsx` | `RiskMatrix` | 8s (240f) | 3×3 likelihood vs impact heat grid with animated risk dots |
| `KPIDashboard.jsx` | `KPIDashboard` | 7s (210f) | 2–4 KPI metric cards with trend indicators |
| `ProgressGauge.jsx` | `ProgressGauge` | 7s (210f) | Circular arc gauge(s) for compliance %, scores, adoption rates |
| `CounterAnimation.jsx` | `CounterAnimation` | 5s (150f) | Standalone animated count-up for dramatic data reveals (dedicated composition — not a type of InfographicScene) |

All compositions run at **30 FPS**. Output codec is **h264**, image format is **png**, `crf: 12`.

Each composition has a `{Name}-Vertical` variant (1080×1920) registered in `Root.jsx`.

#### `InfographicScene` types (pass as `type` prop)

| type | key props |
|------|-----------|
| `data_callout` | `value`, `label`, `context` |
| `counter_animation` | `from`, `to`, `unit`, `label` |
| `line_graph` | `title`, `unit`, `dataPoints: [{year, value}]`, `highlight` |
| `split_comparison` | `leftLabel`, `leftValues`, `rightLabel`, `rightValues`, `bottomNote` |
| `before_after_card` | `beforeLabel`, `beforeRows`, `afterLabel`, `afterRows`, `verdict` — rows use `;;` separator (NOT `\|`) |
| `bar_chart` | `title`, `unit`, `dataPoints: [{label, value, highlight?}]` |

#### `RiskMatrix` props
`risks: [{label, likelihood, impact, highlight?}]` — `likelihood` / `impact` are `1` (Low), `2` (Medium), `3` (High).

#### `KPIDashboard` props
`kpis: [{label, value, trend, change, context, highlight?}]` — `trend`: `"up"` \| `"down"` \| `"neutral"`. `layout`: `"2x2"` (default) \| `"1x3"` \| `"1x4"`.

#### `ProgressGauge` props
`gauges: [{label, value (0–100), unit, context, highlight?, threshold?}]` — arc auto-colors green ≥80%, amber ≥50%, red <50%; `highlight: true` forces red. `threshold` shows "BELOW/ON TARGET" badge and forces red arc when breached. `variant`: `"single"` (default, one large centred gauge) \| `"multi"` (2–4 side-by-side, auto-sized).

### REMOTION_DATA column format (Visual Library col 19)

All values are pipe-separated `key=value` pairs. **Never use `|` inside a value** — it will be parsed as a new key.

```
# data_callout
type=DATA_CALLOUT | value=$7.2B | label=Pension Deficit | context=At point of collapse

# counter_animation — routed to CounterAnimation composition (NOT InfographicScene)
# Director fills `to` with the display number (e.g. 7.2, not 7200000000)
# GAS splits `unit` → prefix/suffix: "$B" → prefix="$" suffix="B", "%" → prefix="" suffix="%"
type=COUNTER_ANIMATION | from=0 | to=7.2 | unit=$B | label=Losses in 3 years | context=2010-2016

# line_graph
type=LINE_GRAPH | label=Market Share | unit=% | points=2009:50,2016:1,2024:0.3

# bar_chart
type=BAR_CHART | title=Revenue by Year | unit=$B | points=2020:1.2:false,2021:2.1:false,2022:3.4:true

# split_comparison
type=SPLIT_COMPARISON | left_label=Before GRC | left_values=Audit:75%,IT:Not covered | right_label=After GRC | right_values=Audit:100%,IT:Fully mapped | bottom_note=18 months to implement

# before_after_card  ← rows use ";;" separator, NOT "|"
type=BEFORE_AFTER_CARD | before_label=Standard Process | before_rows=Audit scope→75%;;IT systems→Not covered;;Risk appetite→Not defined | after_label=Post-Reform | after_rows=Audit scope→100%;;IT systems→Fully mapped;;Risk appetite→Board approved | verdict=Full compliance achieved

# Risk Matrix
type=RISK_MATRIX | title=Key Risks | xlabel=LIKELIHOOD | ylabel=IMPACT | risks=Data Breach:3:3:true,Regulatory Fine:2:3:false,Reputational Loss:3:2:false

# KPI Dashboard  ← no colons or commas inside label/context fields
type=KPI_DASHBOARD | title=Performance 2024 | layout=2x2 | kpis=Revenue:$2.1B:up:+6%:vs prior year:false,Compliance Rate:94%:up:+12pts:target 100%:false

# Progress Gauge
type=PROGRESS_GAUGE | title=Compliance Scores | variant=multi | gauges=Data Governance:94:%:target 100%:false:80,Risk Coverage:67:%:below target:true:75
```

**Array field rules:**
- `risks=`, `kpis=`, `gauges=` — items separated by `,`, fields within each item by `:`
- `before_rows=`, `after_rows=` — items separated by `;;`, label→value by `→`
- Avoid `:` and `,` in label/context text for array compositions — use `-` instead

### Server endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/render` | Render a single scene — requires `compositionId`, `outputFilename`, optional `props` |
| `POST` | `/render-batch` | Render multiple scenes — requires `scenes[]` array |
| `GET` | `/output/:filename` | Download a rendered MP4 — **supports HTTP Range** (chunked pull + byte-verify for large files) |
| `GET` | `/output-info` | Size/metadata for a rendered file (used to verify a full download) |
| `GET` | `/output-list` | List rendered files |
| `POST` | `/assemble/job` + `GET /assemble/job/:id` | Async full-film assembly (mirrors `/research/job`); result returns bytes + `sceneTimings` |
| `POST` | `/thumbnail` | Render a 1280×720 thumbnail PNG via `renderStill`. `{contentId, props}` + optional `compositionId` (`ThumbnailPoster` default / `ThumbnailCinematic`) + `variant` (→ `{id}_thumbnail_{variant}.png`) |
| `POST` | `/preview-scene` | Adapt ONE scene's `{sceneType, remotionData}` via `adapt.js` and render the real case-file component to a settled still (used by "Preview One Scene") |

Rendered MP4s/PNGs are saved to `output/` at the project root.

### Environment

Copy `env.template` to `.env` and set `DRIVE_FOLDER_ID` (Google Drive folder ID for upload via `src/server/drive-upload.js`).

### Quality settings

`renderMedia()` in `src/server/index.js` is configured with:
- `imageFormat: "png"` — lossless frames, sharper than the default jpeg (especially for text/edges)
- `crf: 12` — high quality h264 encode (lower = better; range 0–51, default ~18)

Tune `crf` between 12–16 to balance quality vs file size.

### Rendering flow

1. `getBundle()` bundles `src/index.jsx` via `@remotion/bundler` (cached after first call)
2. `selectComposition()` selects and configures the target composition with `inputProps`
3. `renderMedia()` renders to an h264 MP4 in `output/`

### Scaling path

To move from local to cloud rendering, replace `renderMedia()` in `src/server/index.js` with `renderMediaOnLambda()` from `@remotion/lambda`. The payload format and Apps Script integration remain identical.
