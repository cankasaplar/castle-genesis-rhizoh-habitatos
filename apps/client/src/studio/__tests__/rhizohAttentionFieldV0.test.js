import { describe, expect, it } from "vitest";
import {
  ATTENTION_HINT_BIAS_CAP_V0,
  decayRhizohAttentionFieldV0,
  depositRhizohAttentionFieldV0,
  resolveAttentionHintBiasV0,
  stepRhizohAttentionFieldV0
} from "../rhizohAttentionFieldV0.js";
import {
  OCTO_BEHAVIOR_V0,
  buildOctoBehaviorWeightsV0,
  createOctoReactionEcologyV0,
  observeOctoReactionV0,
  stepOctoReactionEcologyV0
} from "../octoReactionEcologyV0.js";
import { createCognitiveGeometryEngineV1, ingestCognitiveDraftV1 } from "../octoCognitiveGeometryCompilerV1.js";
import { createRhizohMemoryV0, enqueueRhizohAttentionHintV0, stepRhizohMemoryV0 } from "../rhizohMemoryV0.js";

describe("rhizohAttentionFieldV0", () => {
  it("decays field cells over time instead of freezing history", () => {
    const field = { spiral: 0.32, branching: 0.18 };
    decayRhizohAttentionFieldV0(field, 2500);
    expect(field.spiral).toBeLessThan(0.32);
    expect(field.branching).toBeLessThan(0.18);
    expect(field.spiral).toBeGreaterThan(0);
  });

  it("caps hint bias — never becomes a command weight", () => {
    const field = { spiral: 1 };
    const bias = resolveAttentionHintBiasV0(field, "spiral");
    expect(bias).toBeLessThanOrEqual(ATTENTION_HINT_BIAS_CAP_V0);
    expect(bias).toBeGreaterThan(0);
  });

  it("scenario A: spiral attention field nudges interest on matching geometry", () => {
    const ecology = createOctoReactionEcologyV0({ interest: 0.45 });
    const signal = {
      cubeNovelty: 0.42,
      cubeStable: 0.2,
      silenceMs: 2000,
      userEnergy: 0.2,
      attentionHintBias: resolveAttentionHintBiasV0({ spiral: 0.32 }, "spiral")
    };

    observeOctoReactionV0(ecology, signal);
    const withHint = ecology.interest;

    const baseline = createOctoReactionEcologyV0({ interest: 0.45 });
    observeOctoReactionV0(baseline, { ...signal, attentionHintBias: 0 });

    expect(withHint).toBeGreaterThan(baseline.interest);
    expect(signal.attentionHintBias).toBeLessThanOrEqual(ATTENTION_HINT_BIAS_CAP_V0);
  });

  it("scenario B: high cube novelty still wins over mismatched hint field", () => {
    const ecology = createOctoReactionEcologyV0({ interest: 0.5, energy: 0.5 });
    const spiralFieldBias = resolveAttentionHintBiasV0({ spiral: 0.32 }, "spiral");

    const spikeSignal = {
      cubeNovelty: 0.88,
      cubeStable: 0.08,
      silenceMs: 1000,
      userEnergy: 0.35,
      attentionHintBias: 0
    };
    const mutedSpiralSignal = {
      cubeNovelty: 0.18,
      cubeStable: 0.62,
      silenceMs: 1000,
      userEnergy: 0.1,
      attentionHintBias: spiralFieldBias
    };

    const spikeWeights = buildOctoBehaviorWeightsV0(ecology, spikeSignal);
    const spiralWeights = buildOctoBehaviorWeightsV0(createOctoReactionEcologyV0({ interest: 0.5 }), mutedSpiralSignal);

    expect(spikeWeights[OCTO_BEHAVIOR_V0.APPROACH]).toBeGreaterThan(spiralWeights[OCTO_BEHAVIOR_V0.APPROACH]);
  });

  it("deposits hints into field model not command queue", () => {
    const memory = createRhizohMemoryV0();
    const deposited = enqueueRhizohAttentionHintV0(memory, { target: "spiral", weight: 0.32 });

    expect(deposited.target).toBe("spiral");
    expect(memory.attentionField.spiral).toBeGreaterThan(0);
    expect(memory.attentionField.spiral).toBeLessThanOrEqual(0.42);
  });

  it("syncs memory observations into attention field each tick", () => {
    const memory = createRhizohMemoryV0();
    stepRhizohMemoryV0(memory, { draftText: "spiral geometri", nowMs: 1000, deltaMs: 500 });
    stepRhizohMemoryV0(memory, { draftText: "spiral tekrar", nowMs: 1600, deltaMs: 500 });

    expect(memory.attentionField.spiral ?? 0).toBeGreaterThan(0);
  });

  it("integrates with ecology step without overriding cube novelty", () => {
    const ecology = createOctoReactionEcologyV0();
    const engine = createCognitiveGeometryEngineV1(12);
    ingestCognitiveDraftV1(engine, "neden mantık spiral");

    const withField = stepOctoReactionEcologyV0(ecology, engine, {
      attentionHintBias: resolveAttentionHintBiasV0({ spiral: 0.32 }, "spiral"),
      geometryKind: "spiral",
      thinkIntervalMs: 0
    });

    ingestCognitiveDraftV1(engine, "korku tehlike kaç");
    const spikeEcology = createOctoReactionEcologyV0();
    const withSpike = stepOctoReactionEcologyV0(spikeEcology, engine, {
      attentionHintBias: resolveAttentionHintBiasV0({ spiral: 0.32 }, "spike"),
      geometryKind: "spike",
      thinkIntervalMs: 0
    });

    expect(withField.ecology.attentionHintBias).toBeGreaterThan(0);
    expect(withSpike.ecology.attentionHintBias).toBeLessThan(withField.ecology.attentionHintBias);
    expect(withSpike.signal.cubeNovelty).toBeGreaterThan(0.2);
  });

  it("steps field decay and deposit in one pass", () => {
    const field = { stretch: 0.2 };
    const snapshot = stepRhizohAttentionFieldV0(field, 500, {
      attentionEntry: { focus: "spiral", strength: 0.9 },
      topicTouches: [{ topic: "spiral", mentions: 4 }]
    });

    expect(snapshot.rows.some((row) => row.target === "spiral")).toBe(true);
    expect(field.spiral).toBeGreaterThan(0);
  });
});
