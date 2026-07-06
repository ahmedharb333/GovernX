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
| `GET` | `/output/:filename` | Download a rendered MP4 |
| `GET` | `/output-list` | List rendered files |

Rendered MP4s are saved to `output/` at the project root.

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
