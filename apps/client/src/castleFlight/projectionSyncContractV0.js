/**
 * Projection synchronization contract — layer 5: spatial-temporal coherence across surfaces.
 *
 * Complements (does not replace) perceptionAlignmentSnapshotV0 / CAMERA_UNIFICATION_SPEC_V1.
 *
 * Surfaces in sync scope:
 *   anchor (FOX/cube identity projection)
 *   camera (cube-centric / Cesium lens)
 *   social (SCR citizen replication)
 *
 * Cap wheel is intentionally OUT of projection sync — interpreter only (layer 1–4).
 *
 * CONTRACT:
 * - READ ONLY — never mutates anchor, camera, social, or gate state
 * - Ephemeral frame evaluation — no persistence, no feedback into execution
 * - FOX swap must bind anchor as read-only reflect; animation frames join this contract
 */

import {
  ALIGNMENT_DRIFT_RISK_V0,
  normalizeAlignmentTickMsV0,
  normalizeAlignmentTimeSyncV0
} from "./perceptionAlignmentSnapshotV0.js";

export const PROJECTION_SYNC_CONTRACT_SCHEMA_V0 = "castle.projection_sync_contract.v0";

/** Surfaces that participate in multi-view projection coherence. */
export const PROJECTION_SURFACE_V0 = Object.freeze({
  ANCHOR: "anchor",
  CAMERA: "camera",
  SOCIAL: "social"
});

/** @type {Readonly<{ never: readonly string[], always: readonly string[] }>} */
export const PROJECTION_SYNC_HARD_RULES_V0 = Object.freeze({
  never: Object.freeze([
    "anchor_to_wheel_feedback",
    "anchor_to_gate_decision",
    "camera_to_behavior_decision",
    "social_to_execution",
    "animation_to_voice_gate",
    "projection_to_cap_wheel_mutation"
  ]),
  always: Object.freeze([
    "anchor_read_only_reflect",
    "camera_pure_projection",
    "social_read_only_replicate",
    "cap_wheel_interpreter_only"
  ])
});

const FLICKER_MEDIUM_MS_V0 = 100;
const FLICKER_HIGH_MS_V0 = 250;

/**
 * Evaluate cross-surface frame spread — detects spatial-temporal "flicker meaning" risk.
 * @param {{
 *   tickMs?: number,
 *   atMs?: number,
 *   anchorFrameMs?: number,
 *   cameraFrameMs?: number,
 *   socialFrameMs?: number,
 *   speciesId?: string | null
 * }} input
 */
export function evaluateProjectionFrameCoherenceV0(input = {}) {
  const tickMs = normalizeAlignmentTickMsV0(input.tickMs ?? input.atMs ?? Date.now());
  const anchorFrameMs = Number(input.anchorFrameMs ?? tickMs) || tickMs;
  const cameraFrameMs = Number(input.cameraFrameMs ?? tickMs) || tickMs;
  const socialFrameMs = Number(input.socialFrameMs ?? tickMs) || tickMs;

  const timeSync = normalizeAlignmentTimeSyncV0({
    atMs: tickMs,
    perceptionCapturedAtMs: anchorFrameMs,
    spatialCapturedAtMs: cameraFrameMs,
    presentationCapturedAtMs: socialFrameMs
  });

  const spreads = [
    Math.abs(anchorFrameMs - cameraFrameMs),
    Math.abs(anchorFrameMs - socialFrameMs),
    Math.abs(cameraFrameMs - socialFrameMs)
  ];
  const maxSpreadMs = Math.max(...spreads, 0);

  let flickerRisk = ALIGNMENT_DRIFT_RISK_V0.LOW;
  if (maxSpreadMs >= FLICKER_HIGH_MS_V0) flickerRisk = ALIGNMENT_DRIFT_RISK_V0.HIGH;
  else if (maxSpreadMs >= FLICKER_MEDIUM_MS_V0) flickerRisk = ALIGNMENT_DRIFT_RISK_V0.MEDIUM;

  return Object.freeze({
    schema: PROJECTION_SYNC_CONTRACT_SCHEMA_V0,
    observabilityOnly: true,
    tickMs,
    speciesId: input.speciesId != null ? String(input.speciesId) : null,
    surfaces: Object.freeze({
      [PROJECTION_SURFACE_V0.ANCHOR]: anchorFrameMs,
      [PROJECTION_SURFACE_V0.CAMERA]: cameraFrameMs,
      [PROJECTION_SURFACE_V0.SOCIAL]: socialFrameMs
    }),
    maxSpreadMs,
    flickerRisk,
    coherent: flickerRisk === ALIGNMENT_DRIFT_RISK_V0.LOW,
    timeSync,
    hardRules: PROJECTION_SYNC_HARD_RULES_V0
  });
}

/**
 * @param {ReturnType<typeof evaluateProjectionFrameCoherenceV0>} snapshot
 */
export function projectionSyncDebugDetailV0(snapshot) {
  if (!snapshot) return null;
  return Object.freeze({
    tickMs: snapshot.tickMs,
    maxSpreadMs: snapshot.maxSpreadMs,
    flickerRisk: snapshot.flickerRisk,
    coherent: snapshot.coherent,
    speciesId: snapshot.speciesId
  });
}

/**
 * @param {() => ReturnType<typeof evaluateProjectionFrameCoherenceV0>} provider
 */
export function bindProjectionSyncDebugV0(provider) {
  if (typeof window === "undefined" || typeof provider !== "function") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.projectionSync = () => projectionSyncDebugDetailV0(provider());
}
