/**
 * Spatial Epistemic Runtime (SER) — spatial embodiment orchestrator (v0): deterministic **projection composer** only.
 *
 * **Not:** authority layer, truth producer, decision engine, subscription gate, external security ACL.
 * **Not importing:** `rhizohCapabilityManagerV0` / `rhizohRenderCapabilityV0` — composers must not depend on
 * policy/UI gates; the shell resolves `getRenderCapabilitySnapshotV0()` **outside** and branches there if needed.
 *
 * **Yes:** `worldPresenceState` → `projectionHints` (+ optional camera-local anchor field probe for bias / debug).
 *
 * Live heartbeat (weather stale, smoothing state, Cesium sink) stays in `liveRuntimeOrchestratorV0.js`;
 * this module is the narrow **spatial projection composition** contract for callers that want a single entry.
 *
 * @see liveRuntimeOrchestratorV0.js
 * @see sceneProjectionAdapterV0.js
 * @see docs/RHIZOH_SPATIAL_EMBODIMENT_FINAL_LOCK_V1.md
 */

import { deriveProjectionHintsV0 } from "../runtime/sceneProjectionAdapterV0.js";
import { resolveAnchorFieldDistortion01V0 } from "./spatialAnchorResolverV0.js";

export const SPATIAL_ORCHESTRATOR_SCHEMA_V0 = "spatialOrchestrator.v0";

/**
 * @param {{
 *   worldPresenceState: unknown,
 *   cameraLat?: number | null,
 *   cameraLon?: number | null
 * }} input
 */
export function composeSpatialProjectionFrameV0(input) {
  const state = input.worldPresenceState;
  const hints = deriveProjectionHintsV0(state);

  let anchorFieldDistortion01 = null;
  if (Number.isFinite(input.cameraLat) && Number.isFinite(input.cameraLon)) {
    anchorFieldDistortion01 = resolveAnchorFieldDistortion01V0(
      /** @type {number} */ (input.cameraLat),
      /** @type {number} */ (input.cameraLon)
    );
  }

  return Object.freeze({
    schema: SPATIAL_ORCHESTRATOR_SCHEMA_V0,
    hints,
    anchorFieldDistortion01
  });
}

/** SER v1.0 mühür adı — `composeSpatialProjectionFrameV0` ile özdeş; yalnızca isimlendirme sabitleri. */
export const composeSpatialProjectionV0 = composeSpatialProjectionFrameV0;
