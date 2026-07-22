/* ============================================================================
   library.jsx — Case-file component library (data-viz set)
   The InfographicScene / KPIDashboard / ProgressGauge / RiskMatrix types,
   rebuilt in the GovernX investigative-poster aesthetic. Data-driven — each
   accepts the same shapes the pipeline's REMOTION_DATA produces.

   Design rules (shared with the film):
     • navy authority ground · off-white document cards
     • RED = the one signal (the highlighted bar, the breached gauge, the peak)
     • source footer + attribution on every data scene
     • editorial motion: reveal / draw / count-up, no bounce

   ComponentShowcase (registered) renders one of each for review.
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, SourceFooter, AttributionTag, Stamp, Vignette, useCountUp, EvidenceFooter } from "./parts";

const EO = Easing.out(Easing.cubic);
const A = (f, a, b, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });

const Frame = ({ code, title, children, bg = COLOR.navy }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: bg, overflow: "hidden" }}>
      <Vignette />
      <Masthead code={code} delay={0} />
      {title && (
        <div style={{ position: "absolute", top: 128, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 4, 18),
          fontFamily: FONT.display, fontWeight: 800, fontSize: SIZE.title, color: COLOR.white, letterSpacing: TRACK.tight }}>
          {title}
        </div>
      )}
      {children}
    </AbsoluteFill>
  );
};

/* ── BAR CHART ─────────────────────────────────────────────────────────────── */
export const CaseBarChart = ({
  title = "",
  unit = "",
  bars = [],
  attribution = "", source = { publisher: "", year: "" }
}) => {
  const f = useCurrentFrame();
  const max = Math.max(...bars.map(b => b.value));
  // Unit → currency symbol before the number, magnitude/percent after it.
  // Handles $M, ¥B, €K, %, B+ … not just the old hardcoded "$M". Unknown units
  // trail with a space ("20 pts"). Empty unit → bare number.
  const um = String(unit || "").trim().match(/^([$€£¥])?\s*(%|[KkMmBbTt]\+?)?$/);
  const uPre = um ? (um[1] || "") : "";
  const uPost = um ? (um[2] || "") : (unit ? " " + String(unit).trim() : "");
  const baseY = 860, top = 300, chartH = baseY - top, x0 = 220, gap = 60;
  const bw = (1920 - x0 - SPACE.margin - gap * (bars.length - 1)) / bars.length;
  return (
    <Frame code="EVIDENCE · DATA" title={title}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={x0 - 30} y1={baseY} x2={1920 - SPACE.margin} y2={baseY} stroke={COLOR.mistDim} strokeWidth={2} />
        {bars.map((b, i) => {
          const h = (b.value / max) * chartH * A(f, 14 + i * 6, 40 + i * 6);
          const x = x0 + i * (bw + gap);
          return (
            <g key={i}>
              <rect x={x} y={baseY - h} width={bw} height={h} rx={4}
                fill={b.highlight ? COLOR.red : COLOR.mist} opacity={b.highlight ? 1 : 0.55} />
              <text x={x + bw / 2} y={baseY - h - 18} textAnchor="middle"
                fontFamily={FONT.displayHeavy} fontSize={46} fill={b.highlight ? COLOR.red : COLOR.white}
                opacity={A(f, 30 + i * 6, 48 + i * 6)}>{uPre}{b.value}{uPost}</text>
              <text x={x + bw / 2} y={baseY + 40} textAnchor="middle"
                fontFamily={FONT.sans} fontSize={22} fill={COLOR.mist} opacity={A(f, 20, 40)}>{b.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ position: "absolute", top: 150, right: SPACE.margin }}><AttributionTag attribution={attribution} delay={44} /></div>
      <SourceFooter publisher={source.publisher} year={source.year} docType="verified figures" delay={48} bottom={SPACE.lg} />
    </Frame>
  );
};

/* ── LINE GRAPH ────────────────────────────────────────────────────────────── */
export const CaseLineGraph = ({
  title = "",
  note = "",
  points = [],
  attribution = "", source = { publisher: "", year: "" }
}) => {
  const f = useCurrentFrame();
  const x0 = 220, x1 = 1780, y0 = 820, y1 = 300;
  const px = (i) => x0 + (x1 - x0) * (i / (points.length - 1));
  const py = (v) => y0 - (y1 - y0) * (-(v / 100));
  const draw = A(f, 16, 60);
  const path = points.map((p, i) => `${i ? "L" : "M"}${px(i)},${py(p.y)}`).join(" ");
  const totalLen = 2400;
  return (
    <Frame code="EVIDENCE · TREND" title={title}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        <line x1={x0} y1={y0} x2={x1} y2={y0} stroke={COLOR.mistDim} strokeWidth={2} />
        <path d={path} fill="none" stroke={COLOR.red} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={totalLen} strokeDashoffset={(1 - draw) * totalLen} />
        {points.map((p, i) => (
          <g key={i} opacity={A(f, 40 + i * 4, 54 + i * 4)}>
            <circle cx={px(i)} cy={py(p.y)} r={p.highlight ? 12 : 7} fill={p.highlight ? COLOR.red : COLOR.white}
              style={p.highlight ? { filter: `drop-shadow(0 0 10px ${COLOR.red})` } : undefined} />
            <text x={px(i)} y={y0 + 40} textAnchor="middle" fontFamily={FONT.mono} fontSize={22} fill={COLOR.mist}>{p.x}</text>
          </g>
        ))}
      </svg>
      {note && <div style={{ position: "absolute", top: 210, left: SPACE.margin, fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.06em", color: COLOR.mistDim, opacity: A(f, 10, 24) }}>{note}</div>}
      <SourceFooter publisher={source.publisher} year={source.year} docType="" delay={54} bottom={SPACE.lg} />
    </Frame>
  );
};

/* ── BEFORE / AFTER CARD ───────────────────────────────────────────────────── */
export const CaseBeforeAfter = ({
  beforeLabel = "",
  beforeRows = [],
  afterLabel = "",
  afterRows = [],
  verdict = "",
  source = { publisher: "", year: "" }, attribution = ""
}) => {
  const f = useCurrentFrame();
  const Panel = ({ x, label, rows, after, delay }) => (
    <div style={{
      position: "absolute", top: 280, left: x, width: 740, backgroundColor: after ? COLOR.paper : COLOR.navyPanel,
      border: `2px solid ${after ? COLOR.red : COLOR.mistDim}`, borderRadius: 8, padding: "30px 38px",
      opacity: A(f, delay, delay + 16), transform: `translateY(${A(f, delay, delay + 16, 26, 0)}px)`
    }}>
      <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: after ? COLOR.red : COLOR.mist, marginBottom: 18 }}>{label}</div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: i ? `1px solid ${after ? COLOR.paperEdge : COLOR.navy}` : "none" }}>
          <span style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: after ? COLOR.inkSoft : COLOR.mist }}>{r[0]}</span>
          <span style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: SIZE.body, color: after ? COLOR.ink : COLOR.white }}>{r[1]}</span>
        </div>
      ))}
    </div>
  );
  return (
    <Frame code="EVIDENCE · BEFORE / AFTER" title="">
      <Panel x={150} label={beforeLabel} rows={beforeRows} after={false} delay={12} />
      <Panel x={1030} label={afterLabel} rows={afterRows} after delay={30} />
      <div style={{ position: "absolute", bottom: 190, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 54, 72),
        fontFamily: FONT.serif, fontStyle: "italic", fontSize: 40, color: COLOR.white, borderLeft: `4px solid ${COLOR.red}`, paddingLeft: 26 }}>
        {verdict}
      </div>
      <SourceFooter publisher={source.publisher} year={source.year} docType="" delay={60} bottom={SPACE.lg} />
    </Frame>
  );
};

