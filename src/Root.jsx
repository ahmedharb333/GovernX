/* ============================================================================
   Root.jsx — GovernX Remotion Project
   Registers all compositions in TWO variants:
     - Base (landscape)  → 1920×1080 — Standard / Deep Dive formats
     - -Vertical         → 1080×1920 — Short (<60s) / Short (<90s) formats
   Stage 8D selects the correct compositionId based on idea.targetFormat.
   Place at: governx-remotion/src/Root.jsx
============================================================================ */

import { Composition } from "remotion";
import { TextImpactScene } from "./compositions/TextImpactScene";
import { CheckpointCard   } from "./compositions/CheckpointCard";
import { InfographicScene } from "./compositions/InfographicScene";
import { Timeline         } from "./compositions/Timeline";
import { OpeningTitle     } from "./compositions/OpeningTitle";
import { RiskMatrix       } from "./compositions/RiskMatrix";
import { KPIDashboard     } from "./compositions/KPIDashboard";
import { ProgressGauge      } from "./compositions/ProgressGauge";
import { CounterAnimation  } from "./compositions/CounterAnimation";

const FPS = 30;

const W_LANDSCAPE = 1920;
const H_LANDSCAPE = 1080;

const W_VERTICAL  = 1080;
const H_VERTICAL  = 1920;

