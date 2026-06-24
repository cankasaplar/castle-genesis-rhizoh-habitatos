import { describe, expect, it } from "vitest";
import {
  CHESS_OBSERVATION_SHORT_001_MIN_MOVES_V0,
  buildRhizohChessObservationShortCaptureV0,
  formatChessObservationShortBriefV0
} from "../rhizohChessObservationShortCaptureV0.js";

describe("rhizohChessObservationShortCaptureV0", () => {
  it("builds 60s shot list with six beats", () => {
    const cap = buildRhizohChessObservationShortCaptureV0({ locale: "en" });
    expect(cap.schema).toContain("chess_observation_short_001");
    expect(cap.shotList).toHaveLength(6);
    expect(cap.durationSecTarget).toBe(60);
    expect(cap.shotList.reduce((sum, s) => sum + s.durationSec, 0)).toBe(60);
  });

  it("marks ready when moves meet threshold", () => {
    const cap = buildRhizohChessObservationShortCaptureV0({ locale: "en" });
    if (cap.digest.movesSeen >= CHESS_OBSERVATION_SHORT_001_MIN_MOVES_V0) {
      expect(cap.readyToRecord).toBe(true);
      expect(cap.digest.movesDeficit).toBe(0);
    } else {
      expect(cap.readyToRecord).toBe(false);
      expect(cap.digest.movesDeficit).toBeGreaterThan(0);
    }
  });

  it("formats copy brief with shot list", () => {
    const cap = buildRhizohChessObservationShortCaptureV0({ locale: "tr" });
    const brief = formatChessObservationShortBriefV0(cap);
    expect(brief).toContain("Rhizoh Chess Observation #001");
    expect(brief).toContain("Shot list");
    expect(brief).toContain("mutationPermitted");
  });
});