/* ── KPI DASHBOARD ─────────────────────────────────────────────────────────── */
/* Figures arrive as free text — "$2M" and "9.078 billion yen" land in the same
   slot. A fixed size makes the short ones look right and silently overflows the
   long ones (DataWall wrapped "9.078 billion yen" to three lines and it collided
   with the neighbouring rows). Scale to the slot instead. Shared so the panels
   that show a headline figure cannot drift apart. */
export function fitValueSize(value, max) {
  const n = String(value || "").length;
  const f = n <= 8 ? 1 : n <= 12 ? 0.74 : n <= 18 ? 0.56 : 0.44;
  return Math.round(max * f);
}

export const CaseKPIDashboard = ({
  title = "THE CASE IN NUMBERS",
  kpis = []
}) => {
  const f = useCurrentFrame();
  const cols = 2, cw = 780, ch = 250, gx = 60, gy = 50, x0 = 150, y0 = 300;
  return (
    <Frame code="EVIDENCE · SUMMARY" title={title}>
      {kpis.map((k, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const x = x0 + c * (cw + gx), y = y0 + r * (ch + gy);
        const d = 12 + i * 8;
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: cw, height: ch, backgroundColor: COLOR.navyPanel,
            border: `2px solid ${k.highlight ? COLOR.red : "#243350"}`, borderRadius: 8, padding: "26px 34px",
            opacity: A(f, d, d + 16), transform: `translateY(${A(f, d, d + 16, 24, 0)}px)`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: TRACK.label, color: COLOR.mist }}>{k.label}</span>
              {k.tag && <span style={{ fontFamily: FONT.sans, fontSize: 14, fontWeight: 800, letterSpacing: "0.1em", color: k.tag === "Company" ? COLOR.yellowInk : COLOR.primaryInk, backgroundColor: k.tag === "Company" ? COLOR.yellow : COLOR.primaryBg, padding: "4px 10px", borderRadius: 999 }}>{k.tag.toUpperCase()}</span>}
            </div>
            <div style={{ fontFamily: FONT.displayHeavy, fontSize: fitValueSize(k.value, 110), lineHeight: 1.02,
              color: k.highlight ? COLOR.red : COLOR.white, marginTop: 10,
              whiteSpace: "nowrap", overflow: "hidden" }}>{k.value}</div>
            <div style={{ fontFamily: FONT.sans, fontSize: SIZE.label, color: COLOR.mist, marginTop: 6 }}>{k.context}</div>
          </div>
        );
      })}
    </Frame>
  );
};

