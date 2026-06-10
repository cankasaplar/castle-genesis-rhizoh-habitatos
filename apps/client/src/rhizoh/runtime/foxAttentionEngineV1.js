/**
 * FOX_ATTENTION_ENGINE_V1 — Fox core attention behavior motor.
 * Answers: "Neye dikkat edeceğim?" (scope only — never execution authority).
 *
 * Sprint 5 policy: axis count is FROZEN at 5. New feeds (calendar, social, …)
 * must map into user|continuity|emotional|novelty|world signals only.
 *
 * Chain: Awareness → Attention → Significance → Posture → Rhizoh dialogue thread → Response
 * Fox role (narrow): attention shaping · significance · posture · continuity pressure only.
 */

import { computeCastleAttentionFieldV1 } from "../../castlePerception/castleAttentionFieldV1.js";
import { computeAttentionFieldV1 } from "./rhizohExperienceFabricV1.js";
import { readCanonicalLiveSnapshotV1 } from "./rhizohCanonicalLiveSnapshotV1.js";
import {
  readCastleAwarenessFieldV1,
  worldSignalFromAwarenessV1
} from "./castleAwarenessFieldV1.js";
import { validateFoxAttentionFieldAxesV1 } from "./foxAxisPolicyV1.js";
import {
  RHIZOH_CONVERSATION_MODE_V0,
  RHIZOH_CONVERSATION_INTENT_V0
} from "./rhizohConversationDepthV0.js";

export const FOX_ATTENTION_ENGINE_SCHEMA_V1 = "castle.rhizoh.fox_attention_engine.v1";
export const FOX_ATTENTION_FIELD_SCHEMA_V1 = "castle.rhizoh.fox_attention_field.v1";

export const FOX_ATTENTION_DOMINANT_SOURCE_V1 = Object.freeze({
  USER: "USER",
  CONTINUITY: "CONTINUITY",
  EMOTIONAL: "EMOTIONAL",
  NOVELTY: "NOVELTY",
  WORLD: "WORLD"
});

/** @type {Readonly<Record<string, number>>} */
export const FOX_ATTENTION_SCORE_WEIGHTS_V1 = Object.freeze({
  userSignal: 0.3,
  continuitySignal: 0.25,
  emotionalSignal: 0.2,
  noveltySignal: 0.15,
  worldSignal: 0.1
});

/** @type {Readonly<Record<string, number>>} */
const MODE_RANK_V1 = Object.freeze({
  [RHIZOH_CONVERSATION_MODE_V0.GREET]: 1,
  [RHIZOH_CONVERSATION_MODE_V0.EXPLORE]: 2,
  [RHIZOH_CONVERSATION_MODE_V0.DEBATE]: 3,
  [RHIZOH_CONVERSATION_MODE_V0.NARRATIVE]: 4,
  [RHIZOH_CONVERSATION_MODE_V0.SYNTHESIS]: 5,
  [RHIZOH_CONVERSATION_MODE_V0.DISCOURSE]: 6
});

/** @type {Readonly<Record<string, string>>} */
const ATTENTION_TO_GENERATION_V1 = Object.freeze({
  low: "FAST_DIALOGUE",
  mid: "STANDARD",
  high: "REFLECTIVE",
  deep: "NARRATIVE"
});

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function clampDepth(n) {
  const x = Math.floor(Number(n));
  if (!Number.isFinite(x)) return 2;
  return Math.max(1, Math.min(5, x));
}

function round3(n) {
  return Math.round(clamp01(n) * 1000) / 1000;
}

function isTrivialFactoidV1(message) {
  const raw = String(message || "").trim();
  const t = raw
    .toLowerCase()
    .replace(/[?.!…]+$/u, "")
    .trim();
  if (raw.length >= 32) return false;
  if (/[,;]/.test(raw)) return false;
  return (
    /^saat\s*k(aç|c)/u.test(t) ||
    /^what\s*time/u.test(t) ||
    (/^hava\s*nas(ı|i)l/u.test(t) && raw.length < 22) ||
    /^kaç\s*derece/u.test(t) ||
    /^bugün\s*günlerden/u.test(t)
  );
}

