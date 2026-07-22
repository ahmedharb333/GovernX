/* ============================================================================
   film.jsx — "GovernanceX Alert: The Metric That Manufactured Fraud"
   A single sequenced film of the Wells Fargo case, in the GovernX
   investigative-poster language. Every figure is from the verified evidence.

   Visual thesis: attribution IS the art direction.
     • Company self-reported numbers → cream document / "confession" register
     • Regulator / Court numbers      → navy authority / stamped register
     • RED is the only signal (the fraction found, the arrow, the stamp)

   Landscape 1920×1080 · 30fps. Master composition id: "GovernXFilm".
   ============================================================================ */

import { AbsoluteFill, Series, interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, SourceFooter, AttributionTag, Stamp, Vignette, useCountUp } from "./parts";

const EO = Easing.out(Easing.cubic);
// local eased interpolate against the scene's local frame
const A = (f, a, b, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });
const LIN = (f, a, b, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const outAt = (f, dur, hold = 10) => LIN(f, dur - hold, dur, 1, 0);   // fade the scene out at its end

const Ground = ({ children, dur, bg = COLOR.navy }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: bg, opacity: outAt(f, dur), overflow: "hidden" }}>
      <Vignette />
      {children}
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   1 · TITLE  — the frame
   ══════════════════════════════════════════════════════════════════════════ */
const STitle = ({ dur }) => {
  const f = useCurrentFrame();
  const rule = A(f, 12, 34, 0, 100);
  return (
    <Ground dur={dur} bg={COLOR.navyDeep}>
      <Masthead code="GOVERNANCE ALERT · GX-2606-BIZ-001" delay={0} />
      <div style={{ position: "absolute", top: 360, left: SPACE.margin, right: SPACE.margin }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.stamp, color: COLOR.red, opacity: A(f, 20, 34) }}>
          CASE ANALYSIS · CONSUMER BANKING
        </div>
        <div style={{
          fontFamily: FONT.serif, fontWeight: 700, fontSize: 118, lineHeight: 1.0, color: COLOR.white,
          marginTop: 18, opacity: A(f, 26, 46), transform: `translateY(${A(f, 26, 46, 24, 0)}px)`
        }}>
          The metric that<br />manufactured <span style={{ color: COLOR.red }}>fraud</span>.
        </div>
        <div style={{ height: 4, width: `${rule}%`, maxWidth: 640, backgroundColor: COLOR.red, marginTop: 36 }} />
        <div style={{
          fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.mist, marginTop: 30, maxWidth: 1150,
          opacity: A(f, 46, 64), lineHeight: 1.35
        }}>
          How Wells Fargo's own incentive system produced 3.5 million accounts nobody asked for —
          and why every number you are about to see, the bank reported about itself.
        </div>
      </div>
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   2 · DOT FIELD  — scale made visceral. 165M reviewed · 3.5M ignite red.
   ══════════════════════════════════════════════════════════════════════════ */
const SDotField = ({ dur }) => {
  const f = useCurrentFrame();
  const COLS = 58, ROWS = 22, N = COLS * ROWS;         // ~1276 dots stand in for 165M
  const RED_FRAC = 3.5 / 165;                          // the real ratio
  const redCount = Math.max(1, Math.round(N * RED_FRAC)); // ~27 red dots
  const step = Math.floor(N / redCount);                  // every ~47th dot
  // deterministic sparse spread: one red dot per `step`, nudged so they don't
  // land in a single column
  const isRed = (i) => (i % step) === ((Math.floor(i / step) * 13) % step);

  const gridX0 = 150, gridY0 = 210, gw = 1620, gh = 560;
  const dx = gw / (COLS - 1), dy = gh / (ROWS - 1);
  const appear = A(f, 8, 60);                          // dots fade in
  const ignite = A(f, 70, 120);                        // red dots ignite

  const dots = [];
  for (let i = 0; i < N; i++) {
    const c = i % COLS, r = Math.floor(i / COLS);
    const red = isRed(i);
    dots.push(
      <circle key={i} cx={gridX0 + c * dx} cy={gridY0 + r * dy} r={red ? 5.5 : 4}
        fill={red ? COLOR.red : COLOR.mistDim}
        opacity={red ? 0.15 + ignite * 0.85 : appear * 0.55}
        style={red ? { filter: `drop-shadow(0 0 ${ignite * 8}px ${COLOR.red})` } : undefined} />
    );
  }
  return (
    <Ground dur={dur}>
      <Masthead code="THE SCALE · SELF-REPORTED" delay={0} />
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>{dots}</svg>
      <div style={{ position: "absolute", top: 108, left: SPACE.margin, opacity: A(f, 4, 20) }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: SIZE.title, color: COLOR.white, letterSpacing: TRACK.tight }}>
          MORE THAN <span style={{ color: COLOR.white }}>165 MILLION</span> ACCOUNTS REVIEWED
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: COLOR.mistDim, marginTop: 6 }}>
          RETAIL BANKING ACCOUNTS · JANUARY 2009 – SEPTEMBER 2016
        </div>
      </div>
      <div style={{ position: "absolute", top: 820, left: SPACE.margin, right: SPACE.margin, display: "flex", alignItems: "flex-end", justifyContent: "space-between", opacity: A(f, 96, 118) }}>
        <div>
          <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.label, color: COLOR.red }}>POTENTIALLY UNAUTHORIZED</div>
          <div style={{ fontFamily: FONT.displayHeavy, fontSize: 150, lineHeight: 0.9, color: COLOR.red }}>
            ~3.5<span style={{ fontSize: 64, marginLeft: 12 }}>MILLION</span>
          </div>
        </div>
        <div style={{ marginBottom: 20 }}><AttributionTag attribution="Company self-reported" delay={100} /></div>
      </div>
      <SourceFooter publisher="Wells Fargo" year="2017" docType="Form 8-K Exhibit 99.1 · 31 Aug 2017" delay={104} bottom={SPACE.lg} right />
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   3 · CONFESSION LEDGER  — the bank's own numbers, typed onto its own paper.
   ══════════════════════════════════════════════════════════════════════════ */
