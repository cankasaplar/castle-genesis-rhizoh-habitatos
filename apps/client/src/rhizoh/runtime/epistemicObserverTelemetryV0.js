/**
 * Phase 9.4.4a — Read-only observer telemetry (Epistemic Traceability Field).
 *
 * Records user/observer actions on the event bus only.
 * Does NOT write witness semantics, navigation physics, or execution state.
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §15.4
 */

import { getEpistemicSimResearchSnapshotV0 } from "./epistemicSimResearchStoreV0.js";
import { publishObserverActionEnvelopeV0 } from "./epistemicEventBusV0.js";
import {
  OBSERVER_ACTION_KIND_V0,
  OBSERVER_TELEMETRY_SCHEMA_V0
} from "./epistemicObserverTelemetryContractV0.js";

/**
 * @typedef {Object} ObserverActionTelemetryInputV0
 * @property {string} action
 * @property {string} [source]
 * @property {string|null} [targetNodeId]
 * @property {Record<string, unknown>} [meta]
 */

/**
 * @param {ObserverActionTelemetryInputV0} input
 * @returns {import('./epistemicEventBusV0.js').EpistemicEventEnvelopeV0|null}
 */
export function recordObserverActionTelemetryV0(input) {
  const action = String(input?.action || "");
  if (!action) return null;

  const snap = getEpistemicSimResearchSnapshotV0();
  const targetNodeId = input.targetNodeId ?? snap?.focusNodeId ?? null;

  return publishObserverActionEnvelopeV0({
    action,
    source: String(input.source || "observer_ui"),
    targetNodeId,
    meta: input.meta && typeof input.meta === "object" ? input.meta : {},
    atFrame: snap?.frame ?? 0,
    focusNodeId: snap?.focusNodeId ?? null,
    stabilizationMode: snap?.stabilizationMode ?? null
  });
}

/**
 * Convenience wrappers — all read-only telemetry.
 */
export function recordManifoldNavObserverTelemetryV0(nodeId, source = "epistemic_debug_overlay") {
  return recordObserverActionTelemetryV0({
    action: OBSERVER_ACTION_KIND_V0.MANIFOLD_NAV,
    source,
    targetNodeId: nodeId,
    meta: { schema: OBSERVER_TELEMETRY_SCHEMA_V0, witnessWrite: false, feedbackLoop: false }
  });
}

/**
 * @param {string} key
 * @param {string} [source]
 */
export function recordCameraKeyObserverTelemetryV0(key, source = "cesium_keyboard_nav") {
  return recordObserverActionTelemetryV0({
    action: OBSERVER_ACTION_KIND_V0.CAMERA_KEY,
    source,
    meta: {
      schema: OBSERVER_TELEMETRY_SCHEMA_V0,
      key: String(key || ""),
      witnessWrite: false,
      feedbackLoop: false
    }
  });
}

/**
 * @param {Record<string, unknown>} poiMeta
 */
export function recordPoiSelectObserverTelemetryV0(poiMeta, source = "cesium_poi_select") {
  return recordObserverActionTelemetryV0({
    action: OBSERVER_ACTION_KIND_V0.POI_SELECT,
    source,
    meta: {
      schema: OBSERVER_TELEMETRY_SCHEMA_V0,
      poi: poiMeta,
      witnessWrite: false,
      feedbackLoop: false
    }
  });
}
