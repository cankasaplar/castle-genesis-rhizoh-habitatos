/**
 * Expose shadow trace ledger on window (sync — core boot, not async legal loop only).
 */
import { injectEpistemicStressV0 } from "./rhizohEpistemicStressInjectionV0.js";
import { getEpistemicMemoryGraphSnapshotV0 } from "./rhizohEpistemicMemoryGraphV0.js";
import { assessEpistemicGraphInflationRiskV0 } from "./rhizohEpistemicGraphInflationGuardV0.js";
import { getLastCouncilAnomalyReasoningV0 } from "./rhizohEpistemicCouncilV0.js";
import {
  exportShadowComplianceSnapshotV0,
  getShadowTraceLedgerSnapshotV0,
  injectShadowEntropyTestV0
} from "./rhizohShadowTraceLedgerV0.js";

export function ensureShadowTraceLedgerDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.exportShadowComplianceSnapshot = exportShadowComplianceSnapshotV0;
  window.__rhizoh.shadowTraceLedgerSnapshot = getShadowTraceLedgerSnapshotV0;
  window.__rhizoh.injectShadowEntropyTest = injectShadowEntropyTestV0;
  window.__rhizoh.injectEpistemicStress = injectEpistemicStressV0;
  window.__rhizoh.epistemicMemoryGraph = getEpistemicMemoryGraphSnapshotV0();
  window.__rhizoh.graphInflationRisk = assessEpistemicGraphInflationRiskV0();
  window.__rhizoh.councilAnomalyReasoning = getLastCouncilAnomalyReasoningV0();
  window.__rhizoh.shadowTraceLedger = getShadowTraceLedgerSnapshotV0();
  return getShadowTraceLedgerSnapshotV0();
}
