# GovernX Remotion Renderer

![Remotion](https://img.shields.io/badge/Remotion-4.0.186-0088CC?logo=remotion&logoColor=white)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-%5E4.18.2-000000?logo=express&logoColor=white)

Programmatic video renderer for GovernX — builds branded MP4 scenes from structured data.

## Compositions

| Name | Duration | Use |
|------|----------|-----|
| CheckpointCard | 5s | Date / event / governance angle cards |
| InfographicScene | 6s | Bar charts, comparisons, counters, callouts |
| TextImpactScene | 4s | Large-type stats, hook callouts, GRC closing |
| OpeningTitle | 4s | Branded video title card per content ID |

## Setup (one time)

```bash
cd governx-remotion
npm install
```

## Start the render server

```bash
npm start
```

Server runs on http://localhost:3000

## Preview in Remotion Studio

```bash
npm run studio
```

## Endpoints

- `GET  /health`          — health check
- `POST /render`          — render a single scene
- `POST /render-batch`    — render multiple scenes
- `GET  /output/{file}`   — serve rendered MP4
- `GET  /output-list`     — list all rendered files

## Scene payload examples

### Checkpoint Card
```json
{
  "compositionId": "CheckpointCard",
  "contentId": "GX-2605-TECH-001",
  "sceneNum": "3",
  "props": {
    "date": "2007",
    "event": "iPhone launched. Nokia dismissed it.",
    "angle": "RISK GOVERNANCE FAILURE",
    "checkpointNum": 2,
    "totalCheckpoints": 4
  }
}
```

### Infographic
```json
{
  "compositionId": "InfographicScene",
  "contentId": "GX-2605-SPT-001",
  "sceneNum": "I1",
  "props": {
    "type": "split_comparison",
    "title": "Serie A vs Premier League",
    "subtitle": "Revenue 2022 (€ Billions)",
    "dataPoints": [
      { "label": "Serie A", "value": 1.8, "highlight": false },
      { "label": "Premier League", "value": 5.5, "highlight": true }
    ],
    "unit": "€",
    "voiceoverSync": "The gap had grown to €3.7 billion."
  }
}
```

## Upgrade to Remotion Lambda (when ready)

Replace the local `renderMedia()` call in `server/index.js` with `renderMediaOnLambda()`.
The payload format and Apps Script integration stay identical.
