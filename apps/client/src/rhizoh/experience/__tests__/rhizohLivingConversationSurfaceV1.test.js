import { describe, expect, it, beforeEach } from "vitest";
import {
  __resetLivingConversationSurfaceForTestV1,
  buildConversationContinuitySnapshotV1,
  emitRhizohSttHeardSurfaceV1,
  isRhizohLivingConversationSurfaceV1,
  resolveFastReflexBridgeCopyV1,
  resolveSttHeardHudCopyV1,
  RHIZOH_STT_HEARD_EVENT_V1
} from "../rhizohLivingConversationSurfaceV1.js";

describe("rhizohLivingConversationSurfaceV1", () => {
  beforeEach(() => {
    __resetLivingConversationSurfaceForTestV1();
  });

  it("isRhizohLivingConversationSurfaceV1 defaults on", () => {
    expect(isRhizohLivingConversationSurfaceV1()).toBe(true);
  });

  it("resolveSttHeardHudCopyV1 shows transcript on block", () => {
    const copy = resolveSttHeardHudCopyV1(true, "Merhaba.", { executionAccepted: false });
    expect(copy).toContain("Merhaba");
    expect(copy).toContain("yazarak");
  });

  it("resolveFastReflexBridgeCopyV1 is bridge not terminal", () => {
    expect(resolveFastReflexBridgeCopyV1(true, "greet")).toContain("devam");
  });

  it("emitRhizohSttHeardSurfaceV1 dispatches event", () => {
    let heard = null;
    window.addEventListener(RHIZOH_STT_HEARD_EVENT_V1, (e) => {
      heard = e.detail;
    });
    emitRhizohSttHeardSurfaceV1({ text: "Selam", tr: true, executionAccepted: false, reason: "test" });
    expect(heard?.text).toBe("Selam");
    expect(heard?.hudCopy).toContain("Selam");
  });

  it("buildConversationContinuitySnapshotV1 marks continuing after turns", () => {
    const snap = buildConversationContinuitySnapshotV1({ userTurnCount: 2, productSessionId: "ps_1" });
    expect(snap.continuingThought).toBe(true);
    expect(snap.turnCount).toBe(2);
  });
});
