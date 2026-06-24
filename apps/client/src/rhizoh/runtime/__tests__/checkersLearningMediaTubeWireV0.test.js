import { describe, expect, it, beforeEach } from "vitest";
import {
  getCheckersLearningTubeSnapshotV0,
  wireCheckersLearningMediaTubeV0,
  resetCheckersLearningMediaTubeWireForTestV0
} from "../checkersLearningMediaTubeWireV0.js";
import { resetCheckersArenaEngineForTestV0 } from "../checkersArenaEngineV0.js";
import { resetCheckersLearningBatchForTestV0 } from "../checkersLearningBatchV0.js";
import { resetCheckersLearningAgreementGateForTestV0 } from "../checkersLearningAgreementGateV0.js";

describe("checkersLearningMediaTubeWireV0", () => {
  beforeEach(() => {
    resetCheckersLearningMediaTubeWireForTestV0();
    resetCheckersArenaEngineForTestV0();
    resetCheckersLearningBatchForTestV0();
    resetCheckersLearningAgreementGateForTestV0();
  });

  it("wires demo move and returns spacetime envelope", async () => {
    const result = await wireCheckersLearningMediaTubeV0({ force: true, demoMove: true, locale: "tr" });
    expect(result.ok).toBe(true);
    expect(result.spacetime.causalSpaceId).toBe("checkers.causal.space");
    expect(result.demoIngestOk).toBe(true);
    expect(result.interpretationOnly).toBe(true);
  });

  it("exposes tube snapshot with pipeline", () => {
    const snap = getCheckersLearningTubeSnapshotV0({ locale: "en" });
    expect(snap.schema).toContain("snapshot");
    expect(snap.spacetime.worldAnchor.channelId).toBe("rhizoh_checkers_learning");
  });
});
