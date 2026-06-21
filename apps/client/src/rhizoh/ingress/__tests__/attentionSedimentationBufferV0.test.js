import { describe, expect, it, beforeEach } from "vitest";
import {
  clearAttentionSedimentForTestV0,
  getAttentionSedimentSnapshotV0,
  refreshAttentionSedimentFromTraceV0,
  SEDIMENT_INPUT_SOURCE_V0
} from "../attentionSedimentationBufferV0.js";
import {
  clearObserverTraceForTestV0,
  getObserverTraceSnapshotV0,
  injectObserverTraceEntriesForTestV0
} from "../observerReadOnlyHookV0.js";

describe("attentionSedimentationBufferV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
    clearAttentionSedimentForTestV0();
  });

  it("accumulates frequency without observing or learning", () => {
    injectObserverTraceEntriesForTestV0([
      { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
      { type: "map_hover", target: "pin_42", meta: { surface: "map", focus: 0.5 } },
      { type: "chess_open", target: "e4", meta: { surface: "chess", focus: 0.4 } }
    ]);
    const countBefore = getObserverTraceSnapshotV0().count;
    const out = refreshAttentionSedimentFromTraceV0();
    expect(out.learns).toBe(false);
    expect(out.influencesCausalGraph).toBe(false);
    expect(out.influencesIdentity).toBe(false);
    expect(out.influencesNarrativeSelection).toBe(false);
    expect(out.isAttentionSediment).toBe(true);
    expect(out.echoGuard.echoLoopDetected).toBe(false);
    expect(getObserverTraceSnapshotV0().count).toBe(countBefore);
    expect(out.stratumCount).toBeGreaterThanOrEqual(2);
    const mapStratum = out.strata.find((s) => s.source === SEDIMENT_INPUT_SOURCE_V0.MAP);
    expect(mapStratum?.frequency).toBe(2);
    expect(out.chessField.deterministicAnchor).toBe(true);
  });

  it("returns empty snapshot when not refreshed", () => {
    const snap = getAttentionSedimentSnapshotV0();
    expect(snap.stratumCount).toBe(0);
    expect(snap.influencesNarrativeSelection).toBe(false);
  });
});