const LEDGER = [
  ["~2.1 million", "potentially unauthorized accounts — original review (May 2011–mid 2015)"],
  ["1,534,280", "deposit accounts that may not have been authorized"],
  ["565,443", "credit-card applications submitted without consent"],
  ["~3.5 million", "potentially unauthorized accounts — expanded review (2009–2016)"],
  ["~528,000", "potentially unauthorized online bill-pay enrollments"]
];
const SConfession = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Ground dur={dur} bg={COLOR.navyDeep}>
      <div style={{
        position: "absolute", top: 90, left: SPACE.margin, right: SPACE.margin, bottom: 90,
        backgroundColor: COLOR.paper, borderRadius: 6, boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
        transform: `translateY(${A(f, 0, 18, 40, 0)}px)`, opacity: A(f, 0, 18), padding: "46px 60px", overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `2px solid ${COLOR.paperEdge}`, paddingBottom: 18 }}>
          <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 40, color: COLOR.ink }}>What the bank reported about itself</div>
          <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: COLOR.inkSoft }}>SELF-REPORTED · WELLS FARGO ANALYSIS</div>
        </div>
        {LEDGER.map((row, i) => {
          const t = 26 + i * 22;
          const op = A(f, t, t + 16);
          return (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 34, marginTop: i === 0 ? 40 : 28, opacity: op, transform: `translateX(${A(f, t, t + 16, -20, 0)}px)` }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 76, color: COLOR.ink, minWidth: 430, textAlign: "right", letterSpacing: TRACK.tight }}>{row[0]}</div>
              <div style={{ width: 3, alignSelf: "stretch", backgroundColor: COLOR.red, opacity: 0.7 }} />
              <div style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.inkSoft, lineHeight: 1.3 }}>{row[1]}</div>
            </div>
          );
        })}
        <div style={{ position: "absolute", right: 60, bottom: 40 }}><Stamp text="ON THE RECORD" delay={150} rotate={-7} /></div>
      </div>
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   4 · REVISION SPLIT  — 2.1M → 3.5M, the scope that kept expanding.
   ══════════════════════════════════════════════════════════════════════════ */
