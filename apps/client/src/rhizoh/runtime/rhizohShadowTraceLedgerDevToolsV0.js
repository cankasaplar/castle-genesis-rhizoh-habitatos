/**
 * Expose shadow trace ledger on window (sync — core boot, not async legal loop only).
 */
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
  window.__rhizoh.shadowTraceLedger = getShadowTraceLedgerSnapshotV0();
  return getShadowTraceLedgerSnapshotV0();
}
