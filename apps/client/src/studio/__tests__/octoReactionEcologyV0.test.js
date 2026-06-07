import { describe, expect, it } from "vitest";
import {
  OCTO_BEHAVIOR_LIST_V0,
  OCTO_BEHAVIOR_V0,
  buildOctoBehaviorWeightsV0,
  createOctoReactionEcologyV0,
  createSeededRngV0,
  extractCubeObserveSignalV0,
  mapOctoBehaviorToMotionBiasV0,
  observeOctoReactionV0,
  pickWeightedOctoBehaviorV0,
  stepOctoReactionEcologyV0,
  thinkOctoReactionV0
} from "../octoReactionEcologyV0.js";
import {
  createCognitiveGeometryEngineV1 as createEngine,
  ingestCognitiveDraftV1 as ingestDraft
} from "../octoCognitiveGeometryCompilerV1.js";

describe("octoReactionEcologyV0", () => {
  it("extracts novelty from cube mutation", () => {
    const engine = createEngine(12);
    ingestDraft(engine, "korku tehlike kaç");
    engine.energy = 0.85;
    engine.status = "TOPOLOGY MUTATION";

    const signal = extractCubeObserveSignalV0(engine, { nowMs: Date.now(), userEnergy: 0.6 });
    expect(signal.cubeNovelty).toBeGreaterThan(0.35);
    expect(signal.dominant).toBe("ACTION");
  });

  it("raises interest on novelty and lowers on stability", () => {
    const ecology = createOctoReactionEcologyV0({ interest: 0.5 });
    observeOctoReactionV0(ecology, {
      cubeNovelty: 0.8,
      cubeStable: 0.1,
      silenceMs: 1000,
      userEnergy: 0.2
    });
    const highInterest = ecology.interest;

    observeOctoReactionV0(ecology, {
      cubeNovelty: 0.05,
      cubeStable: 0.9,
      silenceMs: 1000,
      userEnergy: 0
    });
    expect(highInterest).toBeGreaterThan(ecology.interest);
  });

  it("favors approach when cube mutates and retreat when stable", () => {
    const ecology = createOctoReactionEcologyV0({ interest: 0.7 });
    const mutateWeights = buildOctoBehaviorWeightsV0(ecology, {
      cubeNovelty: 0.75,
      cubeStable: 0.1,
      silenceMs: 500,
      userEnergy: 0.4
    });
    const stableWeights = buildOctoBehaviorWeightsV0(ecology, {
      cubeNovelty: 0.05,
      cubeStable: 0.88,
      silenceMs: 500,
      userEnergy: 0
    });

    expect(mutateWeights[OCTO_BEHAVIOR_V0.APPROACH]).toBeGreaterThan(stableWeights[OCTO_BEHAVIOR_V0.APPROACH]);
    expect(stableWeights[OCTO_BEHAVIOR_V0.RETREAT]).toBeGreaterThan(mutateWeights[OCTO_BEHAVIOR_V0.RETREAT]);
  });

  it("weighted pick produces variety when weights are competitive", () => {
    const weights = {
      [OCTO_BEHAVIOR_V0.LOOK]: 0.22,
      [OCTO_BEHAVIOR_V0.APPROACH]: 0.2,
      [OCTO_BEHAVIOR_V0.RETREAT]: 0.18,
      [OCTO_BEHAVIOR_V0.TOUCH]: 0.14,
      [OCTO_BEHAVIOR_V0.WAIT]: 0.16,
      [OCTO_BEHAVIOR_V0.SLEEP]: 0.1
    };
    const seen = new Set();
    for (let seed = 1; seed < 80; seed += 1) {
      seen.add(pickWeightedOctoBehaviorV0(weights, createSeededRngV0(seed)));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("think keeps behavior stable between 500ms ticks", () => {
    const engine = createEngine(12);
    const ecology = createOctoReactionEcologyV0();
    const now = Date.now();
    const first = stepOctoReactionEcologyV0(ecology, engine, { nowMs: now, thinkIntervalMs: 500 });
    const second = stepOctoReactionEcologyV0(ecology, engine, { nowMs: now + 120, thinkIntervalMs: 500 });
    expect(second.intent.behavior).toBe(first.intent.behavior);
  });

  it("picks behavior deterministically with fixed rng", () => {
    const weights = {
      look: 0.2,
      approach: 0.5,
      retreat: 0.1,
      touch: 0.05,
      wait: 0.1,
      sleep: 0.05
    };
    const rng = createSeededRngV0(42);
    const first = pickWeightedOctoBehaviorV0(weights, rng);
    const rng2 = createSeededRngV0(42);
    const second = pickWeightedOctoBehaviorV0(weights, rng2);
    expect(first).toBe(second);
  });

  it("maps touch behavior to tentacle extend bias", () => {
    const bias = mapOctoBehaviorToMotionBiasV0(
      { behavior: OCTO_BEHAVIOR_V0.TOUCH, confidence: 0.7 },
      { silenceMs: 2000 }
    );
    expect(bias.tentacleExtend).toBeGreaterThan(0.5);
    expect(bias.reachBias).toBeGreaterThan(0.4);
  });

  it("long silence enables orbit bias on wait/look", () => {
    const waitBias = mapOctoBehaviorToMotionBiasV0(
      { behavior: OCTO_BEHAVIOR_V0.WAIT, confidence: 0.4 },
      { silenceMs: 22000 }
    );
    expect(waitBias.orbit).toBe(true);
  });

  it("steps ecology on cube engine without learning side effects", () => {
    const engine = createEngine(16);
    ingestDraft(engine, "merhaba göster bak yeni");
    const ecology = createOctoReactionEcologyV0();
    const tick = stepOctoReactionEcologyV0(ecology, engine, {
      nowMs: Date.now(),
      userEnergy: 0.55,
      rng: createSeededRngV0(7),
      thinkIntervalMs: 0
    });

    expect(tick.schema).toBe("castle.octo_reaction_ecology_tick.v0");
    expect(OCTO_BEHAVIOR_LIST_V0).toContain(tick.intent.behavior);
    expect(ecology.tickCount).toBe(1);
    expect(ecology.lastIntent).toEqual(tick.intent);
  });
});
