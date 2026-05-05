/**
 * Prompt composer — RhizohMemoryContextPackV0 → LLM-ready strings (gateway agnostic).
 */
import type { RhizohMemoryContextPackV0 } from "../types/rskOntology";

export interface RhizohLlmPromptBundleV0 {
  system: string;
  user: string;
}

const SYSTEM_PREAMBLE = `You are Rhizoh — a causal agent in Castle Studio. You read structured world/presence context, reason, and output ONLY valid JSON for tool intents (no prose outside JSON).
Schema for each intent: { "toolId": string, "kernelAction"?: string, "payload": object, "confidence"?: number, "rationale"?: string }
Return: { "intents": [ ... ] }`;

function formatRecord(title: string, r: Record<string, string>, salience: number | undefined): string {
  const keys = Object.keys(r);
  if (!keys.length) return `${title}: (empty)`;
  const w = salience !== undefined ? ` [salience:${salience.toFixed(2)}]` : "";
  const lines = keys.slice(0, 24).map((k) => `  - ${k}: ${r[k]}`);
  const more = keys.length > 24 ? `  … +${keys.length - 24} more` : "";
  return `${title}${w}:\n${lines.join("\n")}${more ? `\n${more}` : ""}`;
}

function weight(pack: RhizohMemoryContextPackV0, key: keyof NonNullable<RhizohMemoryContextPackV0["salienceWeights"]>): number | undefined {
  return pack.salienceWeights?.[key];
}

/**
 * Compose system + user messages. Salience weights trim narrative emphasis when present.
 */
export function composeRhizohLlmPrompt(
  pack: RhizohMemoryContextPackV0,
  userGoal?: string
): RhizohLlmPromptBundleV0 {
  const sw = pack.salienceWeights;
  const userParts = [
    formatRecord("REGIONS", pack.regionDigestByRegionUid, weight(pack, "region")),
    formatRecord("ROOMS", pack.roomDigestByRoomUid, weight(pack, "room")),
    formatRecord("BROADCASTS", pack.broadcastDigestByBroadcastUid, weight(pack, "broadcast")),
    `SOCIAL_EDGES [salience:${(sw?.social ?? 0).toFixed(2)}]:\n  ${pack.socialEdgeDigests.slice(0, 20).join("\n  ") || "(none)"}`,
    `EPISODIC_CLIPS [salience:${(sw?.episodic ?? 0).toFixed(2)}]: ${pack.episodicClipIds.join(", ") || "(none)"}`,
    `LONG_TERM [salience:${(sw?.longTerm ?? 0).toFixed(2)}]: ${pack.longTermDistilled || "(none)"}`,
    `ECOLOGY_TIER [salience:${(sw?.ecology ?? 0).toFixed(2)}]: (see region eco in REGIONS)`,
    "",
    userGoal && userGoal.trim() ? `USER_GOAL: ${userGoal.trim()}` : "USER_GOAL: (maintain coherence; no destructive actions unless necessary)"
  ];

  return {
    system: SYSTEM_PREAMBLE,
    user: userParts.join("\n\n")
  };
}
