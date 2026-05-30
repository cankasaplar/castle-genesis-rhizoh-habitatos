/**
 * CORE-ELIGIBLE — episodic story snapshot per turn (hard-partial continuity).
 * Primary: who / where / last beat / open threads — not token length.
 */

import { buildRhizohStoryContinuitySnapshotV0 } from "./rhizohNarrativeLayerCapabilityV0.js";

/**
 * @param {Record<string, unknown> | null | undefined} snap
 * @returns {number}
 */
export function scoreStoryContinuityV0(snap) {
  if (!snap || typeof snap !== "object") return 0;
  let n = 0;
  if (snap.who) n += 0.2;
  if (snap.where) n += 0.15;
  if (snap.whatHappenedLast || snap.lastScene) n += 0.35;
  const open = Array.isArray(snap.unresolvedThreads) ? snap.unresolvedThreads.length : 0;
  if (open > 0) n += 0.15;
  if (open >= 2) n += 0.1;
  const entities = Array.isArray(snap.activeEntities) ? snap.activeEntities.length : 0;
  if (entities > 0) n += 0.05;
  return Math.round(Math.min(1, n) * 1000) / 1000;
}

/**
 * @param {number} score
 * @returns {boolean}
 */
export function storyContinuityGuaranteeFromScoreV0(score) {
  return Number(score) >= 0.75;
}

/**
 * @param {{
 *   userMessage?: string,
 *   priorSnapshot?: Record<string, unknown> | null,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   recentTurns?: Array<{ user?: string, assistant?: string }>,
 *   conversationPhase?: string,
 *   conversationMode?: string,
 *   persona?: { firstName?: string, displayName?: string },
 *   layerMission?: string,
 *   turnIndex?: number,
 *   traceId?: string
 * }} input
 */
