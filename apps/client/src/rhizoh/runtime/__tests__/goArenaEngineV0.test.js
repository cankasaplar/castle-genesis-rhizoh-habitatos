import { describe, expect, it, beforeEach } from "vitest";
import {
  applyGoArenaMoveV0,
  resetGoArenaEngineForTestV0,
  getGoArenaEngineSnapshotV0
} from "../goArenaEngineV0.js";
import { ingestGoLearningDemoMoveV0 } from "../goLearningDemoIngestV0.js";
import { resetGoLearningBatchForTestV0 } from "../goLearningBatchV0.js";
import { resetGoLearningAgreementGateForTestV0 } from "../goLearningAgreementGateV0.js";

describe("goArenaEngineV0", () => {
  beforeEach(() => {
    resetGoArenaEngineForTestV0();
  });

  it("applies moves and updates board hash", () => {
    const r1 = applyGoArenaMoveV0({ x: 3, y: 3 });
    expect(r1.ok).toBe(true);
    expect(getGoArenaEngineSnapshotV0().moveCount).toBe(1);
  });
});

describe("goLearningDemoIngestV0", () => {
  beforeEach(() => {
    resetGoArenaEngineForTestV0();
    resetGoLearningBatchForTestV0();
    resetGoLearningAgreementGateForTestV0();
  });

  it("ingests demo move with spacetime envelope", () => {
    const result = ingestGoLearningDemoMoveV0({ x: 4, y: 4, confidence: 0.85 });
    expect(result.ok).toBe(true);
    expect(result.spacetime.causalSpaceId).toBe("go.causal.space");
    expect(result.batch.enqueued).toBe(true);
  });
});