/**
 * @param {string} a
 * @param {string} b
 */
function maxConversationModeV1(a, b) {
  const ka = String(a || RHIZOH_CONVERSATION_MODE_V0.EXPLORE);
  const kb = String(b || RHIZOH_CONVERSATION_MODE_V0.EXPLORE);
  return (MODE_RANK_V1[ka] ?? 2) >= (MODE_RANK_V1[kb] ?? 2) ? ka : kb;
}

/**
 * @param {Record<string, unknown>} [runtime]
 * @param {Record<string, unknown>} [continuity]
 */
function readWorldAttentionSignalsV1(runtime, continuity) {
  const runt = runtime && typeof runtime === "object" ? runtime : {};
  const cont = continuity && typeof continuity === "object" ? continuity : {};
  let castleField = null;
  let fabricField = null;
  let liveSnapshot = null;

  try {
    castleField = computeCastleAttentionFieldV1();
  } catch {
    castleField = null;
  }
  try {
    fabricField = computeAttentionFieldV1();
  } catch {
    fabricField = null;
  }
  try {
    liveSnapshot = readCanonicalLiveSnapshotV1();
  } catch {
    liveSnapshot = null;
  }

  return Object.freeze({
    mapSurfaceActive: runt.mapSurfaceActive === true,
    healthConnectivity: String(runt.healthState?.connectivity || ""),
    socialTension: Number(cont.runtime?.socialField?.roomState?.tension),
    castleGlobalMass: Number(castleField?.globalMass),
    castleIntentMass: Number(castleField?.intentMass),
    castleNarrativeMass: Number(castleField?.narrativeMass),
    castleIntentSpike: castleField?.isIntentSpike === true,
    castleDominantSource: String(castleField?.dominantSource || ""),
    fabricUserPriority: Number(fabricField?.userStreamPriority),
    fabricBackgroundMass: Number(fabricField?.backgroundMass),
    fabricDominantSource: String(fabricField?.dominantSource || ""),
    liveSnapshot,
    liveWeather: liveSnapshot?.weather != null,
    liveTraffic: liveSnapshot?.traffic != null,
    liveSports:
      Array.isArray(liveSnapshot?.sports?.liveMatches) &&
      liveSnapshot.sports.liveMatches.length > 0,
    liveNews:
      Array.isArray(liveSnapshot?.news?.headlines) && liveSnapshot.news.headlines.length > 0
  });
}

/**
 * @param {string} message
 * @param {Record<string, unknown>} router
 * @param {Record<string, unknown>} depth
 */
function computeUserSignalV1(message, router, depth) {
  if (isTrivialFactoidV1(message)) return 0.1;
  const t = String(message || "").toLowerCase();
  const intent = String(router.intent || "");
  const urgency = clamp01(router.urgency);
  const confidence = clamp01(router.confidence ?? 0.72);

  let signal = 0.18 + urgency * 0.22 + confidence * 0.1;
  if (intent === "CRISIS") signal = Math.max(signal, 0.88);
  else if (intent === "REFLECT") signal = Math.max(signal, 0.72);
  else if (intent === "BUILD") signal = Math.max(signal, 0.55);
  else if (intent === "PLAY") signal = Math.max(signal, 0.48);
  else if (intent === "CHAT" && message.length < 24) signal = Math.min(signal, 0.28);

  if (/(kötü hissed|yalnız|kaybolmuş|kaybolmus|umutsuz|yardım|help|acil)/u.test(t)) {
    signal = Math.max(signal, 0.8);
  }
  if (/(hayat|anlam|yön|sorguluyorum)/u.test(t) && t.length > 18) {
    signal = Math.max(signal, 0.68);
  }
  if (String(depth.conversationIntent || "") === RHIZOH_CONVERSATION_INTENT_V0.REFLECT) {
    signal = Math.max(signal, 0.62);
  }
  if (/^(selam|merhaba|hey|günaydın|naber)\b/u.test(t) && message.length < 32) {
    signal = Math.min(signal, 0.22);
  }
  return round3(signal);
}

