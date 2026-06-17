import { describe, expect, it, beforeEach } from "vitest";
import { calculateTopologyDriftV0, freezeTopologyEventV0 } from "../rhizohGeometryTopologyV0.js";
import { RHIZOH_GEOMETRY_PATTERN_FAMILY_V0 } from "../rhizohGeometryPatternFamilyV0.js";
import {
  commitDriftCubeObservationV0,
  resetDriftCubeRingV0,
  summarizeDriftCubeV0
} from "../rhizohGeometryDriftCubeV0.js";
import { observeChessRegretGeometryV0 } from "../rhizohGeometryChessRegretObserverV0.js";
import {
  classifyTopologyCodexEventV0,
  TOPOLOGY_EVENT_TYPES_V0
} from "../rhizohTopologyEventEmitterV0.js";
import { runRhizohUgeSilentObserverV0 } from "../rhizohUgeSilentObserverV0.js";
import { __resetCodexBusForTestV0 } from "../../../core/CodexBusV0.js";

describe("rhizohGeometryTopologyV0", () => {
  it("returns high drift when pattern families differ", () => {
    const played = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER,
      deltaMagnitude: 0.2
    });
    const expected = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.ENCLOSURE,
      deltaMagnitude: 0.8
    });
    const drift = calculateTopologyDriftV0(played, expected);
    expect(drift.familyMatch).toBe(false);
    expect(drift.magnitude).toBeGreaterThan(0.4);
  });

  it("returns low drift when families and magnitudes align", () => {
    const played = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP,
      deltaMagnitude: 0.5
    });
    const expected = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP,
      deltaMagnitude: 0.52
    });
    const drift = calculateTopologyDriftV0(played, expected);
    expect(drift.familyMatch).toBe(true);
    expect(drift.magnitude).toBeLessThan(0.1);
  });
});

describe("rhizohTopologyEventEmitterV0", () => {
  it("classifies jump anomaly when mirror jumps but teacher does not", () => {
    const played = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.JUMP
    });
    const expected = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.ENCLOSURE
    });
    const drift = calculateTopologyDriftV0(played, expected);
    expect(classifyTopologyCodexEventV0(played, expected, drift)).toBe(
      TOPOLOGY_EVENT_TYPES_V0.JUMP_ANOMALY
    );
  });

  it("classifies cluster locked when families align on cluster", () => {
    const played = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER,
      deltaMagnitude: 0.5
    });
    const expected = freezeTopologyEventV0({
      sourceSpace: "chess",
      topologyType: RHIZOH_GEOMETRY_PATTERN_FAMILY_V0.CLUSTER,
      deltaMagnitude: 0.52
    });
    const drift = calculateTopologyDriftV0(played, expected);
    expect(classifyTopologyCodexEventV0(played, expected, drift)).toBe(
      TOPOLOGY_EVENT_TYPES_V0.CLUSTER_LOCKED
    );
  });
});

describe("rhizohGeometryDriftCubeV0", () => {
  beforeEach(() => {
    resetDriftCubeRingV0();
  });

  it("commits observation points with bounded z", () => {
    const point = commitDriftCubeObservationV0({
      x: [4, 4],
      y: 12,
      z: 1.5,
      sourceSpace: "chess",
      played: { patternFamily: "enclosure" },
      expected: { patternFamily: "cluster" },
      drift: { magnitude: 0.7, familyMatch: false }
    });
    expect(point.z).toBe(1);
    expect(point.context.playedPattern).toBe("enclosure");
  });
});

describe("rhizohGeometryChessRegretObserverV0", () => {
  beforeEach(() => {
    resetDriftCubeRingV0();
  });

  it("observes regret trace into drift cube without throwing", () => {
    const moves = ["e4", "e5", "Nf3", "Nc6"];
    const regret = {
      evalTrace: [
        Object.freeze({ moveNumber: 1, san: "e4", bestMove: "d4" }),
        Object.freeze({ moveNumber: 3, san: "Nf3", bestMove: "Nc3" })
      ]
    };
    const report = observeChessRegretGeometryV0({ regret, moves, matchId: "test_match" });
    expect(report.observationCount).toBe(2);
    expect(report.summary.count).toBe(2);
  });
});

describe("rhizohUgeSilentObserverV0", () => {
  beforeEach(() => {
    resetDriftCubeRingV0();
    __resetCodexBusForTestV0();
  });

  it("skips when teacher is offline", async () => {
    const report = await runRhizohUgeSilentObserverV0({
      moves: ["e4"],
      engineStatus: "heuristic_fallback"
    });
    expect(report.skipped).toBe(true);
    expect(report.governance.policyInfluence).toBe(false);
  });

  it("observes moves into drift cube without policy influence", async () => {
    const moves = ["e4", "e5", "Nf3", "Nc6"];
    const regret = {
      evalTrace: [
        Object.freeze({ moveNumber: 1, san: "e4", bestMove: "d4" }),
        Object.freeze({ moveNumber: 3, san: "Nf3", bestMove: "Nc3" })
      ]
    };
    const report = await runRhizohUgeSilentObserverV0({
      regret,
      moves,
      engineStatus: "stockfish_wasm",
      matchId: "uge_test"
    });
    expect(report.skipped).toBe(false);
    expect(report.observationCount).toBe(2);
    expect(report.governance.moveInfluence).toBe(false);
    expect(report.summary.count).toBe(2);
  });
});