const SRevision = ({ dur }) => {
  const f = useCurrentFrame();
  const Col = ({ x, w, label, period, big, sub, dim, delay }) => (
    <div style={{ position: "absolute", top: 300, left: x, width: w, opacity: A(f, delay, delay + 16), transform: `translateY(${A(f, delay, delay + 16, 24, 0)}px)` }}>
      <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: dim ? COLOR.mistDim : COLOR.red }}>{label}</div>
      <div style={{ fontFamily: FONT.sans, fontSize: SIZE.label, color: COLOR.mist, marginTop: 4 }}>{period}</div>
      <div style={{ fontFamily: FONT.displayHeavy, fontSize: dim ? 150 : 200, lineHeight: 0.9, color: dim ? COLOR.mistDim : COLOR.white, marginTop: 18 }}>{big}</div>
      <div style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.mist, marginTop: 10 }}>{sub}</div>
    </div>
  );
  return (
    <Ground dur={dur}>
      <Masthead code="THE SCOPE EXPANDED" delay={0} />
      <Col x={150} w={640} label="ORIGINAL REVIEW" period="May 2011 – mid 2015" big="~2.1M" sub="potentially unauthorized" dim delay={10} />
      {/* arrow */}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={840} y1={470} x2={1030} y2={470} stroke={COLOR.red} strokeWidth={12} strokeLinecap="round"
          strokeDasharray="200" strokeDashoffset={A(f, 40, 64, 200, 0)} />
        <polygon points="1030,470 998,452 998,488" fill={COLOR.red} opacity={A(f, 60, 66)} />
      </svg>
      <Col x={1090} w={680} label="EXPANDED THIRD-PARTY REVIEW" period="January 2009 – September 2016" big="~3.5M" sub="potentially unauthorized" delay={54} />
      <div style={{ position: "absolute", bottom: 150, left: SPACE.margin, opacity: A(f, 80, 96), fontFamily: FONT.mono, fontSize: SIZE.source, color: COLOR.mistDim, letterSpacing: "0.06em" }}>
        + 2.55M REVISED ORIGINAL PERIOD  ·  + 981,000 ADDITIONAL YEARS
      </div>
      <div style={{ position: "absolute", bottom: 150, right: SPACE.margin }}><AttributionTag attribution="Company self-reported" delay={82} /></div>
      <SourceFooter publisher="Wells Fargo" year="2017" docType="Expanded account review" delay={86} bottom={SPACE.lg} />
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   5 · FEE IMPACT  — two document chips, real harm.
   ══════════════════════════════════════════════════════════════════════════ */
const SFees = ({ dur }) => {
  const f = useCurrentFrame();
  const Chip = ({ x, title, count, money, delay }) => (
    <div style={{
      position: "absolute", top: 320, left: x, width: 700, backgroundColor: COLOR.paper, borderRadius: 6,
      padding: "34px 40px", boxShadow: "0 20px 50px rgba(0,0,0,0.45)", opacity: A(f, delay, delay + 16),
      transform: `translateY(${A(f, delay, delay + 16, 30, 0)}px)`
    }}>
      <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: COLOR.inkSoft }}>{title}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 26, marginTop: 14 }}>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 96, color: COLOR.red, lineHeight: 0.9 }}>{money}</div>
      </div>
      <div style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.ink, marginTop: 8 }}>{count} accounts incurred fees</div>
    </div>
  );
  return (
    <Ground dur={dur}>
      <Masthead code="REAL HARM · SELF-REPORTED" delay={0} />
      <div style={{ position: "absolute", top: 150, left: SPACE.margin, fontFamily: FONT.serif, fontWeight: 700, fontSize: SIZE.h2, color: COLOR.white, opacity: A(f, 4, 18) }}>
        The phantom accounts were not harmless.
      </div>
      <Chip x={150} title="DEPOSIT ACCOUNTS" count="~85,000" money="~$2M" delay={16} />
      <Chip x={1070} title="CREDIT-CARD ACCOUNTS" count="~14,000" money="$403,145" delay={34} />
      <div style={{ position: "absolute", bottom: 150, right: SPACE.margin }}><AttributionTag attribution="Company self-reported" delay={54} /></div>
      <SourceFooter publisher="CFPB" year="2016" docType="Consent Order 2016-CFPB-0015" delay={58} bottom={SPACE.lg} />
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   6 · THE PIVOT  — 5,300, the fulcrum. The explanation IS the evidence.
   ══════════════════════════════════════════════════════════════════════════ */
const SPivot = ({ dur }) => {
  const f = useCurrentFrame();
  const strike = A(f, 150, 178, 0, 100);
  return (
    <Ground dur={dur} bg={COLOR.navyDeep}>
      <Masthead code="THE COMFORTABLE EXPLANATION" delay={0} />
      <div style={{ position: "absolute", top: 250, left: SPACE.margin, opacity: A(f, 10, 26) }}>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 300, lineHeight: 0.82, color: COLOR.white }}>~5,300</div>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: SIZE.heroSub, color: COLOR.mist, letterSpacing: "0.03em", position: "relative", display: "inline-block" }}>
          EMPLOYEES TERMINATED
          <div style={{ position: "absolute", top: "52%", left: -6, width: `${strike}%`, height: 6, backgroundColor: COLOR.red }} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 220, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 186, 210) }}>
        <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 700, fontSize: 60, color: COLOR.white, lineHeight: 1.15 }}>
          This was the bank's explanation.<br />
          <span style={{ color: COLOR.red }}>It was also the evidence against it.</span>
        </div>
      </div>
      <div style={{ position: "absolute", top: 260, right: SPACE.margin }}><AttributionTag attribution="Regulator" delay={20} /></div>
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   7 · SIMULATED FUNDING LOOP  — the mechanism. The heart of the film.
   ══════════════════════════════════════════════════════════════════════════ */
