import { describe, expect, it, beforeEach } from "vitest";
import {
  getGoLearningTubeSnapshotV0,
  wireGoLearningMediaTubeV0,
  resetGoLearningMediaTubeWireForTestV0
} from "../goLearningMediaTubeWireV0.js";
import { resetGoArenaEngineForTestV0 } from "../goArenaEngineV0.js";
import { resetGoLearningBatchForTestV0 } from "../goLearningBatchV0.js";
import { resetGoLearningAgreementGateForTestV0 } from "../goLearningAgreementGateV0.js";

describe("goLearningMediaTubeWireV0", () => {
  beforeEach(() => {
    resetGoLearningMediaTubeWireForTestV0();
    resetGoArenaEngineForTestV0();
    resetGoLearningBatchForTestV0();
    resetGoLearningAgreementGateForTestV0();
  });

  it("wires demo move and returns spacetime envelope", async () => {
    const result = await wireGoLearningMediaTubeV0({ force: true, demoMove: true, locale: "tr" });
    expect(result.ok).toBe(true);
    expect(result.spacetime.causalSpaceId).toBe("go.causal.space");
    expect(result.demoIngestOk).toBe(true);
    expect(result.interpretationOnly).toBe(true);
  });

  it("exposes tube snapshot with pipeline", () => {
    const snap = getGoLearningTubeSnapshotV0({ locale: "en" });
    expect(snap.schema).toContain("snapshot");
    expect(snap.spacetime.worldAnchor.channelId).toBe("rhizoh_go_learning");
  });
});
