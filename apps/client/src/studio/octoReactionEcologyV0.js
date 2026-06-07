/**
 * Octo Reaction Ecology v0 — Katman 1: öğrenme yok, canlılık var.
 * Cube geometrisi → Octo interest/energy → olasılıksal davranış.
 * Render katmanı sadece intent okur; üretmez.
 * @see docs/RHIZOH_COMPANION_OBSERVATION_PRESENCE_V0.md
 */

export const OCTO_REACTION_ECOLOGY_SCHEMA_V0 = "castle.octo_reaction_ecology.v0";
export const OCTO_REACTION_TICK_SCHEMA_V0 = "castle.octo_reaction_ecology_tick.v0";

export const OCTO_BEHAVIOR_V0 = Object.freeze({
  LOOK: "look",
  APPROACH: "approach",
  RETREAT: "retreat",
  TOUCH: "touch",
  WAIT: "wait",
  SLEEP: "sleep"
});

export const OCTO_BEHAVIOR_LIST_V0 = Object.freeze([
  OCTO_BEHAVIOR_V0.LOOK,
  OCTO_BEHAVIOR_V0.APPROACH,
  OCTO_BEHAVIOR_V0.RETREAT,
  OCTO_BEHAVIOR_V0.TOUCH,
  OCTO_BEHAVIOR_V0.WAIT,
  OCTO_BEHAVIOR_V0.SLEEP
]);

export const OCTO_THINK_INTERVAL_MS_V0 = 500;
export const OCTO_ATTENTION_HINT_BIAS_CAP_V0 = 0.25;

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

/**
 * @returns {import("./octoCognitiveGeometryCompilerV1.js").ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1> | null}
 */
function readEngine(engine) {
  return engine && typeof engine === "object" ? engine : null;
}

/**
 * @param {number} [seed]
 */
