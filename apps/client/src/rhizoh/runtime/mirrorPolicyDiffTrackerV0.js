/**
 * MirrorPolicyDiffTrackerV0 — Dual Reality Ledger + counterfactual memory.
 * Records canonical / mirror / counterfactual triad — not mere diff logging.
 * RESEARCH-ONLY — Geometry/Policy → Execution forbidden.
 */

import { emitCodexBusV0 } from "../../core/CodexBusV0.js";
import { commitDriftCubeObservationV0 } from "./rhizohGeometryDriftCubeV0.js";
import { readAlternativeStrategyNodesV0 } from "./geometricDriftFieldV0.js";
import { REGRET_CLASS_V0 } from "./regretVectorSystemV0.js";

export const POLICY_EVOLUTION_TICK_TYPE_V0 = "POLICY_EVOLUTION_TICK";
export const POLICY_EVOLUTION_TICK_SCHEMA_V0 = "rhizoh.policy_evolution_tick.v0.1";
export const DUAL_REALITY_LEDGER_SCHEMA_V0 = "rhizoh.dual_reality_ledger.v0";
export const POLICY_EVOLUTION_LOG_TAG_V0 = "[CASTLE_policy_evolution]";

const RING_MAX_V0 = 96;

/** @type {object[]} */
let tickRingV0 = [];

/** @type {object[]} */
let counterfactualRingV0 = [];

function ensureApiV0() {
  if (typeof window === "undefined") return;
  window.__rhizoh = window.__rhizoh || {};
  window.__rhizoh.policyEvolution = Object.freeze({
    list: () => Object.freeze([...tickRingV0]),
    alternatives: () => readAlternativeStrategyNodesV0(),
    counterfactuals: () => Object.freeze([...counterfactualRingV0]),
    clear: () => {
      tickRingV0 = [];
      counterfactualRingV0 = [];
      return Object.freeze([]);
    }
  });
}

/**
 * @param {{
 *   regretVector?: object|null,
 *   driftField?: object|null
 * }} opts
 */
export function buildCounterfactualMemoryV0(opts = {}) {
  const rv = opts.regretVector || {};
  const driftField = opts.driftField || {};
  const teacherCp = rv.teacherCp != null ? Number(rv.teacherCp) : null;
  const swingCp = rv.swingCp != null ? Number(rv.swingCp) : null;
  const mirrorCp = teacherCp != null && swingCp != null ? teacherCp + swingCp : null;

  let branchClass = "counterfactual_unknown";
  if (swingCp != null && swingCp < -20) branchClass = "mirror_underperforms";
  else if (swingCp != null && Math.abs(swingCp) <= 20) branchClass = "mirror_equivalent";
  else if (swingCp != null && swingCp > 0) branchClass = "mirror_latent_upside";

  const hypothesis =
    rv.regretClass === REGRET_CLASS_V0.SACRIFICE
      ? "Eval drop may be intentional sacrifice space, not blunder."
      : rv.regretClass === REGRET_CLASS_V0.TACTICAL
        ? "Hidden tactical branch — counterfactual line unresolved at V0 depth."
        : branchClass === "mirror_latent_upside"
          ? "Mirror line may outperform teacher projection."
          : "Teacher anchor line vs mirror branch divergence.";

  return Object.freeze({
    schema: "rhizoh.counterfactual_memory.v0",
    teacherMove: rv.bestMove || null,
    mirrorMove: rv.san || null,
    teacherLineCp: teacherCp,
    mirrorLineCp: mirrorCp,
    deltaCp: swingCp,
    branchClass,
    hypothesis,
    topologyTag: rv.topologyTag || null,
    canonicalPattern: driftField.canonicalPattern || rv.teacherPatternFamily || null,
    mirrorPattern: driftField.mirrorPattern || rv.mirrorPatternFamily || null
  });
}

/**
 * @param {{
 *   regretVector?: object|null,
 *   driftField?: object|null,
 *   counterfactual?: object|null
 * }} opts
 */
export function buildDualRealityLedgerV0(opts = {}) {
  const rv = opts.regretVector || {};
  const driftField = opts.driftField || {};
  const counterfactual = opts.counterfactual || buildCounterfactualMemoryV0(opts);

  return Object.freeze({
    schema: DUAL_REALITY_LEDGER_SCHEMA_V0,
    canonicalPolicy: Object.freeze({
      move: rv.bestMove || null,
      pattern: driftField.canonicalPattern || rv.teacherPatternFamily || null,
      evalCp: rv.teacherCp ?? null,
      role: "anchor"
    }),
    mirrorPolicy: Object.freeze({
      move: rv.san || null,
      pattern: driftField.mirrorPattern || rv.mirrorPatternFamily || null,
      evalCp: counterfactual.mirrorLineCp,
      role: "exploration"
    }),
    counterfactualOutcome: Object.freeze({ ...counterfactual })
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
  const counterfactual = buildCounterfactualMemoryV0({
    regretVector: tick.regretVector,
    driftField: tick.driftField
  });
  const dualRealityLedger = buildDualRealityLedgerV0({
    regretVector: tick.regretVector,
    driftField: tick.driftField,
    counterfactual
  });

  const payload = Object.freeze({
    schema: POLICY_EVOLUTION_TICK_SCHEMA_V0,
    layer: tick.layer ?? null,
    matchId: tick.matchId ?? null,
    canonicalTeacher: tick.canonicalTeacher || tick.driftField?.canonicalPattern || null,
    mirrorDivergence: tick.mirrorDivergence || tick.driftField?.mirrorPattern || null,
    driftVectorMagnitude: Math.max(0, Math.min(1, Number(tick.driftVectorMagnitude) || 0)),
    canonicalWeight: tick.canonicalWeight ?? tick.driftField?.canonicalWeight ?? 0.7,
    mirrorWeight: tick.mirrorWeight ?? tick.driftField?.mirrorWeight ?? 0.3,
    explorationBias: tick.driftField?.explorationBias ?? 0,
    status: tick.status || tick.driftField?.status || "TRAJECTORY_ALIGNED",
    topologyTag: tick.regretVector?.topologyTag || null,
    regretClass: tick.regretVector?.regretClass || null,
    directionalDriftVector: tick.regretVector?.directionalDriftVector || null,
    dualRealityLedger,
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
      familyMatch: payload.canonicalTeacher === payload.mirrorDivergence,
      topologyTag: payload.topologyTag
    }
  });

  tickRingV0 = [payload, ...tickRingV0].slice(0, RING_MAX_V0);
  counterfactualRingV0 = [dualRealityLedger, ...counterfactualRingV0].slice(0, RING_MAX_V0);
  ensureApiV0();

  if (typeof console !== "undefined" && console.info) {
    console.info(POLICY_EVOLUTION_LOG_TAG_V0, {
      layer: payload.layer,
      canonicalTeacher: payload.canonicalTeacher,
      mirrorDivergence: payload.mirrorDivergence,
      driftVectorMagnitude: payload.driftVectorMagnitude,
      topologyTag: payload.topologyTag,
      branchClass: dualRealityLedger.counterfactualOutcome.branchClass,
      status: payload.status
    });
  }

  return payload;
}

export function readPolicyEvolutionTicksV0() {
  return Object.freeze([...tickRingV0]);
}

export function readCounterfactualMemoryV0() {
  return Object.freeze([...counterfactualRingV0]);
}

export function resetPolicyEvolutionTicksForTestV0() {
  tickRingV0 = [];
  counterfactualRingV0 = [];
}
