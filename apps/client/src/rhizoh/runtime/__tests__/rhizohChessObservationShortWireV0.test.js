import { describe, expect, it } from "vitest";
import { ensureRhizohChessObservationShortDevToolsV0 } from "../rhizohChessObservationShortWireV0.js";

describe("rhizohChessObservationShortWireV0", () => {
  it("exposes chessObservationShort001 on window.__rhizoh", () => {
    const fn = ensureRhizohChessObservationShortDevToolsV0();
    expect(typeof fn).toBe("function");
    const cap = fn({ locale: "en" });
    expect(cap.shotList).toHaveLength(6);
    expect(typeof window.__rhizoh.copyChessObservationBrief).toBe("function");
  });
});
