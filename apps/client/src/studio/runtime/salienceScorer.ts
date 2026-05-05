/**
 * Salience scorer — derives RhizohMemorySalienceWeightsV0 from kernel + pack heuristics.
 * Pure; no side effects.
 */
import { buildRhizohMemoryContextPack, type BuildRhizohMemoryContextPackOptions } from "./contextBuilder";
import type {
  RhizohAttentionFocusV0,
  RhizohMemoryContextPackV0,
  RhizohMemorySalienceWeightsV0,
  StudioKernelState
} from "../types/rskOntology.js";

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** Self-steering: last committed `attentionFocus` biases next pack weights. */
export function biasSalienceFromAttentionFocus(
  weights: RhizohMemorySalienceWeightsV0,
  focus: RhizohAttentionFocusV0 | undefined
): RhizohMemorySalienceWeightsV0 {
  if (!focus) return weights;
  const bump = 0.22;
  const w: RhizohMemorySalienceWeightsV0 = { ...weights };
  const add = (k: keyof RhizohMemorySalienceWeightsV0) => {
    const cur = w[k];
    w[k] = clamp01((typeof cur === "number" ? cur : 0.35) + bump);
  };
  switch (focus) {
    case "world":
      add("region");
      add("ecology");
      break;
    case "room":
      add("room");
      break;
    case "social":
      add("social");
      break;
    case "broadcast":
      add("broadcast");
      break;
    case "memory":
      add("longTerm");
      add("episodic");
      break;
    default:
      break;
  }
  return w;
}

/**
 * Heuristic salience: boost tiers that have signal in the current kernel + pack.
 */
export function scoreRhizohSalience(
  s: StudioKernelState,
  pack: RhizohMemoryContextPackV0
): RhizohMemorySalienceWeightsV0 {
  const roomN = Object.keys(pack.roomDigestByRoomUid).length;
  const regionN = Object.keys(pack.regionDigestByRegionUid).length;
  const bcN = Object.keys(pack.broadcastDigestByBroadcastUid).length;
  const socialN = pack.socialEdgeDigests.length;
  const episodicN = pack.episodicClipIds.length;
  const lt = pack.longTermDistilled.trim().length;

  const avatarN = Object.keys(s.presence?.avatars ?? {}).length;
  const activeRegion = s.worldLocomotion?.activeRegionUid;

  const episodic = clamp01(0.35 + episodicN * 0.06);
  const room = clamp01(0.25 + Math.min(roomN, 6) * 0.08);
  const region = clamp01(0.2 + (activeRegion ? 0.25 : 0) + Math.min(regionN, 8) * 0.04);
  const social = clamp01(0.3 + Math.min(socialN, 12) * 0.04 + Math.min(avatarN, 12) * 0.03);
  const broadcast = clamp01(0.25 + bcN * 0.12);
  const longTerm = clamp01(0.2 + (lt > 0 ? 0.35 : 0) + Math.min(lt / 200, 0.25));

  const ecoHealth = s.worldEcology?.healthByRegionUid ?? {};
  const ecoSpread = Object.values(ecoHealth).filter((v) => typeof v === "number").length;
  const ecology = clamp01(0.15 + Math.min(ecoSpread, 6) * 0.06);

  return {
    episodic,
    room,
    region,
    social,
    broadcast,
    longTerm,
    ecology
  };
}

/** Merge pack with scored salience (immutable). */
export function withSalience(
  pack: RhizohMemoryContextPackV0,
  weights: RhizohMemorySalienceWeightsV0
): RhizohMemoryContextPackV0 {
  return { ...pack, salienceWeights: weights };
}

/** One-shot: contextBuilder + salience on the same kernel snapshot. */
export function buildRhizohMemoryContextPackWithSalience(
  s: StudioKernelState,
  opts?: BuildRhizohMemoryContextPackOptions
): RhizohMemoryContextPackV0 {
  const base = buildRhizohMemoryContextPack(s, opts);
  let weights = scoreRhizohSalience(s, base);
  const focus = s.agentRuntime?.lastAttentionFocus;
  if (focus) weights = biasSalienceFromAttentionFocus(weights, focus);
  return withSalience(base, weights);
}