const SLoop = ({ dur }) => {
  const f = useCurrentFrame();
  const intro = A(f, 6, 26);
  // loop the money flow; each loop ticks the KPI
  const LOOP = 66;                                  // frames per cycle
  const start = 40;
  const cycle = Math.max(0, f - start);
  const kpi = Math.floor(cycle / LOOP);
  const p = (cycle % LOOP) / LOOP;                  // 0..1 within a cycle
  const flow = Math.min(1, p * 1.6);                // funds travel in first 60%
  // account boxes
  const realX = 260, phantomX = 1180, boxY = 430, boxW = 480, boxH = 200;
  const dotX = realX + boxW + (phantomX - (realX + boxW)) * flow;
  return (
    <Ground dur={dur}>
      <Masthead code="THE MECHANISM · REGULATOR FINDING" delay={0} />
      <div style={{ position: "absolute", top: 120, left: SPACE.margin, opacity: intro }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: SIZE.title, color: COLOR.white, letterSpacing: TRACK.tight }}>
          "SIMULATED FUNDING"
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.mist, marginTop: 8, maxWidth: 1500 }}>
          Move a customer's own money into an account they never opened — just long enough to trigger the bonus.
        </div>
      </div>

      {/* the two accounts */}
      {[["CUSTOMER'S REAL ACCOUNT", realX, false], ["PHANTOM ACCOUNT", phantomX, true]].map(([lbl, x, phantom], i) => (
        <div key={i} style={{
          position: "absolute", top: boxY, left: x, width: boxW, height: boxH, opacity: intro,
          border: `3px solid ${phantom ? COLOR.red : COLOR.mist}`, borderStyle: phantom ? "dashed" : "solid",
          borderRadius: 8, backgroundColor: phantom ? COLOR.redWash : COLOR.navyPanel,
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: phantom ? COLOR.red : COLOR.mist }}>{lbl}</div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 54, color: COLOR.white, marginTop: 8 }}>{phantom ? "OPENED" : "FUNDED"}</div>
        </div>
      ))}

      {/* the travelling funds */}
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <line x1={realX + boxW} y1={boxY + boxH / 2} x2={phantomX} y2={boxY + boxH / 2} stroke={COLOR.mistDim} strokeWidth={3} strokeDasharray="10 12" opacity={intro * 0.6} />
        <circle cx={dotX} cy={boxY + boxH / 2} r={16} fill={COLOR.red} opacity={f > start ? 1 : 0} style={{ filter: `drop-shadow(0 0 12px ${COLOR.red})` }} />
      </svg>

      {/* the KPI that performs */}
      <div style={{ position: "absolute", top: 730, left: 0, right: 0, textAlign: "center", opacity: intro }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.label, color: COLOR.mistDim }}>INCENTIVE KPI · NEW FUNDED ACCOUNTS</div>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 130, lineHeight: 0.9, color: COLOR.yellow, marginTop: 6 }}>
          +{kpi.toLocaleString()}
        </div>
        <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 34, color: COLOR.mist, marginTop: 4 }}>
          The metric ticks up. Every single time.
        </div>
      </div>
      <SourceFooter publisher="CFPB" year="2016" docType="Consent Order 2016-CFPB-0015" delay={30} bottom={SPACE.lg} />
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   8 · REGULATOR PENALTY  — the navy seal register.
   ══════════════════════════════════════════════════════════════════════════ */
