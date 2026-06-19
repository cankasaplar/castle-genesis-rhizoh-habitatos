import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  CHESS_TELEMETRY_LEVEL_V0,
  __resetChessTelemetryLogForTestV0,
  buildChessDriftLogEnvelopeV0,
  resolveChessTelemetryLevelV0,
  setChessTelemetryLevelV0,
  shouldLogChessGeometryDriftV0,
  shouldLogChessMovePlayedV0,
  shouldLogChessTopologyEventV0
} from "../chessTelemetryLogV0.js";
import { TOPOLOGY_EVENT_TYPES_V0 } from "../rhizohTopologyEventEmitterV0.js";

describe("chessTelemetryLogV0", () => {
  beforeEach(() => {
    __resetChessTelemetryLogForTestV0();
    if (typeof window !== "undefined") {
      window.localStorage?.removeItem("rhizoh_chess_telemetry_level_v0");
      window.__rhizoh = {};
    }
  });

  it("samples slot 0 moves at critical level (prod-quiet)", () => {
    setChessTelemetryLevelV0(CHESS_TELEMETRY_LEVEL_V0.CRITICAL);
    const slot0 = Array.from({ length: 20 }, (_, i) =>
      shouldLogChessMovePlayedV0({ slotId: 0, moveNumber: i })
    );
    expect(slot0.filter(Boolean).length).toBeGreaterThan(0);
    expect(slot0.filter(Boolean).length).toBeLessThan(20);
    expect(shouldLogChessMovePlayedV0({ slotId: 3, moveNumber: 1 })).toBe(false);
  });

  it("samples non-anchor slots at L1", () => {
    setChessTelemetryLevelV0(CHESS_TELEMETRY_LEVEL_V0.MOVES);
    const results = Array.from({ length: 20 }, (_, i) =>
      shouldLogChessMovePlayedV0({ slotId: 5, moveNumber: i })
    );
    expect(results.filter(Boolean).length).toBeGreaterThan(0);
    expect(results.filter(Boolean).length).toBeLessThan(20);
  });

  it("logs drift topology at critical level", () => {
    setChessTelemetryLevelV0(CHESS_TELEMETRY_LEVEL_V0.CRITICAL);
    expect(
      shouldLogChessTopologyEventV0({
        eventType: TOPOLOGY_EVENT_TYPES_V0.DRIFT_DETECTED,
        driftMagnitude: 1
      })
    ).toBe(true);
    expect(
      shouldLogChessTopologyEventV0({
        eventType: TOPOLOGY_EVENT_TYPES_V0.CLUSTER_LOCKED,
        driftMagnitude: 0
      })
    ).toBe(false);
  });

  it("enriches drift envelope with causalChainId", () => {
    const row = buildChessDriftLogEnvelopeV0("warn", {
      matchId: "cluster_7_test",
      moveNumber: 53,
      entropyScore: 1
    });
    expect(row.kind).toBe("DRIFT_EVENT");
    expect(row.clusterId).toBe(7);
    expect(String(row.causalChainId)).toContain("chess_drift_");
  });

  it("logs geometry drift for high z at critical level", () => {
    setChessTelemetryLevelV0(CHESS_TELEMETRY_LEVEL_V0.CRITICAL);
    expect(
      shouldLogChessGeometryDriftV0({ matchId: "cluster_3_x", z: 1, familyMismatch: true })
    ).toBe(true);
    expect(
      shouldLogChessGeometryDriftV0({ matchId: "cluster_3_x", z: 0, familyMismatch: false })
    ).toBe(false);
  });

  it("respects debug override on window", () => {
    if (typeof window === "undefined") return;
    window.__rhizoh.debug = { chessTelemetryLevel: 3 };
    expect(resolveChessTelemetryLevelV0()).toBe(3);
  });
});
