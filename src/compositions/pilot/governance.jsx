/* ============================================================================
   governance.jsx — the GovernX-value scenes: DecisionChain, ControlGapMap,
   ClaimLedger. These carry the analysis, not decoration.

   DecisionChain — how one management decision propagated into harm:
     Sales Targets → Employee Pressure → Unauthorized Accounts → Customer Harm
       → Regulatory Action → Governance Lesson.  Red failure path.
   ControlGapMap — the governance stack with the ONE missing control lit red.
   ClaimLedger — a fast evidence flash: claim · source · VERIFIED · Claim_ID.
   ============================================================================ */

import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLOR, FONT, SIZE, SPACE, TRACK } from "../../theme";
import { Masthead, Vignette, SourceFooter } from "./parts";

const EO = Easing.out(Easing.cubic);
const A = (f, a, b, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EO });

const Shell = ({ code, title, children }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.navy, overflow: "hidden" }}>
      <Vignette />
      <Masthead code={code} delay={0} />
      {title && <div style={{ position: "absolute", top: 128, left: SPACE.margin, right: SPACE.margin,
        fontFamily: FONT.serif, fontWeight: 700, fontSize: 54, color: COLOR.white, opacity: A(f, 4, 18) }}>{title}</div>}
      {children}
    </AbsoluteFill>
  );
};

/* ── DECISION CHAIN ─────────────────────────────────────────────────────────── */
export const DecisionChain = ({
  title = "THE DECISION CHAIN",
  nodes = [],
  outcome = "GOVERNANCE LESSON",
  sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  const all = [...nodes, { label: outcome, outcome: true }];
  const n = all.length;
  const gap = 40, x0 = SPACE.margin;
  const nw = (1920 - x0 * 2 - gap * (n - 1)) / n;
  const cy = 560;
  return (
    <Shell code="THE ARGUMENT" title={title}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
        {all.slice(0, -1).map((_, i) => {
          const x = x0 + (i + 1) * nw + i * gap + gap / 2;
          const p = A(f, 20 + i * 10, 34 + i * 10);
          return (
            <g key={i}>
              <line x1={x - gap / 2} y1={cy} x2={x - gap / 2 + p * gap} y2={cy} stroke={COLOR.red} strokeWidth={6} />
              {p > 0.9 && <polygon points={`${x + gap / 2},${cy} ${x + gap / 2 - 14},${cy - 9} ${x + gap / 2 - 14},${cy + 9}`} fill={COLOR.red} />}
            </g>
          );
        })}
      </svg>
      {all.map((nd, i) => {
        const x = x0 + i * (nw + gap);
        const d = 14 + i * 10;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: cy - 70, width: nw, height: 140,
            display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 14px",
            boxSizing: "border-box", borderRadius: 10,
            backgroundColor: nd.outcome ? COLOR.red : COLOR.navyPanel,
            border: `2px solid ${nd.outcome ? COLOR.red : "#2a3a5a"}`, borderLeft: nd.outcome ? undefined : `5px solid ${COLOR.red}`,
            opacity: A(f, d, d + 14), transform: `translateY(${A(f, d, d + 14, 20, 0)}px)` }}>
            <div>
              <div style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 24, letterSpacing: "0.04em", color: COLOR.white, lineHeight: 1.15 }}>{nd.label}</div>
              {nd.claimId && <div style={{ fontFamily: FONT.mono, fontSize: 13, color: COLOR.mist, marginTop: 8 }}>{nd.claimId}</div>}
            </div>
          </div>
        );
      })}
      <SourceFooter publisher={sourceLabel} docType={footnote} delay={70} bottom={SPACE.lg} />
    </Shell>
  );
};

