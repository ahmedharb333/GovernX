/* ============================================================================
   registry.jsx — component NAME → React component, for in-composition assembly.
   adapt.js (general pipeline) and the V3 edit manifest both resolve to names here.
   ============================================================================ */

import {
  CaseBarChart, CaseLineGraph, CaseBeforeAfter, CaseKPIDashboard,
  CaseGauges, CaseRiskMatrix, CaseDataWall, CaseSplit
} from "./library";
import { StatementCard } from "./statements";
import { ScaleField, ScopeArrow, ControlPerimeter, CaseCheckpoint, CaseTimeline, BeatTimeline } from "./signature";
import { OpeningHook, VerdictCard, StatPoster } from "./hero";
import { DecisionChain, ControlGapMap, ClaimLedger } from "./governance";
import { BigNumberPoster } from "./BigNumberPoster";
import { EvidenceCard } from "./EvidenceCard";
import { GovernanceMethod } from "./GovernanceMethod";

export const BY_NAME = {
  // narrative / bookends
  StatementCard, OpeningHook, VerdictCard, StatPoster, CaseCheckpoint, CaseTimeline, BeatTimeline,
  // signature
  ScaleField, ScopeArrow, ControlPerimeter,
  // governance value
  DecisionChain, ControlGapMap, ClaimLedger,
  // data-viz
  CaseBarChart, CaseLineGraph, CaseBeforeAfter, CaseKPIDashboard,
  CaseGauges, CaseRiskMatrix, CaseDataWall, CaseSplit,
  // pilot utilities
  BigNumberPoster, EvidenceCard, GovernanceMethod
};

export function componentForName(name) {
  return BY_NAME[name] || null;
}