export function buildStorySnapshotForTurnV0(input = {}) {
  const thread = input.narrativeThread && typeof input.narrativeThread === "object" ? input.narrativeThread : {};
  const arc = input.narrativeArc && typeof input.narrativeArc === "object" ? input.narrativeArc : {};
  const turns = Array.isArray(input.recentTurns) ? input.recentTurns : [];
  const last = turns.length ? turns[turns.length - 1] : null;
  const userMsg = String(input.userMessage || "").replace(/\s+/g, " ").trim();

  const who =
    input.persona?.displayName || input.persona?.firstName
      ? String(input.persona.displayName || input.persona.firstName).slice(0, 48)
      : "sovereign_node";

  const where = String(input.layerMission || arc.locale || "rhizoh_world_mesh").slice(0, 120);

  let whatHappenedLast = null;
  if (last && (last.user || last.assistant)) {
    const u = String(last.user || "").slice(0, 140);
    const a = String(last.assistant || "").slice(0, 180);
    whatHappenedLast = u || a ? `Önceki tur — kullanıcı: ${u || "—"} | Rhizoh: ${a || "—"}` : null;
  }
  if (!whatHappenedLast && thread.arcSummary) {
    whatHappenedLast = String(thread.arcSummary).slice(-360);
  }
  if (!whatHappenedLast && thread.lastUserSnippet) {
    whatHappenedLast = `Son kullanıcı: ${String(thread.lastUserSnippet).slice(0, 140)}`;
  }

  const unresolvedThreads = [];
  const priorOpen = Array.isArray(input.priorSnapshot?.unresolvedThreads)
    ? input.priorSnapshot.unresolvedThreads.map((t) => String(t).slice(0, 120))
    : [];
  for (const t of priorOpen.slice(0, 6)) {
    if (t && !unresolvedThreads.includes(t)) unresolvedThreads.push(t);
  }
  if (userMsg.includes("?")) {
    unresolvedThreads.push(`açık_soru:${userMsg.slice(0, 96)}`);
  }
  if (String(thread.focusIntent || "") === "CRISIS") {
    unresolvedThreads.push("crisis_intent_chain");
  }
  if (arc.direction && String(arc.direction).trim()) {
    unresolvedThreads.push(`arc:${String(arc.direction).slice(0, 80)}`);
  }
  const memoryEpisodes = Array.isArray(input.memoryEpisodes) ? input.memoryEpisodes : [];
  if (memoryEpisodes.length) {
    const ep = memoryEpisodes[memoryEpisodes.length - 1];
    if (ep && typeof ep === "object" && ep.summary) {
      unresolvedThreads.push(`episode:${String(ep.summary).slice(0, 80)}`);
    }
  }

  const activeEntities = ["Rhizoh", who].filter(Boolean);

  const base = buildRhizohStoryContinuitySnapshotV0({
    lastScene: whatHappenedLast,
    activeEntities,
    unresolvedThreads: unresolvedThreads.slice(0, 8),
    phaseHint: input.conversationPhase || null
  });

  const storyContinuityScore = scoreStoryContinuityV0({
    who,
    where,
    whatHappenedLast,
    unresolvedThreads,
    activeEntities
  });
  const storyContinuityGuarantee = storyContinuityGuaranteeFromScoreV0(storyContinuityScore);

  return Object.freeze({
    ...base,
    who,
    where,
    whatHappenedLast,
    conversationMode: input.conversationMode ? String(input.conversationMode).slice(0, 24) : null,
    turnIndex: Math.max(0, Math.floor(Number(input.turnIndex) || 0)),
    traceId: input.traceId ? String(input.traceId).slice(0, 128) : null,
    storyContinuityScore,
    storyContinuityGuarantee,
    /** @type {"soft_prompt_only"|"hard_partial"} */
    controlMode: storyContinuityGuarantee ? "hard_partial" : "soft_prompt_only",
    updatedAt: Date.now()
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} prior
 * @param {{ userMessage?: string, assistantMessage?: string, intent?: string }} turn
 */
export function advanceStorySnapshotAfterTurnV0(prior, turn = {}) {
  const user = String(turn.userMessage || "").replace(/\s+/g, " ").trim().slice(0, 200);
  const assistant = String(turn.assistantMessage || "").replace(/\s+/g, " ").trim().slice(0, 280);
  const whatHappenedLast =
    user || assistant
      ? `Son tur — kullanıcı: ${user || "—"} | Rhizoh: ${assistant || "—"}`
      : prior?.whatHappenedLast ?? null;

  const unresolved = Array.isArray(prior?.unresolvedThreads) ? [...prior.unresolvedThreads] : [];
  if (turn.intent === "CONCLUDE" || /\b(özet|sonuç|tamam)\b/ui.test(user)) {
    return buildStorySnapshotForTurnV0({
      priorSnapshot: null,
      userMessage: user,
      narrativeThread: { arcSummary: whatHappenedLast, lastUserSnippet: user.slice(0, 140) },
      conversationPhase: prior?.phaseHint,
      turnIndex: (Number(prior?.turnIndex) || 0) + 1
    });
  }

  const score = scoreStoryContinuityV0({
    who: prior?.who,
    where: prior?.where,
    whatHappenedLast,
    unresolvedThreads: unresolved,
    activeEntities: prior?.activeEntities
  });
  return Object.freeze({
    ...(prior && typeof prior === "object" ? prior : {}),
    whatHappenedLast,
    lastScene: whatHappenedLast,
    unresolvedThreads: unresolved.slice(0, 8),
    updatedAt: Date.now(),
    storyContinuityScore: score,
    storyContinuityGuarantee: storyContinuityGuaranteeFromScoreV0(score),
    controlMode: storyContinuityGuaranteeFromScoreV0(score) ? "hard_partial" : "soft_prompt_only"
  });
}

/**
 * @param {Record<string, unknown> | null | undefined} snap
 * @returns {string}
 */
export function formatStorySnapshotForLlmV0(snap) {
  if (!snap || typeof snap !== "object") return "";
  const lines = [
    "## Story continuity snapshot (authoritative for this turn — do not invent past events)",
    snap.who ? `who: ${snap.who}` : "",
    snap.where ? `where: ${snap.where}` : "",
    snap.whatHappenedLast || snap.lastScene ? `what_happened_last: ${snap.whatHappenedLast || snap.lastScene}` : "",
    Array.isArray(snap.unresolvedThreads) && snap.unresolvedThreads.length
      ? `unresolved_threads: ${snap.unresolvedThreads.join(" | ")}`
      : "unresolved_threads: (none recorded)",
    snap.storyContinuityGuarantee
      ? "story_continuity_guarantee: true — bind reply to snapshot; reference open threads when relevant."
      : "story_continuity_guarantee: false — stay general; do not fabricate specific past scenes."
  ].filter(Boolean);
  return lines.join("\n");
}
