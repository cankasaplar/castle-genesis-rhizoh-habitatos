import { describe, expect, it } from "vitest";
import {
  computeAutonomousStudioDirectorIntentV0,
  AUTONOMOUS_STUDIO_DIRECTOR_INTENT_SCHEMA_V0
} from "../autonomousStudioDirectorIntentV0.js";

describe("computeAutonomousStudioDirectorIntentV0", () => {
  it("emits intent envelope with stream bias when publish score is high", () => {
    const d = computeAutonomousStudioDirectorIntentV0(
      {
        networkDiff: { dirty: true },
        studioEvent: { fullSnapshotRecommended: false },
        youtubePipelineHint: { publishRecommendationScore: 0.6, directorMission: "arc", narrativeArcId: "genesis" }
      },
      { intensityEwma01: 0.8 }
    );
    expect(d.schema).toBe(AUTONOMOUS_STUDIO_DIRECTOR_INTENT_SCHEMA_V0);
    expect(d.streamBias).toBe("open");
    expect(d.directorMission).toBe("arc");
    expect(d.narrativeArcId).toBe("genesis");
    expect(String(d.note || "").length).toBeGreaterThan(10);
  });
});