/**
 * @param {Record<string, unknown>} depth
 * @param {Record<string, unknown> | null} thread
 * @param {Record<string, unknown> | null} arc
 * @param {Array<{ user?: string, ts?: number }>} recentTurns
 * @param {string} intent
 */
function computeContinuitySignalV1(depth, thread, arc, recentTurns, intent, continuityPressure) {
  let signal = 0.12 + clamp01(depth.continuityStrength) * 0.38;

  const chain = Array.isArray(thread?.intentChain) ? thread.intentChain.map(String) : [];
  const sameInChain = intent ? chain.filter((x) => x === intent).length : 0;
  if (sameInChain >= 3) signal = Math.max(signal, 0.75);
  else if (sameInChain >= 1) signal = Math.max(signal, 0.48);
  else if (chain.length >= 2) signal = Math.max(signal, 0.35);

  if (thread?.arcSummary) signal += 0.08;
  if (thread?.focusIntent && intent && String(thread.focusIntent) === intent) signal += 0.1;
  if (arc?.phase || arc?.trajectory) signal += 0.06;

  const turns = Array.isArray(recentTurns) ? recentTurns : [];
  if (turns.length >= 6) signal += 0.06;
  const recentWindowMs = 20 * 60 * 1000;
  const now = Date.now();
  const recentInWindow = turns.filter((row) => now - Number(row?.ts || 0) <= recentWindowMs);
  if (recentInWindow.length >= 3 && sameInChain >= 1) {
    signal = Math.max(signal, 0.72);
  }

  if (!chain.length && turns.length <= 1) signal = Math.min(signal, 0.18);

  const pressure = clamp01(continuityPressure);
  if (pressure > 0) signal = round3(Math.max(signal, pressure * 0.88));

  return round3(signal);
}

/**
 * @param {Record<string, number>} emotions
 * @param {Record<string, unknown>} router
 * @param {string} message
 */
function computeEmotionalSignalV1(emotions, router, message) {
  const t = String(message || "").toLowerCase();
  const care = clamp01(emotions.care ?? 0.3);
  const tension = clamp01(emotions.tension ?? 0);
  const rupture = clamp01(emotions.rupture ?? 0);
  const repair = clamp01(emotions.repair ?? 0);
  const trust = clamp01(emotions.trust ?? 0.4);
  const wonder = clamp01(emotions.wonder ?? 0.5);

  let signal = 0.1 + care * 0.28 + tension * 0.22 + rupture * 0.18 + wonder * 0.08 + trust * 0.06;
  signal -= repair * 0.06;

  const emotionalTag = String(router.emotionalSignal || "");
  if (emotionalTag === "CONTEMPLATIVE" || emotionalTag === "WARM") signal += 0.18;
  if (emotionalTag === "FRUSTRATED" || emotionalTag === "ALERT") signal += 0.14;
  if (emotionalTag === "FATIGUED_BUT_DETERMINED") signal += 0.16;

  if (/(yalnız|kötü hissed|üzgün|uzgun|hisset|özlüyorum|yoruldum|boşlukta|kaygı)/u.test(t)) {
    signal = Math.max(signal, 0.8);
  }
  if (/(teşekkür|sağol|harika|sevindim)/u.test(t)) {
    signal = Math.max(signal, 0.35);
  }
  if (tension < 0.08 && rupture < 0.06 && care < 0.25) {
    signal = Math.min(signal, 0.18);
  }

  return round3(signal);
}

/**
 * @param {string} intent
 * @param {Record<string, unknown> | null} thread
 * @param {unknown[]} memoryEpisodes
 * @param {string} message
 */