const SPenalty = ({ dur }) => {
  const f = useCurrentFrame();
  const num = useCountUp(100, 0, 12, 44, 0);
  return (
    <Ground dur={dur} bg={COLOR.navyDeep}>
      <Masthead code="THE FINDING · REGULATOR" delay={0} />
      <div style={{ position: "absolute", top: 250, left: SPACE.margin, opacity: A(f, 4, 18) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.label, color: COLOR.mist }}>
          CFPB CIVIL MONEY PENALTY · 8 SEPTEMBER 2016
        </div>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 320, lineHeight: 0.82, color: COLOR.white, marginTop: 6 }}>
          ${num}<span style={{ color: COLOR.red, fontSize: 130 }}>M</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 220, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 56, 74),
        fontFamily: FONT.serif, fontStyle: "italic", fontSize: 40, color: COLOR.paper, borderLeft: `4px solid ${COLOR.red}`, paddingLeft: 28, maxWidth: 1400 }}>
        "Respondent must pay a civil money penalty of $100 million to the Bureau."
      </div>
      <div style={{ position: "absolute", top: 300, right: SPACE.margin }}><Stamp text="CONSENT ORDER" delay={40} rotate={6} /></div>
      <div style={{ position: "absolute", bottom: 150, right: SPACE.margin }}><AttributionTag attribution="Regulator" delay={44} /></div>
      <SourceFooter publisher="CFPB" year="2016" docType="Consent Order 2016-CFPB-0015 · verbatim" delay={48} bottom={SPACE.lg} />
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   9 · SETTLEMENT  — the 15-year window, the court register.
   ══════════════════════════════════════════════════════════════════════════ */
