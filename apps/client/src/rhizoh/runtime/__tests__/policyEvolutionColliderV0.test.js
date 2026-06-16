import { describe, expect, it, beforeEach } from "vitest";
import {
  buildRegretVectorsFromTraceV0,
  classifyTopologyTagV0,
  enrichRegretVectorWithTopologyV0,
  buildDirectionalDriftVectorV0,
  REGRET_TOPOLOGY_TAG_V0,
  REGRET_CLASS_V0
} from "../regretVectorSystemV0.js";
import {
  ADAPTIVE_DRIFT_PRIOR_V0,
  POLICY_EVOLUTION_STATUS_V0,
  applyMatchOutcomeToAdaptiveFieldV0,
  resolveGeometricDriftFieldV0,
  resetAdaptiveDriftStateForTestV0,
  resetAlternativeStrategyNodesForTestV0,
  readAdaptiveDriftStateV0
} from "../geometricDriftFieldV0.js";
import {
  buildCounterfactualMemoryV0,
  buildDualRealityLedgerV0,
  emitPolicyEvolutionTickV0,
  resetPolicyEvolutionTicksForTestV0,
  readPolicyEvolutionTicksV0,
  readCounterfactualMemoryV0
} from "../mirrorPolicyDiffTrackerV0.js";
import { observePolicyEvolutionColliderV0 } from "../policyEvolutionColliderV0.js";
import { __resetCodexBusForTestV0 } from "../../../core/CodexBusV0.js";
import { resetDriftCubeRingV0 } from "../rhizohGeometryDriftCubeV0.js";

describe("regretVectorSystemV0", () => {
  it("builds scalar regret + directional vector + topology tag", () => {
    const regret = {
      evalTrace: [
        Object.freeze({ moveNumber: 1, san: "e4", bestMove: "d4", swingCp: -48, beforeCp: 20 })
      ]
    };
    const vectors = buildRegretVectorsFromTraceV0({ regret, fenRows: [{ san: "e4", before: "start" }] });
    expect(vectors).toHaveLength(1);
    expect(vectors[0].scalarRegret).toBeGreaterThan(0);

    const enriched = enrichRegretVectorWithTopologyV0({
      regretVector: vectors[0],
      teacherTopology: { patternFamily: "enclosure" },
      mirrorTopology: { patternFamily: "jump" }
    });
    expect(enriched.topologyTag).toBe(REGRET_TOPOLOGY_TAG_V0.STRATEGIC_UNIVERSE_DIVERGENCE);
    expect(enriched.directionalDriftVector.vector).toHaveLength(3);
    expect(enriched.isRegretNotLoss).toBe(true);
  });

  it("classifies sacrifice space separately from position error", () => {
    const tag = classifyTopologyTagV0(
      { swingCp: -35, beforeCp: 150, forcedWinLine: false },
      "enclosure",
      "jump"
    );
    expect(tag).toBe(REGRET_TOPOLOGY_TAG_V0.SACRIFICE_SPACE);
  });

  it("builds directional drift between strategy axes", () => {
    const drift = buildDirectionalDriftVectorV0("enclosure", "jump");
    expect(drift.dominantAxis).toBe("jump");
    expect(drift.magnitude).toBeGreaterThan(0);
  });
});

