/**
 * Spatial Truth Validator v0 — post-projection audit + pre-write gate.
 * Balances optimistic world projector (repair v1.1) against ghost spatial positives.
 * RESEARCH-ONLY — influencesExecution: false; observation registry only.
 */

import { listSpatialNodesV0 } from "./rhizohSpatialNodeLayerV0.js";
import {
  estimateWorldSpaceDivergenceV0,
  evaluateSpatialDriftQuarantineV0,
  SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0
} from "./worldSpaceReattachmentV0.js";
import { getGroundingLayerSnapshotV1 } from "./rhizohGroundingLayerV1.js";
import { bootstrapInternalSemanticMassV0 } from "./causalGraphSpatialBridgeV0.js";

export const SPATIAL_TRUTH_VALIDATOR_SCHEMA_V0 = "castle.rhizoh.spatial_truth_validator.v0";

export const SPATIAL_TRUTH_VERDICT_V0 = Object.freeze({
  STRICT_PASS: "strict_pass",
  OPTIMISTIC_PASS: "optimistic_pass",
  QUARANTINE: "quarantine",
  REJECT: "reject"
});

/** Minimum confidence to allow optimistic (pre-Cesium) world write. */
export const OPTIMISTIC_WRITE_CONFIDENCE_FLOOR_V0 = 0.45;

/** @type {Set<string>} */
const quarantinedSpatialNodeIdsV0 = new Set();

/**
 * @returns {boolean}
 */
export function isSpatialTruthStrictModeV0() {
  try {
    return String(import.meta.env?.VITE_SPATIAL_TRUTH_STRICT || "").trim() === "1";
  } catch {
    return false;
  }
}

/**
 * @returns {{ lat: number, lon: number, isDefault: boolean }}
 */
function readAnchorContextV0() {
  if (typeof window === "undefined") {
    return Object.freeze({ lat: 41.045, lon: 29.006, isDefault: true });
  }
  const geo = window.__CASTLE_NEXUS_GEO__;
  const lat = Number(geo?.lat);
  const lon = Number(geo?.lon);
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return Object.freeze({ lat, lon, isDefault: false });
  }
  return Object.freeze({ lat: 41.045, lon: 29.006, isDefault: true });
}

/**
 * @param {string} causalNodeId
 * @param {object} [causalMap]
 */
