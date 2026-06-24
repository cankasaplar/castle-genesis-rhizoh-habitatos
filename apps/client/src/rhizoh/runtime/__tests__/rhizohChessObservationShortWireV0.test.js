import { describe, expect, it } from "vitest";
import {
  ensureRhizohChessObservationShortDevToolsV0,
  copyRhizohChessObservationBriefV0,
  printRhizohChessObservationBriefV0
} from "../rhizohChessObservationShortWireV0.js";

describe("rhizohChessObservationShortWireV0", () => {
  it("exposes chessObservationShort001 on window.__rhizoh", () => {
    const fn = ensureRhizohChessObservationShortDevToolsV0();
    expect(typeof fn).toBe("function");
    const cap = fn({ locale: "en" });
    expect(cap.shotList).toHaveLength(6);
    expect(typeof window.__rhizoh.copyChessObservationBrief).toBe("function");
    expect(typeof window.__rhizoh.printChessObservationBrief).toBe("function");
  });

  it("copyChessObservationBrief does not throw when clipboard blocked", async () => {
    const result = await copyRhizohChessObservationBriefV0({ locale: "en" });
    expect(result.brief).toContain("Rhizoh Chess Observation #001");
    expect(typeof result.copied).toBe("boolean");
    expect(result.method).toBeTruthy();
  });

  it("printChessObservationBrief returns brief without clipboard", () => {
    const result = printRhizohChessObservationBriefV0({ locale: "tr" });
    expect(result.printed).toBe(true);
    expect(result.brief).toContain("mutationPermitted");
  });
});