/* ── PROGRESS GAUGES ───────────────────────────────────────────────────────── */
export const CaseGauges = ({
  title = "CONTROL COVERAGE — BY DOMAIN",
  gauges = [
    { label: "Financial Reporting", value: 96 },
    { label: "Data & IT", value: 88 },
    { label: "Incentive Design", value: 4, highlight: true }
  ]
}) => {
  const f = useCurrentFrame();
  const R = 150, sw = 26, cx0 = 460, gap = 500, cy = 560;
  const arc = (v) => {
    const p = A(f, 16, 60) * (v / 100);
    const ang = Math.PI * (0.75 + 1.5 * p);
    return { p, endAng: ang };
  };
  return (
    <Frame code="EVIDENCE · COVERAGE" title={title}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {gauges.map((g, i) => {
          const cx = cx0 + i * gap;
          const start = 0.75 * Math.PI, full = 2.25 * Math.PI;
          const p = A(f, 16 + i * 6, 60 + i * 6) * (g.value / 100);
          const end = start + (full - start) * p;
          const col = g.highlight || g.value < 50 ? COLOR.red : g.value < 80 ? COLOR.yellow : COLOR.verified;
          const arcPath = (a0, a1) => {
            const large = a1 - a0 > Math.PI ? 1 : 0;
            return `M${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} A${R},${R} 0 ${large} 1 ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)}`;
          };
          return (
            <g key={i}>
              <path d={arcPath(start, full)} fill="none" stroke={COLOR.navyPanel} strokeWidth={sw} strokeLinecap="round" />
              <path d={arcPath(start, end)} fill="none" stroke={col} strokeWidth={sw} strokeLinecap="round" />
              <text x={cx} y={cy + 20} textAnchor="middle" fontFamily={FONT.displayHeavy} fontSize={90} fill={col}>{Math.round(A(f, 16 + i * 6, 60 + i * 6) * g.value)}%</text>
              <text x={cx} y={cy + 230} textAnchor="middle" fontFamily={FONT.sans} fontSize={26} fill={COLOR.mist} opacity={A(f, 30, 48)}>{g.label}</text>
            </g>
          );
        })}
      </svg>
      <SourceFooter publisher="GovernX analysis" year="" docType="illustrative coverage" delay={58} bottom={SPACE.lg} />
    </Frame>
  );
};

