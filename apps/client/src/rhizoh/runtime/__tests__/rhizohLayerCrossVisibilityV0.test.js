import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  auditRhizohTurnLayerPresenceV0,
  emitRhizohAcademyTickV0
} from "../rhizohLayerCrossVisibilityV0.js";

describe("auditRhizohTurnLayerPresenceV0", () => {
  it("marks academy passive on default product LLM path", () => {
    const audit = auditRhizohTurnLayerPresenceV0({
      traceId: "TRC-1",
      layerSpec: { id: 10, code: "L10" },
      conversationPhase: "TRUST_BUILD",
      continuity: { rhizohNarrativeThread: { headline: "beat" } }
    });
    expect(audit.academy.influence).toBe("passive");
    expect(audit.narrative.influence).toBe("partial");
    expect(audit.crossLayerRisk).toBe("invisible_academy_dependency");
  });

  it("marks academy active when L11 focused", () => {
    const audit = auditRhizohTurnLayerPresenceV0({
      traceId: "TRC-2",
      layerSpec: { id: 11, code: "L11" },
      continuity: {}
    });
    expect(audit.academy.influence).toBe("active");
  });
});

describe("emitRhizohAcademyTickV0", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs CASTLE_academy_tick namespace", () => {
    const audit = auditRhizohTurnLayerPresenceV0({ traceId: "TRC-3", layerSpec: { id: 10 } });
    emitRhizohAcademyTickV0(audit);
    expect(console.info).toHaveBeenCalledWith(
      "[CASTLE_academy_tick]",
      expect.objectContaining({ traceId: "TRC-3", influence: "passive" })
    );
  });
});
