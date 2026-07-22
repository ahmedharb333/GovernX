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
// ── Pilot 001 MVP compositions (investigative case-file look) ──────────────────
import { BigNumberPoster   } from "./compositions/pilot/BigNumberPoster";
import { EvidenceCard      } from "./compositions/pilot/EvidenceCard";
import { GovernanceMethod  } from "./compositions/pilot/GovernanceMethod";
import { DecisionChain     } from "./compositions/pilot/DecisionChain";
import { GovernXFilm, FILM_DURATION } from "./compositions/pilot/film";
import {
  ComponentShowcase, SHOWCASE_DURATION,
  CaseBarChart, CaseLineGraph, CaseBeforeAfter, CaseKPIDashboard, CaseGauges, CaseRiskMatrix, CaseDataWall, CaseSplit
} from "./compositions/pilot/library";
import { AssembledFilm, calculateAssembledMetadata, ASSEMBLED_MOCK } from "./compositions/pilot/assembled";
import { StatementCard } from "./compositions/pilot/statements";
import { ScaleField, ScopeArrow, ControlPerimeter, CaseCheckpoint, CaseTimeline } from "./compositions/pilot/signature";
import { OpeningHook, VerdictCard, StatPoster } from "./compositions/pilot/hero";
import { BeatTimeline } from "./compositions/pilot/signature";
import { DecisionChain as CaseDecisionChain, ControlGapMap, ClaimLedger } from "./compositions/pilot/governance";
import { ThumbnailPoster, ThumbnailCinematic } from "./compositions/pilot/thumbnail";
import { ChannelBanner } from "./compositions/ChannelBanner";
import { Logo } from "./compositions/Logo";

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

      {/* ════════════════════════════════════════════════════════════════════
          PILOT 001 MVP — investigative case-file compositions (landscape)
          defaultProps = Wells Fargo Pilot 001 (source-backed)
      ════════════════════════════════════════════════════════════════════ */}

      {/* Full film — the whole Wells Fargo case in one sequenced piece (~4 min) */}
      <Composition
        id="GovernXFilm"
        component={GovernXFilm}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={FILM_DURATION}
      />

      {/* Case-file data-viz library — bar / line / before-after / KPI / gauges / risk */}
      <Composition
        id="ComponentShowcase"
        component={ComponentShowcase}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={SHOWCASE_DURATION}
      />
      <Composition id="CaseBarChart"     component={CaseBarChart}     fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="CaseLineGraph"    component={CaseLineGraph}    fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="CaseBeforeAfter"  component={CaseBeforeAfter}  fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="CaseKPIDashboard" component={CaseKPIDashboard} fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="CaseGauges"       component={CaseGauges}       fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="CaseRiskMatrix"   component={CaseRiskMatrix}   fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="CaseDataWall"     component={CaseDataWall}     fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={180} />
      <Composition id="CaseSplit"        component={CaseSplit}        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="StatementCard"    component={StatementCard}    fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="ScaleField"       component={ScaleField}       fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={240} />
      <Composition id="ScopeArrow"       component={ScopeArrow}       fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={180} />
      <Composition id="ControlPerimeter" component={ControlPerimeter} fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={210} />
      <Composition id="CaseCheckpoint"   component={CaseCheckpoint}   fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="CaseTimeline"     component={CaseTimeline}     fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={240} />
      <Composition id="OpeningHook"      component={OpeningHook}      fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={500} />
      <Composition id="VerdictCard"      component={VerdictCard}      fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={330} />
      <Composition id="CaseDecisionChain" component={CaseDecisionChain} fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={240} />
      <Composition id="ControlGapMap"    component={ControlGapMap}    fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={240} />
      <Composition id="ClaimLedger"      component={ClaimLedger}      fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={150} />
      <Composition id="StatPoster"       component={StatPoster}       fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={180} />
      <Composition id="BeatTimeline"     component={BeatTimeline}     fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE} durationInFrames={240} />

      {/* ThumbnailPoster — 1280×720 YouTube thumbnail in the case-file poster
          language, rendered from the same verified figures as the film. Still,
          not video: render with renderStill(). */}
      <Composition
        id="ThumbnailPoster"
        component={ThumbnailPoster}
        fps={FPS} width={1280} height={720}
        durationInFrames={60}
      />

      <Composition
        id="ThumbnailCinematic"
        component={ThumbnailCinematic}
        fps={FPS} width={1280} height={720}
        durationInFrames={1}
      />

      {/* ChannelBanner — 2048×1152 YouTube channel banner. Still, render with
          renderStill(). Critical content sits in the centred mobile-safe area. */}
      <Composition
        id="ChannelBanner"
        component={ChannelBanner}
        fps={FPS} width={2048} height={1152}
        durationInFrames={1}
      />

      {/* Refined logo system — stills, render with renderStill() */}
      <Composition id="LogoWordmark" component={Logo} fps={FPS} width={1600} height={520} durationInFrames={1} defaultProps={{ variant: "wordmark" }} />
      <Composition id="LogoMonogram" component={Logo} fps={FPS} width={800}  height={800} durationInFrames={1} defaultProps={{ variant: "monogram" }} />
      <Composition id="ProfilePic"   component={Logo} fps={FPS} width={800}  height={800} durationInFrames={1} defaultProps={{ variant: "profile" }} />
      <Composition id="LogoWatermark" component={Logo} fps={FPS} width={600} height={600} durationInFrames={1} defaultProps={{ variant: "watermark" }} />

      {/* AssembledFilm — data-driven full video (replaces Shotstack assembly).
          Duration is computed from the scene list via calculateMetadata. */}
      <Composition
        id="AssembledFilm"
        component={AssembledFilm}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={960}
        defaultProps={ASSEMBLED_MOCK}
        calculateMetadata={calculateAssembledMetadata}
      />

      <Composition
        id="BigNumberPoster"
        component={BigNumberPoster}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={150}
        // DM_8 (claim C20) revising DM_7 (claim C18). Both Verified.
        // The source hedges "potentially", and the figure is the BANK'S OWN
        // review — not a regulator finding. Both facts are on screen.
        defaultProps={{
          kicker     : "THE FAKE ACCOUNTS SCANDAL",
          countTo    : 3.5, countFrom: 2.1, decimals: 1, prefix: "", suffix: " MILLION",
          hedge      : "POTENTIALLY",
          bigCaption : "UNAUTHORIZED ACCOUNTS",
          oldValue   : "2.1M", oldNote: "ORIGINAL ANALYSIS", revisedNote: "REVISED UPWARD",
          dateTag    : "AUGUST 2017",
          bannerText : "THE BANK'S OWN REVIEW",
          attribution: "Company self-reported",
          source     : { publisher: "Wells Fargo", year: "2017", docType: "Form 8-K Exhibit 99.1 · 31 Aug 2017" },
          verified   : true, primary: true
        }}
      />

      <Composition
        id="EvidenceCard"
        component={EvidenceCard}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={180}
        // DM_4 (claim C8). Attribution: Regulator. The extract is the VERBATIM
        // quote the engine gated against the consent order — not a paraphrase.
        // ("$185M" previously sat here and appears in NO verified claim.)
        defaultProps={{
          claimId    : "C8",
          headline   : "The Bureau imposed a civil money penalty on Wells Fargo",
          value      : "$100M",
          valueLabel : "CIVIL MONEY PENALTY · 8 SEPT 2016",
          extract    : "Respondent must pay a civil money penalty of $100 million to the Bureau.",
          attribution: "Regulator",
          source     : { publisher: "CFPB", year: "2016", docType: "Consent Order 2016-CFPB-0015" },
          verified   : true, primary: true
        }}
      />

      <Composition
        id="GovernanceMethod"
        component={GovernanceMethod}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={210}
        defaultProps={{ failureIndex: 2 }}
      />

      <Composition
        id="DecisionChain"
        component={DecisionChain}
        fps={FPS} width={W_LANDSCAPE} height={H_LANDSCAPE}
        durationInFrames={240}
        defaultProps={{ company: "Wells Fargo" }}
      />

    </>
  );
};
