/**
 * FOX_SIGNIFICANCE_ENGINE_V1 — importance ≠ attention.
 * Answers: "Bu ne kadar önemli (uzun vadede)?" — separate from salience/notice.
 *
 * Chain position: Awareness → Attention → Significance → Cognition → Behavior posture → Response
 * Significance never adds attention axes.
 */

export const FOX_SIGNIFICANCE_ENGINE_SCHEMA_V1 = "castle.rhizoh.fox_significance_engine.v1";
export const FOX_SIGNIFICANCE_FIELD_SCHEMA_V1 = "castle.rhizoh.fox_significance_field.v1";

export const FOX_BEHAVIOR_POSTURE_V1 = Object.freeze({
  OBSERVE: "observe",
  REACT: "react",
  INITIATE_CANDIDATE: "initiate_candidate"
});

/** @type {Readonly<Record<string, number>>} */
export const FOX_SIGNIFICANCE_WEIGHTS_V1 = Object.freeze({
  relationshipImpact: 0.28,
  goalImpact: 0.22,
  identityImpact: 0.22,
  longTermContinuityImpact: 0.28
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function round3(n) {
  return Math.round(clamp01(n) * 1000) / 1000;
}

/**
 * @param {Record<string, unknown>} [continuity]
 * @param {Record<string, number> | null} [emotions]
 */
function computeRelationshipImpactV1(continuity, emotions) {
  const cont = continuity && typeof continuity === "object" ? continuity : {};
  const rel = cont.relationship && typeof cont.relationship === "object" ? cont.relationship : {};
  const em = emotions && typeof emotions === "object" ? emotions : {};
  const trust = clamp01(rel.trust ?? em.trust);
  const familiarity = clamp01(rel.familiarity ?? em.familiarity);
  const bond = clamp01(rel.bondScore ?? (trust + familiarity) / 2);
  const care = clamp01(em.care);
  const repair = clamp01(em.repair);
  return round3(0.28 + bond * 0.42 + care * 0.2 + repair * 0.1);
}

/**
 * @param {Record<string, unknown>} [continuity]
 * @param {Record<string, unknown>} [router]
 * @param {string} [conversationPhase]
 */
function computeGoalImpactV1(continuity, router, conversationPhase) {
  const cont = continuity && typeof continuity === "object" ? continuity : {};
  const persona = cont.persona && typeof cont.persona === "object" ? cont.persona : {};
  const goals = Array.isArray(persona.goals) ? persona.goals : [];
  const intent = String(router?.intent || "");
  let impact = 0.12 + Math.min(0.35, goals.length * 0.08);
  if (intent === "BUILD") impact = Math.max(impact, 0.62);
  if (String(conversationPhase || "").includes("POWER")) impact = Math.max(impact, 0.55);
  return round3(impact);
}

/**
 * @param {Record<string, unknown> | null} [narrativeArc]
 * @param {Record<string, unknown>} [continuity]
 */
function computeIdentityImpactV1(narrativeArc, continuity) {
  const arc = narrativeArc && typeof narrativeArc === "object" ? narrativeArc : null;
  const cont = continuity && typeof continuity === "object" ? continuity : {};
  const narrative = String(cont.identityNarrative || cont.identity?.narrative || "");
  let impact = 0.14;
  if (narrative.length > 80) impact += 0.22;
  if (arc?.phase) impact += 0.18;
  if (arc?.trajectory) impact += 0.12;
  if (String(arc?.bondTrend || "") === "rising") impact += 0.08;
  return round3(impact);
}

/**
 * @param {Record<string, unknown> | null} [narrativeThread]
 * @param {Record<string, unknown> | null} [narrativeArc]
 * @param {unknown[]} [memoryEpisodes]
 * @param {number} [userTurnCount]
 */
function computeLongTermContinuityImpactV1(narrativeThread, narrativeArc, memoryEpisodes, userTurnCount) {
  const thread = narrativeThread && typeof narrativeThread === "object" ? narrativeThread : null;
  const arc = narrativeArc && typeof narrativeArc === "object" ? narrativeArc : null;
  const episodes = Array.isArray(memoryEpisodes) ? memoryEpisodes : [];
  const turns = Math.max(0, Math.floor(Number(userTurnCount) || 0));

  let impact = 0.1;
  const chain = Array.isArray(thread?.intentChain) ? thread.intentChain : [];
  if (chain.length >= 4) impact += 0.18;
  if (thread?.arcSummary) impact += 0.14;
  if (arc?.direction) impact += 0.16;
  if (episodes.length >= 6) impact += 0.14;
  if (turns >= 12) impact += 0.12;
  if (turns >= 24) impact += 0.1;

  return round3(impact);
}

/**
 * @param {{
 *   relationshipImpact: number,
 *   goalImpact: number,
 *   identityImpact: number,
 *   longTermContinuityImpact: number
 * }} impacts
 */
export function computeFoxSignificanceScoreV1(impacts) {
  const w = FOX_SIGNIFICANCE_WEIGHTS_V1;
  const raw =
    clamp01(impacts.relationshipImpact) * w.relationshipImpact +
    clamp01(impacts.goalImpact) * w.goalImpact +
    clamp01(impacts.identityImpact) * w.identityImpact +
    clamp01(impacts.longTermContinuityImpact) * w.longTermContinuityImpact;
  return round3(raw);
}

/**
 * @param {{
 *   message?: string,
 *   router?: Record<string, unknown> | null,
 *   emotions?: Record<string, number> | null,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   userTurnCount?: number,
 *   conversationPhase?: string,
 *   continuity?: Record<string, unknown> | null,
 *   atMs?: number
 * }} input
 */
export function resolveFoxSignificanceEngineV1(input = {}) {
  const impacts = Object.freeze({
    relationshipImpact: computeRelationshipImpactV1(input.continuity, input.emotions),
    goalImpact: computeGoalImpactV1(input.continuity, input.router, input.conversationPhase),
    identityImpact: computeIdentityImpactV1(input.narrativeArc, input.continuity),
    longTermContinuityImpact: computeLongTermContinuityImpactV1(
      input.narrativeThread,
      input.narrativeArc,
      input.memoryEpisodes,
      input.userTurnCount
    )
  });
  const significanceScore = computeFoxSignificanceScoreV1(impacts);
  const ranked = Object.entries(impacts).sort((a, b) => b[1] - a[1]);
  const dominantImpact = ranked[0]?.[0] || "relationshipImpact";

  const significanceField = Object.freeze({
    schema: FOX_SIGNIFICANCE_FIELD_SCHEMA_V1,
    role: "significance_only_no_execution",
    score: significanceScore,
    dominantImpact,
    relationshipImpact: impacts.relationshipImpact,
    goalImpact: impacts.goalImpact,
    identityImpact: impacts.identityImpact,
    longTermContinuityImpact: impacts.longTermContinuityImpact,
    generatedAt: Number(input.atMs) || Date.now()
  });

  return Object.freeze({
    schema: FOX_SIGNIFICANCE_ENGINE_SCHEMA_V1,
    significanceScore,
    significanceField,
    impacts
  });
}

/**
 * Reaction ≠ Behavior posture (diagnostic only; execution gate in foxBehaviorGateV1).
 * @param {{
 *   attentionField?: { score?: number, worldSignal?: number, userSignal?: number } | null,
 *   significanceField?: { score?: number } | null,
 *   userInitiated?: boolean,
 *   message?: string
 * }} input
 */
export function evaluateFoxBehaviorPostureV1(input = {}) {
  const attention = input.attentionField && typeof input.attentionField === "object" ? input.attentionField : {};
  const significance =
    input.significanceField && typeof input.significanceField === "object" ? input.significanceField : {};
  const userInitiated = input.userInitiated === true && String(input.message || "").trim().length > 0;

  const attScore = clamp01(attention.score);
  const sigScore = clamp01(significance.score);
  const worldSignal = clamp01(attention.worldSignal);

  if (userInitiated) {
    return Object.freeze({
      posture: FOX_BEHAVIOR_POSTURE_V1.REACT,
      reason: "user_initiated_turn",
      maySpeak: true,
      mayInitiate: false
    });
  }

  if (sigScore >= 0.72 && worldSignal >= 0.55 && attScore >= 0.45) {
    return Object.freeze({
      posture: FOX_BEHAVIOR_POSTURE_V1.INITIATE_CANDIDATE,
      reason: "high_significance_and_world_salience",
      maySpeak: false,
      mayInitiate: true
    });
  }

  if (worldSignal >= 0.35 && sigScore < 0.42) {
    return Object.freeze({
      posture: FOX_BEHAVIOR_POSTURE_V1.OBSERVE,
      reason: "noticed_low_significance_world_event",
      maySpeak: false,
      mayInitiate: false
    });
  }

  return Object.freeze({
    posture: FOX_BEHAVIOR_POSTURE_V1.OBSERVE,
    reason: "default_quiet_observation",
    maySpeak: false,
    mayInitiate: false
  });
}

/**
 * @param {ReturnType<typeof resolveFoxSignificanceEngineV1>} significance
 */
export function buildFoxSignificancePromptBlockV1(significance) {
  const f = significance?.significanceField;
  if (!f) return "";
  return [
    "## FOX significance (importance — not salience)",
    `significanceScore: ${f.score} · dominantImpact: ${f.dominantImpact}`,
    `impacts: relationship=${f.relationshipImpact} goal=${f.goalImpact} identity=${f.identityImpact} longTerm=${f.longTermContinuityImpact}`,
    "Use significance for long-horizon priority; attention field decides immediate focus."
  ].join("\n");
}
