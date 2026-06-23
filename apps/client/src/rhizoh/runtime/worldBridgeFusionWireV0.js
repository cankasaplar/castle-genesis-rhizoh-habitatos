/**
 * World Bridge fusion wire v0 — auto-fuse after ingress ingest (interpretation-only).
 * RESEARCH-ONLY — projects lane state into epistemic update; no execution authority.
 */

import { fuseCrossSpaceEpistemicV0 } from "./crossSpaceCausalFusionV0.js";

/**
 * @param {{ fuse?: boolean, atMs?: number, suppressEvent?: boolean }} [opts]
 */
export function wireWorldBridgeFusionAfterIngestV0(opts = {}) {
  if (opts.fuse === false) return null;
  return fuseCrossSpaceEpistemicV0({
    atMs: Number(opts.atMs) || Date.now(),
    suppressEvent: opts.suppressEvent === true
  });
}