describe("geometricDriftFieldV0", () => {
  beforeEach(() => {
    resetAlternativeStrategyNodesForTestV0();
    resetAdaptiveDriftStateForTestV0();
  });

  it("starts from 70/30 adaptive priors", () => {
    const field = resolveGeometricDriftFieldV0({
      teacherTopology: { patternFamily: "enclosure" },
      mirrorTopology: { patternFamily: "jump" },
      regretVector: {
        scalarRegret: 0.5,
        topologyTag: REGRET_TOPOLOGY_TAG_V0.STRATEGIC_UNIVERSE_DIVERGENCE
      }
    });
    expect(field.canonicalWeight).toBeCloseTo(ADAPTIVE_DRIFT_PRIOR_V0.canonical, 1);
    expect(field.mirrorWeight).toBeCloseTo(ADAPTIVE_DRIFT_PRIOR_V0.mirror, 1);
    expect(field.governance.canonicalRole).toBe("anchor");
    expect(field.status).toBe(POLICY_EVOLUTION_STATUS_V0.ALTERNATIVE_UNIVERSE_PRESERVED);
  });

  it("increases exploration bias after mirror universe win", () => {
    applyMatchOutcomeToAdaptiveFieldV0({ outcome: "win", ticks: [] });
    const state = readAdaptiveDriftStateV0();
    expect(state.explorationBias).toBeGreaterThan(0);
    expect(state.mirrorWeight).toBeGreaterThan(ADAPTIVE_DRIFT_PRIOR_V0.mirror);
  });

  it("anneals exploration after loss streak", () => {
    applyMatchOutcomeToAdaptiveFieldV0({ outcome: "loss", ticks: [] });
    applyMatchOutcomeToAdaptiveFieldV0({ outcome: "loss", ticks: [] });
    const state = readAdaptiveDriftStateV0();
    expect(state.explorationBias).toBeLessThan(0);
  });
});

describe("mirrorPolicyDiffTrackerV0", () => {
  beforeEach(() => {
    resetPolicyEvolutionTicksForTestV0();
    resetDriftCubeRingV0();
    __resetCodexBusForTestV0();
  });

  it("builds counterfactual memory triad", () => {
    const counterfactual = buildCounterfactualMemoryV0({
      regretVector: {
        san: "e4",
        bestMove: "d4",
        teacherCp: 40,
        swingCp: -30,
        regretClass: REGRET_CLASS_V0.REGRET
      },
      driftField: { canonicalPattern: "enclosure", mirrorPattern: "jump" }
    });
    expect(counterfactual.teacherMove).toBe("d4");
    expect(counterfactual.mirrorMove).toBe("e4");
    expect(counterfactual.mirrorLineCp).toBe(10);
    expect(counterfactual.branchClass).toBe("mirror_underperforms");
  });

  it("emits dual reality ledger with three layers", () => {
    const tick = emitPolicyEvolutionTickV0({
      layer: 12,
      canonicalTeacher: "enclosure",
      mirrorDivergence: "jump",
      driftVectorMagnitude: 0.42,
      status: "ALTERNATIVE_UNIVERSE_PRESERVED",
      regretVector: {
        san: "Nf3",
        bestMove: "d4",
        teacherCp: 20,
        swingCp: -15,
        topologyTag: REGRET_TOPOLOGY_TAG_V0.STRATEGIC_UNIVERSE_DIVERGENCE,
        regretClass: REGRET_CLASS_V0.REGRET
      },
      driftField: { canonicalPattern: "enclosure", mirrorPattern: "jump" }
    });
    expect(tick.dualRealityLedger.canonicalPolicy.move).toBe("d4");
    expect(tick.dualRealityLedger.mirrorPolicy.move).toBe("Nf3");
    expect(tick.dualRealityLedger.counterfactualOutcome.branchClass).toBeTruthy();
    expect(readPolicyEvolutionTicksV0()).toHaveLength(1);
    expect(readCounterfactualMemoryV0()).toHaveLength(1);
  });
});

describe("policyEvolutionColliderV0", () => {
  beforeEach(() => {
    resetPolicyEvolutionTicksForTestV0();
    resetAlternativeStrategyNodesForTestV0();
    resetAdaptiveDriftStateForTestV0();
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

  it("observes dual-reality ticks with adaptive state when teacher online", () => {
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
      matchId: "policy_test",
      outcome: "win"
    });
    expect(report.skipped).toBe(false);
    expect(report.tickCount).toBe(1);
    expect(report.ticks[0].dualRealityLedger).toBeTruthy();
    expect(report.adaptiveState.explorationBias).toBeGreaterThan(0);
    expect(report.governance.explorationNeverPunishedAsError).toBe(true);
  });
});