/* ── CONTROL GAP MAP ────────────────────────────────────────────────────────── */
export const ControlGapMap = ({
  title = "WHERE THE CONTROL SHOULD HAVE BEEN",
  layers = [],
  outcome = "",
  sourceLabel = "", footnote = ""
}) => {
  const f = useCurrentFrame();
  const x = 520, w = 880, top = 280, rowH = 92, gapY = 16;
  return (
    <Shell code="THE CONTROL GAP" title={title}>
      {layers.map((l, i) => {
        const y = top + i * (rowH + gapY);
        const d = 14 + i * 8;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: rowH,
            display: "flex", alignItems: "center", padding: "0 28px", boxSizing: "border-box", borderRadius: 8,
            backgroundColor: l.ok ? COLOR.navyPanel : COLOR.redWash,
            border: `2px ${l.ok ? "solid" : "dashed"} ${l.ok ? "#2a3a5a" : COLOR.red}`,
            opacity: A(f, d, d + 14), transform: `translateX(${A(f, d, d + 14, -30, 0)}px)` }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, marginRight: 20, display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: l.ok ? "transparent" : COLOR.red, border: `2px solid ${l.ok ? COLOR.verified : COLOR.red}`,
              color: l.ok ? COLOR.verified : COLOR.white, fontSize: 18, fontWeight: 900, fontFamily: FONT.sans }}>{l.ok ? "✓" : "!"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: FONT.sans, fontWeight: 700, fontSize: 28, color: COLOR.white }}>{l.label}</div>
              {l.note && <div style={{ fontFamily: FONT.sans, fontSize: 18, color: COLOR.red, marginTop: 2 }}>{l.note}</div>}
            </div>
            {!l.ok && <div style={{ fontFamily: FONT.mono, fontSize: 15, fontWeight: 800, letterSpacing: "0.12em", color: COLOR.red }}>CONTROL GAP</div>}
          </div>
        );
      })}
      {/* the gap label on the left */}
      <div style={{ position: "absolute", left: SPACE.margin, top: 300, width: 320, opacity: A(f, 40, 56) }}>
        <div style={{ fontFamily: FONT.mono, fontSize: SIZE.micro, letterSpacing: "0.16em", color: COLOR.mistDim }}>GOVERNANCE STACK</div>
        <div style={{ fontFamily: FONT.serif, fontStyle: "italic", fontSize: 34, color: COLOR.mist, marginTop: 14, lineHeight: 1.3 }}>Every layer had a control — except the one that set the incentive.</div>
      </div>
      <div style={{ position: "absolute", left: x, top: top + layers.length * (rowH + gapY) + 20, width: w, opacity: A(f, 60, 76),
        fontFamily: FONT.sans, fontSize: 22, color: COLOR.mist }}>↓ {outcome}</div>
      <SourceFooter publisher={sourceLabel} docType={footnote} delay={66} bottom={SPACE.lg} />
    </Shell>
  );
};

/* ── CLAIM LEDGER (evidence flash) ──────────────────────────────────────────── */
export const ClaimLedger = ({
  title = "EVERY FIGURE, ON THE RECORD",
  rows = []
}) => {
  const f = useCurrentFrame();
  const top = 300, rowH = 118, x = SPACE.margin, w = 1920 - SPACE.margin * 2;
  return (
    <Shell code="THE EVIDENCE" title={title}>
      <div style={{ position: "absolute", left: x, top: top - 34, width: w, display: "flex", opacity: A(f, 6, 16),
        fontFamily: FONT.mono, fontSize: 15, letterSpacing: "0.14em", color: COLOR.mistDim }}>
        <div style={{ flex: 1 }}>CLAIM</div><div style={{ width: 420 }}>SOURCE</div><div style={{ width: 150 }}>STATUS</div><div style={{ width: 160 }}>CLAIM ID</div>
      </div>
      {rows.map((r, i) => {
        const y = top + i * rowH, d = 12 + i * 7;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: rowH - 18,
            display: "flex", alignItems: "center", borderTop: `1px solid ${COLOR.navyPanel}`,
            opacity: A(f, d, d + 10), transform: `translateX(${A(f, d, d + 10, -24, 0)}px)` }}>
            <div style={{ flex: 1, fontFamily: FONT.sans, fontWeight: 700, fontSize: 32, color: COLOR.white }}>{r.claim}</div>
            <div style={{ width: 420, fontFamily: FONT.mono, fontSize: 20, color: COLOR.mist, textTransform: "uppercase", letterSpacing: "0.04em" }}>{r.source}</div>
            <div style={{ width: 150, display: "flex", alignItems: "center", gap: 8, color: COLOR.verified }}>
              <span style={{ fontSize: 20, fontWeight: 900 }}>✓</span>
              <span style={{ fontFamily: FONT.sans, fontWeight: 800, fontSize: 16, letterSpacing: "0.1em" }}>VERIFIED</span>
            </div>
            <div style={{ width: 160, fontFamily: FONT.mono, fontSize: 18, color: COLOR.mist }}>{r.id}</div>
          </div>
        );
      })}
      <div style={{ borderTop: `1px solid ${COLOR.navyPanel}`, position: "absolute", left: x, top: top + rows.length * rowH, width: w }} />
    </Shell>
  );
};
