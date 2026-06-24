/**
 * Studio demo seed wire — DevTools + boot.
 * RESEARCH-ONLY
 */

import { runStudioObservationDemoSeedV0 } from "./rhizohStudioDemoSeedV0.js";

export function ensureRhizohStudioDemoSeedDevToolsV0() {
  if (typeof window === "undefined") return null;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.studioDemoSeed = (opts) => runStudioObservationDemoSeedV0(opts);
  return window.__rhizoh.studioDemoSeed;
}
