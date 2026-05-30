/**
 * RESEARCH-ONLY — narrative vs story continuity capability map (non-executable).
 * SSOT for “what narrative layer does today” vs planned story graph.
 */

export const RHIZOH_CANONICAL_INGRESS_ORIGIN_V0 = "https://rhizoh.com";

import { storyContinuityGuaranteeFromScoreV0 } from "./rhizohStorySnapshotEngineV0.js";

/**
 * @param {Record<string, unknown> | null} [storySnapshot]
 * @returns {Readonly<{
 *   schema: string,
 *   activeNow: readonly string[],
 *   notYet: readonly string[],
 *   stateContinuityGuarantee: boolean,
 *   storyContinuityGuarantee: boolean,
 *   storyContinuityScore: number | null,
 *   canonicalIngress: string,
 *   ingressNote: string
 * }>}
 */
export function describeRhizohNarrativeLayerCapabilityV0(storySnapshot = null) {
  const score =
    storySnapshot && typeof storySnapshot.storyContinuityScore === "number"
      ? storySnapshot.storyContinuityScore
      : null;
  const storyGuarantee =
    storySnapshot?.storyContinuityGuarantee === true ||
    (score != null && storyContinuityGuaranteeFromScoreV0(score));

  return Object.freeze({
    schema: "castle.rhizoh.narrative_layer_capability.v0",
    activeNow: Object.freeze([
      "turn_event_log",
      "phase_fsm",
      "bond_trust_gates",
      "continuity_ledger_write",
      "living_world_product_grounding_copy",
      "story_snapshot_engine_v0"
    ]),
    notYet: Object.freeze([
      "full_story_graph_reconstruction",
      "multi_entity_persistent_world_state"
    ]),
    stateContinuityGuarantee: true,
    storyContinuityGuarantee: storyGuarantee,
    storyContinuityScore: score,
    canonicalIngress: RHIZOH_CANONICAL_INGRESS_ORIGIN_V0,
    ingressNote:
      "Non-canonical entry points should redirect or alias only; separate boot + state per domain fragments narrative anchor."
  });
}

/**
 * Planned story continuity envelope (v0 skeleton — not wired to LLM prompt yet).
 * @param {Record<string, unknown>} [partial]
 */
export function buildRhizohStoryContinuitySnapshotV0(partial = {}) {
  return Object.freeze({
    schema: "castle.rhizoh.story_continuity_snapshot.v0",
    lastScene: partial.lastScene != null ? String(partial.lastScene).slice(0, 400) : null,
    activeEntities: Array.isArray(partial.activeEntities)
      ? partial.activeEntities.map((e) => String(e).slice(0, 64)).slice(0, 12)
      : [],
    unresolvedThreads: Array.isArray(partial.unresolvedThreads)
      ? partial.unresolvedThreads.map((t) => String(t).slice(0, 120)).slice(0, 8)
      : [],
    phaseHint: partial.phaseHint != null ? String(partial.phaseHint).slice(0, 32) : null
  });
}