/* ── RISK MATRIX ───────────────────────────────────────────────────────────── */
export const CaseRiskMatrix = ({
  title = "WHERE THE CONTROL GAP LIVED",
  risks = [],
  source = { publisher: "", year: "" },
  footnote = ""
}) => {
  const f = useCurrentFrame();
  const cell = 200, gx0 = 980, gy0 = 300;   // grid moved right to open a legend column
  const cellColor = (c, r) => {
    const heat = (c + 1) + (r + 1);
    return heat >= 5 ? COLOR.redWash : heat >= 4 ? "rgba(242,194,48,0.10)" : "rgba(30,122,70,0.10)";
  };
  // Two risks can land in the same cell (both high/high). Fan same-cell dots out
  // on a small arc so they never stack, instead of drawing them on top of one
  // another. Labels no longer live in the grid at all — they are a numbered
  // legend on the left, which is how a real risk matrix is read.
  const cellKey = (k) => (k.likelihood || 0) + "," + (k.impact || 0);
  const groups = {};
  risks.forEach((k, i) => { (groups[cellKey(k)] = groups[cellKey(k)] || []).push(i); });
  const offsetFor = (k, i) => {
    const peers = groups[cellKey(k)];
    const idx = peers.indexOf(i), n = peers.length;
    if (n === 1) return { dx: 0, dy: 0 };
    const ang = -Math.PI / 2 + (idx - (n - 1) / 2) * 0.9;
    return { dx: Math.cos(ang) * 34, dy: Math.sin(ang) * 34 };
  };
  return (
    <Frame code="EVIDENCE · RISK" title={title}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {[0, 1, 2].map(r => [0, 1, 2].map(c => (
          <rect key={`${r}${c}`} x={gx0 + c * cell} y={gy0 + (2 - r) * cell} width={cell - 6} height={cell - 6} rx={6}
            fill={cellColor(c, r)} stroke="#243350" strokeWidth={1} opacity={A(f, 8, 30)} />
        )))}
        {risks.map((k, i) => {
          const o = offsetFor(k, i);
          const cx = gx0 + (k.likelihood - 1) * cell + cell / 2 - 3 + o.dx;
          const cy = gy0 + (3 - k.impact) * cell + cell / 2 - 3 + o.dy;
          const d = 30 + i * 10;
          return (
            <g key={i} opacity={A(f, d, d + 14)}>
              <circle cx={cx} cy={cy} r={k.highlight ? 26 : 20} fill={k.highlight ? COLOR.red : COLOR.mist}
                style={k.highlight ? { filter: `drop-shadow(0 0 12px ${COLOR.red})` } : undefined} />
              <text x={cx} y={cy + 8} textAnchor="middle" fontFamily={FONT.sans} fontWeight={800} fontSize={22}
                fill={k.highlight ? COLOR.white : COLOR.navyDeep}>{i + 1}</text>
            </g>
          );
        })}
        <text x={gx0 - 30} y={gy0 + 1.5 * cell} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={COLOR.mist} transform={`rotate(-90 ${gx0 - 30} ${gy0 + 1.5 * cell})`}>IMPACT →</text>
        <text x={gx0 + 1.5 * cell} y={gy0 + 3 * cell + 44} textAnchor="middle" fontFamily={FONT.mono} fontSize={20} fill={COLOR.mist}>LIKELIHOOD →</text>
      </svg>

      {/* numbered legend — the labels, out of the crowded grid */}
      <div style={{ position: "absolute", left: SPACE.margin, top: gy0, width: 640 }}>
        {risks.map((k, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26,
            opacity: A(f, 30 + i * 10, 44 + i * 10) }}>
            <div style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 999,
              backgroundColor: k.highlight ? COLOR.red : COLOR.mist,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT.sans, fontWeight: 800, fontSize: 22,
              color: k.highlight ? COLOR.white : COLOR.navyDeep }}>{i + 1}</div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 26, lineHeight: 1.2,
              color: k.highlight ? COLOR.white : COLOR.mist }}>{k.label}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 150, right: SPACE.margin }}><Stamp text="UNCONTROLLED" delay={50} rotate={-8} /></div>
      <SourceFooter publisher={source.publisher} year={source.year} docType={footnote} delay={54} bottom={SPACE.lg} />
    </Frame>
  );
};

