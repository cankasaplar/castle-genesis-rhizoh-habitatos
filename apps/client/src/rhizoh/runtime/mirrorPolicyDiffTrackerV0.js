/**
 * MirrorPolicyDiffTrackerV0 — records 70/30 policy tension into observation bus + Drift Cube.
 * RESEARCH-ONLY — Geometry/Policy → Execution forbidden.
 */

import { emitCodexBusV0 } from "../../core/CodexBusV0.js";
import { commitDriftCubeObservationV0 } from "./rhizohGeometryDriftCubeV0.js";
import { readAlternativeStrategyNodesV0 } from "./geometricDriftFieldV0.js";

export const POLICY_EVOLUTION_TICK_TYPE_V0 = "POLICY_EVOLUTION_TICK";
export const POLICY_EVOLUTION_TICK_SCHEMA_V0 = "rhizoh.policy_evolution_tick.v0";
export const POLICY_EVOLUTION_LOG_TAG_V0 = "[CASTLE_policy_evolution]";

const RING_MAX_V0 = 96;

/** @type {object[]} */
let tickRingV0 = [];

function ensureApiV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.policyEvolution = Object.freeze({
    list: () => Object.freeze([...tickRingV0]),
    alternatives: () => readAlternativeStrategyNodesV0(),
    clear: () => {
      tickRingV0 = [];
      return Object.freeze([]);
    }
  });
}

/**
 * @param {{
 *   layer?: number|string,
 *   matchId?: string|null,
 *   canonicalTeacher?: string,
 *   mirrorDivergence?: string,
 *   driftVectorMagnitude?: number,
 *   canonicalWeight?: number,
 *   mirrorWeight?: number,
 *   status?: string,
 *   regretVector?: object|null,
 *   driftField?: object|null
 * }} tick
 */
export function emitPolicyEvolutionTickV0(tick = {}) {
  const payload = Object.freeze({
    schema: POLICY_EVOLUTION_TICK_SCHEMA_V0,
    layer: tick.layer ?? null,
    matchId: tick.matchId ?? null,
    canonicalTeacher: tick.canonicalTeacher || tick.driftField?.canonicalPattern || null,
    mirrorDivergence: tick.mirrorDivergence || tick.driftField?.mirrorPattern || null,
    driftVectorMagnitude: Math.max(0, Math.min(1, Number(tick.driftVectorMagnitude) || 0)),
    canonicalWeight: tick.canonicalWeight ?? tick.driftField?.canonicalWeight ?? 0.7,
    mirrorWeight: tick.mirrorWeight ?? tick.driftField?.mirrorWeight ?? 0.3,
    status: tick.status || tick.driftField?.status || "TRAJECTORY_ALIGNED",
    regretVector: tick.regretVector ? Object.freeze({ ...tick.regretVector }) : null,
    driftField: tick.driftField ? Object.freeze({ ...tick.driftField }) : null,
    observedAt: new Date().toISOString()
  });

  emitCodexBusV0(POLICY_EVOLUTION_TICK_TYPE_V0, payload, {
    source: "mirror_policy_diff_tracker_v0",
    observationOnly: true
  });

  commitDriftCubeObservationV0({
    sourceSpace: "chess_policy",
    matchId: payload.matchId,
    x: payload.canonicalTeacher,
    y: payload.layer,
    z: payload.driftVectorMagnitude,
    played: { patternFamily: payload.mirrorDivergence },
    expected: { patternFamily: payload.canonicalTeacher },
    drift: {
      magnitude: payload.driftVectorMagnitude,
      familyMatch: payload.canonicalTeacher === payload.mirrorDivergence
    }
  });

  tickRingV0 = [payload, ...tickRingV0].slice(0, RING_MAX_V0);
  ensureApiV0();

  if (typeof console !== "undefined" && console.info) {
    console.info(POLICY_EVOLUTION_LOG_TAG_V0, {
      layer: payload.layer,
      canonicalTeacher: payload.canonicalTeacher,
      mirrorDivergence: payload.mirrorDivergence,
      driftVectorMagnitude: payload.driftVectorMagnitude,
      status: payload.status
    });
  }

  return payload;
}

export function readPolicyEvolutionTicksV0() {
  return Object.freeze([...tickRingV0]);
}

export function resetPolicyEvolutionTicksForTestV0() {
  tickRingV0 = [];
}
