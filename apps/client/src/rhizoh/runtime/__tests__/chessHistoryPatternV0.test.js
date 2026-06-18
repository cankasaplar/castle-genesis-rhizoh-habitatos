import { beforeEach, describe, expect, it } from "vitest";
import { classifyOpeningBucketV0, resolveOpeningFingerprintV0 } from "../chessHistoryPatternV0.js";

describe("chessHistoryPatternV0", () => {
  it("classifyOpeningBucketV0 detects King's Pawn", () => {
    expect(classifyOpeningBucketV0(["e4", "e5"])).toBe("King's Pawn");
  });

  it("resolveOpeningFingerprintV0 builds stable key", () => {
    const fp = resolveOpeningFingerprintV0(["e4", "c5", "Nf3"]);
    expect(fp).toContain("e4");
    expect(fp).toContain("c5");
  });
});