/* ── CASE DATA WALL ─────────────────────────────────────────────────────────
   Replaces the generic KPI 2×2 grid. A stacked evidence ledger: each figure is
   a full-width row (huge condensed number + label + who-said-it tag), ruled like
   a case file, one row struck in red. Reads as evidence, not a dashboard. */
export const CaseDataWall = ({
  title = "THE CASE IN NUMBERS",
  rows = [],
  claimId = "", sourceLabel = "",
  verificationStatus = "", confidence = "", footnoteText = ""
}) => {
  const f = useCurrentFrame();
  const TAG = {
    "Regulator": { t: "REGULATOR", bg: COLOR.primaryBg, ink: COLOR.primaryInk },
    "Court": { t: "COURT", bg: COLOR.primaryBg, ink: COLOR.primaryInk },
    "Company self-reported": { t: "SELF-REPORTED", bg: COLOR.yellow, ink: COLOR.yellowInk },
    "Media": { t: "PRESS", bg: COLOR.paperShade, ink: COLOR.inkSoft }
  };
  // Attribution must never be guessed. This used to be `TAG[sourceType] || TAG.Media`,
  // so any unrecognised value — including the natural "Company" — was relabelled
  // PRESS, turning a company self-report into a press claim on screen. Match
  // loosely on intent; if it still can't be identified, render NO tag at all.
  const tagFor = (s) => {
    const t = String(s || "").trim().toLowerCase();
    if (!t) return null;
    if (TAG[String(s).trim()]) return TAG[String(s).trim()];
    if (/regulat|sec\b|cfpb|occ|fca/.test(t)) return TAG["Regulator"];
    if (/court|judg|settlement|litig/.test(t)) return TAG["Court"];
    if (/compan|self|internal|issuer|filing/.test(t)) return TAG["Company self-reported"];
    if (/media|press|news|report(er|ing)/.test(t)) return TAG["Media"];
    return null;
  };
  const valueSize = (v) => fitValueSize(v, 104);   // shared with the KPI panel
  const top = 300, rowH = 132;
  return (
    <Frame code="EVIDENCE · DATA WALL" title={title}>
      <div style={{ position: "absolute", top, left: SPACE.margin, right: SPACE.margin }}>
        {rows.map((r, i) => {
          const d = 14 + i * 8;
          const op = A(f, d, d + 16);
          const x = A(f, d, d + 16, -40, 0);
          const tag = tagFor(r.sourceType);
          return (
            <div key={i} style={{
              position: "relative", height: rowH, display: "flex", alignItems: "center",
              borderTop: `1px solid ${COLOR.navyPanel}`, opacity: op, transform: `translateX(${x}px)`,
              overflow: "hidden"   // a row can never bleed into its neighbours
            }}>
              {r.highlight && <div style={{ position: "absolute", left: -30, top: 18, bottom: 18, width: 6, backgroundColor: COLOR.red }} />}
              <div style={{
                fontFamily: FONT.displayHeavy, fontSize: valueSize(r.value), lineHeight: 1.02,
                width: 520, flexShrink: 0, color: r.highlight ? COLOR.red : COLOR.white
              }}>{r.value}</div>
              <div style={{ flex: 1, paddingLeft: 30 }}>
                <div style={{ fontFamily: FONT.sans, fontSize: SIZE.h2, color: r.highlight ? COLOR.white : COLOR.mist, letterSpacing: TRACK.tight }}>{r.label}</div>
              </div>
              {tag ? (
                <div style={{
                  fontFamily: FONT.sans, fontSize: 15, fontWeight: 800, letterSpacing: "0.1em",
                  color: tag.ink, backgroundColor: tag.bg, padding: "6px 14px", borderRadius: 999,
                  alignSelf: "center", flexShrink: 0
                }}>{tag.t}</div>
              ) : null}
            </div>
          );
        })}
        <div style={{ borderTop: `1px solid ${COLOR.navyPanel}` }} />
      </div>
      <EvidenceFooter claimId={claimId} sourceLabel={sourceLabel} footnoteText={footnoteText}
        verificationStatus={verificationStatus} confidence={confidence} delay={54} />
    </Frame>
  );
};