function computeNoveltySignalV1(intent, thread, memoryEpisodes, message) {
  const episodes = Array.isArray(memoryEpisodes) ? memoryEpisodes : [];
  const intentKey = String(intent || "CHAT");
  const sameIntentEpisodes = episodes.filter(
    (ep) => ep && typeof ep === "object" && String(ep.intent || "") === intentKey
  ).length;

  let signal = 0.9;
  if (sameIntentEpisodes > 0) {
    signal = Math.max(0.05, 0.9 - sameIntentEpisodes * 0.08);
  }
  if (sameIntentEpisodes >= 8) signal = 0.05;

  const chain = Array.isArray(thread?.intentChain) ? thread.intentChain : [];
  if (chain.length >= 4 && chain.slice(-3).every((x) => String(x) === intentKey)) {
    signal = Math.min(signal, 0.12);
  }

  const t = String(message || "").toLowerCase();
  if (/\b(yeni|ilk defa|ilk kez|hiç|never|discover)\b/u.test(t)) {
    signal = Math.max(signal, 0.82);
  }
  if (!chain.length && episodes.length === 0 && message.length > 32) {
    signal = Math.max(signal, 0.75);
  }

  return round3(signal);
}

/**
 * @param {string} message
 * @param {ReturnType<typeof readWorldAttentionSignalsV1>} world
 */
function computeWorldSignalV1(message, world) {
  const t = String(message || "").toLowerCase();
  if (/(deprem|earthquake|tsunami|sel|yangın|patlama|saldırı|attack|emergency alert)/u.test(t)) {
    return 1;
  }

  let weatherImpact = 0.15;
  let trafficImpact = 0.12;
  let newsImpact = 0.1;
  let sportsImpact = 0.1;

  const snap = world.liveSnapshot;
  const weather = snap?.weather;
  if (weather) {
    const desc = String(weather.description || weather.weatherMain || "").toLowerCase();
    if (/(storm|fırtına|thunder|snow|kar|extreme|heat)/u.test(desc)) weatherImpact = 0.55;
    else if (/(rain|yağmur|cloud|bulut)/u.test(desc)) weatherImpact = 0.28;
    else weatherImpact = 0.15;
  }

  const traffic = snap?.traffic;
  if (traffic) {
    const level = String(traffic.level || "").toLowerCase();
    const intensity = clamp01(traffic.intensity);
    if (level === "heavy" || level === "severe" || intensity > 0.72) trafficImpact = 0.62;
    else if (intensity > 0.45) trafficImpact = 0.38;
    if (Number(traffic.delayMinutes) >= 15) trafficImpact = Math.max(trafficImpact, 0.5);
  }

  const headlines = Array.isArray(snap?.news?.headlines) ? snap.news.headlines : [];
  for (const h of headlines.slice(0, 6)) {
    const title = String(h?.title || "").toLowerCase();
    if (/(deprem|war|savaş|kriz|crisis|breaking|acil)/u.test(title)) {
      newsImpact = 0.95;
      break;
    }
    if (/(seçim|economy|ekonomi|merkez bank)/u.test(title)) newsImpact = Math.max(newsImpact, 0.42);
  }

  if (world.liveSports) sportsImpact = 0.35;
  if (/(maç|spor|match|score|gol)/u.test(t) && world.liveSports) sportsImpact = 0.55;

  if (/(hava|weather|trafik|traffic|maç|spor|haber|news|yağmur)/u.test(t)) {
    weatherImpact = Math.max(weatherImpact, 0.32);
    trafficImpact = Math.max(trafficImpact, 0.28);
    newsImpact = Math.max(newsImpact, 0.25);
  }

  if (world.mapSurfaceActive) {
    weatherImpact += 0.06;
    trafficImpact += 0.05;
  }
  if (world.castleIntentSpike) newsImpact = Math.max(newsImpact, 0.45);
  const castleMassBoost = clamp01(world.castleIntentMass) * 0.2;
  let worldSignal = Math.max(weatherImpact, trafficImpact, newsImpact, sportsImpact, castleMassBoost);

  if (world.healthConnectivity === "DEGRADED" || world.healthConnectivity === "MAINTENANCE") {
    worldSignal = Math.max(worldSignal, 0.22);
  }
  if (Number.isFinite(world.socialTension) && world.socialTension > 0.55) {
    worldSignal = Math.max(worldSignal, 0.3);
  }

  return round3(worldSignal);
}