export const RemotionRoot = () => {
  return (
    <>

      {/* ════════════════════════════════════════════════════════════════════
          LANDSCAPE — Standard / Deep Dive (1920×1080)
      ════════════════════════════════════════════════════════════════════ */}

      <Composition
        id="TextImpactScene"
        component={TextImpactScene}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={150}
        defaultProps={{
          type    : "default",
          mainText: "$65.8 BILLION",
          subText : "BP DEEPWATER HORIZON",
          context : "GovernX",
          accent  : true
        }}
      />

      <Composition
        id="CheckpointCard"
        component={CheckpointCard}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={150}
        defaultProps={{
          date            : "April 2010",
          event           : "Safety gates on Macondo rig overruled under budget pressure",
          angle           : "BUDGET OWNERS CONTROLLED SAFETY GATES",
          checkpointNum   : 1,
          totalCheckpoints: 3,
          variant         : "standard"
        }}
      />

      <Composition
        id="InfographicScene"
        component={InfographicScene}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={180}
        defaultProps={{
          type         : "data_callout",
          value        : "$65.8B",
          label        : "Total BP Charges",
          context      : "2010 – 2016",
          title        : "",
          unit         : "",
          dataPoints   : [],
          voiceoverSync: ""
        }}
      />

      <Composition
        id="TimelineReveal"
        component={Timeline}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={300}
        defaultProps={{
          checkpoints: [
            "Texas City explosion — 15 dead 2005",
            "Baker Panel warning — governance deficient 2007",
            "Macondo blowout — 11 dead April 2010",
            "Federal court — gross negligence 2014",
            "BP cumulative charges reach $65.8B 2016"
          ],
          company      : "BP Deepwater Horizon",
          voiceoverSync: ""
        }}
      />

      <Composition
        id="OpeningTitle"
        component={OpeningTitle}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={120}
        defaultProps={{
          company   : "GovernX",
          discipline: "GRC",
          hook      : "The hidden governance failure behind the collapse",
          contentId : "GX-0000-BIZ-001"
        }}
      />


      <Composition
        id="RiskMatrix"
        component={RiskMatrix}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={240}
        defaultProps={{
          title : "Governance Risk Assessment",
          xLabel: "LIKELIHOOD",
          yLabel: "IMPACT",
          risks : [
            { label: "No board oversight", likelihood: 3, impact: 3, highlight: true },
            { label: "Budget over safety",  likelihood: 3, impact: 2 },
            { label: "Audit gaps",          likelihood: 2, impact: 3 },
            { label: "Vendor risk",         likelihood: 2, impact: 2 },
            { label: "Policy gaps",         likelihood: 1, impact: 2 }
          ]
        }}
      />

      <Composition
        id="KPIDashboard"
        component={KPIDashboard}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={210}
        defaultProps={{
          title : "Governance Performance Dashboard",
          layout: "2x2",
          kpis  : [
            { label: "Policy Compliance",  value: "94%",   trend: "up",   change: "+6% YoY",  context: "ISO 9001 audit 2023",      highlight: false },
            { label: "Open Risk Items",    value: "17",    trend: "down", change: "-8 vs Q2",  context: "Board review pending",     highlight: true  },
            { label: "Audit Findings",     value: "3",     trend: "up",   change: "+2 critical",context: "External audit Oct 2023", highlight: true  },
            { label: "Training Coverage",  value: "88%",   trend: "up",   change: "+11% YoY",  context: "GRC staff certified",     highlight: false }
          ]
        }}
      />

      <Composition
        id="ProgressGauge"
        component={ProgressGauge}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={210}
        defaultProps={{
          title  : "Governance Compliance Overview",
          variant: "multi",
          gauges : [
            { label: "Policy Compliance",  value: 94, unit: "%", context: "ISO 9001 — 2023",     highlight: false, threshold: 80 },
            { label: "Safety Gate Score",  value: 41, unit: "%", context: "Macondo rig — 2010",  highlight: true,  threshold: 80 },
            { label: "Training Coverage",  value: 88, unit: "%", context: "GRC certified staff",  highlight: false, threshold: 75 }
          ]
        }}
      />

      {/* ════════════════════════════════════════════════════════════════════
          VERTICAL — Short (<60s) / Short (<90s) (1080×1920)
      ════════════════════════════════════════════════════════════════════ */}

      <Composition
        id="TextImpactScene-Vertical"
        component={TextImpactScene}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={150}
        defaultProps={{
          type    : "default",
          mainText: "$65.8 BILLION",
          subText : "BP DEEPWATER HORIZON",
          context : "GovernX",
          accent  : true
        }}
      />

      <Composition
        id="CheckpointCard-Vertical"
        component={CheckpointCard}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={150}
        defaultProps={{
          date            : "April 2010",
          event           : "Safety gates on Macondo rig overruled under budget pressure",
          angle           : "BUDGET OWNERS CONTROLLED SAFETY GATES",
          checkpointNum   : 1,
          totalCheckpoints: 3,
          variant         : "standard"
        }}
      />

      <Composition
        id="InfographicScene-Vertical"
        component={InfographicScene}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={180}
        defaultProps={{
          type         : "data_callout",
          value        : "$65.8B",
          label        : "Total BP Charges",
          context      : "2010 – 2016",
          title        : "",
          unit         : "",
          dataPoints   : [],
          voiceoverSync: ""
        }}
      />

      <Composition
        id="TimelineReveal-Vertical"
        component={Timeline}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={300}
        defaultProps={{
          checkpoints: [
            "Texas City explosion — 15 dead 2005",
            "Baker Panel warning — governance deficient 2007",
            "Macondo blowout — 11 dead April 2010",
            "Federal court — gross negligence 2014",
            "BP cumulative charges reach $65.8B 2016"
          ],
          company      : "BP Deepwater Horizon",
          voiceoverSync: ""
        }}
      />

      <Composition
        id="ProgressGauge-Vertical"
        component={ProgressGauge}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={210}
        defaultProps={{
          title  : "Governance Compliance Overview",
          variant: "multi",
          gauges : [
            { label: "Policy Compliance",  value: 94, unit: "%", context: "ISO 9001 — 2023",    highlight: false, threshold: 80 },
            { label: "Safety Gate Score",  value: 41, unit: "%", context: "Macondo rig — 2010", highlight: true,  threshold: 80 },
            { label: "Training Coverage",  value: 88, unit: "%", context: "GRC certified staff", highlight: false, threshold: 75 }
          ]
        }}
      />

      <Composition
        id="KPIDashboard-Vertical"
        component={KPIDashboard}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={210}
        defaultProps={{
          title : "Governance Performance Dashboard",
          layout: "2x2",
          kpis  : [
            { label: "Policy Compliance",  value: "94%",   trend: "up",   change: "+6% YoY",   context: "ISO 9001 audit 2023",      highlight: false },
            { label: "Open Risk Items",    value: "17",    trend: "down", change: "-8 vs Q2",   context: "Board review pending",     highlight: true  },
            { label: "Audit Findings",     value: "3",     trend: "up",   change: "+2 critical", context: "External audit Oct 2023", highlight: true  },
            { label: "Training Coverage",  value: "88%",   trend: "up",   change: "+11% YoY",   context: "GRC staff certified",     highlight: false }
          ]
        }}
      />

      <Composition
        id="RiskMatrix-Vertical"
        component={RiskMatrix}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={240}
        defaultProps={{
          title : "Governance Risk Assessment",
          xLabel: "LIKELIHOOD",
          yLabel: "IMPACT",
          risks : [
            { label: "No board oversight", likelihood: 3, impact: 3, highlight: true },
            { label: "Budget over safety",  likelihood: 3, impact: 2 },
            { label: "Audit gaps",          likelihood: 2, impact: 3 },
            { label: "Vendor risk",         likelihood: 2, impact: 2 },
            { label: "Policy gaps",         likelihood: 1, impact: 2 }
          ]
        }}
      />

      <Composition
        id="OpeningTitle-Vertical"
        component={OpeningTitle}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={120}
        defaultProps={{
          company   : "GovernX",
          discipline: "GRC",
          hook      : "The hidden governance failure behind the collapse",
          contentId : "GX-0000-BIZ-001"
        }}
      />

      {/* ── CounterAnimation — standalone count-up for dramatic data reveals ── */}

      <Composition
        id="CounterAnimation"
        component={CounterAnimation}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={150}
        defaultProps={{
          from   : 0,
          to     : 83,
          prefix : "$",
          suffix : "B",
          label  : "BlackBerry Peak Market Cap",
          context: ""
        }}
      />

      <Composition
        id="CounterAnimation-Vertical"
        component={CounterAnimation}
        fps={FPS} width={W_VERTICAL} height={H_VERTICAL}
        durationInFrames={150}
        defaultProps={{
          from   : 0,
          to     : 83,
          prefix : "$",
          suffix : "B",
          label  : "BlackBerry Peak Market Cap",
          context: ""
        }}
      />

    </>
  );
};