/* ── CASE SPLIT — two-column comparison in the case-file language ───────────── */
export const CaseSplit = ({
  title = "", leftLabel = "Before", leftRows = [["Metric", "value"]],
  rightLabel = "After", rightRows = [["Metric", "value"]], bottomNote = "",
  sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  const Panel = ({ x, label, rows, accent, delay }) => (
    <div style={{ position: "absolute", top: 300, left: x, width: 740,
      opacity: A(f, delay, delay + 16), transform: `translateY(${A(f, delay, delay + 16, 24, 0)}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22 }}>
        <div style={{ width: 8, height: 30, backgroundColor: accent ? COLOR.red : COLOR.mistDim }} />
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.label, letterSpacing: TRACK.label, color: accent ? COLOR.red : COLOR.mist, textTransform: "uppercase" }}>{label}</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "20px 0", borderTop: `1px solid ${COLOR.navyPanel}` }}>
          <span style={{ fontFamily: FONT.sans, fontSize: SIZE.body, color: COLOR.mist, maxWidth: 380 }}>{r[0]}</span>
          <span style={{ fontFamily: FONT.displayHeavy, fontSize: 52, color: accent ? COLOR.white : COLOR.mist, textAlign: "right" }}>{r[1]}</span>
        </div>
      ))}
    </div>
  );
  return (
    <Frame code="EVIDENCE · COMPARISON" title={title}>
      <Panel x={SPACE.margin} label={leftLabel} rows={leftRows} accent={false} delay={14} />
      <Panel x={1020} label={rightLabel} rows={rightRows} accent delay={30} />
      {bottomNote && <div style={{ position: "absolute", bottom: 190, left: SPACE.margin, right: SPACE.margin, opacity: A(f, 50, 68),
        fontFamily: FONT.serif, fontStyle: "italic", fontSize: 34, color: COLOR.white, borderLeft: `4px solid ${COLOR.red}`, paddingLeft: 22 }}>{bottomNote}</div>}
      <SourceFooter publisher={sourceLabel} docType={footnote} delay={58} bottom={SPACE.lg} />
    </Frame>
  );
};

/* ── SHOWCASE — one of each, sequenced ─────────────────────────────────────── */
import { Series } from "remotion";
const SHOW = [CaseBarChart, CaseLineGraph, CaseBeforeAfter, CaseKPIDashboard, CaseGauges, CaseRiskMatrix];
export const SHOWCASE_DURATION = SHOW.length * 150;

export const ComponentShowcase = () => (
  <AbsoluteFill style={{ backgroundColor: COLOR.navyDeep }}>
    <Series>
      {SHOW.map((Comp, i) => (
        <Series.Sequence key={i} durationInFrames={150}><Comp /></Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
