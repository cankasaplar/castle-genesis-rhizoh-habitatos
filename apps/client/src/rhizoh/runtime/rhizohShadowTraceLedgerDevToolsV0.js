/**
 * Expose shadow trace ledger on window (sync — core boot, not async legal loop only).
 */
import { injectEpistemicStressV0 } from "./rhizohEpistemicStressInjectionV0.js";
import { refreshRhizohShadowDevToolsV0 } from "./rhizohShadowDevToolsRefreshV0.js";
import {
  exportShadowComplianceSnapshotV0,
  getShadowTraceLedgerSnapshotV0,
  injectShadowEntropyTestV0
} from "./rhizohShadowTraceLedgerV0.js";

export { refreshRhizohShadowDevToolsV0 } from "./rhizohShadowDevToolsRefreshV0.js";

export function ensureShadowTraceLedgerDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.exportShadowComplianceSnapshot = exportShadowComplianceSnapshotV0;
  window.__rhizoh.shadowTraceLedgerSnapshot = getShadowTraceLedgerSnapshotV0;
  window.__rhizoh.refreshShadowDevTools = refreshRhizohShadowDevToolsV0;
  window.__rhizoh.injectShadowEntropyTest = injectShadowEntropyTestV0;
  window.__rhizoh.injectEpistemicStress = injectEpistemicStressV0;
  return refreshRhizohShadowDevToolsV0();
}
