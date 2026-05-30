import { describe, expect, it } from "vitest";
import {
  computeGhostPetSocialEmbodimentDriveV0,
  GHOST_PET_SOCIAL_EMBODIMENT_DRIVE_SCHEMA_V0
} from "../ghostPetSocialEmbodimentDriveV0.js";

describe("computeGhostPetSocialEmbodimentDriveV0", () => {
  it("maps initiative and continuity into orbit phase and scales", () => {
    const d = computeGhostPetSocialEmbodimentDriveV0(
      {
        socialRuntimeV1: { mode: "SOCIAL_ACTIVE", initiativeBudget01: 0.72 },
        personaContinuity: { band: "HOST", continuityStrength01: 0.55, ticksInBand: 5 },
        rhizohCastleRuntimeRole: "GUIDE",
        socialMemoryRecall: { recallLines: ["a", "b"] },
        crossCastleBleedGuard: { bleedRisk01: 0.1 }
      },
      { energy01: 0.6, peerCount: 4, operatorUserId: "op", focusUserId: "speaker1" }
    );
    expect(d.schema).toBe(GHOST_PET_SOCIAL_EMBODIMENT_DRIVE_SCHEMA_V0);
    expect(d.orbitPhaseRad).toBeGreaterThan(Math.PI * 0.15);
    expect(d.radiusScale01).toBeGreaterThan(0.95);
    expect(d.verticalBobScale01).toBeGreaterThan(0.85);
    expect(d.initiativeLean01).toBeCloseTo(0.72, 2);
    expect(d.roleStance).toBe("GUIDE");
    expect(d.socialAttention01).toBeGreaterThan(0.3);
    expect(d.attention?.mode).toBe("ACTIVE_SPEAKER");
    expect(d.locomotionHint).toBeTruthy();
    expect(d.motionStyle?.schema).toContain("motion_style");
    expect(d.multiPetHint?.schema).toBeTruthy();
  });

  it("tightens radius when bleed risk is high", () => {
    const low = computeGhostPetSocialEmbodimentDriveV0(
      {
        socialRuntimeV1: { mode: "IDLE", initiativeBudget01: 0.5 },
        crossCastleBleedGuard: { bleedRisk01: 0.05 }
      },
      {}
    );
    const high = computeGhostPetSocialEmbodimentDriveV0(
      {
        socialRuntimeV1: { mode: "IDLE", initiativeBudget01: 0.5 },
        crossCastleBleedGuard: { bleedRisk01: 0.75 }
      },
      {}
    );
    expect(high.radiusScale01).toBeLessThan(low.radiusScale01);
    expect(high.moodHint).toBe("guarded");
  });
});
