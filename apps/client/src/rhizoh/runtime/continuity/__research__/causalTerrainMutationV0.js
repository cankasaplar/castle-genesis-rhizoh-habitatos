/**
 * RESEARCH-ONLY: Phase 9.4.2 — Causal Terrain Mutation / Epistemic Navigation Physics
 *
 * Observation plane → world traversal constraints (not execution permission).
 * stress → movement cost · disagreement → path distortion · coherence → navigational gravity
 *
 * @see apps/client/docs/TEMPORAL_IDENTITY_CONTINUITY_V0.md §15.2
 */

export const CAUSAL_TERRAIN_MUTATION_SCHEMA_V0 =
  "castle.rhizoh.causal_terrain_mutation.research.v0.4.2";

import { EPISTEMIC_PHYSICS_EVENT_KIND_V0 } from "../../epistemicPhysicsEventContractV0.js";

export { EPISTEMIC_PHYSICS_EVENT_KIND_V0 };

/**
 * @typedef {Object} EpistemicNavigationPhysicsV0
 * @property {number} movementCost
 * @property {number} pathDistortion
 * @property {number} navigationalGravity
 * @property {number} moveScale
 * @property {number} turnBias
 * @property {boolean} traversable
 * @property {string} constraintClass
 */

/**
 * @typedef {Object} EpistemicPhysicsEventV0
 * @property {string} kind
 * @property {string} nodeId
 * @property {number} severity
 * @property {number} atFrame
 * @property {string} statement
 */

/**
 * @param {{
 *   epistemicSplitBrainScore?: number,
 *   coherenceGradient?: number,
 *   stabilizationMode?: string | null,
 *   focusNodeId?: string | null,
 *   frame?: number,
 *   visitCount?: number
 * }} input
 */
export function deriveEpistemicNavigationPhysicsV0(input) {
  const stress = Math.min(1, Math.max(0, Number(input.epistemicSplitBrainScore) || 0));
  const coherence = Math.min(1, Math.max(0, Number(input.coherenceGradient) ?? 1));
  const visitCount = Number(input.visitCount) || 0;
  const disagreementFactor = Math.min(1, visitCount * 0.08 + stress * 0.35);

  const movementCost = 1 + stress * 2.8 + disagreementFactor * 0.6;
  const pathDistortion = Math.min(1, stress * 0.55 + disagreementFactor * 0.35);
  const navigationalGravity = coherence;
  const moveScale = Math.max(0.2, navigationalGravity * (1 - stress * 0.7));
  const turnBias = pathDistortion * 0.5;

  const traversable = stress < 0.88 && coherence > 0.15;
  const constraintClass = traversable ? "soft_epistemic_constraint" : "quarantine_terrain_band";

  return {
    schema: CAUSAL_TERRAIN_MUTATION_SCHEMA_V0,
    movementCost,
    pathDistortion,
    navigationalGravity,
    moveScale,
    turnBias,
    traversable,
    constraintClass,
    truthCollapsed: false,
    statement: "Traversal physics from epistemic field — observation plane only."
  };
}

/**
 * Physics events (not UI toast) — for future event bus wire.
 *
 * @param {EpistemicNavigationPhysicsV0} physics
 * @param {{
 *   focusNodeId?: string | null,
 *   frame?: number,
 *   stabilizationMode?: string | null
 * }} ctx
 */
export function emitEpistemicPhysicsEventsV0(physics, ctx = {}) {
  const events = [];
  const nodeId = ctx.focusNodeId || "node:unknown";
  const frame = Number(ctx.frame) || 0;

  if (physics.pathDistortion > 0.45) {
    events.push({
      kind: EPISTEMIC_PHYSICS_EVENT_KIND_V0.DRIFT_SPIKE,
      nodeId,
      severity: physics.pathDistortion,
      atFrame: frame,
      statement: `${nodeId} drift spike — path distortion elevated.`
    });
  }

  if (physics.navigationalGravity < 0.35) {
    events.push({
      kind: EPISTEMIC_PHYSICS_EVENT_KIND_V0.COHERENCE_COLLAPSE_ATTEMPT,
      nodeId,
      severity: 1 - physics.navigationalGravity,
      atFrame: frame,
      statement: "Coherence collapse attempt — navigational gravity weak."
    });
  }

  if (physics.movementCost > 3) {
    events.push({
      kind: EPISTEMIC_PHYSICS_EVENT_KIND_V0.TERRAIN_STRESS_PEAK,
      nodeId,
      severity: Math.min(1, physics.movementCost / 5),
      atFrame: frame,
      statement: "Terrain stress peak — movement cost surge."
    });
  }

  if (String(ctx.stabilizationMode || "").includes("parallel")) {
    events.push({
      kind: EPISTEMIC_PHYSICS_EVENT_KIND_V0.DISAGREEMENT_SURGE,
      nodeId,
      severity: physics.pathDistortion,
      atFrame: frame,
      statement: "Disagreement surge — plural manifold active."
    });
  }

  return events;
}

/**
 * @param {import('../../epistemicSimResearchStoreV0.js').EpistemicSimResearchSnapshotV0} snapshot
 * @param {{ visitCount?: number }} [opts]
 */
export function deriveCausalTerrainMutationV0(snapshot, opts = {}) {
  const physics = deriveEpistemicNavigationPhysicsV0({
    epistemicSplitBrainScore: snapshot.epistemicSplitBrainScore,
    coherenceGradient: snapshot.coherenceGradient,
    stabilizationMode: snapshot.stabilizationMode,
    focusNodeId: snapshot.focusNodeId,
    frame: snapshot.frame,
    visitCount: opts.visitCount
  });

  const events = emitEpistemicPhysicsEventsV0(physics, {
    focusNodeId: snapshot.focusNodeId,
    frame: snapshot.frame,
    stabilizationMode: snapshot.stabilizationMode
  });

  return {
    schema: CAUSAL_TERRAIN_MUTATION_SCHEMA_V0,
    physics,
    events,
    terrainConstraintActive: physics.traversable === false,
    truthCollapsed: false
  };
}
