/**
 * Castle Adaptive Interaction v1.5 — context-sensitive learned interaction weights.
 * @see apps/client/docs/RHIZOH_CASTLE_OS_V1_5.md
 */

export const CASTLE_ADAPTIVE_INTERACTION_SCHEMA_V1_5 = "castle.adaptive_interaction.v1.5";

/** @type {Map<string, number>} */
const learnedWeightByEdgeV1_5 = new Map();
const LEARNED_MIN_V1_5 = 0.35;
const LEARNED_MAX_V1_5 = 1.65;
const LEARN_RATE_V1_5 = 0.08;

function clampLearned(n) {
  return Math.max(LEARNED_MIN_V1_5, Math.min(LEARNED_MAX_V1_5, Number(n) || 1));
}

function edgeKey(fromTopic, toTopic, kind) {
  return `${fromTopic || "general"}->${toTopic || "general"}:${kind}`;
}

function topicKey(label) {
  return String(label || "general").replace("co_watch_sports", "co_watch");
}

export function observeInteractionOutcomeV1_5(observation = {}) {
  const fromTopic = topicKey(observation.fromTopic);
  const toTopic = topicKey(observation.toTopic);
  const userIntentBoost = Number(observation.userIntentBoost) || 0;
  const volatility = Number(observation.volatility) || 0;
  const dominantShift = observation.dominantShift === true;

  for (const kind of ["suppresses", "enhances", "reframes", "delays"]) {
    const key = edgeKey(fromTopic, toTopic, kind);
    let w = learnedWeightByEdgeV1_5.get(key) ?? 1;

    if (kind === "suppresses" && userIntentBoost > 0.6) {
      w = clampLearned(w - LEARN_RATE_V1_5 * userIntentBoost);
    }
    if (kind === "enhances" && userIntentBoost > 0.5) {
      w = clampLearned(w + LEARN_RATE_V1_5 * 0.5);
    }
    if (volatility > 0.55 && kind === "suppresses" && dominantShift) {
      w = clampLearned(w - LEARN_RATE_V1_5 * volatility);
    }
    if (volatility > 0.7 && kind === "reframes") {
      w = clampLearned(w + LEARN_RATE_V1_5 * 0.35);
    }

    learnedWeightByEdgeV1_5.set(key, Number(w.toFixed(4)));
  }
}

export function applyLearnedInteractionV1_5(baseEdge, context = {}) {
  const fromTopic = topicKey(baseEdge.fromTopic);
  const toTopic = topicKey(baseEdge.toTopic);
  const intentOverride = Number(context.userIntentBoost) || 0;

  const scaleKind = (kind, value) => {
    if (!value) return 0;
    let w = learnedWeightByEdgeV1_5.get(edgeKey(fromTopic, toTopic, kind)) ?? 1;
    if (kind === "suppresses" && intentOverride > 0.75) {
      w = Math.min(w, 0.55);
    }
    if (context.invertSuppresses && kind === "suppresses") {
      w = clampLearned(2 - w);
    }
    return Number(Math.max(0, Math.min(1, value * w)).toFixed(4));
  };

  return Object.freeze({
    ...baseEdge,
    learned: true,
    suppresses: scaleKind("suppresses", baseEdge.suppresses),
    enhances: scaleKind("enhances", baseEdge.enhances),
    reframes: scaleKind("reframes", baseEdge.reframes),
    delays: scaleKind("delays", baseEdge.delays)
  });
}

export function getLearnedInteractionWeightV1_5(fromTopic, toTopic, kind) {
  return learnedWeightByEdgeV1_5.get(edgeKey(topicKey(fromTopic), topicKey(toTopic), kind)) ?? 1;
}

/** @internal vitest */
export function __resetAdaptiveInteractionForTestV1_5() {
  learnedWeightByEdgeV1_5.clear();
}
