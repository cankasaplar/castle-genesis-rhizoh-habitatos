import { describe, expect, it, beforeEach } from "vitest";
import {
  clearObserverTraceForTestV0,
  getObserverTraceSnapshotV0,
  observeV0,
  OBSERVER_TRACE_EXCLUDED_SINKS_V0
} from "../observerReadOnlyHookV0.js";

describe("observerReadOnlyHookV0", () => {
  beforeEach(() => {
    clearObserverTraceForTestV0();
  });

  it("observe appends to observation plane only", () => {
    const entry = observeV0({ type: "map_hover", target: "pin", meta: { focus: 0.2 } });
    expect(entry.influencesCausalGraph).toBe(false);
    expect(entry.influencesIdentity).toBe(false);
    expect(getObserverTraceSnapshotV0().count).toBe(1);
  });

  it("declares hard boundary excluded sinks", () => {
    observeV0({ type: "panel_open", target: "epi_id" });
    const snap = getObserverTraceSnapshotV0();
    expect(snap.excludedFrom).toEqual(OBSERVER_TRACE_EXCLUDED_SINKS_V0);
    expect(snap.isMemory).toBe(false);
  });
});
