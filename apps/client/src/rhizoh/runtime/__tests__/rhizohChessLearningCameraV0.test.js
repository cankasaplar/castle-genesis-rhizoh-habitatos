import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetRhizohChessLearningCameraForTestV0,
  buildRhizohChessLearningCameraV0,
  ensureRhizohChessLearningCameraV0,
  resolveChessLearnBacklogHealthV0
} from "../rhizohChessLearningCameraV0.js";
import { CHESS_LEARN_BUFFER_MAX_V0 } from "../rhizohUglLearnBufferSinkV0.js";
import { __resetRhizohChessLearningReportForTestV0 } from "../rhizohChessLearningReportV0.js";
import { __resetChessLearningMonitorForTestV0 } from "../chessLearningMonitorV0.js";

describe("rhizohChessLearningCameraV0", () => {
  beforeEach(() => {
    __resetRhizohChessLearningCameraForTestV0();
    __resetRhizohChessLearningReportForTestV0();
    __resetChessLearningMonitorForTestV0();
    window.__rhizoh = {};
  });

  it("classifies backlog health tiers", () => {
    expect(resolveChessLearnBacklogHealthV0(10)).toBe("healthy");
    expect(resolveChessLearnBacklogHealthV0(70)).toBe("warn");
    expect(resolveChessLearnBacklogHealthV0(CHESS_LEARN_BUFFER_MAX_V0)).toBe("critical");
  });

  it("installs window.__rhizoh.chessLearningCamera", () => {
    ensureRhizohChessLearningCameraV0();
    expect(typeof window.__rhizoh.chessLearningCamera).toBe("function");
  });

  it("builds epistemic camera snapshot with pipeline + LC0 reserved", () => {
    const camera = buildRhizohChessLearningCameraV0();
    expect(camera.schema).toContain("chess_learning_camera");
    expect(camera.interpretationOnly).toBe(true);
    expect(camera.pipeline.bufferMax).toBe(CHESS_LEARN_BUFFER_MAX_V0);
    expect(camera.engines.lc0.status).toBe("reserved");
    expect(camera.engines.lc0.available).toBe(false);
  });
});
