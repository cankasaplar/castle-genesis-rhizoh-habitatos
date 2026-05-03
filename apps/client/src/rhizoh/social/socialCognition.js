/**
 * Rhizoh Social Cognition Layer — tek API: advance + prompt formatı.
 */

import { perceiveSharedRoom } from "./socialPerception.js";
import { mergeBondGraphFromTurn } from "./bondGraph.js";
import { computeAttention, extractMentions } from "./attentionRouter.js";
import { inferVoiceRoute } from "./voiceRouting.js";
import { seedBondStubs } from "./bondGraph.js";

export function createInitialSocialField() {
  return {
    roomState: {
      energy: 0.52,
      tension: 0.14,
      cohesion: 0.72,
      noise: 0.34,
      focusTopic: ""
    },
    bondGraph: {},
    attention: {
      primarySpeaker: null,
      primaryId: null,
      listeners: [],
      interruptedBy: null,
      mode: "room_observe"
    },
    speakingQueue: [],
    presenceTargets: [],
    voiceHint: {
      type: "room_reply",
      addressee: null,
      rationale: "init"
    },
    updatedAt: Date.now()
  };
}

/**
 * @param {unknown} prev
 * @param {{
 *   message: string,
 *   assistantSnippet?: string,
 *   recentTurns: unknown[],
 *   operatorId: string,
 *   operatorLabel: string,
 *   trust: number,
 *   familiarity: number,
 *   intent?: string,
 *   castlePeers?: { id: string, label: string }[]
 * }} input
 */
export function advanceSocialField(prev, input) {
  const base = createInitialSocialField();
  const p = prev && typeof prev === "object" ? prev : {};
  const roomState = perceiveSharedRoom({
    recentTurns: input.recentTurns,
    currentMessage: input.message,
    intent: input.intent,
    assistantSnippet: input.assistantSnippet
  });
  let bondGraph = mergeBondGraphFromTurn(
    p.bondGraph && typeof p.bondGraph === "object" ? p.bondGraph : {},
    {
      operatorId: input.operatorId,
      operatorLabel: input.operatorLabel,
      trust: input.trust,
      familiarity: input.familiarity,
      assistantSnippet: input.assistantSnippet
    }
  );
  const peers = Array.isArray(input.castlePeers) ? input.castlePeers : [];
  if (peers.length) {
    bondGraph = seedBondStubs(
      bondGraph,
      peers.map((x) => ({ id: x.id, label: x.label }))
    );
  }
  const mentions = extractMentions(input.message);
  const attention = computeAttention({
    operatorId: input.operatorId,
    operatorLabel: input.operatorLabel,
    recentTurns: input.recentTurns,
    roomState,
    intent: input.intent || "CHAT",
    mentions
  });
  const voiceHint = inferVoiceRoute({
    attention,
    bondGraph,
    operatorId: input.operatorId,
    message: input.message
  });

  const speakingQueue = [];
  if (attention.primaryId) speakingQueue.push(attention.primaryId);

  const presenceTargets = [
    { id: attention.primaryId, label: attention.primarySpeaker, role: "primary" },
    ...attention.listeners.map((l) => ({ id: `mention:${l}`, label: l, role: "listener" }))
  ].filter((x) => x.id);

  return {
    roomState,
    bondGraph,
    attention,
    speakingQueue,
    presenceTargets,
    voiceHint,
    updatedAt: Date.now()
  };
}

/**
 * Gateway / continuity memory bloğu (İngilizce kısa talimat).
 * @param {ReturnType<typeof advanceSocialField>} sf
 */
export function formatSocialFieldForPrompt(sf) {
  if (!sf || typeof sf !== "object") return "";
  const rs = sf.roomState && typeof sf.roomState === "object" ? sf.roomState : {};
  const att = sf.attention && typeof sf.attention === "object" ? sf.attention : {};
  const vh = sf.voiceHint && typeof sf.voiceHint === "object" ? sf.voiceHint : {};
  const energy = Number(rs.energy) > 0.66 ? "high" : Number(rs.energy) < 0.4 ? "low" : "medium";
  const cohesion = Number(rs.cohesion) > 0.75 ? "high" : Number(rs.cohesion) < 0.45 ? "low" : "medium";
  const topic = String(rs.focusTopic || "").slice(0, 64);
  const listeners = Array.isArray(att.listeners) ? att.listeners.join(", ") : "";
  return [
    "Social cognition (sovereign companion — not a generic moderator):",
    `- Room: energy=${energy} tension=${(Number(rs.tension) || 0).toFixed(2)} cohesion=${cohesion} noise=${(Number(rs.noise) || 0).toFixed(2)} topic=${topic || "n/a"}`,
    `- Primary speaker: ${att.primarySpeaker ?? "n/a"} (mode=${att.mode ?? ""})`,
    listeners ? `- Other voices in play: ${listeners}` : "- Other voices: none detected",
    `- Voice route hint: ${vh.type ?? ""} (${vh.rationale ?? ""})${vh.addressee ? ` → @${vh.addressee}` : ""}`,
    "Respond socially: prefer the hinted route; use room-wide language only when route is room_reply; avoid identical tone toward every participant when bondGraph differs."
  ].join("\n");
}