function causalNodeExistsV0(causalNodeId, causalMap) {
  const map = causalMap || (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const nodes = Array.isArray(map?.nodes) ? map.nodes : [];
  return nodes.some((n) => String(n.id) === String(causalNodeId));
}

/**
 * Score 0..1 — higher = safer to write to world_space.
 * @param {{
 *   causalNode?: object,
 *   causalNodeId?: string,
 *   spatialVector?: object | null,
 *   atMs?: number,
 *   force?: boolean,
 *   cesiumReady?: boolean,
 *   causalMap?: object
 * }} candidate
 */
export function scoreSpatialProjectionConfidenceV0(candidate = {}) {
  const issues = [];
  let score = 0.55;

  const causalId = String(candidate.causalNodeId || candidate.causalNode?.id || "");
  const map = candidate.causalMap;
  if (causalId && causalNodeExistsV0(causalId, map)) {
    score += 0.22;
  } else if (causalId) {
    issues.push("causal_node_not_in_map");
    score -= 0.35;
  } else {
    issues.push("missing_causal_backing");
    score -= 0.25;
  }

  const anchor = readAnchorContextV0();
  if (anchor.isDefault) {
    issues.push("default_world_anchor");
    score -= 0.18;
  } else {
    score += 0.12;
  }

  const vec = candidate.spatialVector;
  if (vec && Number.isFinite(vec.x) && Number.isFinite(vec.y) && Number.isFinite(vec.z)) {
    score += 0.08;
  } else {
    issues.push("invalid_spatial_vector");
    score -= 0.2;
  }

  const divergence = estimateWorldSpaceDivergenceV0();
  const quarantine = evaluateSpatialDriftQuarantineV0(divergence);
  if (quarantine.quarantine) {
    issues.push("divergence_quarantine");
    score -= 0.3;
  } else {
    score += 0.05;
  }

  const cesiumReady =
    candidate.cesiumReady ??
    (typeof window !== "undefined" &&
      (window.__CASTLE_CESIUM__?.ready === true || window.__CASTLE_CESIUM__?.commandReady === true));
  if (cesiumReady) {
    score += 0.15;
  } else if (candidate.force === true) {
    issues.push("optimistic_pre_cesium_write");
    score -= 0.08;
  }

  const grounding = getGroundingLayerSnapshotV1();
  const internal =
    Number(grounding.internalMass) ||
    bootstrapInternalSemanticMassV0({ causalMap: map, currentMass: 0 }).mass;
  if (internal < 0.15) {
    issues.push("low_internal_semantic_mass");
    score -= 0.12;
  } else {
    score += 0.06;
  }

  const atMs = Number(candidate.atMs ?? candidate.causalNode?.atMs ?? Date.now());
  if (atMs > Date.now() + 5000) {
    issues.push("temporal_future_snapshot");
    score -= 0.25;
  }

  return Object.freeze({
    confidence: Number(Math.max(0, Math.min(1, score)).toFixed(3)),
    issues: Object.freeze(issues),
    divergence,
    anchorIsDefault: anchor.isDefault,
    cesiumReady: cesiumReady === true
  });
}

/**
 * Pre-write gate for buffered WORLD-domain flush (no causal node required).
 * @param {{ force?: boolean, cesiumReady?: boolean, buffered?: number }} candidate
 */
export function validateSpatialFlushCandidateV0(candidate = {}) {
  const grounding = getGroundingLayerSnapshotV1();
  const divergence = estimateWorldSpaceDivergenceV0();
  const quarantine = evaluateSpatialDriftQuarantineV0(divergence);
  const cesiumReady = candidate.cesiumReady === true;
  const force = candidate.force === true;
  const buffered = Number(candidate.buffered) || 0;

  /** @type {string[]} */
  const issues = [];
  if (buffered <= 0) issues.push("empty_buffer");
  if (quarantine.quarantine) issues.push("divergence_quarantine");
  if (force && !cesiumReady && !grounding.worldAnchored) issues.push("force_without_world_anchor");

  let verdict = SPATIAL_TRUTH_VERDICT_V0.REJECT;
  let allowWrite = false;

  if (issues.includes("empty_buffer")) {
    return Object.freeze({
      schema: SPATIAL_TRUTH_VALIDATOR_SCHEMA_V0,
      atMs: Date.now(),
      influencesExecution: false,
      verdict: SPATIAL_TRUTH_VERDICT_V0.REJECT,
      allowWrite: false,
      issues: Object.freeze(issues),
      confidence: 0
    });
  }

  if (!issues.includes("divergence_quarantine")) {
    if (cesiumReady || (!force && grounding.worldAnchored)) {
      verdict = SPATIAL_TRUTH_VERDICT_V0.STRICT_PASS;
      allowWrite = true;
    } else if (force && grounding.worldAnchored) {
      verdict = SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS;
      allowWrite = !isSpatialTruthStrictModeV0();
      issues.push("optimistic_pre_cesium_flush");
    }
  } else {
    verdict = SPATIAL_TRUTH_VERDICT_V0.QUARANTINE;
  }

  return Object.freeze({
    schema: SPATIAL_TRUTH_VALIDATOR_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    verdict,
    allowWrite,
    strictMode: isSpatialTruthStrictModeV0(),
    confidence: allowWrite ? (verdict === SPATIAL_TRUTH_VERDICT_V0.STRICT_PASS ? 0.85 : 0.52) : 0,
    issues: Object.freeze(issues),
    divergence
  });
}

/**
 * @param {Parameters<typeof scoreSpatialProjectionConfidenceV0>[0]} candidate
 */
export function validateSpatialProjectionCandidateV0(candidate = {}) {
  const scored = scoreSpatialProjectionConfidenceV0(candidate);
  const strict = isSpatialTruthStrictModeV0();

  let verdict = SPATIAL_TRUTH_VERDICT_V0.REJECT;
  let allowWrite = false;

  const strictPass =
    scored.confidence >= 0.72 &&
    !scored.issues.includes("causal_node_not_in_map") &&
    !scored.issues.includes("missing_causal_backing") &&
    !scored.issues.includes("divergence_quarantine") &&
    !scored.issues.includes("temporal_future_snapshot");

  const optimisticPass =
    scored.confidence >= OPTIMISTIC_WRITE_CONFIDENCE_FLOOR_V0 &&
    !scored.issues.includes("divergence_quarantine") &&
    !scored.issues.includes("temporal_future_snapshot") &&
    !scored.issues.includes("causal_node_not_in_map") &&
    !scored.issues.includes("missing_causal_backing");

  if (strictPass) {
    verdict = SPATIAL_TRUTH_VERDICT_V0.STRICT_PASS;
    allowWrite = true;
  } else if (optimisticPass && !strict) {
    verdict = SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS;
    allowWrite = true;
  } else if (scored.issues.includes("divergence_quarantine")) {
    verdict = SPATIAL_TRUTH_VERDICT_V0.QUARANTINE;
    allowWrite = false;
  }

  return Object.freeze({
    schema: SPATIAL_TRUTH_VALIDATOR_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    verdict,
    allowWrite,
    strictMode: strict,
    ...scored
  });
}

/**
 * Post-write audit — detect ghost spatial nodes (no causal backing / default anchor only).
 * @param {object} [causalMap]
 */
export function auditSpatialRegistryTruthV0(causalMap) {
  const map = causalMap || (typeof window !== "undefined" ? window.__rhizoh?.causalMap : null);
  const nodes = listSpatialNodesV0();
  /** @type {object[]} */
  const ghosts = [];
  /** @type {object[]} */
  const validated = [];
  /** @type {object[]} */
  const optimistic = [];

  for (const row of nodes) {
    const payload = row.payload || {};
    const causalNodeId = String(payload.causalNodeId || "");
    const verdict = validateSpatialProjectionCandidateV0({
      causalNodeId,
      spatialVector: payload.spatial_vector,
      atMs: row.atMs,
      causalMap: map
    });

    const entry = Object.freeze({
      nodeId: row.id,
      tier: row.tier,
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      issues: verdict.issues
    });

    if (verdict.verdict === SPATIAL_TRUTH_VERDICT_V0.STRICT_PASS) {
      validated.push(entry);
    } else if (verdict.verdict === SPATIAL_TRUTH_VERDICT_V0.OPTIMISTIC_PASS) {
      optimistic.push(entry);
    } else {
      ghosts.push(entry);
      quarantinedSpatialNodeIdsV0.add(row.id);
    }
  }

  const report = Object.freeze({
    schema: SPATIAL_TRUTH_VALIDATOR_SCHEMA_V0,
    atMs: Date.now(),
    influencesExecution: false,
    spatialNodeCount: nodes.length,
    validatedCount: validated.length,
    optimisticCount: optimistic.length,
    ghostCount: ghosts.length,
    quarantineThreshold: SPATIAL_DRIFT_QUARANTINE_THRESHOLD_V0,
    strictMode: isSpatialTruthStrictModeV0(),
    pass: ghosts.length === 0,
    validated: Object.freeze(validated),
    optimistic: Object.freeze(optimistic),
    ghosts: Object.freeze(ghosts)
  });

  if (typeof window !== "undefined") {
    window.__rhizoh = window.__rhizoh || {};
    window.__rhizoh.spatialTruthValidator = report;
  }

  return report;
}

/**
 * @param {string} nodeId
 */
export function isSpatialNodeQuarantinedV0(nodeId) {
  return quarantinedSpatialNodeIdsV0.has(String(nodeId || ""));
}

/** @internal vitest */
export function __resetSpatialTruthValidatorForTestV0() {
  quarantinedSpatialNodeIdsV0.clear();
  if (typeof window !== "undefined") {
    delete window.__rhizoh?.spatialTruthValidator;
  }
}
