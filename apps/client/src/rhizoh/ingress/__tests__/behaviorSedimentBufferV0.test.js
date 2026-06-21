import { describe, expect, it, beforeEach } from "vitest";
import {
  clearBehaviorSedimentForTestV0,
  computeBehaviorEvidenceStrengthV0,
  getBehaviorSedimentSnapshotV0,
  lookupBehaviorRecordV0,
  refreshBehaviorSedimentFromTraceV0
} from "../behaviorSedimentBufferV0.js";
import {
  clearObserverTraceForTestV0,
  getObserverTraceSnapshotV0,
  injectObserverTraceEntriesForTestV0
} from "../observerReadOnlyHookV0.js";

const WPRL_BEHAVIOR_TRACE = [
  { type: "map_enter", target: "wprl_sports_arena", meta: { surface: "map", dwellMs: 180_000 } },
  { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.5 } },
  { type: "map_exit", target: "wprl_sports_arena", meta: { surface: "map" } },
  { type: "map_enter", target: "chess_arena", meta: { surface: "map", dwellMs: 20_000 } },
  { type: "map_enter", target: "wprl_sports_arena", meta: { surface: "map", dwellMs: 240_000 } },
  { type: "map_hover", target: "wprl_sports_arena", meta: { surface: "map", focus: 0.6 } }
];

describe("behaviorSedimentBufferV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearBehaviorSedimentForTestV0();
  });

  it("accumulates visits and dwell without observing or learning", () => {
    const base = Date.now() - 600_000;
    injectObserverTraceEntriesForTestV0(
      WPRL_BEHAVIOR_TRACE.map((row, i) => ({ ...row, ts: base + i * 120_000 }))
    );
    const countBefore = getObserverTraceSnapshotV0().count;
    const out = refreshBehaviorSedimentFromTraceV0();

    expect(out.learns).toBe(false);
    expect(out.behaviorBias).toBe(true);
    expect(out.truthBias).toBe(false);
    expect(out.influencesCausalGraph).toBe(false);
    expect(out.echoGuard.echoLoopDetected).toBe(false);
    expect(getObserverTraceSnapshotV0().count).toBe(countBefore);

    const wprl = lookupBehaviorRecordV0("wprl_sports_arena", out);
    expect(wprl).not.toBeNull();
    expect(wprl.visits).toBeGreaterThanOrEqual(2);
    expect(wprl.avgDwellTime).toBeGreaterThan(0);
    expect(wprl.returnRate).toBeGreaterThan(0);
  });

  it("returns honest empty evidence when not refreshed", () => {
    const evidence = computeBehaviorEvidenceStrengthV0("wprl_sports_arena");
    expect(evidence.available).toBe(false);
    expect(evidence.sufficientForSignificance).toBeFalsy();
    expect(getBehaviorSedimentSnapshotV0().entityCount).toBe(0);
  });

  it("marks sufficient evidence when visits and return rate accumulate", () => {
    const base = Date.now() - 3_600_000;
    injectObserverTraceEntriesForTestV0([
      { type: "map_enter", target: "wprl_sports_arena", meta: { surface: "map", dwellMs: 180_000 }, ts: base },
      {
        type: "map_enter",
        target: "wprl_sports_arena",
        meta: { surface: "map", dwellMs: 200_000 },
        ts: base + 40 * 60 * 1000
      },
      {
        type: "map_enter",
        target: "wprl_sports_arena",
        meta: { surface: "map", dwellMs: 220_000 },
        ts: base + 80 * 60 * 1000
      }
    ]);
    refreshBehaviorSedimentFromTraceV0();
    const evidence = computeBehaviorEvidenceStrengthV0("wprl_sports_arena");
    expect(evidence.available).toBe(true);
    expect(evidence.sufficientForSignificance).toBe(true);
    expect(evidence.returnRate).toBeGreaterThan(0);
  });
});