/**
 * @param {{
 *   userSignal: number,
 *   continuitySignal: number,
 *   emotionalSignal: number,
 *   noveltySignal: number,
 *   worldSignal: number
 * }} signals
 */
function resolveDominantSourceV1(signals) {
  const ranked = [
    [FOX_ATTENTION_DOMINANT_SOURCE_V1.USER, signals.userSignal],
    [FOX_ATTENTION_DOMINANT_SOURCE_V1.CONTINUITY, signals.continuitySignal],
    [FOX_ATTENTION_DOMINANT_SOURCE_V1.EMOTIONAL, signals.emotionalSignal],
    [FOX_ATTENTION_DOMINANT_SOURCE_V1.NOVELTY, signals.noveltySignal],
    [FOX_ATTENTION_DOMINANT_SOURCE_V1.WORLD, signals.worldSignal]
  ].sort((a, b) => b[1] - a[1]);
  return ranked[0]?.[0] || FOX_ATTENTION_DOMINANT_SOURCE_V1.USER;
}

/**
 * @param {{
 *   message?: string,
 *   router?: Record<string, unknown> | null,
 *   depth?: Record<string, unknown>,
 *   emotions?: Record<string, number> | null,
 *   narrativeThread?: Record<string, unknown> | null,
 *   narrativeArc?: Record<string, unknown> | null,
 *   memoryEpisodes?: unknown[],
 *   recentTurns?: Array<{ user?: string, ts?: number }>,
 *   runtime?: Record<string, unknown> | null,
 *   continuity?: Record<string, unknown> | null,
 *   continuityPressure?: number,
 *   atMs?: number
 * }} input
 */
export function computeFoxAttentionFieldV1(input = {}) {
  const message = String(input.message || "").trim();
  const router = input.router && typeof input.router === "object" ? input.router : {};
  const depth = input.depth && typeof input.depth === "object" ? input.depth : {};
  const emotions = input.emotions && typeof input.emotions === "object" ? input.emotions : {};
  const thread =
    input.narrativeThread && typeof input.narrativeThread === "object" ? input.narrativeThread : null;
  const arc = input.narrativeArc && typeof input.narrativeArc === "object" ? input.narrativeArc : null;
  const intent = String(router.intent || "");
  const world = readWorldAttentionSignalsV1(input.runtime, input.continuity);

  if (isTrivialFactoidV1(message)) {
    return Object.freeze({
      schema: FOX_ATTENTION_FIELD_SCHEMA_V1,
      role: "attention_scope_only",
      userSignal: 0.1,
      continuitySignal: 0.12,
      emotionalSignal: 0.08,
      noveltySignal: 0.1,
      worldSignal: 0.08,
      trivialFactoid: true,
      world
    });
  }

  const userSignal = computeUserSignalV1(message, router, depth);
  const continuitySignal = computeContinuitySignalV1(
    depth,
    thread,
    arc,
    input.recentTurns,
    intent,
    input.continuityPressure
  );
  const emotionalSignal = computeEmotionalSignalV1(emotions, router, message);
  const noveltySignal = computeNoveltySignalV1(intent, thread, input.memoryEpisodes, message);
  let worldSignal = computeWorldSignalV1(message, world);
  try {
    const awareness = readCastleAwarenessFieldV1();
    worldSignal = round3(Math.max(worldSignal, worldSignalFromAwarenessV1(awareness)));
  } catch {
    /* awareness feed optional */
  }

  const field = Object.freeze({
    schema: FOX_ATTENTION_FIELD_SCHEMA_V1,
    role: "attention_scope_only",
    userSignal,
    continuitySignal,
    emotionalSignal,
    noveltySignal,
    worldSignal,
    trivialFactoid: false,
    world
  });
  const axisCheck = validateFoxAttentionFieldAxesV1(field);
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "test" && !axisCheck.valid) {
    throw new Error(axisCheck.message);
  }
  return field;
}

/**
 * @param {ReturnType<typeof computeFoxAttentionFieldV1>} field
 */