const SSettlement = ({ dur }) => {
  const f = useCurrentFrame();
  const bar = A(f, 30, 70);
  return (
    <Ground dur={dur}>
      <Masthead code="THE RECKONING · COURT RECORD" delay={0} />
      <div style={{ position: "absolute", top: 150, left: SPACE.margin, opacity: A(f, 4, 20) }}>
        <div style={{ fontFamily: FONT.displayHeavy, fontSize: 210, lineHeight: 0.85, color: COLOR.white }}>$142<span style={{ color: COLOR.red, fontSize: 96 }}>M</span></div>
        <div style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.mist }}>class-action settlement · Jabbari v. Wells Fargo</div>
      </div>
      {/* 15-year window bar */}
      <div style={{ position: "absolute", top: 560, left: SPACE.margin, right: SPACE.margin }}>
        <div style={{ height: 12, backgroundColor: COLOR.navyPanel, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${bar * 100}%`, backgroundColor: COLOR.red }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontFamily: FONT.mono, fontSize: SIZE.source, color: COLOR.mist, letterSpacing: "0.06em", opacity: A(f, 60, 78) }}>
          <span>1 MAY 2002</span><span style={{ color: COLOR.red, fontWeight: 700 }}>FIFTEEN YEARS OF POTENTIAL MISCONDUCT</span><span>20 APRIL 2017</span>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 150, right: SPACE.margin }}><AttributionTag attribution="Court" delay={70} /></div>
      <SourceFooter publisher="U.S. District Court, N.D. Cal." year="2017" docType="Preliminary approval" delay={74} bottom={SPACE.lg} />
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   10 · GOVERNANCE PERIMETER  — the control fence, and the lever outside it.
   ══════════════════════════════════════════════════════════════════════════ */
const SPerimeter = ({ dur }) => {
  const f = useCurrentFrame();
  const fence = A(f, 10, 40);
  const chipsIn = A(f, 40, 66);
  const outside = A(f, 74, 96);
  const line = A(f, 110, 150);
  const CX = 700, CY = 560, CW = 900, CH = 520;      // control perimeter box
  const outBox = { x: 1230, y: 640, w: 520, h: 200 };
  return (
    <Ground dur={dur} bg={COLOR.navyDeep}>
      <Masthead code="THE ROOT CAUSE" delay={0} />
      <div style={{ position: "absolute", top: 120, left: SPACE.margin, opacity: A(f, 2, 16), fontFamily: FONT.serif, fontWeight: 700, fontSize: SIZE.h2, color: COLOR.white }}>
        Everything the risk function watched — and the one thing it didn't.
      </div>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {/* the perimeter */}
        <rect x={CX - CW / 2} y={CY - CH / 2} width={CW} height={CH} rx={16} fill="none"
          stroke={COLOR.mist} strokeWidth={3} strokeDasharray={2 * (CW + CH)} strokeDashoffset={(1 - fence) * 2 * (CW + CH)} />
        {/* red line from outside box → perimeter (the gap) */}
        <line x1={outBox.x} y1={outBox.y + outBox.h / 2} x2={CX + CW / 2} y2={CY + 120}
          stroke={COLOR.red} strokeWidth={6} strokeDasharray="600" strokeDashoffset={(1 - line) * 600} />
        {line > 0.98 && <polygon points={`${CX + CW / 2},${CY + 120} ${CX + CW / 2 + 26},${CY + 104} ${CX + CW / 2 + 26},${CY + 136}`} fill={COLOR.red} />}
      </svg>
      <div style={{ position: "absolute", left: CX - CW / 2, top: CY - CH / 2 - 42, width: CW, textAlign: "center", opacity: fence, fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.label, color: COLOR.mist }}>
        RISK GOVERNANCE PERIMETER
      </div>
      {/* inside chips */}
      <div style={{ position: "absolute", left: CX - CW / 2, top: CY - 40, width: CW, display: "flex", justifyContent: "space-around", opacity: chipsIn }}>
        {["AUDIT", "RISK COMMITTEE", "COMPLIANCE"].map((c) => (
          <div key={c} style={{ border: `1px solid ${COLOR.mist}`, borderRadius: 999, padding: "12px 26px", fontFamily: FONT.sans, fontWeight: 700, fontSize: SIZE.label, color: COLOR.mist, letterSpacing: "0.1em" }}>{c}</div>
        ))}
      </div>
      {/* outside box: compensation */}
      <div style={{
        position: "absolute", left: outBox.x, top: outBox.y, width: outBox.w, height: outBox.h,
        border: `3px solid ${COLOR.red}`, borderRadius: 8, backgroundColor: COLOR.redWash, opacity: outside,
        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 12, textAlign: "center"
      }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 42, color: COLOR.white }}>COMPENSATION · SALES KPIs</div>
        <div style={{ fontFamily: FONT.sans, fontSize: SIZE.label, color: COLOR.red, marginTop: 8 }}>set by the business line — never audited</div>
      </div>
      <SourceFooter publisher="GovernX analysis" year="" docType="grounded in CFPB findings" delay={120} bottom={SPACE.lg} />
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   11 · VERDICT  — the case-file cover, stamped closed.
   ══════════════════════════════════════════════════════════════════════════ */
const SVerdict = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Ground dur={dur} bg={COLOR.navyDeep}>
      <Masthead code="VERDICT" delay={0} />
      <div style={{ position: "absolute", top: 300, left: SPACE.margin, right: SPACE.margin }}>
        <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 150, lineHeight: 0.98, color: COLOR.mistDim, opacity: A(f, 8, 24) }}>Not rogue employees.</div>
        <div style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 150, lineHeight: 0.98, color: COLOR.white, opacity: A(f, 30, 48) }}>
          A rogue <span style={{ color: COLOR.red }}>metric</span>.
        </div>
        <div style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.mist, marginTop: 40, maxWidth: 1300, opacity: A(f, 56, 74), lineHeight: 1.4 }}>
          A governance architecture that placed its most powerful behavioral driver — compensation —
          beyond the reach of its own control framework.
        </div>
      </div>
      <div style={{ position: "absolute", top: 360, right: 180 }}><Stamp text="CASE CLOSED" delay={90} rotate={-10} /></div>
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   12 · CTA  — the question for the room.
   ══════════════════════════════════════════════════════════════════════════ */
const SCTA = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Ground dur={dur} bg={COLOR.navy}>
      <div style={{ position: "absolute", top: 380, left: SPACE.margin, right: SPACE.margin, textAlign: "center" }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.stamp, color: COLOR.red, opacity: A(f, 6, 22) }}>THE QUESTION FOR YOUR RISK COMMITTEE</div>
        <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontWeight: 700, fontSize: 72, color: COLOR.white, marginTop: 24, opacity: A(f, 18, 40), lineHeight: 1.2 }}>
          What happens when this metric is gamed —<br />and who in this room is asking?
        </div>
        <div style={{ marginTop: 60, opacity: A(f, 44, 62), fontFamily: FONT.serif, fontSize: 40, fontWeight: 700, color: COLOR.white }}>
          GOVERN<span style={{ color: COLOR.red }}>X</span>
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: COLOR.mistDim, marginTop: 10, opacity: A(f, 48, 66) }}>
          GOVERNANCE · RISK · COMPLIANCE
        </div>
      </div>
    </Ground>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MASTER  — sequence the movements
   ══════════════════════════════════════════════════════════════════════════ */
// Base per-scene durations (frames @30fps) sized for visual pacing.
const SCENES_BASE = [
  [STitle, 330], [SDotField, 840], [SConfession, 810], [SRevision, 540], [SFees, 480],
  [SPivot, 540], [SLoop, 900], [SPenalty, 480], [SSettlement, 540], [SPerimeter, 900],
  [SVerdict, 540], [SCTA, 330]
];
// Stretch to match the voiceover length (≈6:06 = 10975 frames). Each scene's
// reveal animations play in their first seconds, then hold longer under the
// narration — so stretching adds breathing room, not dead motion.
const VO_FRAMES = 10975;
const BASE_TOTAL = SCENES_BASE.reduce((n, s) => n + s[1], 0);
const SCALE = VO_FRAMES / BASE_TOTAL;
const SCENES = SCENES_BASE.map(([C, d]) => [C, Math.round(d * SCALE)]);
export const FILM_DURATION = SCENES.reduce((n, s) => n + s[1], 0);   // frames

export const GovernXFilm = () => (
  <AbsoluteFill style={{ backgroundColor: COLOR.navyDeep }}>
    <Series>
      {SCENES.map(([Comp, dur], i) => (
        <Series.Sequence key={i} durationInFrames={dur}>
          <Comp dur={dur} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
