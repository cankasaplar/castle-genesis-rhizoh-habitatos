/**
 * World layer activation status — legal hold vs renderer pending vs active.
 * Explains why spatial audit may be pending (governance), not broken.
 * RESEARCH-ONLY
 */

import { isWorldLayerEnabled } from "./castleWorldLayerGateV0.js";
import { getWorldExecutionModeV0 } from "./worldExecutionGateV0.js";
import { getSpatialReadyGateSnapshotV0 } from "./rhizohSpatialReadyGateV0.js";
import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import { getSpatialWorldSyncSnapshotV0 } from "./spatialWorldSyncV0.js";

export const RHIZOH_WORLD_LAYER_ACTIVATION_SCHEMA_V0 = "rhizoh.world_layer_activation.v0";

export const WORLD_LAYER_PHASE_V0 = Object.freeze({
  OFF: "world_layer_off",
  LEGAL_HOLD: "legal_hold",
  RENDERER_PENDING: "renderer_pending",
  ACTIVE: "active"
});

function readEnvFlagV0(name) {
  try {
    const v = String(import.meta.env?.[name] ?? "").trim().toLowerCase();
    return v === "1" || v === "true" || v === "on";
  } catch {
    return false;
  }
}

/**
 * @returns {object}
 */
export function resolveWorldLayerActivationStatusV0() {
  const worldLayerEnabled = isWorldLayerEnabled();
  const executionMode = getWorldExecutionModeV0();
  const gate = getSpatialReadyGateSnapshotV0();
  const worldSync = getSpatialWorldSyncSnapshotV0();
  const cesiumTarget = readEnvFlagV0("VITE_CESIUM_WORLD_PROJECTION_BIND");
  const ontologicalGate = readEnvFlagV0("VITE_ONTOLOGICAL_BOOT_GATE");
  const closedAdmission = readEnvFlagV0("VITE_RHIZOH_CLOSED_ADMISSION");
  const nodeCount = listSpatialNodesV0().length;

  let phase = WORLD_LAYER_PHASE_V0.ACTIVE;
  let approved = true;
  let holdReason = null;

  if (!worldLayerEnabled || executionMode === "OFF") {
    phase = WORLD_LAYER_PHASE_V0.OFF;
    approved = false;
    holdReason = "world_layer_disabled";
  } else if (closedAdmission && !ontologicalGate) {
    phase = WORLD_LAYER_PHASE_V0.LEGAL_HOLD;
    approved = false;
    holdReason = "activation_ready_hold_pending";
  } else if (cesiumTarget && !gate.cesiumReady) {
    phase = WORLD_LAYER_PHASE_V0.RENDERER_PENDING;
    approved = false;
    holdReason = "cesium_renderer_not_mounted";
  }

  const target = cesiumTarget ? "cesium_activation" : "topology_only";

  const snap = Object.freeze({
    schema: RHIZOH_WORLD_LAYER_ACTIVATION_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    phase,
    target,
    approved,
    holdReason,
    worldLayerEnabled,
    executionMode,
    topologyExists: nodeCount > 0,
    spatialNodeCount: nodeCount,
    rendererReady: gate.cesiumReady === true,
    spatialGateOpen: gate.open === true,
    worldSync: Object.freeze({
      worldSyncActive: worldSync.worldSyncActive,
      adapterAlive: worldSync.adapterAlive,
      ready: worldSync.ready
    }),
    narrative:
      phase === WORLD_LAYER_PHASE_V0.LEGAL_HOLD
        ? "Spatial surface held — legal / READY-HOLD activation gate"
        : phase === WORLD_LAYER_PHASE_V0.RENDERER_PENDING
          ? "World topology ready — Cesium renderer plugin not mounted"
          : phase === WORLD_LAYER_PHASE_V0.OFF
            ? "World layer disabled in build profile"
            : "World layer active"
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.worldLayerStatus = snap;
  }

  return snap;
}

export function ensureWorldLayerActivationDevToolsV0() {
  if (typeof window === "undefined") return null;
  return resolveWorldLayerActivationStatusV0();
}
