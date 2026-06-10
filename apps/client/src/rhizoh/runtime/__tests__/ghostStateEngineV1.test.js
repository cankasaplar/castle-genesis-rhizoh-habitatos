import { describe, it, expect } from "vitest";
import {
  resolveGhostPresentationBiasV1,
  applyGhostPresentationToCompanionDriveV1,
  buildGhostPresentationTonePromptBlockV1,
  GHOST_IDLE_BEHAVIOR_V1,
  GHOST_GAZE_DIRECTION_V1
} from "../ghostStateEngineV1.js";
import { FOX_BEHAVIOR_POSTURE_V1 } from "../foxSignificanceEngineV1.js";

describe("ghostStateEngineV1", () => {
  it("maps high comfort to calm idle and longer pause", () => {
    const gp = resolveGhostPresentationBiasV1({
      ghostState: { comfort: 0.78, curiosity: 0.2, focus: 0.35, alertness: 0.15, continuity: 0.4 },
      behaviorPosture: { posture: FOX_BEHAVIOR_POSTURE_V1.REACT }
    });
    expect(gp.presentationBias.behaviors.idleBehavior).toBe(GHOST_IDLE_BEHAVIOR_V1.CALM_REST);
    expect(gp.presentationBias.uiHints.pauseDurationMs).toBeGreaterThan(300);
    expect(gp.presentationBias.uiHints.animationBias).toBe("calm");
  });

  it("maps high alertness to scan gaze and elevated micro scan", () => {
    const gp = resolveGhostPresentationBiasV1({
      ghostState: { comfort: 0.3, curiosity: 0.25, focus: 0.4, alertness: 0.72, continuity: 0.35 },
      behaviorPosture: { posture: FOX_BEHAVIOR_POSTURE_V1.OBSERVE }
    });
    expect(gp.presentationBias.behaviors.microScan).toBe("elevated");
    expect(gp.presentationBias.uiHints.gazeDirection).toBe(GHOST_GAZE_DIRECTION_V1.SCAN);
    expect(gp.presentationBias.drivePatch.emotion).toBe("listening");
  });

  it("maps high continuity/focus to gaze hold", () => {
    const gp = resolveGhostPresentationBiasV1({
      ghostState: { comfort: 0.5, curiosity: 0.3, focus: 0.68, alertness: 0.25, continuity: 0.62 },
      dialogueThread: { dialogueCurve: { continuity: 0.62, tension: 0.2 } }
    });
    expect(gp.presentationBias.behaviors.gazeHold).toBe("locked");
    expect(gp.presentationBias.uiHints.gazeDirection).toBe(GHOST_GAZE_DIRECTION_V1.HOLD);
  });

  it("patches companion drive without producing speech", () => {
    const base = { emotion: "neutral", activation: 0.3, reach: 0.35, live: false };
    const gp = resolveGhostPresentationBiasV1({
      ghostState: { comfort: 0.55, curiosity: 0.52, focus: 0.4, alertness: 0.3, continuity: 0.45 }
    });
    const patched = applyGhostPresentationToCompanionDriveV1(base, gp.presentationBias);
    expect(patched.emotion).toBe("curious");
    expect(patched.ghostPresentation?.typingDelayMs).toBeGreaterThan(0);
    expect(String(buildGhostPresentationTonePromptBlockV1(gp.presentationBias))).toContain(
      "tone bias only"
    );
  });
});