export function computeFoxAttentionScoreV1(field) {
  if (field?.trivialFactoid === true) return 0.15;
  const f = field && typeof field === "object" ? field : {};
  const w = FOX_ATTENTION_SCORE_WEIGHTS_V1;
  const raw =
    clamp01(f.userSignal) * w.userSignal +
    clamp01(f.continuitySignal) * w.continuitySignal +
    clamp01(f.emotionalSignal) * w.emotionalSignal +
    clamp01(f.noveltySignal) * w.noveltySignal +
    clamp01(f.worldSignal) * w.worldSignal;
  return round3(raw);
}

/**
 * @param {ReturnType<typeof computeFoxAttentionFieldV1>} field
 * @param {number} score
 * @param {number} [atMs]
 */
export function buildRhizohFoxAttentionFieldV1(field, score, atMs = Date.now()) {
  const dominantSource = resolveDominantSourceV1({
    userSignal: field.userSignal,
    continuitySignal: field.continuitySignal,
    emotionalSignal: field.emotionalSignal,
    noveltySignal: field.noveltySignal,
    worldSignal: field.worldSignal
  });

  return Object.freeze({
    schema: FOX_ATTENTION_FIELD_SCHEMA_V1,
    role: "attention_scope_only",
    score: round3(score),
    dominantSource,
    userSignal: field.userSignal,
    continuitySignal: field.continuitySignal,
    emotionalSignal: field.emotionalSignal,
    noveltySignal: field.noveltySignal,
    worldSignal: field.worldSignal,
    ghostBindings: Object.freeze({
      ghostCuriosity: field.noveltySignal,
      ghostFocus: field.continuitySignal,
      ghostAlertness: field.worldSignal
    }),
    generatedAt: Number(atMs) || Date.now()
  });
}

/**
 * @param {number} score
 */
export function mapFoxAttentionScoreToGenerationModeV1(score) {
  const s = clamp01(score);
  if (s < 0.3) return ATTENTION_TO_GENERATION_V1.low;
  if (s < 0.6) return ATTENTION_TO_GENERATION_V1.mid;
  if (s < 0.85) return ATTENTION_TO_GENERATION_V1.high;
  return ATTENTION_TO_GENERATION_V1.deep;
}

/**
 * Cognition bias from attention field — not a decision layer.
 * @param {Record<string, unknown>} depth
 * @param {number} attentionScore
 * @param {ReturnType<typeof computeFoxAttentionFieldV1>} field
 */
export function applyFoxAttentionToDepthV1(depth, attentionScore, field) {
  const base = depth && typeof depth === "object" ? depth : {};
  const score = clamp01(attentionScore);
  let conversationMode = String(base.conversationMode || RHIZOH_CONVERSATION_MODE_V0.EXPLORE);
  let depthLevel = clampDepth(base.depthLevel);
  let continuityStrength = clamp01(base.continuityStrength);

  if (score >= 0.85) {
    conversationMode = maxConversationModeV1(conversationMode, RHIZOH_CONVERSATION_MODE_V0.NARRATIVE);
    depthLevel = Math.max(depthLevel, 4);
    continuityStrength = Math.max(continuityStrength, 0.82);
  } else if (score >= 0.6) {
    if (field.emotionalSignal >= 0.45) {
      conversationMode = maxConversationModeV1(conversationMode, RHIZOH_CONVERSATION_MODE_V0.NARRATIVE);
    } else {
      conversationMode = maxConversationModeV1(conversationMode, RHIZOH_CONVERSATION_MODE_V0.EXPLORE);
    }
    depthLevel = Math.max(depthLevel, 3);
    continuityStrength = Math.max(continuityStrength, 0.62);
  } else if (score < 0.3) {
    conversationMode = RHIZOH_CONVERSATION_MODE_V0.GREET;
    depthLevel = Math.min(depthLevel, 2);
  }

  return Object.freeze({
    ...base,
    conversationMode,
    depthLevel,
    continuityStrength
  });
}

/**
 * @param {ReturnType<typeof buildRhizohFoxAttentionFieldV1>} attentionField
 */
