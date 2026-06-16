import { describe, expect, it, beforeEach } from "vitest";
import { buildRegretVectorsFromTraceV0 } from "../regretVectorSystemV0.js";
import {
  POLICY_CANONICAL_WEIGHT_V0,
  POLICY_MIRROR_WEIGHT_V0,
  POLICY_EVOLUTION_STATUS_V0,
  resolveGeometricDriftFieldV0,
  resetAlternativeStrategyNodesForTestV0
} from "../geometricDriftFieldV0.js";
import {
  emitPolicyEvolutionTickV0,
  resetPolicyEvolutionTicksForTestV0,
  readPolicyEvolutionTicksV0
} from "../mirrorPolicyDiffTrackerV0.js";
import { observePolicyEvolutionColliderV0 } from "../policyEvolutionColliderV0.js";
import { __resetCodexBusForTestV0 } from "../../../core/CodexBusV0.js";
import { resetDriftCubeRingV0 } from "../rhizohGeometryDriftCubeV0.js";

describe("regretVectorSystemV0", () => {
  it("builds normalized vectors from eval trace", () => {
    const regret = {
      evalTrace: [
        Object.freeze({ moveNumber: 1, san: "e4", bestMove: "d4", swingCp: -48, beforeCp: 20 })
      ]
    };
    const vectors = buildRegretVectorsFromTraceV0({ regret, fenRows: [{ san: "e4", before: "start" }] });
    expect(vectors).toHaveLength(1);
    expect(vectors[0].magnitude).toBeGreaterThan(0);
  });
});

describe("geometricDriftFieldV0", () => {
  beforeEach(() => {
    resetAlternativeStrategyNodesForTestV0();
  });

  it("uses 70/30 canonical mirror weights", () => {
    const field = resolveGeometricDriftFieldV0({
      teacherTopology: { patternFamily: "enclosure" },
      mirrorTopology: { patternFamily: "jump" },
      regretVector: { magnitude: 0.5 }
    });
    expect(field.canonicalWeight).toBe(POLICY_CANONICAL_WEIGHT_V0);
    expect(field.mirrorWeight).toBe(POLICY_MIRROR_WEIGHT_V0);
    expect(field.status).toBe(POLICY_EVOLUTION_STATUS_V0.ALTERNATIVE_UNIVERSE_PRESERVED);
  });
});

describe("mirrorPolicyDiffTrackerV0", () => {
  beforeEach(() => {
    resetPolicyEvolutionTicksForTestV0();
    resetDriftCubeRingV0();
    __resetCodexBusForTestV0();
  });

  it("emits policy evolution tick payload", () => {
    const tick = emitPolicyEvolutionTickV0({
      layer: 12,
      canonicalTeacher: "enclosure",
      mirrorDivergence: "jump",
      driftVectorMagnitude: 0.42,
      status: "ALTERNATIVE_UNIVERSE_PRESERVED"
    });
    expect(tick.canonicalTeacher).toBe("enclosure");
    expect(readPolicyEvolutionTicksV0()).toHaveLength(1);
  });
});

describe("policyEvolutionColliderV0", () => {
  beforeEach(() => {
    resetPolicyEvolutionTicksForTestV0();
    resetAlternativeStrategyNodesForTestV0();
    resetDriftCubeRingV0();
    __resetCodexBusForTestV0();
  });

  it("skips when teacher is offline", () => {
    const report = observePolicyEvolutionColliderV0({
      regret: { evalTrace: [] },
      moves: ["e4"],
      engineStatus: "heuristic_fallback"
    });
    expect(report.skipped).toBe(true);
    expect(report.reason).toBe("teacher_offline");
  });

  it("observes dual-reality ticks when teacher online", () => {
    const moves = ["e4", "e5", "Nf3", "Nc6"];
    const regret = {
      evalTrace: [
        Object.freeze({ moveNumber: 1, san: "e4", bestMove: "d4", swingCp: -30, beforeCp: 15 })
      ]
    };
    const report = observePolicyEvolutionColliderV0({
      regret,
      moves,
      engineStatus: "stockfish_wasm",
      matchId: "policy_test"
    });
    expect(report.skipped).toBe(false);
    expect(report.tickCount).toBe(1);
  });
});