export function createSeededRngV0(seed = 1) {
  let s = (Math.abs(Math.floor(Number(seed) || 1)) * 48271) % 2147483647;
  if (s <= 0) s = 1;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * @param {object} [seedState]
 */
export function createOctoReactionEcologyV0(seedState = {}) {
  const nowMs = Date.now();
  return {
    schema: OCTO_REACTION_ECOLOGY_SCHEMA_V0,
    interest: clamp01(seedState.interest ?? 0.5),
    energy: clamp01(seedState.energy ?? 0.5),
    lastBehavior: OCTO_BEHAVIOR_V0.WAIT,
    lastBehaviorAtMs: nowMs,
    lastThinkAtMs: 0,
    tickCount: 0,
    lastSignal: null,
    lastIntent: null,
    lastAttentionHintBias: 0
  };
}

/**
 * Cube engine → gözlem sinyali (dil değil, geometri).
 * @param {ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>} engine
 * @param {{ nowMs?: number, userEnergy?: number }} [opts]
 */
export function extractCubeObserveSignalV0(engine, opts = {}) {
  const e = readEngine(engine);
  const nowMs = opts.nowMs ?? Date.now();
  const lastTyping = e?.lastTypingTime ?? nowMs;
  const silenceMs = Math.max(0, nowMs - lastTyping);

  const cur = e?.currentTopology ?? {};
  const tgt = e?.targetTopology ?? {};
  const topoDelta =
    Math.abs((cur.twist ?? 0) - (tgt.twist ?? 0)) +
    Math.abs((cur.fold ?? 0) - (tgt.fold ?? 0)) +
    Math.abs((cur.spikes ?? 0) - (tgt.spikes ?? 0)) +
    Math.abs((cur.stretchY ?? 1) - (tgt.stretchY ?? 1));

  const energy = clamp01(e?.energy ?? 0);
  const mutating = /MUTATION|DRIFT/i.test(String(e?.status ?? ""));
  const novelty = clamp01(topoDelta * 0.38 + energy * 0.42 + (mutating ? 0.22 : 0));

  const rhizohLock = clamp01(e?.rhizohLock ?? 1);
  const locked = String(e?.status ?? "") === "GEOMETRY LOCKED";
  const stable = clamp01(rhizohLock * 0.52 + (1 - energy) * 0.32 + (locked ? 0.18 : 0));

  return Object.freeze({
    cubeNovelty: novelty,
    cubeStable: stable,
    silenceMs,
    userEnergy: clamp01(opts.userEnergy ?? 0),
    dominant: e?.dominant ?? "NEUTRAL",
    geometryPhase: (cur.twist ?? 0) + (cur.fold ?? 0) + (cur.spikes ?? 0) + ((cur.stretchY ?? 1) - 1)
  });
}

/**
 * @param {ReturnType<typeof createOctoReactionEcologyV0>} ecology
 * @param {ReturnType<typeof extractCubeObserveSignalV0>} signal
 */
export function observeOctoReactionV0(ecology, signal) {
  const novelty = signal.cubeNovelty ?? 0;
  const stable = signal.cubeStable ?? 0;
  const silenceSec = (signal.silenceMs ?? 0) / 1000;
  const userEnergy = signal.userEnergy ?? 0;
  const hintBias = clamp01(signal.attentionHintBias ?? 0);

  ecology.lastAttentionHintBias = hintBias;
  ecology.interest = clamp01(ecology.interest * 0.9 + novelty * 0.38 - stable * 0.07 + hintBias);
  ecology.energy = clamp01(
    ecology.energy * 0.93 + userEnergy * 0.24 + novelty * 0.14 - (silenceSec > 35 ? 0.05 : 0)
  );
  ecology.lastSignal = signal;
}

/**
 * @param {ReturnType<typeof createOctoReactionEcologyV0>} ecology
 * @param {ReturnType<typeof extractCubeObserveSignalV0>} signal
 */
export function buildOctoBehaviorWeightsV0(ecology, signal) {
  const interest = ecology.interest;
  const energy = ecology.energy;
  const hintBias = clamp01(signal.attentionHintBias ?? ecology.lastAttentionHintBias ?? 0);
  const novelty = signal.cubeNovelty ?? 0;
  const stable = signal.cubeStable ?? 0;
  const silenceSec = (signal.silenceMs ?? 0) / 1000;

  const weights = {
    [OCTO_BEHAVIOR_V0.LOOK]: 0.12 + interest * 0.2 + novelty * 0.12 + hintBias * 0.08,
    [OCTO_BEHAVIOR_V0.APPROACH]: 0.08 + interest * 0.34 + novelty * 0.3 - stable * 0.14 + hintBias * 0.12,
    [OCTO_BEHAVIOR_V0.RETREAT]: 0.06 + stable * 0.3 + (1 - interest) * 0.12 - novelty * 0.16,
    [OCTO_BEHAVIOR_V0.TOUCH]:
      0.04 + interest * 0.16 + (interest > 0.62 && novelty < 0.42 ? 0.2 : 0),
    [OCTO_BEHAVIOR_V0.WAIT]: 0.14 + stable * 0.1 + (silenceSec < 6 ? 0.1 : 0),
    [OCTO_BEHAVIOR_V0.SLEEP]:
      0.03 +
      (silenceSec > 28 ? 0.26 : silenceSec > 14 ? 0.12 : 0) +
      (1 - energy) * 0.1
  };

  if (silenceSec > 18) {
    weights[OCTO_BEHAVIOR_V0.LOOK] += 0.14;
    weights[OCTO_BEHAVIOR_V0.WAIT] += 0.12;
  }

  if (userEnergyBurst(signal)) {
    weights[OCTO_BEHAVIOR_V0.APPROACH] += 0.16;
    weights[OCTO_BEHAVIOR_V0.LOOK] += 0.08;
  }

  return weights;
}

/**
 * @param {ReturnType<typeof extractCubeObserveSignalV0>} signal
 */
function userEnergyBurst(signal) {
  return (signal.userEnergy ?? 0) > 0.52;
}

/**
 * @param {Record<string, number>} weights
 * @param {() => number} [rng]
 */
export function pickWeightedOctoBehaviorV0(weights, rng = Math.random) {
  const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  if (total <= 0) return OCTO_BEHAVIOR_V0.WAIT;

  let roll = rng() * total;
  for (const [behavior, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return behavior;
  }
  return entries[entries.length - 1][0];
}

/**
 * @param {ReturnType<typeof createOctoReactionEcologyV0>} ecology
 * @param {ReturnType<typeof extractCubeObserveSignalV0>} signal
 * @param {() => number} [rng]
 */
export function thinkOctoReactionV0(ecology, signal, rng = Math.random) {
  const weights = buildOctoBehaviorWeightsV0(ecology, signal);
  const behavior = pickWeightedOctoBehaviorV0(weights, rng);
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  const confidence = total > 0 ? clamp01((weights[behavior] ?? 0) / total) : 0;

  return Object.freeze({
    behavior,
    confidence,
    weights: Object.freeze({ ...weights }),
    interest: ecology.interest,
    energy: ecology.energy
  });
}

/**
 * @param {ReturnType<typeof thinkOctoReactionV0>} intent
 * @param {ReturnType<typeof extractCubeObserveSignalV0>} [signal]
 */
export function mapOctoBehaviorToMotionBiasV0(intent, signal = null) {
  const behavior = intent?.behavior ?? OCTO_BEHAVIOR_V0.WAIT;
  const confidence = intent?.confidence ?? 0.5;
  const silenceSec = (signal?.silenceMs ?? 0) / 1000;
  const orbit = silenceSec > 18 && (behavior === OCTO_BEHAVIOR_V0.WAIT || behavior === OCTO_BEHAVIOR_V0.LOOK);

  switch (behavior) {
    case OCTO_BEHAVIOR_V0.APPROACH:
      return Object.freeze({
        behavior,
        swimSpeedMul: 1.12 + confidence * 0.28,
        reachBias: 0.32 + confidence * 0.42,
        coilBias: 0.1,
        tentacleExtend: 0,
        headLeanCube: 0.42 + confidence * 0.2,
        orbit: false,
        allowBodySwim: true
      });
    case OCTO_BEHAVIOR_V0.RETREAT:
      return Object.freeze({
        behavior,
        swimSpeedMul: 0.72,
        reachBias: -0.22 - confidence * 0.12,
        coilBias: 0.38,
        tentacleExtend: 0,
        headLeanCube: -0.12,
        orbit: false,
        allowBodySwim: true
      });
    case OCTO_BEHAVIOR_V0.TOUCH:
      return Object.freeze({
        behavior,
        swimSpeedMul: 0.92,
        reachBias: 0.58 + confidence * 0.2,
        coilBias: 0.06,
        tentacleExtend: 0.5 + confidence * 0.35,
        headLeanCube: 0.62,
        orbit: false,
        allowBodySwim: true
      });
    case OCTO_BEHAVIOR_V0.LOOK:
      return Object.freeze({
        behavior,
        swimSpeedMul: 0.52,
        reachBias: 0.14,
        coilBias: 0.22,
        tentacleExtend: 0,
        headLeanCube: 0.68,
        orbit,
        allowBodySwim: true
      });
    case OCTO_BEHAVIOR_V0.SLEEP:
      return Object.freeze({
        behavior,
        swimSpeedMul: 0.32,
        reachBias: 0,
        coilBias: 0.74,
        tentacleExtend: 0,
        headLeanCube: 0.08,
        orbit: false,
        allowBodySwim: confidence > 0.35
      });
    case OCTO_BEHAVIOR_V0.WAIT:
    default:
      return Object.freeze({
        behavior: OCTO_BEHAVIOR_V0.WAIT,
        swimSpeedMul: 0.48,
        reachBias: 0.06,
        coilBias: 0.28,
        tentacleExtend: 0,
        headLeanCube: 0.22,
        orbit,
        allowBodySwim: orbit || confidence > 0.2
      });
  }
}

/**
 * @param {object} carry
 * @param {ReturnType<typeof stepOctoReactionEcologyV0>} tick
 */
export function mergeOctoEcologyIntoCarryV0(carry, tick) {
  if (!carry || !tick?.intent) return carry;
  const bias = mapOctoBehaviorToMotionBiasV0(tick.intent, tick.signal);

  return {
    ...carry,
    ecologyBehavior: bias.behavior,
    ecologyConfidence: tick.intent.confidence,
    ecologyInterest: tick.ecology.interest,
    ecologyEnergy: tick.ecology.energy,
    ecologySwimSpeedMul: bias.swimSpeedMul,
    ecologyReachBias: bias.reachBias,
    ecologyCoilBias: bias.coilBias,
    ecologyOrbit: bias.orbit,
    ecologyHeadLeanCube: bias.headLeanCube,
    tentacleExtend: Math.max(carry.tentacleExtend ?? 0, bias.tentacleExtend),
    headLeanX: (carry.headLeanX ?? 0) + bias.headLeanCube * 0.35,
    allowBodySwim: carry.allowBodySwim || bias.allowBodySwim,
    sessionSwim: carry.sessionSwim || bias.allowBodySwim,
    ecologyTick: tick
  };
}

/**
 * @param {ReturnType<typeof createOctoReactionEcologyV0>} ecology
 * @param {ReturnType<typeof import("./octoCognitiveGeometryCompilerV1.js").createCognitiveGeometryEngineV1>} engine
 * @param {{ nowMs?: number, userEnergy?: number, rng?: () => number, thinkIntervalMs?: number, attentionHintBias?: number, geometryKind?: string }} [opts]
 */
export function stepOctoReactionEcologyV0(ecology, engine, opts = {}) {
  const nowMs = opts.nowMs ?? Date.now();
  const thinkIntervalMs = opts.thinkIntervalMs ?? OCTO_THINK_INTERVAL_MS_V0;
  const hintBias = clamp01(opts.attentionHintBias ?? 0);
  const signal = Object.freeze({
    ...extractCubeObserveSignalV0(engine, { ...opts, nowMs }),
    attentionHintBias: hintBias,
    geometryKind: opts.geometryKind ?? null
  });

  observeOctoReactionV0(ecology, signal);

  let intent = ecology.lastIntent;
  if (!intent || nowMs - ecology.lastThinkAtMs >= thinkIntervalMs) {
    intent = thinkOctoReactionV0(ecology, signal, opts.rng);
    ecology.lastIntent = intent;
    ecology.lastBehavior = intent.behavior;
    ecology.lastBehaviorAtMs = nowMs;
    ecology.lastThinkAtMs = nowMs;
  }

  ecology.tickCount += 1;

  return Object.freeze({
    schema: OCTO_REACTION_TICK_SCHEMA_V0,
    signal,
    intent,
    ecology: Object.freeze({
      interest: ecology.interest,
      energy: ecology.energy,
      lastBehavior: ecology.lastBehavior,
      attentionHintBias: ecology.lastAttentionHintBias
    })
  });
}
