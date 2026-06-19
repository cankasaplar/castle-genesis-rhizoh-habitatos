import { describe, expect, it } from "vitest";
import {
  CHESS_VARIANT_ID_V0,
  listChessVariantsV0,
  resolveChessVariantV0
} from "../chessVariantRegistryV0.js";
import {
  CHESS_LEARNING_SESSION_PRESET_V0,
  listChessLearningSessionPresetsV0,
  resolveChessLearningSessionPresetV0
} from "../chessLearningSessionV0.js";

describe("chessVariantRegistryV0", () => {
  it("lists team pet vs rhizoh as implemented", () => {
    const team = resolveChessVariantV0(CHESS_VARIANT_ID_V0.TEAM_PET_VS_RHIZOH);
    expect(team.implemented).toBe(true);
    expect(team.teamWhite).toContain("fox");
  });

  it("marks 3p/4p/3d as research-only", () => {
    const three = resolveChessVariantV0(CHESS_VARIANT_ID_V0.THREE_PLAYER);
    expect(three.implemented).toBe(false);
    expect(listChessVariantsV0().length).toBeGreaterThanOrEqual(5);
  });
});

describe("chessLearningSessionV0", () => {
  it("exposes bullet research preset", () => {
    const preset = resolveChessLearningSessionPresetV0(CHESS_LEARNING_SESSION_PRESET_V0.BULLET_RESEARCH.id);
    expect(preset.timeControlId).toBe("bullet_1_0");
    expect(listChessLearningSessionPresetsV0().length).toBeGreaterThanOrEqual(3);
  });
});
