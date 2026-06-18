/**
 * Live DevTools refresh — update window.__rhizoh shadow/council/memory pointers after runtime events.
 */
import { getEpistemicMemoryGraphSnapshotV0, runEpistemicMemoryGraphLifecycleV0 } from "./rhizohEpistemicMemoryGraphV0.js";
import { getLastEpistemicGraphLifecyclePassV0 } from "./rhizohEpistemicGraphLifecycleV0.js";
import { assessEpistemicGraphInflationRiskV0 } from "./rhizohEpistemicGraphInflationGuardV0.js";
import { getLastCouncilAnomalyReasoningV0 } from "./rhizohEpistemicCouncilV0.js";
import { getShadowTraceLedgerSnapshotV0 } from "./rhizohShadowTraceLedgerV0.js";
import { getExecutionGovernanceSnapshotV0 } from "./rhizohExecutionGovernanceSwitchboardV0.js";
import { ensureHardSeparationDevToolsV0 } from "./rhizohHardSeparationLayerV0.js";

export function refreshRhizohShadowDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.shadowTraceLedger = getShadowTraceLedgerSnapshotV0();
  window.__rhizoh.epistemicMemoryGraph = getEpistemicMemoryGraphSnapshotV0();
  window.__rhizoh.graphInflationRisk = assessEpistemicGraphInflationRiskV0();
  window.__rhizoh.councilAnomalyReasoning = getLastCouncilAnomalyReasoningV0();
  window.__rhizoh.graphLifecycle = getLastEpistemicGraphLifecyclePassV0();
  window.__rhizoh.runGraphLifecyclePass = runEpistemicMemoryGraphLifecycleV0;
  window.__rhizoh.executionGovernance = getExecutionGovernanceSnapshotV0();
  ensureHardSeparationDevToolsV0();
  return window.__rhizoh.shadowTraceLedger;
}