export function buildFoxAttentionPromptBlockV1(attentionField) {
  const f = attentionField && typeof attentionField === "object" ? attentionField : {};
  const score = clamp01(f.score);
  const band = score < 0.3 ? "low" : score < 0.6 ? "mid" : score < 0.85 ? "high" : "deep";
  const lines = [
    "## FOX attention field (scope only — what to look at, not what to decide)",
    `attentionScore: ${score} (${band}) · dominantSource: ${f.dominantSource || "USER"}`,
    `signals: user=${f.userSignal} continuity=${f.continuitySignal} emotional=${f.emotionalSignal} novelty=${f.noveltySignal} world=${f.worldSignal}`,
    `ghostBindings: curiosity=${f.ghostBindings?.ghostCuriosity} focus=${f.ghostBindings?.ghostFocus} alertness=${f.ghostBindings?.ghostAlertness}`,
    score < 0.3
      ? "Attention scope: brief factual surface; do not over-elaborate."
      : score < 0.6
        ? "Attention scope: user thread + one continuity callback if natural."
        : score < 0.85
          ? "Attention scope: emotional subtext + narrative thread are primary."
          : "Attention scope: deep continuity + world/emotion signals co-primary."
  ];
  if (f.dominantSource === FOX_ATTENTION_DOMINANT_SOURCE_V1.WORLD) {
    lines.push("Dominant world signal — reference live context only when user-facing.");
  }
  if (f.dominantSource === FOX_ATTENTION_DOMINANT_SOURCE_V1.NOVELTY) {
    lines.push("High novelty — treat as fresh discovery; avoid assuming prior agreement.");
  }
  return lines.join("\n");
}

/**
 * @param {Parameters<typeof computeFoxAttentionFieldV1>[0] & {
 *   depth: Record<string, unknown>
 * }} input
 */
export function resolveFoxAttentionEngineV1(input = {}) {
  const field = computeFoxAttentionFieldV1(input);
  const attentionScore = computeFoxAttentionScoreV1(field);
  const attentionField = buildRhizohFoxAttentionFieldV1(field, attentionScore);
  const adjustedDepth = applyFoxAttentionToDepthV1(input.depth, attentionScore, field);
  const fromAttention = mapFoxAttentionScoreToGenerationModeV1(attentionScore);
  const promptBlock = buildFoxAttentionPromptBlockV1(attentionField);

  return Object.freeze({
    schema: FOX_ATTENTION_ENGINE_SCHEMA_V1,
    attentionScore,
    attentionField,
    field,
    components: Object.freeze({
      intentWeight: field.userSignal,
      emotionWeight: field.emotionalSignal,
      continuityWeight: field.continuitySignal,
      noveltyWeight: field.noveltySignal,
      worldImpactWeight: field.worldSignal,
      trivialFactoid: field.trivialFactoid,
      world: field.world
    }),
    adjustedDepth,
    recommendedGenerationMode: fromAttention,
    recommendedConversationMode: adjustedDepth.conversationMode,
    recommendedDepthLevel: adjustedDepth.depthLevel,
    recommendedContinuityStrength: adjustedDepth.continuityStrength,
    promptBlock,
    ghostBindings: attentionField.ghostBindings
  });
}

/** @deprecated alias — maps to field signals */
export function computeFoxAttentionComponentsV1(input = {}) {
  const field = computeFoxAttentionFieldV1(input);
  return Object.freeze({
    intentWeight: field.userSignal,
    emotionWeight: field.emotionalSignal,
    continuityWeight: field.continuitySignal,
    noveltyWeight: field.noveltySignal,
    worldImpactWeight: field.worldSignal,
    trivialFactoid: field.trivialFactoid,
    world: field.world
  });
}

/** @deprecated */
export function computeFoxAttentionScoreV0(input = {}) {
  const field = computeFoxAttentionFieldV1(input);
  return computeFoxAttentionScoreV1(field);
}

/** @deprecated */
export function mapFoxAttentionScoreToGenerationModeV0(score) {
  return mapFoxAttentionScoreToGenerationModeV1(score);
}
